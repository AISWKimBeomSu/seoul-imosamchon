-- ============================================================================
-- 0019_sessions.sql — 회차(슬롯) (v2.0 Phase 1)
--
-- 배경: 지금은 체험 하나에 날짜가 하나뿐이고 그마저 문자열이다. 회차를 행으로
--       만들면 '8월 21일 3자리 남음'도, 매진도, 자동 마감도 전부 여기서 파생된다.
--
-- 설계: 상태 컬럼을 두지 않는다(ADR-13). open/closed/full/past를 저장하면 실제
--       예약 수와 어긋나는 순간이 반드시 오고, 그 불일치는 조용하다. 대신
--       starts_at·capacity·booked_count·is_closed 네 사실만 저장하고 상태는
--       읽을 때 계산한다(lib/sessions.ts).
--
--       반복 일정 엔진은 만들지 않는다. 월 몇 회 여는 규모에서는 운영자가
--       한 줄씩 추가하는 편이 규칙을 배우는 것보다 빠르다.
--
-- 참조: docs/PLATFORM.md §11.2, F10
-- ============================================================================

create table if not exists public.sessions (
  id           uuid        primary key default gen_random_uuid(),
  -- forms.key는 unique다(0015). 사람이 읽을 수 있는 키로 참조해 admin·로그가 읽힌다.
  -- on delete restrict — 예약이 걸린 체험은 지워지지 않아야 한다(폐지는 은퇴로, §11.7).
  form_key     text        not null references public.forms(key)
                             on update cascade on delete restrict,
  starts_at    timestamptz not null,
  duration_min int,                                    -- null이면 forms.duration_min을 쓴다
  capacity     int         not null check (capacity between 1 and 50),
  booked_count int         not null default 0 check (booked_count >= 0),
  is_closed    boolean     not null default false,     -- 운영자 수동 마감
  note         text        not null default '',        -- 관리자 메모(공개 안 함)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- 마지막 방어선. RPC가 정원을 검사하지만, 코드가 아니라 DB가 막아야 진짜 막힌 것이다.
  constraint sessions_capacity_ok check (booked_count <= capacity)
);

comment on column public.sessions.booked_count is
  '좌석을 점유한 예약 인원 합계. 오직 request_booking / cancel_booking / admin_set_booking_status RPC만 이 값을 바꾼다(ADR-15). 직접 UPDATE 금지.';

create index if not exists idx_sessions_listing
  on public.sessions (form_key, starts_at);

drop trigger if exists trg_sessions_updated on public.sessions;
create trigger trg_sessions_updated
  before update on public.sessions
  for each row execute function public.touch_updated_at();

alter table public.sessions enable row level security;

-- 공개 읽기는 체험의 공개 여부를 따라간다. 비공개 체험의 회차가 새어 나가지 않는다.
drop policy if exists "sessions 공개 읽기" on public.sessions;
create policy "sessions 공개 읽기" on public.sessions
  for select using (
    exists (
      select 1 from public.forms f
      where f.key = form_key and (f.is_published or public.is_admin())
    )
  );

drop policy if exists "sessions 관리자" on public.sessions;
create policy "sessions 관리자" on public.sessions
  for all using (public.is_admin()) with check (public.is_admin());
