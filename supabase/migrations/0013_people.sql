-- ============================================================================
-- 0013_people.sql — 시니어 호스트 · 팀원 소개 (PLAN.md F5 / §9.4)
--
-- ★ 개인정보/초상권: 이름과 얼굴을 웹에 올리는 것은 되돌릴 수 없다
--   (검색엔진 색인·캐시·스크래핑). "동의 받고 올리세요"는 문서일 뿐이다.
--   여기서는 CHECK 제약으로 시스템이 강제한다.
-- ============================================================================

create table if not exists public.people (
  id           uuid primary key default gen_random_uuid(),
  kind         text        not null check (kind in ('senior','team')),
  name         text        not null,                  -- 표기명 그대로 ('김선영' 등)
  role         text        not null default '',       -- '쿠킹클래스 호스트' / '대표'
  region       text,                                  -- '마포 망원동'
  tagline      text        not null default '',       -- 카드 헤드라인 한 줄
  bio          text        not null default '',       -- 소개 문단
  quote        text,                                  -- 인용구
  photo_path   text,                                  -- files 버킷 'people/{uuid}-{ts}.ext'
  photo_alt    text        not null default '',       -- 접근성 대체텍스트
  tags         text[]      not null default '{}',
  slug         text unique,                           -- v1.2 상세페이지용
  story        text,                                  -- v1.2 인터뷰 본문
  sort         int         not null default 0,
  is_published boolean     not null default false,    -- ★ 다른 테이블과 달리 기본 false
  consent_at   timestamptz,                           -- ★ 공개 게시 동의 일시
  consent_memo text        not null default '',       -- 동의 방식 기록
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- ★ 동의 없이는 게시 불가
  constraint people_consent_required
    check (is_published = false or consent_at is not null),

  -- ★ 사진이 있으면 대체텍스트 필수 (스크린리더 사용자에게 사람의 존재를 전달)
  constraint people_alt_required
    check (photo_path is null or length(btrim(photo_alt)) > 0),

  constraint people_slug_format
    check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index if not exists idx_people_published
  on public.people (kind, is_published, sort, created_at);

drop trigger if exists trg_people_updated on public.people;
create trigger trg_people_updated
  before update on public.people
  for each row execute function public.touch_updated_at();

alter table public.people enable row level security;

drop policy if exists "people public read" on public.people;
create policy "people public read"
  on public.people for select using (is_published or public.is_admin());

drop policy if exists "people admin all" on public.people;
create policy "people admin all"
  on public.people for all
  using (public.is_admin()) with check (public.is_admin());
