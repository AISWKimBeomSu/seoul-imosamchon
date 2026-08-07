-- ============================================================================
-- 0021_bookings.sql — 예약 + 정원의 원자성 (v2.0 Phase 2)
--
-- 이 파일이 구글폼을 대체한다. 핵심은 테이블이 아니라 아래 RPC 세 개다.
--
-- 왜 RPC인가: 잔여석 확인과 예약 삽입 사이에 다른 요청이 끼어들면 정원이 넘는다.
--   애플리케이션에서 "세어 보고 → 넣기"를 하면 그 틈은 반드시 열린다. 행을 잠그고
--   한 트랜잭션 안에서 확인·삽입·증가를 끝내는 것만이 실제로 막는 방법이다.
--
-- 좌석을 점유하는 상태: requested, confirmed, no_show, done
-- 좌석을 해제하는 상태: declined, cancelled
--   → 이 정의가 세 RPC의 카운트 증감을 결정하는 유일한 기준이다.
--
-- 참조: docs/PLATFORM.md §11.4·§11.5, F11·F12·F16
-- ============================================================================

create table if not exists public.bookings (
  id            uuid        primary key default gen_random_uuid(),
  session_id    uuid        not null references public.sessions(id) on delete restrict,

  name          text        not null check (length(btrim(name)) between 1 and 50),

  -- 이메일이 nullable인 이유: 이메일을 안 쓰시는 시니어 게스트가 전화로 신청하면
  -- 운영자가 대신 등록한다(F16-7). 웹 폼에서는 서버 액션이 필수로 강제한다 —
  -- 자기가 신청한 경우엔 이메일이 확정·취소 링크를 받는 유일한 통로이기 때문이다.
  email         text        check (email is null or position('@' in email) > 1),

  -- 국제번호를 받는다. Maria(스페인)에게 한국 번호를 요구할 수 없다.
  -- 기호만 잔뜩 든 값이 통과하지 않도록 숫자 개수를 따로 센다.
  phone         text        not null check (
                              phone ~ '^[0-9+\-\s()]{9,25}$'
                              and length(regexp_replace(phone, '\D', '', 'g')) >= 8
                            ),

  guests        int         not null check (guests between 1 and 20),
  note          text        not null default '',       -- 알레르기 등 요청사항
  locale        text        not null default 'ko' check (locale in ('ko','en')),

  status        text        not null default 'requested' check (
                              status in ('requested','confirmed','declined',
                                         'cancelled','no_show','done')
                            ),
  -- web=본인 신청, admin=전화·종이 접수분을 운영자가 대신 등록
  source        text        not null default 'web' check (source in ('web','admin')),

  -- people.consent_at과 같은 방식. 동의를 받았다는 사실을 시각으로 남긴다.
  consent_at    timestamptz not null,
  age_confirmed boolean     not null check (age_confirmed),

  cancel_token   text        not null unique,          -- 서버 생성 난수 32바이트(base64url)
  confirmed_at   timestamptz,
  declined_at    timestamptz,
  cancelled_at   timestamptz,
  decline_reason text        not null default '',
  reminded_at    timestamptz,                          -- D-1 리마인더 멱등성(F13-6)
  admin_memo     text        not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.bookings is
  '예약. 개인정보가 들어 있다 — 공개 RLS 정책을 만들지 않는다. 본인 조회는 cancel_token URL로만 한다.';

create index if not exists idx_bookings_session on public.bookings (session_id, status);
create index if not exists idx_bookings_token   on public.bookings (cancel_token);
create index if not exists idx_bookings_pending on public.bookings (created_at)
  where status = 'requested';                          -- admin의 'SLA 초과 미처리' 조회용

drop trigger if exists trg_bookings_updated on public.bookings;
create trigger trg_bookings_updated
  before update on public.bookings
  for each row execute function public.touch_updated_at();

alter table public.bookings enable row level security;

-- ⚠ 공개 정책을 의도적으로 만들지 않는다.
--    anon은 SELECT도 INSERT도 못 한다. 쓰기는 아래 RPC(service_role 호출)뿐이고,
--    게스트 본인 조회도 서버가 토큰으로 대신 읽어 준다.
--    link_clicks(0011)에서 검증된 '정책 부재 = 서버 전용' 패턴을 더 좁게 적용한 것.
drop policy if exists "bookings 관리자" on public.bookings;
create policy "bookings 관리자" on public.bookings
  for all using (public.is_admin()) with check (public.is_admin());


-- ── RPC ① 신청 ─────────────────────────────────────────────────────────────
create or replace function public.request_booking(
  p_session uuid,
  p_name    text,
  p_email   text,
  p_phone   text,
  p_guests  int,
  p_note    text,
  p_locale  text,
  p_token   text,
  p_source  text default 'web'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_s  record;
  v_f  record;
  v_id uuid;
begin
  -- for update — 여기서 이 회차를 잠근다. 동시에 들어온 두 신청 중 하나는
  -- 이 줄에서 기다렸다가, 앞의 것이 카운트를 올린 뒤의 값을 본다.
  select * into v_s from sessions where id = p_session for update;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;

  select * into v_f from forms where key = v_s.form_key;
  if not found or not v_f.is_published or v_f.booking_mode <> 'native' then
    raise exception 'NOT_BOOKABLE';
  end if;

  if v_s.is_closed or v_s.starts_at <= now() then
    raise exception 'SESSION_CLOSED';
  end if;

  -- 마감 컷오프는 forms.cutoff_hours 하나만 본다(ADR-13).
  -- 운영자 수동 등록은 면제 — 전화가 마감 직전에 올 수 있고, 그 판단은 사람이 한다.
  if p_source <> 'admin'
     and v_s.starts_at - make_interval(hours => v_f.cutoff_hours) <= now() then
    raise exception 'SESSION_CLOSED';
  end if;

  if v_s.booked_count + p_guests > v_s.capacity then
    raise exception 'CAPACITY_EXCEEDED';
  end if;

  insert into bookings (
    session_id, name, email, phone, guests, note, locale,
    consent_at, age_confirmed, cancel_token, source
  ) values (
    p_session, btrim(p_name), nullif(btrim(coalesce(p_email,'')), ''), btrim(p_phone),
    p_guests, coalesce(p_note,''), p_locale,
    now(), true, p_token, p_source
  ) returning id into v_id;

  update sessions set booked_count = booked_count + p_guests where id = p_session;
  return v_id;
end;
$$;


-- ── RPC ② 게스트 취소(토큰) ────────────────────────────────────────────────
create or replace function public.cancel_booking(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_b record;
begin
  -- 'for update of b' — 조인했지만 예약 행만 잠근다. sessions까지 잠글 이유가 없다.
  select b.id, b.status, b.guests, b.session_id, s.starts_at
    into v_b
    from bookings b
    join sessions s on s.id = b.session_id
   where b.cancel_token = p_token
     for update of b;

  if not found then return false; end if;
  -- 이미 끝난 예약은 손대지 않는다(멱등).
  if v_b.status not in ('requested','confirmed') then return false; end if;
  -- 시작한 뒤에는 화면에서 못 되돌린다. 전화로 안내한다.
  if v_b.starts_at <= now() then return false; end if;

  update bookings set status = 'cancelled', cancelled_at = now() where id = v_b.id;

  -- greatest(0, ...)로 감싸지 않는다(ADR-15). 음수가 나온다는 건 어딘가에서
  -- 두 번 뺐다는 뜻이고, 그건 조용히 0으로 덮이는 대신 CHECK 위반으로 터져야 한다.
  update sessions set booked_count = booked_count - v_b.guests where id = v_b.session_id;
  return true;
end;
$$;


-- ── RPC ③ 관리자 상태 변경 ─────────────────────────────────────────────────
-- 승인·거절·취소·노쇼·완료가 전부 여기를 지난다. admin이 RLS로 bookings.status를
-- 직접 UPDATE하면 status만 바뀌고 booked_count는 그대로 남아 좌석이 영원히 샌다.
create or replace function public.admin_set_booking_status(
  p_id     uuid,
  p_status text,
  p_reason text default '',
  p_memo   text default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_b           record;
  v_held_before boolean;
  v_held_after  boolean;
begin
  if p_status not in ('confirmed','declined','cancelled','no_show','done') then
    raise exception 'BAD_STATUS';
  end if;

  select * into v_b from bookings where id = p_id for update;
  if not found then return false; end if;
  if v_b.status = p_status then return true; end if;          -- 멱등: 두 번 눌러도 안전

  -- 종결된 예약을 되살리지 않는다.
  -- 게스트가 방금 취소한 건을 운영자가 승인하면 좌석은 이미 반환된 뒤라
  -- 카운트와 실제가 어긋난다. 그 경쟁을 여기서 끊는다.
  if v_b.status in ('declined','cancelled') then return false; end if;

  v_held_before := v_b.status in ('requested','confirmed','no_show','done');
  v_held_after  := p_status  in ('confirmed','no_show','done');

  update bookings set
    status         = p_status,
    confirmed_at   = case when p_status = 'confirmed' then now() else confirmed_at end,
    declined_at    = case when p_status = 'declined'  then now() else declined_at  end,
    cancelled_at   = case when p_status = 'cancelled' then now() else cancelled_at end,
    decline_reason = case when p_status = 'declined'  then coalesce(p_reason,'')
                          else decline_reason end,
    admin_memo     = coalesce(p_memo, admin_memo)
  where id = p_id;

  if v_held_before and not v_held_after then
    update sessions set booked_count = booked_count - v_b.guests where id = v_b.session_id;
  elsif not v_held_before and v_held_after then
    update sessions set booked_count = booked_count + v_b.guests where id = v_b.session_id;
  end if;

  return true;
end;
$$;


-- ── 실행 권한 ───────────────────────────────────────────────────────────────
-- PostgreSQL은 함수를 만들면 EXECUTE를 PUBLIC에 기본으로 준다. anon·authenticated는
-- PUBLIC을 상속하므로 그 둘에서만 회수하면 PostgREST의 /rest/v1/rpc/… 가 그대로
-- 열려 있다 — 서버 액션의 검증·동의 확인·토큰 생성을 전부 우회할 수 있다는 뜻이다.
-- 0011_link_clicks.sql이 이미 `from public, anon`으로 회수한다. 같은 방식을 쓴다.
revoke execute on function public.request_booking(uuid,text,text,text,int,text,text,text,text)
  from public, anon, authenticated;
revoke execute on function public.cancel_booking(text)
  from public, anon, authenticated;
revoke execute on function public.admin_set_booking_status(uuid,text,text,text)
  from public, anon, authenticated;
