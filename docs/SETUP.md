# 인수인계 체크리스트 — 김범수

> v2.0 DB 분리(2026-08-07) 이후 **사람이 직접 해야 하는 일**만 모았다.
> 코드로 되는 건 전부 끝나 있다. 여기 남은 건 비밀키·결제·계정처럼 자동화할 수 없는 것들이다.

## 지금 상태

| 항목 | 값 |
|---|---|
| 레포 | https://github.com/AISWKimBeomSu/seoul-imosamchon |
| 배포 | https://seoul-imosamchon-orcin.vercel.app (push하면 자동 배포) |
| **새 DB** | Supabase `seoul-imosamchon-v2` · `zurjjkznmdqxtzqbzejp` · 서울 리전 |
| 구 DB | `pxfmvncfdfiuxobjzihw` — 친구 팀 사이트가 계속 쓴다. **건드리지 않는다** |
| 마이그레이션 | 0000~0022 전부 적용 완료 |
| 이관된 데이터 | 체험 3종 · 인물 4명(시니어 2명 공개) · 공지 1건 · 팝업 3건 · 호스트 연결 2건 |

---

## 1. service_role 키 넣기 ★ 이것만 하면 개발이 다시 굴러감

이 키가 있어야 **클릭 계측**과 **예약 접수**가 동작한다. 비밀키라 다른 사람이 대신 가져올 수 없다.

1. https://supabase.com/dashboard/project/zurjjkznmdqxtzqbzejp/settings/api-keys 접속
2. **service_role** 항목의 `Reveal` → 복사
3. 로컬 `.env.local`의 이 줄에 붙여넣기:
   ```
   SUPABASE_SERVICE_ROLE_KEY=
   ```
4. Vercel에도 같은 값을 넣는다:
   ```bash
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   ```
   (preview·development도 같은 방식으로 한 번씩)

> ⚠️ 이 키는 RLS를 전부 우회한다. 채팅·커밋·스크린샷에 절대 남기지 말 것.
> `NEXT_PUBLIC_` 접두사를 붙이면 브라우저로 새어 나간다 — 절대 금지.

## 2. 관리자 계정 만들기

`/admin`에 로그인할 계정. Supabase Auth에는 회원가입 화면이 없으므로 대시보드에서 직접 만든다.

1. https://supabase.com/dashboard/project/zurjjkznmdqxtzqbzejp/auth/users
2. **Add user → Create new user**
3. 이메일 `the.0ne021111@gmail.com`, 비밀번호 임의 지정, **Auto Confirm User 체크**
4. 그다음 SQL Editor에서 한 줄 실행 (이 이메일이 `admins`에 있어야 관리자로 인정된다):
   ```sql
   insert into public.admins (email, name)
   values ('the.0ne021111@gmail.com', '김범수')
   on conflict (email) do nothing;
   ```
5. https://seoul-imosamchon-orcin.vercel.app/admin/login 에서 로그인 확인

> 다른 이메일로 하고 싶으면 3·4번의 주소만 바꾸면 된다.
> 송채우님도 계속 관리자로 두려면 같은 방식으로 한 줄 더 넣으면 된다.

## 3. 첨부파일 옮기기

공지에 달린 파일 5개(포스터·공고문·신청서)가 아직 구 DB의 스토리지에 있다. 1번을 끝내고 한 번만 돌리면 된다.

```bash
SUPABASE_SERVICE_ROLE_KEY='복사한키' node scripts/copy-storage.mjs
```

두 번 돌려도 안전하다. 끝나면 https://seoul-imosamchon-orcin.vercel.app/notice 에서 포스터가 보이는지 확인.

---

## 4. 나중에 (예약을 실제로 켤 때)

지금 급하지 않다. 예약 기능(Phase 2)을 켜는 시점에 필요하다.

| # | 할 일 | 왜 필요한가 |
|---|---|---|
| 4-1 | **도메인 구입** | 확정 메일이 스팸함으로 안 가려면 자체 도메인의 SPF/DKIM이 필요하다. Vercel Settings → Domains에서 연결 |
| 4-2 | **Resend 가입** → API 키 | 예약 확정·거절·취소 안내 메일 발송. 무료 3,000통/월. `RESEND_API_KEY`·`BOOKING_FROM_EMAIL` 두 개를 env에 |
| 4-3 | **전화번호 확정** | 이메일을 안 쓰는 시니어 게스트와 예약 링크를 잃은 사람의 유일한 출구. `site_config.contact_phone`에 넣으면 사이트 전체에 자동 반영 |
| 4-4 | 사업자등록 (해당 시) | 이용약관 §1 표기 + 나중에 PG 심사 요건 |

## 5. 안 해도 되는 것 (확인 완료)

- ~~포스터 교체~~ — 같은 팀이라 기존 연락처 그대로 둔다
- ~~후원 표기 삭제~~ — 정식 지원사업이므로 유지
- ~~팀원 소개 수정~~ — 신승민·송채우 그대로 유지
- ~~시니어 호스트 동의~~ — 확보 완료, 이미 공개로 전환됨

---

## 참고 — 이번에 바뀐 담당

| 역할 | 사람 | 노출 위치 |
|---|---|---|
| 문의·신청 접수·개인정보 열람청구 | **김범수** · beomsu9665@gachon.ac.kr | 푸터 문의, /apply, 방침 §7 |
| 관리자 로그인 | 김범수 · the.0ne021111@gmail.com | /admin |
| 대표자 · 개인정보 보호책임자 | 신승민 · harry147017@gachon.ac.kr | 푸터, 방침 §9, 약관 §1 |

상세 명세는 [PLATFORM.md](PLATFORM.md), 개발 규칙은 [../AGENTS.md](../AGENTS.md).
