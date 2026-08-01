-- ============================================================================
-- 0011_link_clicks.sql — 신청 클릭 계측 (PLAN.md F2/F7 / §9.3)
--
-- 목적: PRD v1.0의 K1(신청 시작률)을 실제로 측정 가능하게 만든다.
--       지금까지 계측이 전무해 "얼마나 신청했는가"를 알 수 없었다.
--
-- 개인정보: IP·User-Agent 원문·쿠키·세션ID를 저장하지 않는다.
--           리퍼러는 '호스트명만' 남긴다(경로·쿼리 폐기).
-- ============================================================================

create table if not exists public.link_clicks (
  id         bigint generated always as identity primary key,
  link_key   text        not null,                    -- 'senior' | 'guest'
  source     text        not null default 'unknown',  -- 진입점(화이트리스트로 정규화됨)
  ref_host   text,                                    -- 리퍼러 호스트명만
  device     text,                                    -- 'mobile' | 'desktop' | 'bot'
  created_at timestamptz not null default now()
);

create index if not exists idx_link_clicks_key_time
  on public.link_clicks (link_key, created_at desc);
create index if not exists idx_link_clicks_source_time
  on public.link_clicks (source, created_at desc);

alter table public.link_clicks enable row level security;

drop policy if exists "link_clicks admin read" on public.link_clicks;
create policy "link_clicks admin read"
  on public.link_clicks for select using (public.is_admin());

-- ★ INSERT 정책이 없다 → anon/authenticated 모두 쓰기 불가.
--   쓰기는 service_role 키를 쓰는 서버 라우트(/api/go)만 가능하다.
--   anon INSERT를 열면 누구나 Supabase REST로 통계를 오염시킬 수 있다.

-- ── 관리자 대시보드 요약 ────────────────────────────────────────────────────
-- security definer는 RLS를 우회하므로 본문에서 is_admin()을 반드시 재확인한다.
create or replace function public.link_click_summary(days int default 30)
returns table (link_key text, source text, clicks bigint)
language sql stable security definer set search_path = public as $$
  select c.link_key, c.source, count(*)::bigint
  from public.link_clicks c
  where public.is_admin()
    and c.created_at >= now() - make_interval(days => greatest(days, 1))
    and c.device is distinct from 'bot'
  group by 1, 2
  order by 3 desc;
$$;

revoke all on function public.link_click_summary(int) from public, anon;
grant execute on function public.link_click_summary(int) to authenticated;
