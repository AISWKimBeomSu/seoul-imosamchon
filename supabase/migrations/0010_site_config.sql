-- ============================================================================
-- 0010_site_config.sql — 사이트 전역 설정 (PLAN.md F1 / §9.2)
--
-- 목적: 구글폼 URL을 사이트 전역의 '단일 소스'로 만든다.
--       지금까지 폼 주소는 notices.google_form_url 한 곳에만 있어서
--       헤더·홈·팝업 어디에서도 폼으로 직접 갈 수 없었다.
-- ============================================================================

create table if not exists public.site_config (
  id                 smallint primary key default 1 check (id = 1),  -- 단일 행 강제

  -- 시니어 모집 폼
  senior_form_url    text,
  senior_form_open   boolean     not null default true,
  senior_form_label  text        not null default '휴대폰으로 5분 신청하기',
  senior_closed_note text        not null default '이번 모집은 마감되었습니다. 다음 공고를 기다려 주세요.',

  -- 외국인 손님(게스트) 모객 폼
  guest_form_url     text,
  guest_form_open    boolean     not null default false,
  guest_form_label   text        not null default 'Book a class',

  -- 연락 안내
  contact_email      text        not null default 'songchaewoo0@gmail.com',
  contact_phone      text,

  updated_at         timestamptz not null default now(),

  -- ★ 오픈 리다이렉트 방어 1선: DB가 구글폼 도메인 외 저장을 거부한다.
  --   관리자 계정이 탈취되어도 피싱 URL을 심을 수 없다.
  constraint site_config_senior_url_ok check (
    senior_form_url is null
    or senior_form_url ~ '^https://(docs\.google\.com/forms/|forms\.gle/)'
  ),
  constraint site_config_guest_url_ok check (
    guest_form_url is null
    or guest_form_url ~ '^https://(docs\.google\.com/forms/|forms\.gle/)'
  )
);

insert into public.site_config (id) values (1) on conflict (id) do nothing;

drop trigger if exists trg_site_config_updated on public.site_config;
create trigger trg_site_config_updated
  before update on public.site_config
  for each row execute function public.touch_updated_at();

alter table public.site_config enable row level security;

-- 이 테이블에는 어차피 화면에 노출될 값만 들어간다(폼 URL, 문의처). 비밀 없음.
drop policy if exists "site_config public read" on public.site_config;
create policy "site_config public read"
  on public.site_config for select using (true);

drop policy if exists "site_config admin update" on public.site_config;
create policy "site_config admin update"
  on public.site_config for update
  using (public.is_admin()) with check (public.is_admin());

-- INSERT/DELETE 정책 없음 → 단일 행이 구조적으로 보장된다.
