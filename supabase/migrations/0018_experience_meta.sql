-- ============================================================================
-- 0018_experience_meta.sql — 체험 구조화 메타 (v2.0 Phase 1)
--
-- 배경: 날짜·가격·정원이 텍스트 안에 갇혀 있다. 쿠킹클래스를 예로 들면
--       subtitle    = '통인시장 · 8월 18일(화) 15:00'
--       description = '정가 135,000원 → 30,000원, 선착순 5명.'
--       detail      = 마크다운 표 안에 같은 숫자가 또
--       세 곳에 흩어져 있으니 '3자리 남음' 같은 건 만들 수가 없고, 회차를
--       하나 더 열려면 사람이 세 문장을 고쳐야 한다.
--
--       이 마이그레이션은 그 값들을 컬럼으로 끌어올린다. 텍스트 컬럼에서는
--       같은 숫자를 지운다 — 두 곳에 있으면 반드시 한쪽이 낡는다.
--
-- ⚠ 배포 순서: 이 파일을 **먼저 적용**하고 코드를 배포한다.
--    lib/forms.ts의 FORM_PUBLIC_COLS에 신규 컬럼을 추가한 코드가 마이그레이션
--    보다 먼저 뜨면, getForms()의 select가 없는 컬럼을 요구해 통째로 실패하고
--    빈 배열로 폴백한다 — 사이트의 모든 체험이 조용히 사라진다.
--
-- 참조: docs/PLATFORM.md §11.1, F9
-- ============================================================================

alter table public.forms
  add column if not exists duration_min  int,                                  -- 소요시간(분). null이면 표시 안 함
  add column if not exists price_krw     int,                                  -- 1인 참가비. null=미정, 0=무료
  add column if not exists max_guests    int,                                  -- 회차 기본 정원(회차가 개별로 덮어쓴다)
  add column if not exists language      text  not null default 'ko',          -- 진행 언어
  add column if not exists meet_place    text  not null default '',            -- 만남 장소(한)
  add column if not exists meet_place_en text  not null default '',            -- 만남 장소(영)
  add column if not exists includes      jsonb not null default '[]'::jsonb,   -- 포함사항 문자열 배열
  add column if not exists includes_en   jsonb not null default '[]'::jsonb,
  add column if not exists booking_mode  text  not null default 'external',    -- external=구글폼, native=자체 예약
  add column if not exists cutoff_hours  int   not null default 0;             -- 시작 N시간 전 마감(F10-2 단일 출처)

comment on column public.forms.booking_mode is
  '신청 경로. external=구글폼(/api/go 경유), native=자체 예약(/book/[key]). 체험 단위로 전환하고, 되돌리면 즉시 구글폼으로 롤백된다.';
comment on column public.forms.cutoff_hours is
  '예약 마감 컷오프(시간). 파생 상태 계산(lib/sessions.ts)과 request_booking RPC가 같은 이 값을 읽는다 — 두 곳에 숫자를 두지 않기 위해.';

alter table public.forms drop constraint if exists forms_booking_mode_ok;
alter table public.forms add  constraint forms_booking_mode_ok
  check (booking_mode in ('external','native'));

alter table public.forms drop constraint if exists forms_language_ok;
alter table public.forms add  constraint forms_language_ok
  check (language in ('ko','en','ko-en'));

alter table public.forms drop constraint if exists forms_price_ok;
alter table public.forms add  constraint forms_price_ok
  check (price_krw is null or price_krw >= 0);

alter table public.forms drop constraint if exists forms_guests_ok;
alter table public.forms add  constraint forms_guests_ok
  check (max_guests is null or max_guests between 1 and 50);

alter table public.forms drop constraint if exists forms_cutoff_ok;
alter table public.forms add  constraint forms_cutoff_ok
  check (cutoff_hours between 0 and 168);

-- includes/includes_en은 문자열 배열이어야 한다. jsonb라 객체·숫자도 들어갈 수 있어 막는다.
alter table public.forms drop constraint if exists forms_includes_ok;
alter table public.forms add  constraint forms_includes_ok check (
  jsonb_typeof(includes) = 'array' and jsonb_typeof(includes_en) = 'array'
);

-- 기존 forms_url_ok(구글폼 도메인)는 그대로 둔다.
-- external 모드가 계속 쓰고, native는 url이 null이어도 통과한다(url is null or ...).

-- ── 시드: 구조화 값 백필 ────────────────────────────────────────────────────
-- 값의 출처는 0016_i18n.sql·0017_class_detail.sql의 기존 텍스트다. 옮겨 적는 것이지
-- 새로 정하는 게 아니다.

update public.forms set
  duration_min  = 210,                                 -- 3.5시간 (장보기 + 조리 + 식사)
  price_krw     = 30000,
  max_guests    = 5,
  language      = 'ko-en',
  meet_place    = '서울 종로구 통인시장 입구',
  meet_place_en = 'Tongin Market main entrance, Jongno-gu, Seoul',
  includes      = '["장보기 동행","한우 불고기 재료비","앞치마·조리도구","함께 먹는 식사","영어 통역"]'::jsonb,
  includes_en   = '["Market shopping with your host","Hanwoo bulgogi ingredients","Apron and cookware","The meal we cook together","English interpretation"]'::jsonb,
  cutoff_hours  = 24
where key = 'cooking';

update public.forms set
  duration_min  = 240,                                 -- 4시간 (노을 시간대 두 코스)
  price_krw     = 30000,
  max_guests    = 5,
  language      = 'ko-en',
  meet_place    = '서울 종로구 인왕산 입구 (사직공원 방면)',
  meet_place_en = 'Inwangsan trailhead near Sajik Park, Jongno-gu, Seoul',
  includes      = '["현지 호스트 안내","코스 중 간식과 물","영어 진행","사진 촬영"]'::jsonb,
  includes_en   = '["Guided by a local host","Snacks and water on the trail","Conducted in English","Photos of your walk"]'::jsonb,
  cutoff_hours  = 24
where key = 'hiking';

-- 시니어 모집은 '체험'이 아니라 모집 공고다. 회차·정원·가격 개념이 없으므로
-- 메타를 비워 두고 external로 남긴다(구조화 필드는 null이면 화면에서 숨는다).
update public.forms set
  language = 'ko'
where key = 'senior';

-- ── 이중 기재 제거는 여기서 하지 않는다 (F9-4는 Phase 2로 미룬다) ──────────
--
-- 날짜·가격·정원이 구조화 컬럼으로 올라갔으니 텍스트에서도 지우는 게 맞다.
-- 다만 지금 지우면 안 된다 — booking_mode가 아직 external이라 회차(sessions)를
-- 화면에 안 띄우기 때문이다. 부제에서 "8월 18일(화) 15:00"을 빼는 순간
-- 손님이 날짜를 알 방법이 사라진다.
--
-- 그래서 순서는 이렇다:
--   ① (여기) 구조화 컬럼을 채운다. 텍스트는 그대로 둔다 — 화면은 안 변한다.
--   ② Phase 2에서 회차를 만들고 booking_mode='native'로 바꾼다.
--   ③ 그때 같은 커밋에서 subtitle·description·detail의 날짜/가격/정원을 지운다.
--      (0023_experience_text_cleanup.sql 로 별도 파일)
--
-- 두 곳에 같은 숫자가 남아 있는 기간이 생기지만, 그 기간에는 구조화 값이
-- 화면에 안 나오므로 사용자가 모순을 볼 일은 없다.
