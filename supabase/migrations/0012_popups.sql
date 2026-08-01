-- ============================================================================
-- 0012_popups.sql — 기간제 팝업 공지 (PLAN.md F4 / §9.5)
--
-- 왜 별도 테이블인가(ADR-2): 시즌마다 새 팝업을 만들고 과거를 보관해야 한다.
--   site_config에 컬럼으로 넣으면 매번 덮어써서 이력이 사라지고,
--   무엇보다 "마감되면 자동으로 사라진다"(G2)를 구현할 수 없다.
-- ============================================================================

create table if not exists public.popups (
  id           uuid primary key default gen_random_uuid(),
  title        text        not null,
  subtitle     text        not null default '',
  body         text        not null default '',       -- 짧은 안내(평문, 마크다운 아님)
  link_key     text        not null default 'senior'
                 check (link_key in ('senior','guest','notice','none')),
  notice_id    uuid references public.notices(id) on delete set null,
  cta_label    text        not null default '신청하러 가기',
  show_qr      boolean     not null default true,     -- 데스크톱에서만 실제 표시됨
  scope        text        not null default 'home' check (scope in ('home','all')),
  starts_at    timestamptz not null default now(),
  ends_at      timestamptz,                           -- null = 무기한
  sort         int         not null default 0,
  is_published boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint popups_period check (ends_at is null or ends_at > starts_at),
  constraint popups_notice_required check (link_key <> 'notice' or notice_id is not null)
);

create index if not exists idx_popups_active
  on public.popups (is_published, starts_at, ends_at, sort);

drop trigger if exists trg_popups_updated on public.popups;
create trigger trg_popups_updated
  before update on public.popups
  for each row execute function public.touch_updated_at();

alter table public.popups enable row level security;

drop policy if exists "popups public read" on public.popups;
create policy "popups public read"
  on public.popups for select using (is_published or public.is_admin());

drop policy if exists "popups admin all" on public.popups;
create policy "popups admin all"
  on public.popups for all
  using (public.is_admin()) with check (public.is_admin());
