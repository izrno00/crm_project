-- Flowdesk: indexes (DB.md §9)
-- Unique indexes come from the table constraints (slug, public_key,
-- (business_id, user_id), (business_id, email), reply_token, rfc_message_id).

-- memberships: RLS helper lookups
create index memberships_user_id_idx
  on public.memberships (user_id);

-- inquiry_sources: FK
create index inquiry_sources_business_id_idx
  on public.inquiry_sources (business_id);

-- inquiries
create index inquiries_business_created_idx
  on public.inquiries (business_id, created_at desc);

create index inquiries_unanswered_idx
  on public.inquiries (business_id, created_at)
  where answered_at is null and archived_at is null;

create index inquiries_customer_id_idx
  on public.inquiries (customer_id);

create index inquiries_source_id_idx
  on public.inquiries (source_id);

create index inquiries_search_text_trgm_idx
  on public.inquiries using gin (search_text extensions.gin_trgm_ops);

-- messages
create index messages_inquiry_created_idx
  on public.messages (inquiry_id, created_at);

create index messages_business_id_idx
  on public.messages (business_id);

create index messages_customer_id_idx
  on public.messages (customer_id);

create index messages_sent_by_idx
  on public.messages (sent_by);

create index messages_provider_message_id_idx
  on public.messages (provider_message_id);

-- inquiry_events
create index inquiry_events_business_created_idx
  on public.inquiry_events (business_id, created_at desc);

create index inquiry_events_inquiry_created_idx
  on public.inquiry_events (inquiry_id, created_at);

create index inquiry_events_message_id_idx
  on public.inquiry_events (message_id);

create index inquiry_events_actor_id_idx
  on public.inquiry_events (actor_id);
