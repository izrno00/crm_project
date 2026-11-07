-- Flowdesk: extensions, enum types and the private schema (DB.md §3, §4, §7.1)

-- Extensions --------------------------------------------------------------
create extension if not exists citext   with schema extensions;
create extension if not exists pg_trgm  with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- Enum types --------------------------------------------------------------
create type public.business_status as enum ('pending', 'active', 'suspended');

create type public.membership_role as enum ('owner', 'member');

create type public.message_direction as enum ('outbound', 'inbound');

create type public.message_status as enum ('sending', 'sent', 'failed', 'received');

create type public.inquiry_event_type as enum (
  'received',
  'reply_sent',
  'reply_failed',
  'marked_answered',
  'marked_unanswered',
  'archived',
  'restored'
);

-- Private schema (internal helpers, not exposed through the Data API) ------
create schema if not exists private;

-- Needed here (not in helper_functions_and_triggers) because
-- inquiry_sources.public_key uses it as its column default.
create function private.generate_public_key()
returns text
language sql volatile set search_path = ''
as $$ select 'pk_' || encode(extensions.gen_random_bytes(20), 'hex'); $$;
