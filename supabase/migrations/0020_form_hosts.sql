-- ============================================================================
-- 0020_form_hosts.sql — 체험↔호스트 연결 (v2.0 Phase 1)
--
-- 배경: 클래스 상세의 '호스트' 블록이 getPeople("senior").slice(0,3) — 그냥
--       시니어 아무나 세 명이다. 이 체험을 실제로 진행하는 분이 누구인지
--       데이터에 없다. 체험 상품에서 호스트는 곁들임이 아니라 상품 자체다.
--
-- 설계: 다대다. 한 분이 여러 체험을 맡고, 한 체험을 두 분이 함께 진행하는 경우가
--       둘 다 실제로 있다.
--
-- 참조: docs/PLATFORM.md §11.3, F14
-- ============================================================================

create table if not exists public.form_hosts (
  form_key  text not null references public.forms(key)  on update cascade on delete cascade,
  person_id uuid not null references public.people(id)  on delete cascade,
  sort      int  not null default 100,
  primary key (form_key, person_id)
);

comment on table public.form_hosts is
  '체험을 진행하는 호스트. 공개 여부는 이 테이블이 아니라 people.is_published와 people.consent_at(초상권 동의)이 정한다 — 연결했다고 노출되지 않는다.';

create index if not exists idx_form_hosts_person on public.form_hosts (person_id);

alter table public.form_hosts enable row level security;

-- 연결 자체에는 민감정보가 없다. 실제 노출은 people·forms의 is_published가 거르므로
-- 여기서 다시 조건을 걸면 조인만 무거워지고 얻는 게 없다.
drop policy if exists "form_hosts 공개 읽기" on public.form_hosts;
create policy "form_hosts 공개 읽기" on public.form_hosts
  for select using (true);

drop policy if exists "form_hosts 관리자" on public.form_hosts;
create policy "form_hosts 관리자" on public.form_hosts
  for all using (public.is_admin()) with check (public.is_admin());

-- ── people.slug 백필 ────────────────────────────────────────────────────────
-- slug는 0013에서 이미 `text unique` + 형식 CHECK(^[a-z0-9]+(-[a-z0-9]+)*$)로
-- 만들어져 있다. 인덱스를 새로 만들지 않는다 — unique 제약이 곧 인덱스다.
-- v1.2에 상세페이지용으로 미리 넣어 두고 여태 안 쓴 컬럼을 이제 켠다.
update public.people set slug = 'kim-sunyoung'  where name = '김선영' and slug is null;
update public.people set slug = 'cho-sukhyun'   where name = '조숙현' and slug is null;
update public.people set slug = 'shin-seungmin' where name = '신승민' and slug is null;
update public.people set slug = 'song-chaewoo'  where name = '송채우' and slug is null;

-- 시드 연결: 쿠킹·하이킹의 호스트.
-- 없는 사람/체험을 참조하면 조용히 0행이 되도록 select에서 뽑는다.
insert into public.form_hosts (form_key, person_id, sort)
select 'cooking', p.id, 10 from public.people p where p.slug = 'kim-sunyoung'
on conflict do nothing;

insert into public.form_hosts (form_key, person_id, sort)
select 'hiking', p.id, 10 from public.people p where p.slug = 'kim-sunyoung'
on conflict do nothing;
