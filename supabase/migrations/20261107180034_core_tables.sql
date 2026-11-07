-- Flowdesk: core tables (DB.md §5.1–§5.5)

-- 5.1 businesses ----------------------------------------------------------
create table public.businesses (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  slug                  text not null,
  email                 extensions.citext not null,
  website               text,
  logo_path             text,
  timezone              text not null default 'UTC',
  status                public.business_status not null default 'active',
  notify_new_inquiry    boolean not null default true,
  bcc_replies           boolean not null default false,
  signature             text,
  sender_name           text not null,
  sender_email          extensions.citext not null,
  reply_to_email        extensions.citext,
  custom_sending_domain text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint businesses_slug_key unique (slug),
  constraint businesses_name_length check (char_length(name) between 1 and 200),
  constraint businesses_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint businesses_signature_length check (char_length(signature) <= 1000)
);

-- 5.2 profiles ------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_full_name_length check (char_length(full_name) <= 200)
);

-- 5.3 platform_admins -----------------------------------------------------
create table public.platform_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 5.4 memberships ---------------------------------------------------------
create table public.memberships (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.membership_role not null default 'owner',
  created_at  timestamptz not null default now(),

  constraint memberships_business_user_key unique (business_id, user_id)
);

-- 5.5 inquiry_sources -----------------------------------------------------
create table public.inquiry_sources (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses (id) on delete cascade,
  name            text not null,
  public_key      text not null default private.generate_public_key(),
  allowed_origins text[] not null default '{}',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint inquiry_sources_public_key_key unique (public_key),
  constraint inquiry_sources_id_business_key unique (id, business_id),
  constraint inquiry_sources_public_key_format check (public_key ~ '^pk_[0-9a-f]{40}$'),
  constraint inquiry_sources_name_length check (char_length(name) <= 100)
);
