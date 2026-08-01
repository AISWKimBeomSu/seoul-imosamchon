-- ============================================================================
-- 0014_storage_hardening.sql — 스토리지 정책 보강 (PLAN.md 부채 D2/D3 / §18.3)
--
-- D2: 버킷이 public=true라 공개 URL은 동작하지만 SELECT 정책이 없어
--     "의도적으로 공개"인지 "빠뜨린 것"인지 코드만 봐서는 알 수 없었다.
-- D3: 확장자 화이트리스트가 명세(v1.0 TSD §4.4)에만 있고 적용되지 않았다.
--     관리자 계정이 탈취되면 임의 확장자를 올릴 수 있는 상태였다.
--
-- ⚠️ 이 정책은 신규 INSERT에만 적용된다. 기존 파일에는 영향이 없다.
--    적용 후 /admin에서 PDF·HWP 첨부 업로드가 되는지 반드시 확인할 것.
-- ============================================================================

-- D2 — 공개 읽기를 정책으로 명시
drop policy if exists "files public read" on storage.objects;
create policy "files public read"
  on storage.objects for select
  using (bucket_id = 'files');

-- D3 — 확장자 화이트리스트.
-- MIME이 아닌 '확장자' 기준인 이유: HWP/HWPX는 MIME이 비어 있거나
-- application/octet-stream으로 와서 MIME 화이트리스트로는 정상 파일이 막힌다.
-- webp는 v1.1의 인물 사진 업로드를 위해 추가했다.
drop policy if exists "files admin insert" on storage.objects;
create policy "files admin insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'files'
    and public.is_admin()
    and lower(storage.extension(name)) in
        ('pdf','doc','docx','hwp','hwpx','jpg','jpeg','png','webp')
  );
