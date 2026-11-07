-- Flowdesk: inquiry tables (DB.md §5.6–§5.10)

-- 5.6 customers -----------------------------------------------------------
create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  email       extensions.citext not null,
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint customers_business_email_key unique (business_id, email),
  constraint customers_id_business_key unique (id, business_id)
);

-- 5.7 inquiries -----------------------------------------------------------
create table public.inquiries (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses (id) on delete cascade,
  customer_id       uuid not null,
  source_id         uuid,
  customer_name     text not null,
  customer_email    extensions.citext not null,
  subject           text not null,
  message           text not null,
  answered_at       timestamptz,
  answered_manually boolean not null default false,
  read_at           timestamptz,
  archived_at       timestamptz,
  reply_token       text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  ip_hash           text,
  origin            text,
  user_agent        text,
  search_text       text not null generated always as (
                      lower(customer_name || ' ' || customer_email::text || ' ' || subject)
                    ) stored,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint inquiries_id_business_key unique (id, business_id),
  constraint inquiries_reply_token_key unique (reply_token),
  constraint inquiries_customer_fk foreign key (customer_id, business_id)
    references public.customers (id, business_id) on delete cascade,
  constraint inquiries_source_fk foreign key (source_id, business_id)
    references public.inquiry_sources (id, business_id) on delete set null (source_id),
  constraint inquiries_customer_name_length check (char_length(customer_name) between 1 and 200),
  constraint inquiries_customer_email_length check (char_length(customer_email::text) <= 254),
  constraint inquiries_subject_length check (char_length(subject) between 1 and 200),
  constraint inquiries_message_length check (char_length(message) between 1 and 5000),
  constraint inquiries_user_agent_length check (char_length(user_agent) <= 500),
  constraint inquiries_answered_manually_check check (not answered_manually or answered_at is not null)
);

-- 5.8 messages ------------------------------------------------------------
create table public.messages (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references public.businesses (id) on delete cascade,
  inquiry_id          uuid not null,
  customer_id         uuid not null,
  direction           public.message_direction not null default 'outbound',
  status              public.message_status not null,
  from_name           text,
  from_email          extensions.citext not null,
  to_email            extensions.citext not null,
  reply_to_email      extensions.citext,
  bcc_email           extensions.citext,
  subject             text not null,
  content             text not null,
  body_text           text not null,
  body_html           text,
  provider            text not null default 'resend',
  provider_message_id text,
  rfc_message_id      text not null,
  in_reply_to         text,
  references_header   text,
  error_message       text,
  attempt_count       integer not null default 0,
  last_attempt_at     timestamptz,
  sent_by             uuid references auth.users (id) on delete set null,
  sent_at             timestamptz,
  received_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint messages_rfc_message_id_key unique (rfc_message_id),
  constraint messages_inquiry_fk foreign key (inquiry_id, business_id)
    references public.inquiries (id, business_id) on delete cascade,
  constraint messages_customer_fk foreign key (customer_id, business_id)
    references public.customers (id, business_id) on delete cascade,
  constraint messages_content_length check (char_length(content) between 1 and 10000),
  constraint messages_direction_status check (
    (direction = 'outbound' and status in ('sending', 'sent', 'failed'))
    or (direction = 'inbound' and status = 'received')
  ),
  constraint messages_sent_at_check check (status <> 'sent' or sent_at is not null)
);

-- 5.9 inquiry_events ------------------------------------------------------
create table public.inquiry_events (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  inquiry_id  uuid not null,
  type        public.inquiry_event_type not null,
  actor_id    uuid references auth.users (id) on delete set null,
  message_id  uuid references public.messages (id) on delete cascade,
  created_at  timestamptz not null default now(),

  constraint inquiry_events_inquiry_fk foreign key (inquiry_id, business_id)
    references public.inquiries (id, business_id) on delete cascade
);

-- 5.10 rate_limits --------------------------------------------------------
create table public.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,

  primary key (key, window_start)
);
