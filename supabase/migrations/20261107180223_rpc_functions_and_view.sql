-- Flowdesk: inquiries_view and RPC functions (DB.md §6, §7.2, §7.3)

-- §6 inquiries_view: derived status + flags. security_invoker, so the
-- RLS policies of public.inquiries apply to whoever queries it.
create view public.inquiries_view
with (security_invoker = true) as
select
  i.*,
  case
    when i.answered_at is not null                       then 'answered'
    when i.created_at > now() - interval '48 hours'      then 'new'
    else                                                      'awaiting'
  end                                   as status,
  (i.read_at is null)                   as is_unread,
  (i.archived_at is not null)           as is_archived
from public.inquiries i;

-- =========================================================================
-- §7.2 Service-role-only RPCs
-- =========================================================================

-- Admin onboarding (and future self-registration with p_status => 'pending').
-- Inserts the business, the owner membership and, if origins are given,
-- a first source named "Main website", in one transaction.
create function public.create_business_with_owner(
  p_owner_id        uuid,
  p_name            text,
  p_slug            text,
  p_email           extensions.citext,
  p_website         text,
  p_timezone        text,
  p_sender_name     text,
  p_sender_email    extensions.citext,
  p_allowed_origins text[],
  p_status          public.business_status default 'active'
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_business_id uuid;
begin
  insert into public.businesses
    (name, slug, email, website, timezone, status, sender_name, sender_email)
  values
    (p_name, p_slug, p_email, p_website, coalesce(p_timezone, 'UTC'), p_status,
     coalesce(nullif(p_sender_name, ''), p_name), p_sender_email)
  returning id into v_business_id;

  insert into public.memberships (business_id, user_id, role)
  values (v_business_id, p_owner_id, 'owner');

  if coalesce(cardinality(p_allowed_origins), 0) > 0 then
    insert into public.inquiry_sources (business_id, name, allowed_origins)
    values (v_business_id, 'Main website', p_allowed_origins);
  end if;

  return v_business_id;
end;
$$;

-- Public intake: checks source + business are active, upserts the customer,
-- inserts the inquiry and its 'received' event.
create function public.submit_inquiry(
  p_source_id  uuid,
  p_name       text,
  p_email      extensions.citext,
  p_subject    text,
  p_message    text,
  p_ip_hash    text,
  p_origin     text,
  p_user_agent text
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_business_id uuid;
  v_customer_id uuid;
  v_inquiry_id  uuid;
begin
  select s.business_id into v_business_id
  from public.inquiry_sources s
  join public.businesses b on b.id = s.business_id
  where s.id = p_source_id and s.is_active and b.status = 'active';

  if v_business_id is null then
    raise exception 'source_inactive' using errcode = 'P0001';
  end if;

  insert into public.customers (business_id, email, name)
  values (v_business_id, p_email, p_name)
  on conflict (business_id, email) do update set name = excluded.name
  returning id into v_customer_id;

  insert into public.inquiries
    (business_id, customer_id, source_id, customer_name, customer_email,
     subject, message, ip_hash, origin, user_agent)
  values
    (v_business_id, v_customer_id, p_source_id, p_name, p_email,
     p_subject, p_message, p_ip_hash, p_origin, left(p_user_agent, 500))
  returning id into v_inquiry_id;

  insert into public.inquiry_events (business_id, inquiry_id, type)
  values (v_business_id, v_inquiry_id, 'received');

  return v_inquiry_id;
end;
$$;

-- Fixed-window rate limit. Returns true when the request is allowed.
-- Deletes rows older than 1 day as it runs.
create function public.check_rate_limit(
  p_key            text,
  p_max            integer,
  p_window_seconds integer
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_hits         integer;
begin
  delete from public.rate_limits
  where window_start < now() - interval '1 day';

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits as rl (key, window_start, hits)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start) do update set hits = rl.hits + 1
  returning rl.hits into v_hits;

  return v_hits <= p_max;
end;
$$;

revoke execute on function public.create_business_with_owner from public, anon, authenticated;
revoke execute on function public.submit_inquiry             from public, anon, authenticated;
revoke execute on function public.check_rate_limit           from public, anon, authenticated;

grant execute on function public.create_business_with_owner to service_role;
grant execute on function public.submit_inquiry             to service_role;
grant execute on function public.check_rate_limit           to service_role;

-- =========================================================================
-- §7.3 Owner-callable RPCs
-- =========================================================================

-- Dashboard stat cards. Non-archived inquiries only; RLS limits rows.
create function public.get_dashboard_stats(p_business_id uuid)
returns table (total bigint, "new" bigint, awaiting bigint, answered bigint, unread bigint)
language sql stable security invoker set search_path = ''
as $$
  select
    count(*),
    count(*) filter (where answered_at is null and created_at >  now() - interval '48 hours'),
    count(*) filter (where answered_at is null and created_at <= now() - interval '48 hours'),
    count(*) filter (where answered_at is not null),
    count(*) filter (where read_at is null)
  from public.inquiries
  where business_id = p_business_id
    and archived_at is null;
$$;

-- Inquiries per day for the last p_days days, in the business timezone.
-- Days with no inquiries return 0. Non-archived only; RLS limits rows.
create function public.get_inquiry_activity(p_business_id uuid, p_days integer default 30)
returns table (day date, inquiries bigint)
language sql stable security invoker set search_path = ''
as $$
  with bounds as (
    select
      b.timezone                                          as tz,
      (now() at time zone b.timezone)::date               as today,
      (now() at time zone b.timezone)::date
        - (greatest(p_days, 1) - 1)                       as first_day
    from public.businesses b
    where b.id = p_business_id
  ),
  days as (
    select bounds.first_day + g.n as day
    from bounds, generate_series(0, greatest(p_days, 1) - 1) as g(n)
  ),
  counts as (
    select (i.created_at at time zone bounds.tz)::date as day, count(*) as total
    from public.inquiries i, bounds
    where i.business_id = p_business_id
      and i.archived_at is null
      and i.created_at >= (bounds.first_day::timestamp at time zone bounds.tz)
    group by 1
  )
  select d.day, coalesce(c.total, 0)::bigint
  from days d
  left join counts c on c.day = d.day
  order by d.day;
$$;

-- Mark as answered (manual). Returns true when something changed.
create function public.mark_inquiry_answered(p_inquiry_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_business_id uuid;
begin
  select i.business_id into v_business_id
  from public.inquiries i
  where i.id = p_inquiry_id
    and i.business_id in (select private.active_business_ids());
  if v_business_id is null then return false; end if;

  update public.inquiries
     set answered_at = now(),
         answered_manually = true
   where id = p_inquiry_id
     and business_id = v_business_id
     and answered_at is null;
  if not found then return false; end if;

  insert into public.inquiry_events (business_id, inquiry_id, type, actor_id)
  values (v_business_id, p_inquiry_id, 'marked_answered', (select auth.uid()));

  return true;
end;
$$;

-- Undo a manual mark. Only when answered manually and no reply was sent.
create function public.mark_inquiry_unanswered(p_inquiry_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_business_id uuid;
begin
  select i.business_id into v_business_id
  from public.inquiries i
  where i.id = p_inquiry_id
    and i.business_id in (select private.active_business_ids());
  if v_business_id is null then return false; end if;

  update public.inquiries i
     set answered_at = null,
         answered_manually = false
   where i.id = p_inquiry_id
     and i.business_id = v_business_id
     and i.answered_manually
     and not exists (
       select 1
       from public.messages m
       where m.inquiry_id = i.id
         and m.business_id = i.business_id
         and m.status = 'sent'
     );
  if not found then return false; end if;

  insert into public.inquiry_events (business_id, inquiry_id, type, actor_id)
  values (v_business_id, p_inquiry_id, 'marked_unanswered', (select auth.uid()));

  return true;
end;
$$;

-- Archive / restore. Returns true when the state changed.
create function public.set_inquiry_archived(p_inquiry_id uuid, p_archived boolean)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_business_id uuid;
begin
  select i.business_id into v_business_id
  from public.inquiries i
  where i.id = p_inquiry_id
    and i.business_id in (select private.active_business_ids());
  if v_business_id is null then return false; end if;

  update public.inquiries
     set archived_at = case when p_archived then now() else null end
   where id = p_inquiry_id
     and business_id = v_business_id
     and (archived_at is null) = p_archived;
  if not found then return false; end if;

  insert into public.inquiry_events (business_id, inquiry_id, type, actor_id)
  values (
    v_business_id,
    p_inquiry_id,
    (case when p_archived then 'archived' else 'restored' end)::public.inquiry_event_type,
    (select auth.uid())
  );

  return true;
end;
$$;

revoke execute on function public.get_dashboard_stats     from public, anon;
revoke execute on function public.get_inquiry_activity    from public, anon;
revoke execute on function public.mark_inquiry_answered   from public, anon;
revoke execute on function public.mark_inquiry_unanswered from public, anon;
revoke execute on function public.set_inquiry_archived    from public, anon;

grant execute on function public.get_dashboard_stats     to authenticated;
grant execute on function public.get_inquiry_activity    to authenticated;
grant execute on function public.mark_inquiry_answered   to authenticated;
grant execute on function public.mark_inquiry_unanswered to authenticated;
grant execute on function public.set_inquiry_archived    to authenticated;
