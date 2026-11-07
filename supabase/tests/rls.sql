-- Flowdesk: database smoke test + RLS isolation checks (Tech.md §15)
--
-- HOW TO RUN
--   Supabase dashboard → SQL Editor → paste this whole file → Run.
--   Run it as the default `postgres` role (the SQL Editor default).
--
-- WHAT HAPPENS
--   Everything runs inside one DO block that ends with RAISE EXCEPTION, so the
--   whole transaction is ROLLED BACK. Nothing is kept: not the two test users
--   in auth.users, not the businesses, inquiries or anything else.
--   The editor therefore shows an ERROR that starts with
--   "SMOKE TEST (rolled back)". That is expected: the report is the error text.
--
-- EXPECTED REPORT (any line that differs, or contains "BAD", is a failure)
--   profiles_trigger=2
--   source_a_key_ok=true sources_b=0 sender_name_default=Smoke A tz_b=UTC
--   customers_a=1 latest_name=Jane D ua_len=500 search_text=jane jane@example.test hello
--   rate_limit_1st=true rate_limit_2nd=false
--   answered_while_sending=false answered_after_fail=false answered_after_sent=true events_inq1=received,reply_failed,reply_sent reply_sent_actor_ok=true
--   B: inquiries=0 view=0 customers=0 messages=0 events=0 sources=0 businesses=1 memberships=1 profiles=1 archive_A_inquiry=false mark_A_inquiry=false delete_A_inquiry=0 read_A_inquiry=0 update_A_business=0
--   A: view=2 statuses=answered,new stats(total,new,awaiting,answered,unread)=2,1,0,1,2 activity_days=30 activity_sum=2
--   A: mark_answered(inq2)=true again=false unanswered(inq2)=true unanswered(inq1,has_sent_reply)=false archive=true archive_again=false total_while_archived=1 restore=true events_inq2=archived,marked_answered,marked_unanswered,received,restored
--   A: set read_at rows=1 update business name rows=1 update own profile rows=1 update_subject=denied update_status=denied update_sender_email=denied insert_message=denied insert_event=denied self_admin=denied update_source=denied call_submit_inquiry=denied call_check_rate_limit=denied truncate=denied
--   A suspended: inquiries=0 sources=0 businesses(readable status)=1 mark_answered=false update_business=0 intake=rejected(source_inactive)
--   anon select businesses=denied anon select view=denied anon rpc=denied
--   key_rotated=true source_deleted_inquiries_kept=2 after_customer_delete: inquiries=0 messages=0 events=0

do $$
declare
  v_owner_a uuid := gen_random_uuid();
  v_owner_b uuid := gen_random_uuid();
  v_biz_a   uuid;
  v_biz_b   uuid;
  v_src_a   uuid;
  v_inq1    uuid;
  v_inq2    uuid;
  v_msg     uuid := gen_random_uuid();
  v_cnt     int;
  v_ok      boolean;
  v_txt     text;
  r         record;
  rep       text := '';
begin
  -- Setup as postgres --------------------------------------------------
  -- Auth users -> on_auth_user_created creates the profiles
  insert into auth.users (id, email, raw_user_meta_data) values
    (v_owner_a, 'smoke-a@example.test', '{"full_name":"Owner A"}'),
    (v_owner_b, 'smoke-b@example.test', '{"full_name":"Owner B"}');
  select count(*) into v_cnt from public.profiles where id in (v_owner_a, v_owner_b) and full_name like 'Owner _';
  rep := rep || 'profiles_trigger=' || v_cnt || E'\n';

  -- Onboarding: A gets a "Main website" source, B (no origins) gets none
  v_biz_a := public.create_business_with_owner(v_owner_a, 'Smoke A', 'smoke-a', 'a@example.test', 'https://a.test',
             'Europe/Berlin', null, 'smoke-a@mail.flowdesk.invalid', array['https://a.test']);
  v_biz_b := public.create_business_with_owner(v_owner_b, 'Smoke B', 'smoke-b', 'b@example.test', null,
             null, 'B Sender', 'smoke-b@mail.flowdesk.invalid', '{}');
  select s.id, s.public_key ~ '^pk_[0-9a-f]{40}$' into v_src_a, v_ok from public.inquiry_sources s where s.business_id = v_biz_a;
  select count(*) into v_cnt from public.inquiry_sources where business_id = v_biz_b;
  select sender_name into v_txt from public.businesses where id = v_biz_a;
  rep := rep || 'source_a_key_ok=' || v_ok || ' sources_b=' || v_cnt || ' sender_name_default=' || v_txt
             || ' tz_b=' || (select timezone from public.businesses where id = v_biz_b) || E'\n';

  -- Intake: the same email in different case = one customer, latest name wins
  v_inq1 := public.submit_inquiry(v_src_a, 'Jane', 'Jane@Example.test', 'Hello', 'Message body', 'h', 'https://a.test', repeat('x', 900));
  v_inq2 := public.submit_inquiry(v_src_a, 'Jane D', 'jane@example.test', 'Second', 'Another', 'h', 'https://a.test', 'UA');
  select count(*), max(name) into v_cnt, v_txt from public.customers where business_id = v_biz_a;
  rep := rep || 'customers_a=' || v_cnt || ' latest_name=' || v_txt
             || ' ua_len=' || (select char_length(user_agent) from public.inquiries where id = v_inq1)
             || ' search_text=' || (select search_text from public.inquiries where id = v_inq1) || E'\n';

  -- Rate limit: max 1 per window
  v_ok := public.check_rate_limit('smoke', 1, 60);
  rep := rep || 'rate_limit_1st=' || v_ok;
  v_ok := public.check_rate_limit('smoke', 1, 60);
  rep := rep || ' rate_limit_2nd=' || v_ok || E'\n';

  -- Message lifecycle: sending -> failed -> sending (retry) -> sent
  insert into public.messages (id, business_id, inquiry_id, customer_id, status, from_email, to_email,
                               subject, content, body_text, rfc_message_id, sent_by, attempt_count)
  select v_msg, v_biz_a, i.id, i.customer_id, 'sending', 'x@a.test', i.customer_email,
         'Re: Hello', 'Hi', 'Hi', '<' || v_msg || '@a.test>', v_owner_a, 1
  from public.inquiries i where i.id = v_inq1;
  select (answered_at is not null) into v_ok from public.inquiries where id = v_inq1;
  rep := rep || 'answered_while_sending=' || v_ok;
  update public.messages set status = 'failed', error_message = 'boom' where id = v_msg;
  select (answered_at is not null) into v_ok from public.inquiries where id = v_inq1;
  rep := rep || ' answered_after_fail=' || v_ok;
  update public.messages set status = 'sending', attempt_count = 2 where id = v_msg;
  update public.messages set status = 'sent', sent_at = now() where id = v_msg;
  select (answered_at is not null) into v_ok from public.inquiries where id = v_inq1;
  rep := rep || ' answered_after_sent=' || v_ok;
  select string_agg(type::text, ',' order by type::text) into v_txt from public.inquiry_events where inquiry_id = v_inq1;
  rep := rep || ' events_inq1=' || v_txt
             || ' reply_sent_actor_ok=' || (select actor_id = v_owner_a from public.inquiry_events where message_id = v_msg and type = 'reply_sent') || E'\n';

  -- As owner B: must not see or touch anything of business A -----------
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner_b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into v_cnt from public.inquiries;          rep := rep || 'B: inquiries=' || v_cnt;
  select count(*) into v_cnt from public.inquiries_view;     rep := rep || ' view=' || v_cnt;
  select count(*) into v_cnt from public.customers;          rep := rep || ' customers=' || v_cnt;
  select count(*) into v_cnt from public.messages;           rep := rep || ' messages=' || v_cnt;
  select count(*) into v_cnt from public.inquiry_events;     rep := rep || ' events=' || v_cnt;
  select count(*) into v_cnt from public.inquiry_sources;    rep := rep || ' sources=' || v_cnt;
  select count(*) into v_cnt from public.businesses;         rep := rep || ' businesses=' || v_cnt;
  select count(*) into v_cnt from public.memberships;        rep := rep || ' memberships=' || v_cnt;
  select count(*) into v_cnt from public.profiles;           rep := rep || ' profiles=' || v_cnt;
  v_ok := public.set_inquiry_archived(v_inq1, true);         rep := rep || ' archive_A_inquiry=' || v_ok;
  v_ok := public.mark_inquiry_answered(v_inq2);              rep := rep || ' mark_A_inquiry=' || v_ok;
  delete from public.inquiries where id = v_inq1;
  get diagnostics v_cnt = row_count;                         rep := rep || ' delete_A_inquiry=' || v_cnt;
  update public.inquiries set read_at = now() where id = v_inq1;
  get diagnostics v_cnt = row_count;                         rep := rep || ' read_A_inquiry=' || v_cnt;
  update public.businesses set name = 'Hacked' where id = v_biz_a;
  get diagnostics v_cnt = row_count;                         rep := rep || ' update_A_business=' || v_cnt || E'\n';
  execute 'reset role';

  -- As owner A: reads, RPCs, allowed writes, blocked writes -------------
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner_a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into v_cnt from public.inquiries_view;     rep := rep || 'A: view=' || v_cnt;
  select string_agg(status, ',' order by status) into v_txt from public.inquiries_view;
  rep := rep || ' statuses=' || v_txt;
  select * into r from public.get_dashboard_stats(v_biz_a);
  rep := rep || ' stats(total,new,awaiting,answered,unread)=' || r.total || ',' || r."new" || ',' || r.awaiting || ',' || r.answered || ',' || r.unread;
  select count(*) as days, sum(a.inquiries) as total into r from public.get_inquiry_activity(v_biz_a) a;
  rep := rep || ' activity_days=' || r.days || ' activity_sum=' || r.total || E'\n';

  v_ok := public.mark_inquiry_answered(v_inq2);    rep := rep || 'A: mark_answered(inq2)=' || v_ok;
  v_ok := public.mark_inquiry_answered(v_inq2);    rep := rep || ' again=' || v_ok;
  v_ok := public.mark_inquiry_unanswered(v_inq2);  rep := rep || ' unanswered(inq2)=' || v_ok;
  v_ok := public.mark_inquiry_unanswered(v_inq1);  rep := rep || ' unanswered(inq1,has_sent_reply)=' || v_ok;
  v_ok := public.set_inquiry_archived(v_inq2, true);  rep := rep || ' archive=' || v_ok;
  v_ok := public.set_inquiry_archived(v_inq2, true);  rep := rep || ' archive_again=' || v_ok;
  select r2.total into v_cnt from public.get_dashboard_stats(v_biz_a) r2;  rep := rep || ' total_while_archived=' || v_cnt;
  v_ok := public.set_inquiry_archived(v_inq2, false); rep := rep || ' restore=' || v_ok;
  select string_agg(type::text, ',' order by type::text) into v_txt from public.inquiry_events where inquiry_id = v_inq2;
  rep := rep || ' events_inq2=' || v_txt || E'\n';

  update public.inquiries set read_at = now() where id = v_inq1;
  get diagnostics v_cnt = row_count;                         rep := rep || 'A: set read_at rows=' || v_cnt;
  update public.businesses set name = 'Smoke A2' where id = v_biz_a;
  get diagnostics v_cnt = row_count;                         rep := rep || ' update business name rows=' || v_cnt;
  update public.profiles set full_name = 'Owner A2' where id = v_owner_a;
  get diagnostics v_cnt = row_count;                         rep := rep || ' update own profile rows=' || v_cnt;

  begin update public.inquiries set subject = 'x' where id = v_inq1; rep := rep || ' update_subject=ALLOWED(BAD)';
  exception when insufficient_privilege then rep := rep || ' update_subject=denied'; end;
  begin update public.businesses set status = 'suspended' where id = v_biz_a; rep := rep || ' update_status=ALLOWED(BAD)';
  exception when insufficient_privilege then rep := rep || ' update_status=denied'; end;
  begin update public.businesses set sender_email = 'evil@x.test' where id = v_biz_a; rep := rep || ' update_sender_email=ALLOWED(BAD)';
  exception when insufficient_privilege then rep := rep || ' update_sender_email=denied'; end;
  begin insert into public.messages (business_id, inquiry_id, customer_id, status, from_email, to_email, subject, content, body_text, rfc_message_id)
        values (v_biz_a, v_inq1, gen_random_uuid(), 'sending', 'a@a', 'b@b', 's', 'c', 'c', 'r'); rep := rep || ' insert_message=ALLOWED(BAD)';
  exception when insufficient_privilege then rep := rep || ' insert_message=denied'; end;
  begin insert into public.inquiry_events (business_id, inquiry_id, type) values (v_biz_a, v_inq1, 'received'); rep := rep || ' insert_event=ALLOWED(BAD)';
  exception when insufficient_privilege then rep := rep || ' insert_event=denied'; end;
  begin insert into public.platform_admins (user_id) values (v_owner_a); rep := rep || ' self_admin=ALLOWED(BAD)';
  exception when insufficient_privilege then rep := rep || ' self_admin=denied'; end;
  begin update public.inquiry_sources set allowed_origins = '{https://evil.test}' where business_id = v_biz_a; rep := rep || ' update_source=ALLOWED(BAD)';
  exception when insufficient_privilege then rep := rep || ' update_source=denied'; end;
  begin perform public.submit_inquiry(v_src_a, 'x', 'x@x.test', 's', 'm', null, null, null); rep := rep || ' call_submit_inquiry=ALLOWED(BAD)';
  exception when insufficient_privilege then rep := rep || ' call_submit_inquiry=denied'; end;
  begin perform public.check_rate_limit('x', 1, 60); rep := rep || ' call_check_rate_limit=ALLOWED(BAD)';
  exception when insufficient_privilege then rep := rep || ' call_check_rate_limit=denied'; end;
  begin truncate public.inquiries; rep := rep || ' truncate=ALLOWED(BAD)';
  exception when insufficient_privilege then rep := rep || ' truncate=denied'; end;
  rep := rep || E'\n';
  execute 'reset role';

  -- Suspension: tenant data hidden, status still readable, intake rejected
  update public.businesses set status = 'suspended' where id = v_biz_a;
  execute 'set local role authenticated';
  select count(*) into v_cnt from public.inquiries;          rep := rep || 'A suspended: inquiries=' || v_cnt;
  select count(*) into v_cnt from public.inquiry_sources;    rep := rep || ' sources=' || v_cnt;
  select count(*) into v_cnt from public.businesses;         rep := rep || ' businesses(readable status)=' || v_cnt;
  v_ok := public.mark_inquiry_answered(v_inq2);              rep := rep || ' mark_answered=' || v_ok;
  update public.businesses set name = 'While suspended' where id = v_biz_a;
  get diagnostics v_cnt = row_count;                         rep := rep || ' update_business=' || v_cnt;
  execute 'reset role';
  begin perform public.submit_inquiry(v_src_a, 'x', 'x@x.test', 's', 'm', null, null, null); rep := rep || ' intake=ACCEPTED(BAD)';
  exception when raise_exception then rep := rep || ' intake=rejected(' || sqlerrm || ')'; end;
  update public.businesses set status = 'active' where id = v_biz_a;
  rep := rep || E'\n';

  -- Anon: no table or RPC access ---------------------------------------
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
  begin select count(*) into v_cnt from public.businesses; rep := rep || 'anon select businesses=ALLOWED(BAD)';
  exception when insufficient_privilege then rep := rep || 'anon select businesses=denied'; end;
  begin select count(*) into v_cnt from public.inquiries_view; rep := rep || ' anon select view=ALLOWED(BAD)';
  exception when insufficient_privilege then rep := rep || ' anon select view=denied'; end;
  begin perform public.get_dashboard_stats(v_biz_a); rep := rep || ' anon rpc=ALLOWED(BAD)';
  exception when insufficient_privilege then rep := rep || ' anon rpc=denied'; end;
  execute 'reset role';

  -- Source key rotation + delete behaviour ------------------------------
  select public_key into v_txt from public.inquiry_sources where id = v_src_a;
  update public.inquiry_sources set public_key = default where id = v_src_a;
  rep := rep || E'\nkey_rotated=' || (select public_key <> v_txt from public.inquiry_sources where id = v_src_a);
  delete from public.inquiry_sources where id = v_src_a;
  rep := rep || ' source_deleted_inquiries_kept=' || (select count(*) from public.inquiries where business_id = v_biz_a and source_id is null);
  delete from public.customers where business_id = v_biz_a;
  rep := rep || ' after_customer_delete: inquiries=' || (select count(*) from public.inquiries where business_id = v_biz_a)
             || ' messages=' || (select count(*) from public.messages where business_id = v_biz_a)
             || ' events=' || (select count(*) from public.inquiry_events where business_id = v_biz_a);

  -- Always roll back
  raise exception E'SMOKE TEST (rolled back)\n%', rep;
end $$;
