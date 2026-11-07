-- Flowdesk: Row Level Security policies and column grants (DB.md §8)
-- "Active" = business_id in (select private.active_business_ids())

-- Enable RLS on every table in public -------------------------------------
alter table public.businesses      enable row level security;
alter table public.profiles        enable row level security;
alter table public.platform_admins enable row level security;
alter table public.memberships     enable row level security;
alter table public.inquiry_sources enable row level security;
alter table public.customers       enable row level security;
alter table public.inquiries       enable row level security;
alter table public.messages        enable row level security;
alter table public.inquiry_events  enable row level security;
alter table public.rate_limits     enable row level security;

-- businesses --------------------------------------------------------------
-- SELECT on any membership, so suspended owners can still read their status.
create policy "members read own business"
on public.businesses for select to authenticated
using (id in (select private.member_business_ids()));

create policy "members update active business"
on public.businesses for update to authenticated
using      (id in (select private.active_business_ids()))
with check (id in (select private.active_business_ids()));

-- profiles ----------------------------------------------------------------
create policy "users read own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "users update own profile"
on public.profiles for update to authenticated
using      (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- platform_admins (no write policies: nobody can make themselves an admin)
create policy "users read own admin row"
on public.platform_admins for select to authenticated
using (user_id = (select auth.uid()));

-- memberships -------------------------------------------------------------
create policy "users read own memberships"
on public.memberships for select to authenticated
using (user_id = (select auth.uid()));

-- inquiry_sources ---------------------------------------------------------
create policy "members read sources"
on public.inquiry_sources for select to authenticated
using (business_id in (select private.active_business_ids()));

-- customers ---------------------------------------------------------------
create policy "members read customers"
on public.customers for select to authenticated
using (business_id in (select private.active_business_ids()));

create policy "members delete customers"
on public.customers for delete to authenticated
using (business_id in (select private.active_business_ids()));

-- inquiries ---------------------------------------------------------------
create policy "members read inquiries"
on public.inquiries for select to authenticated
using (business_id in (select private.active_business_ids()));

create policy "members mark inquiries read"
on public.inquiries for update to authenticated
using      (business_id in (select private.active_business_ids()))
with check (business_id in (select private.active_business_ids()));

create policy "members delete inquiries"
on public.inquiries for delete to authenticated
using (business_id in (select private.active_business_ids()));

-- messages (writes go through the server with the service role) ----------
create policy "members read messages"
on public.messages for select to authenticated
using (business_id in (select private.active_business_ids()));

-- inquiry_events (writes go through functions and triggers) ---------------
create policy "members read inquiry events"
on public.inquiry_events for select to authenticated
using (business_id in (select private.active_business_ids()));

-- rate_limits: no policies. Service role only.

-- Grants (§8.3): policies decide which rows, grants decide which columns ---
revoke all on all tables in schema public from anon;

-- TRUNCATE, REFERENCES and TRIGGER are not covered by RLS, so they are
-- revoked together with the write privileges.
revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from authenticated;

grant update (name, email, website, logo_path, timezone, notify_new_inquiry,
              bcc_replies, signature, sender_name, reply_to_email)
  on public.businesses to authenticated;

grant update (full_name) on public.profiles  to authenticated;
grant update (read_at)   on public.inquiries to authenticated;
grant delete on public.inquiries, public.customers to authenticated;
