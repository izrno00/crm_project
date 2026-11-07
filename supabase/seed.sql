-- Flowdesk dev seed: demo inquiries for the two test businesses (DB.md §11).
-- DEV ONLY. Never run this on production.
--
-- Run `npm run seed:dev` first: it creates the auth users and the two businesses
-- ("Test Business A" and "Test Business B"). This file adds the demo data to them.
--
-- Re-runnable. It starts by deleting the demo customers (addresses ending in
-- @seed.example.com). The cascade removes their inquiries, messages and events, so the demo
-- data is rebuilt from scratch every time. Real test submissions (for example
-- visitor@example.com from the test website) are kept.
--
-- Per business: 30 inquiries over ~42 days.
--   7 new (under 48 h, some unread, one with a failed reply)
--   8 awaiting response (unanswered, 48 h or older)
--  12 answered (9 by email with a sent reply, 3 marked answered manually)
--   3 archived (2 unanswered, 1 answered)
-- One returning customer (Marko Kovač) has 3 inquiries. Test Business A also gets a second
-- connected website, "Landing page", to test the multiple-websites case.
--
-- The whole seed is one DO block, so it either applies completely or not at all.

do $seed$
declare
  names    text[] := array['Marko Kovač', 'Ivana Babić', 'Luka Horvat', 'Petra Novak', 'Ante Jurić',
                           'Maja Knežević', 'Tomislav Vuković', 'Sara Matić', 'Josip Tomić',
                           'Lana Pavlović', 'Filip Marić', 'Dora Grgić'];
  locals   text[] := array['marko.kovac', 'ivana.babic', 'luka.horvat', 'petra.novak', 'ante.juric',
                           'maja.knezevic', 'tomislav.vukovic', 'sara.matic', 'josip.tomic',
                           'lana.pavlovic', 'filip.maric', 'dora.grgic'];
  subjects text[] := array['Quote for a renovation project', 'Question about opening hours',
                           'Booking a visit next week', 'Do you work on weekends?',
                           'Request for a price list', 'Following up on my last message',
                           'Can you cover the Split area?', 'Question about an invoice',
                           'Emergency availability', 'Partnership proposal'];
  bodies   text[] := array[
    E'Hello,\n\nI would like to ask about your services. We have a small project coming up and would appreciate a quote.\n\nThank you,\n{name}',
    E'Hi there,\n\nCould you let me know when you are next available? Ideally sometime in the next two weeks.\n\nBest regards,\n{name}',
    E'Good afternoon,\n\nI found your website and wanted to check whether you can help with something urgent. Please get back to me when you can.\n\n{name}',
    E'Hello,\n\nI have a few questions before I decide. Could you send me some more details about how it works and what it costs?\n\nKind regards,\n{name}',
    E'Hi,\n\nA friend recommended you. We would like to book something for next month. What are the next steps?\n\nThanks,\n{name}',
    E'Dear team,\n\nI am writing to follow up on an earlier conversation. Could someone call me back this week?\n\nRegards,\n{name}'
  ];

  biz record;
  sc  record;

  v_src      uuid;
  v_src2     uuid;
  v_cust     uuid;
  v_inq      uuid;
  v_msg      uuid;
  v_email    text;
  v_name     text;
  v_first    text;
  v_subject  text;
  v_body     text;
  v_reply    text;
  v_created  timestamptz;
  v_sent     timestamptz;
  v_answered timestamptz;
  v_archived timestamptz;
  v_offset   integer;
begin
  update public.businesses
     set timezone = 'Europe/Zagreb'
   where slug in ('test-business-a', 'test-business-b');

  -- Start clean: remove last run's demo data.
  delete from public.customers where email::text like '%@seed.example.com';

  -- A second connected website for Test Business A.
  insert into public.inquiry_sources (business_id, name, allowed_origins)
  select b.id, 'Landing page', array['http://localhost:5500']
  from public.businesses b
  where b.slug = 'test-business-a'
    and not exists (
      select 1 from public.inquiry_sources s
      where s.business_id = b.id and s.name = 'Landing page'
    );

  for biz in
    select b.id, b.slug, b.sender_name, b.sender_email, b.email, m.user_id as owner_id
    from public.businesses b
    join public.memberships m on m.business_id = b.id
    where b.slug in ('test-business-a', 'test-business-b')
    order by b.slug
  loop
    select s.id into v_src  from public.inquiry_sources s where s.business_id = biz.id and s.name = 'Main website'  limit 1;
    select s.id into v_src2 from public.inquiry_sources s where s.business_id = biz.id and s.name = 'Landing page' limit 1;
    v_offset := case when biz.slug = 'test-business-a' then 0 else 4 end;

    -- n, customer, hours ago, kind (open | email | manual | failed), read?, archived?
    for sc in
      select * from (values
        ( 1,  1,    8, 'open',   false, false),
        ( 2,  2,    1, 'open',   false, false),
        ( 3,  3,    3, 'open',   false, false),
        ( 4,  4,   14, 'open',   true,  false),
        ( 5,  5,   20, 'failed', true,  false),
        ( 6,  6,   26, 'open',   false, false),
        ( 7,  7,   40, 'open',   true,  false),
        ( 8,  8,    5, 'email',  true,  false),
        ( 9,  9,   30, 'email',  true,  false),
        (10, 10,   50, 'open',   false, false),
        (11, 11,   72, 'open',   true,  false),
        (12, 12,  100, 'open',   true,  false),
        (13,  2,  170, 'open',   true,  false),
        (14,  3,  260, 'open',   true,  false),
        (15,  5,  400, 'open',   true,  false),
        (16,  1,  700, 'open',   true,  false),
        (17,  4,   60, 'email',  true,  false),
        (18,  6,  120, 'email',  true,  false),
        (19,  1,  200, 'email',  true,  false),
        (20,  7,  330, 'email',  true,  false),
        (21,  8,  500, 'email',  true,  false),
        (22,  9,  800, 'email',  true,  false),
        (23, 10, 1000, 'email',  true,  false),
        (24, 11,   90, 'manual', true,  false),
        (25, 12,  240, 'manual', true,  false),
        (26,  3,  600, 'manual', true,  false),
        (27,  5,  130, 'open',   true,  true),
        (28,  9,  450, 'open',   true,  true),
        (29,  2,  900, 'email',  true,  true),
        (30,  6,  650, 'open',   true,  false)
      ) as t(n, cust, hours, kind, is_read, archived)
      order by n
    loop
      v_name    := names[sc.cust];
      v_first   := split_part(v_name, ' ', 1);
      v_email   := locals[sc.cust] || '@seed.example.com';
      v_subject := subjects[((sc.n + v_offset) % 10) + 1];
      v_body    := replace(bodies[(sc.n % 6) + 1], '{name}', v_first);
      -- A little jitter so the demo inquiries do not all land on the same minute.
      v_created := now() - make_interval(hours => sc.hours) - make_interval(mins => (sc.n * 7) % 53);

      insert into public.customers (business_id, email, name)
      values (biz.id, v_email, v_name)
      on conflict (business_id, email) do update set name = excluded.name
      returning id into v_cust;

      insert into public.inquiries
        (business_id, customer_id, source_id, customer_name, customer_email,
         subject, message, origin, user_agent, created_at)
      values
        (biz.id, v_cust,
         case when biz.slug = 'test-business-a' and sc.n % 3 = 0 then v_src2 else v_src end,
         v_name, v_email, v_subject, v_body,
         'http://localhost:5500', 'Seed data', v_created)
      returning id into v_inq;

      insert into public.inquiry_events (business_id, inquiry_id, type, created_at)
      values (biz.id, v_inq, 'received', v_created);

      if sc.is_read then
        update public.inquiries
           set read_at = least(now() - interval '1 minute', v_created + make_interval(hours => 1 + sc.n % 6))
         where id = v_inq;
      end if;

      if sc.kind = 'email' then
        -- A reply that was sent. The on_message_status trigger sets answered_at and logs reply_sent.
        v_sent  := least(now() - interval '2 minutes', v_created + make_interval(hours => 2 + sc.n % 20));
        v_msg   := gen_random_uuid();
        v_reply := format(E'Hi %s,\n\nThank you for getting in touch. We can help with this. Could you tell us a good time to call you this week?', v_first);

        insert into public.messages
          (id, business_id, inquiry_id, customer_id, direction, status, from_name, from_email,
           to_email, reply_to_email, subject, content, body_text, provider, provider_message_id,
           rfc_message_id, attempt_count, last_attempt_at, sent_by, sent_at, created_at)
        values
          (v_msg, biz.id, v_inq, v_cust, 'outbound', 'sent', biz.sender_name, biz.sender_email,
           v_email, biz.email, 'Re: ' || v_subject, v_reply,
           v_reply || E'\n\n' || biz.sender_name || E'\n\n> ' || replace(v_body, E'\n', E'\n> '),
           'resend', 'seed-' || v_msg, '<' || v_msg || '@mail.flowdesk.invalid>',
           1, v_sent, biz.owner_id, v_sent, v_sent);

      elsif sc.kind = 'failed' then
        -- A reply the email provider rejected. The inquiry stays unanswered; the owner can retry.
        v_sent  := least(now() - interval '2 minutes', v_created + interval '3 hours');
        v_msg   := gen_random_uuid();
        v_reply := format(E'Hi %s,\n\nThanks for your message. We would be glad to help. When suits you for a short call?', v_first);

        insert into public.messages
          (id, business_id, inquiry_id, customer_id, direction, status, from_name, from_email,
           to_email, reply_to_email, subject, content, body_text, provider, rfc_message_id,
           error_message, attempt_count, last_attempt_at, sent_by, created_at)
        values
          (v_msg, biz.id, v_inq, v_cust, 'outbound', 'failed', biz.sender_name, biz.sender_email,
           v_email, biz.email, 'Re: ' || v_subject, v_reply,
           v_reply || E'\n\n' || biz.sender_name || E'\n\n> ' || replace(v_body, E'\n', E'\n> '),
           'resend', '<' || v_msg || '@mail.flowdesk.invalid>',
           'The sender domain is not verified with the email provider.',
           1, v_sent, biz.owner_id, v_sent);

      elsif sc.kind = 'manual' then
        -- Handled outside Flowdesk (for example by phone) and marked as answered by hand.
        v_answered := least(now() - interval '2 minutes', v_created + make_interval(hours => 3 + sc.n % 30));
        update public.inquiries
           set answered_at = v_answered, answered_manually = true
         where id = v_inq;
        insert into public.inquiry_events (business_id, inquiry_id, type, actor_id, created_at)
        values (biz.id, v_inq, 'marked_answered', biz.owner_id, v_answered);
      end if;

      if sc.archived then
        select coalesce(i.answered_at, i.created_at) into v_answered from public.inquiries i where i.id = v_inq;
        v_archived := least(now() - interval '1 minute', v_answered + make_interval(hours => 5 + sc.n % 20));
        update public.inquiries set archived_at = v_archived where id = v_inq;
        insert into public.inquiry_events (business_id, inquiry_id, type, actor_id, created_at)
        values (biz.id, v_inq, 'archived', biz.owner_id, v_archived);
      end if;
    end loop;
  end loop;

  -- The trigger logs reply events at "now". Move them to when the reply was actually attempted,
  -- so the activity feed reads realistically.
  update public.inquiry_events e
     set created_at = coalesce(m.sent_at, m.last_attempt_at)
    from public.messages m
    join public.customers c on c.id = m.customer_id and c.business_id = m.business_id
   where e.message_id = m.id
     and e.type in ('reply_sent', 'reply_failed')
     and c.email::text like '%@seed.example.com';
end
$seed$;
