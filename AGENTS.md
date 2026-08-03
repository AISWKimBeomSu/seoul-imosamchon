# 서울이모삼촌 (seoul-imosamchon)

시니어(50+) 로컬 라이프 크리에이터 모집 브랜드 사이트.
Next.js 16 App Router + Supabase + Vercel.

상세 명세는 아래 문서가 원본이다. 여기 요약본을 만들지 말고 링크로 참조할 것.

- `docs/PRD.md` — 무엇을 만드는가
- `docs/TSD.md` — 어떻게 만드는가
- `docs/PLAN.md` — 진행 상황 / 기술 부채

## 명령어

| 목적      | 명령                                  |
| --------- | ------------------------------------- |
| 개발 서버 | `npm run dev` → http://localhost:3000 |
| 빌드 검증 | `npm run build`                       |
| 린트      | `npm run lint`                        |

- **테스트 스위트가 없다.** 코드 변경 후에는 반드시 `npm run build`와
  `npm run lint`가 통과하는지 확인하고, 영향받는 페이지를 브라우저로 실제 확인한다.
- 개발 서버는 `.claude/launch.json`의 `dev` 설정으로 띄운다. 직접 백그라운드
  프로세스로 실행하지 말 것.

## 폴더 구조

- `app/` — 라우트. `app/admin/*`은 관리자 전용, `app/api/*`은 라우트 핸들러
- `components/` — 클라이언트 컴포넌트
- `lib/` — 서버/클라이언트 공용 로직.
  `*.server.ts` 접미사가 붙은 파일은 **서버에서만** import 한다
- `supabase/migrations/` — 스키마의 유일한 원본
- `docs/` — 명세 문서

<!-- 전체 파일 트리는 여기 적지 않는다. 금방 낡는다. -->

## Next.js 16 주의

이 버전은 학습 데이터의 Next.js와 다르다. API·컨벤션·파일 구조가 모두
바뀌었을 수 있다. 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 해당
가이드를 읽는다. deprecation 경고를 무시하지 않는다.

## DB 변경은 반드시 마이그레이션 파일로

스키마 변경은 `supabase/migrations/NNNN_name.sql`에 쓰고 커밋한 **뒤에**
적용한다. Supabase 대시보드에서 직접 스키마를 바꾸지 않는다.
— v1.0이 그렇게 했다가 레포에 스키마 기록이 하나도 남지 않았다
(`docs/PLAN.md` §0.4, 부채 D1).

- 마이그레이션은 멱등해야 한다: `create table if not exists`,
  `create policy` 전에 `drop policy if exists`.
- `0000_baseline.sql`은 기존 상태의 기록이다. 운영 프로젝트에 **재실행 금지**.
- 적용 후 `list_tables`로 DB와 파일이 일치하는지 검증한다.

## 프로젝트 컨벤션 (새로 만들지 말고 이걸 따를 것)

- **스타일링은 Tailwind v4 + shadcn/ui로 이전 중이다.** 규칙은 아래 "스타일링" 절을 볼 것.
- **컬럼 이름**: `sort` (`sort_order` 아님), `pinned` (`is_pinned` 아님),
  `is_published`, `original_name`.
- **렌더링**: 모든 페이지가 `dynamic = "force-dynamic"`를 export 한다.
  별도의 의도적 마이그레이션 없이 `use cache` / Cache Components를 섞지 않는다.
- **RLS 패턴**: 공개 읽기 `using (is_published or public.is_admin())`,
  관리자 쓰기 `using/with check (public.is_admin())`.
- **라우트는 `/notice`** (단수). 옛 문서의 `/notices`는 틀렸다.
- **구글폼 외부 링크는 전부 `/api/go/[key]`를 경유한다.** 생 `<a href>` 금지.
  이 라우트가 클릭 추적·마감 처리·URL 검증을 담당한다. 직접 링크를 넣으면
  세 가지가 조용히 깨진다.

## 스타일링 — Tailwind v4 + shadcn/ui 이전 중

`/admin`부터 전환하고 공개 페이지는 나중이다. 공개 페이지의 브랜드 디자인
(라임그린·딥그린, 둥근 카드)은 **유지**한다.

- **Preflight는 켜지 않는다.** `globals.css`는 `tailwindcss/theme.css`와
  `utilities.css`만 import 한다. Preflight를 켜면 `.prose` 목록 불릿이 사라진다.
- **색은 `:root` 토큰이 유일한 원본.** shadcn 시맨틱 토큰(`--primary` 등)은
  전부 그 별칭이다. 새 색이 필요하면 `:root`에 토큰을 먼저 추가하고
  `@theme inline`에 연결한다. 인라인 `style={{ color: "#..." }}` 금지.
- **시니어 접근성 기본값은 양보하지 않는다**: 본문 17px, 폰트 14px 이하 금지,
  버튼 최소 높이 52px(내비 CTA 44px), 포커스 링 3px. shadcn 컴포넌트를
  추가한 뒤 `components/ui/*`에서 이 값들로 고쳐 놓는다.
- **`shadcn add` 실행 후에는 `app/layout.tsx`와 `globals.css`를 확인한다.**
  CLI가 Geist 폰트(한글 글리프 없음)를 끼워 넣고 `body`에
  `@apply bg-background text-foreground`를 붙여 브랜드색을 덮은 전력이 있다.
- **레거시 클래스를 지우면서 옮긴다.** 컴포넌트를 shadcn으로 전환할 때
  대응하는 `globals.css` 블록을 **같은 커밋에서** 삭제한다. 이걸 안 지키면
  스타일 소스가 둘로 갈라진 채 남는다.

진행도는 **레거시 컴포넌트 클래스 줄 수**로 잰다 (`globals.css`의 `.wrap`
이후 전부). 전환 시작 시점 **507줄**. 이 숫자가 줄지 않으면 위 마지막 규칙이
지켜지지 않고 있다는 뜻이다.

```bash
awk '/^\.wrap/,0' app/globals.css | wc -l
```

<!-- .wrap 이전(토큰 + @theme + @layer base)은 영구 영역이라 세지 않는다. -->

## 비밀키

`SUPABASE_SERVICE_ROLE_KEY`는 서버 전용이다.

- `NEXT_PUBLIC_` 접두사를 **절대** 붙이지 않는다.
- `lib/supabase/service.ts`에서만 import 한다.
  이 파일은 `import "server-only"`로 시작한다.

## Git

- 마이그레이션 파일은 적용 **전에** 커밋한다.
- `.env.local`은 커밋하지 않는다.
