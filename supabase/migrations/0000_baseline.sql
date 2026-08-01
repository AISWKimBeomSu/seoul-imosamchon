-- ============================================================================
-- 0000_baseline.sql — 현행 운영 DB 상태 캡처 (2026-08-01 기준)
--
-- ⚠️ 이 파일은 "기록용"이다. 기존 프로젝트(pxfmvncfdfiuxobjzihw)에 재실행하지 않는다.
--    새 환경(로컬/스테이징)을 처음 구축할 때만 사용한다.
--
-- 배경: v1.0 개발 시 스키마가 Supabase 대시보드에서 직접 적용되어 저장소에
--       마이그레이션 파일이 없었다(PLAN.md 부채 D1). 이 파일이 그 시점의
--       실제 상태를 코드로 되살린 것이며, 0010 이후는 정상적으로 파일 우선이다.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── 공통 트리거 함수 ────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

-- ── admins: 관리자 화이트리스트 ─────────────────────────────────────────────
create table if not exists public.admins (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text,
  created_at timestamptz not null default now()
);

-- 관리자 판별 (RLS 전반에서 사용). admins 테이블 RLS를 우회하려 security definer.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.admins a where a.email = (auth.jwt() ->> 'email'));
$$;

-- ── notices: 공지/공고 ──────────────────────────────────────────────────────
create table if not exists public.notices (
  id              uuid primary key default gen_random_uuid(),
  category        text not null default '공지'
                    check (category in ('모집공고','안내','공지')),
  title           text not null,
  body            text not null default '',
  google_form_url text,
  dday            date,
  pinned          boolean not null default false,
  is_published    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── attachments: 공지 첨부 ──────────────────────────────────────────────────
create table if not exists public.attachments (
  id             uuid primary key default gen_random_uuid(),
  notice_id      uuid not null references public.notices(id) on delete cascade,
  storage_path   text not null,
  original_name  text not null,
  mime_type      text,
  size_bytes     bigint,
  kind           text not null default 'etc' check (kind in ('form','notice','etc')),
  sort           int  not null default 0,
  download_count int  not null default 0,
  created_at     timestamptz not null default now()
);

-- ── events / faqs: 생성되었으나 v1.1 시점 미사용 (PLAN.md 부채 D5) ──────────
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  caption      text,
  storage_path text,
  sort         int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.faqs (
  id           uuid primary key default gen_random_uuid(),
  question     text not null,
  answer       text not null,
  sort         int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ── 다운로드 카운트 (anon이 호출, security definer로 RLS 우회) ──────────────
create or replace function public.increment_download(att_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.attachments set download_count = download_count + 1 where id = att_id;
$$;

-- ── 트리거 ──────────────────────────────────────────────────────────────────
drop trigger if exists trg_notices_updated on public.notices;
create trigger trg_notices_updated
  before update on public.notices
  for each row execute function public.touch_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.admins      enable row level security;
alter table public.notices     enable row level security;
alter table public.attachments enable row level security;
alter table public.events      enable row level security;
alter table public.faqs        enable row level security;

drop policy if exists "admins self read" on public.admins;
create policy "admins self read" on public.admins for select using (public.is_admin());

drop policy if exists "notices public read" on public.notices;
create policy "notices public read" on public.notices for select
  using (is_published or public.is_admin());
drop policy if exists "notices admin insert" on public.notices;
create policy "notices admin insert" on public.notices for insert with check (public.is_admin());
drop policy if exists "notices admin update" on public.notices;
create policy "notices admin update" on public.notices for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "notices admin delete" on public.notices;
create policy "notices admin delete" on public.notices for delete using (public.is_admin());

drop policy if exists "attachments public read" on public.attachments;
create policy "attachments public read" on public.attachments for select
  using (public.is_admin() or exists (
    select 1 from public.notices n where n.id = attachments.notice_id and n.is_published
  ));
drop policy if exists "attachments admin insert" on public.attachments;
create policy "attachments admin insert" on public.attachments for insert with check (public.is_admin());
drop policy if exists "attachments admin update" on public.attachments;
create policy "attachments admin update" on public.attachments for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "attachments admin delete" on public.attachments;
create policy "attachments admin delete" on public.attachments for delete using (public.is_admin());

drop policy if exists "events public read" on public.events;
create policy "events public read" on public.events for select using (is_published or public.is_admin());
drop policy if exists "events admin all" on public.events;
create policy "events admin all" on public.events for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "faqs public read" on public.faqs;
create policy "faqs public read" on public.faqs for select using (is_published or public.is_admin());
drop policy if exists "faqs admin all" on public.faqs;
create policy "faqs admin all" on public.faqs for all
  using (public.is_admin()) with check (public.is_admin());

-- ── Storage: 단일 버킷 files (public read, 10MB 상한) ───────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('files', 'files', true, 10485760)
on conflict (id) do update set public = true, file_size_limit = 10485760;

drop policy if exists "files admin insert" on storage.objects;
create policy "files admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'files' and public.is_admin());
drop policy if exists "files admin update" on storage.objects;
create policy "files admin update" on storage.objects for update to authenticated
  using (bucket_id = 'files' and public.is_admin())
  with check (bucket_id = 'files' and public.is_admin());
drop policy if exists "files admin delete" on storage.objects;
create policy "files admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'files' and public.is_admin());

-- NOTE: 이 시점에는 storage.objects의 SELECT(공개 읽기) 정책이 없다.
--       버킷 public=true 덕분에 공개 URL은 동작하지만 의도가 코드에 없다.
--       확장자 화이트리스트도 없다. → 0014_storage_hardening.sql 에서 보강.
