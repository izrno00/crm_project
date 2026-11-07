-- Flowdesk: private helpers and triggers (DB.md §7.1, §7.4)

-- 7.1 RLS helpers ---------------------------------------------------------

-- Businesses the current user belongs to (any status). Used to read their own business row.
create function private.member_business_ids()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select m.business_id
  from public.memberships m
  where m.user_id = (select auth.uid());
$$;

-- Businesses the current user belongs to that are ACTIVE. Used for all tenant data.
create function private.active_business_ids()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select m.business_id
  from public.memberships m
  join public.businesses b on b.id = m.business_id
  where m.user_id = (select auth.uid())
    and b.status = 'active';
$$;

create function private.is_platform_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.platform_admins where user_id = (select auth.uid()));
$$;

-- 7.4 updated_at ----------------------------------------------------------
create function private.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.businesses
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.inquiry_sources
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.customers
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.inquiries
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.messages
  for each row execute function private.set_updated_at();

-- 7.4 Profile for each new auth user -------------------------------------
create function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 200));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- 7.4 Message status -> answered_at + timeline events ---------------------
-- Runs only for outbound messages whose status changed.
--   sent   -> answered_at = coalesce(answered_at, sent_at) + 'reply_sent' event
--   failed -> 'reply_failed' event
create function private.handle_message_status()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.direction <> 'outbound' then
    return null;
  end if;

  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return null;
  end if;

  if new.status = 'sent' then
    update public.inquiries
       set answered_at = new.sent_at
     where id = new.inquiry_id
       and business_id = new.business_id
       and answered_at is null;

    insert into public.inquiry_events (business_id, inquiry_id, type, actor_id, message_id)
    values (new.business_id, new.inquiry_id, 'reply_sent', new.sent_by, new.id);

  elsif new.status = 'failed' then
    insert into public.inquiry_events (business_id, inquiry_id, type, message_id)
    values (new.business_id, new.inquiry_id, 'reply_failed', new.id);
  end if;

  return null;
end;
$$;

create trigger on_message_status
  after insert or update of status on public.messages
  for each row execute function private.handle_message_status();

-- Privileges on the private schema ----------------------------------------
-- authenticated: usage + execute on the RLS helpers only.
-- service_role: usage + execute on generate_public_key (inquiry_sources.public_key default).
grant usage on schema private to authenticated, service_role;

revoke all on all functions in schema private from public, anon, authenticated;

grant execute on function private.member_business_ids() to authenticated;
grant execute on function private.active_business_ids() to authenticated;
grant execute on function private.is_platform_admin()   to authenticated;
grant execute on function private.generate_public_key() to service_role;
