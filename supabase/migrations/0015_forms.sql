-- ============================================================================
-- 0015_forms.sql — 신청 폼을 데이터로 일반화 (v1.2)
--
-- 배경: v1.1은 폼이 senior/guest 2개라고 코드에 박아 두었다(site_config의
--       senior_*, guest_* 컬럼 + 라우트의 KEYS 상수). 쿠킹클래스·하이킹이
--       추가되면서 이 가정이 깨졌다. 넷째 폼이 생겨도 코드를 안 고치도록
--       폼을 '행'으로 바꾼다.
--
-- 오픈 리다이렉트 방어는 그대로다: 이동 대상은 여전히 '키'로만 지정되고,
-- URL은 DB에 저장될 때 구글폼 도메인 CHECK를 통과해야 한다.
-- ============================================================================

create table if not exists public.forms (
  id           uuid primary key default gen_random_uuid(),
  key          text        not null unique
                 check (key ~ '^[a-z][a-z0-9-]{1,30}$'),
  title        text        not null,
  subtitle     text        not null default '',
  description  text        not null default '',
  url          text,
  is_open      boolean     not null default false,
  cta_label    text        not null default '신청하기',
  closed_note  text        not null default '이번 접수는 마감되었습니다.',
  audience     text        not null default 'senior'
                 check (audience in ('senior','guest')),
  poster_path  text,                                  -- files 버킷 'forms/...'
  poster_alt   text        not null default '',
  accent       text        not null default 'green'
                 check (accent in ('green','gold','lime')),
  sort         int         not null default 0,
  is_published boolean     not null default true,     -- /apply 목록 노출 여부
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint forms_url_ok check (
    url is null or url ~ '^https://(docs\.google\.com/forms/|forms\.gle/)'
  ),
  constraint forms_poster_alt_ok check (
    poster_path is null or length(btrim(poster_alt)) > 0
  )
);

create index if not exists idx_forms_listing
  on public.forms (is_published, sort, created_at);

drop trigger if exists trg_forms_updated on public.forms;
create trigger trg_forms_updated
  before update on public.forms
  for each row execute function public.touch_updated_at();

alter table public.forms enable row level security;

drop policy if exists "forms public read" on public.forms;
create policy "forms public read"
  on public.forms for select using (is_published or public.is_admin());

drop policy if exists "forms admin all" on public.forms;
create policy "forms admin all"
  on public.forms for all
  using (public.is_admin()) with check (public.is_admin());

-- ── 기존 site_config의 폼 설정을 옮긴다 ─────────────────────────────────────
insert into public.forms (key, title, subtitle, description, url, is_open, cta_label, audience, accent, sort)
select
  'senior',
  '시니어 호스트 신청',
  '만 60세 이상 · 유급 일자리',
  '여러분만이 아는 서울의 로컬함을 외국인 손님에게 알려주세요. 휴대폰으로 5분이면 신청이 끝납니다.',
  c.senior_form_url,
  coalesce(c.senior_form_open, false),
  coalesce(nullif(c.senior_form_label, ''), '휴대폰으로 5분 신청하기'),
  'senior', 'green', 10
from public.site_config c where c.id = 1
on conflict (key) do nothing;

insert into public.forms (key, title, subtitle, description, url, is_open, cta_label, audience, accent, sort)
values
  ('cooking', '쿠킹클래스 신청', '트랙 1 · 시장 장보기 + 집밥',
   '망원시장에서 함께 장을 보고, 진짜 서울 가정집 부엌에서 집밥을 만듭니다.',
   null, false, '쿠킹클래스 신청하기', 'guest', 'gold', 20),
  ('hiking', '하이킹 신청', '트랙 2 · 동네 산책 · 트레킹',
   '가이드북에 없는 동네 길을, 그 길을 30년 걸어온 분과 함께 걷습니다.',
   null, false, '하이킹 신청하기', 'guest', 'lime', 30)
on conflict (key) do nothing;

-- 게스트 폼이 이미 설정돼 있었다면 쿠킹클래스로 승계
update public.forms f
set url = c.guest_form_url, is_open = c.guest_form_open
from public.site_config c
where f.key = 'cooking' and c.id = 1
  and c.guest_form_url is not null and f.url is null;

-- ── site_config에서 폼 컬럼 제거 (연락처만 남긴다) ──────────────────────────
alter table public.site_config drop constraint if exists site_config_senior_url_ok;
alter table public.site_config drop constraint if exists site_config_guest_url_ok;
alter table public.site_config drop column if exists senior_form_url;
alter table public.site_config drop column if exists senior_form_open;
alter table public.site_config drop column if exists senior_form_label;
alter table public.site_config drop column if exists senior_closed_note;
alter table public.site_config drop column if exists guest_form_url;
alter table public.site_config drop column if exists guest_form_open;
alter table public.site_config drop column if exists guest_form_label;

-- ── 팝업: 포스터 이미지 + 임의 폼 연결 + 동시 다중 노출 ─────────────────────
alter table public.popups add column if not exists image_path text;
alter table public.popups add column if not exists image_alt  text not null default '';
alter table public.popups add column if not exists link_kind  text not null default 'form';
alter table public.popups add column if not exists form_key   text;

update public.popups
set link_kind = case
      when link_key in ('senior','guest') then 'form'
      when link_key = 'notice'            then 'notice'
      else 'none' end,
    form_key = case
      when link_key = 'senior' then 'senior'
      when link_key = 'guest'  then 'cooking'   -- 게스트 폼은 쿠킹클래스로 승계
      else null end
where link_key is not null;

alter table public.popups drop constraint if exists popups_notice_required;
alter table public.popups drop column if exists link_key;

alter table public.popups drop constraint if exists popups_link_kind_check;
alter table public.popups add constraint popups_link_kind_check
  check (link_kind in ('form','notice','none'));

alter table public.popups drop constraint if exists popups_link_ok;
alter table public.popups add constraint popups_link_ok check (
     (link_kind = 'form'   and form_key  is not null)
  or (link_kind = 'notice' and notice_id is not null)
  or (link_kind = 'none')
);

alter table public.popups drop constraint if exists popups_image_alt_ok;
alter table public.popups add constraint popups_image_alt_ok
  check (image_path is null or length(btrim(image_alt)) > 0);

-- form_key에는 FK를 걸지 않는다. 폼을 지울 때 팝업 때문에 막히면 운영이 불편하고,
-- 조회 시 폼을 못 찾으면 그 팝업 카드를 조용히 건너뛰면 그만이다.
