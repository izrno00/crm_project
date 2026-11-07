-- Flowdesk: business-logos storage bucket and policies (DB.md §10)
-- Object path: {business_id}/logo-{timestamp}.{ext}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-logos',
  'business-logos',
  true,
  1048576,                                         -- 1 MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

create policy "members read business logos"
on storage.objects for select to authenticated
using (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1] in (select id::text from private.active_business_ids() as id)
);

create policy "members upload business logos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1] in (select id::text from private.active_business_ids() as id)
);

create policy "members update business logos"
on storage.objects for update to authenticated
using (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1] in (select id::text from private.active_business_ids() as id)
)
with check (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1] in (select id::text from private.active_business_ids() as id)
);

create policy "members delete business logos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1] in (select id::text from private.active_business_ids() as id)
);
