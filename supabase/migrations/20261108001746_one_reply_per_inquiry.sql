-- One reply per inquiry in the MVP (PRD REP-11, agreed 2026-11-08). Also stops a double send from
-- two tabs. Inbound messages (future) are not affected. Drop this index when follow-ups arrive.
create unique index messages_one_outbound_per_inquiry
  on public.messages (inquiry_id)
  where direction = 'outbound';
