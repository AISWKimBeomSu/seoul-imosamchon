# 서울이모삼촌 v2.0 실행 계획 — 체험 예약 플랫폼 (PLATFORM)

> 에어비앤비 '체험(Experiences)'을 모티브로, 구글폼 의존 신청 체계를 **자체 예약 플랫폼**으로 승격하는 통합 명세다.
> v1.1 문서(docs/PLAN.md)의 체계 — **실측 우선 · PRD+TSD+실행 통합 · MoSCoW로 자르기** — 를 그대로 계승한다.

| 항목 | 값 |
|---|---|
| 문서 버전 | v2.0-draft.2 — draft.1을 4개 렌즈(코드 정합·DB 동시성·시니어 UX·완결성)로 적대적 검증해 42건 반영 |
| 작성일 | 2026-08-07 |
| 전제 코드 | v1.4 (마이그레이션 0017까지, 커밋 31e2c50) |
| 선행 문서 | [PRD.md](PRD.md) v1.0 · [TSD.md](TSD.md) v1.0 · [PLAN.md](PLAN.md) v1.1 |
| 상태 | 검토용 초안 — §21 확정 후 v2.0 확정 |

---

## 목차

- **Part 0 — 현황**: §0 실측 스냅샷(v1.2~v1.4 소급 기록) · §1 확정된 사업 결정 · §2 부채 현황
- **Part 1 — PRD**: §3 배경 · §4 목표/KPI · §5 페르소나/여정 · §6 기능 요구사항 F9~F17 · §7 IA · §8 비기능 · §9 범위 밖
- **Part 2 — TSD**: §10 아키텍처 · §11 데이터 모델 · §12 라우트/파일 · §13 예약 구현 · §14 이메일 · §15 admin · §16 DB 분리 · §17 보안/개인정보 · §18 성능/접근성
- **Part 3 — 실행**: §19 Phase · §20 QA · §21 착수 전 확정 · §22 리스크 · 부록 A ADR · 부록 B 행정 트랙

---

# Part 0 — 현황

## 0. 실측 스냅샷 (2026-08-07, v1.4 기준)

**PLAN.md는 v1.1(2026-08-01)까지만 기록했고 코드는 3릴리스 더 나갔다. 이 절이 그 공백(v1.2~v1.4)의 공식 기록이다.**

### 0.1 스택 실측

| 레이어 | 값 |
|---|---|
| 프레임워크 | Next.js 16.2.11 (App Router, Turbopack) + React 19.2.4 |
| 스타일 | Tailwind v4 + shadcn(base-nova) **이전 중** — 레거시 CSS 582줄(시작 507줄에서 역행, §2-D7) |
| DB | Supabase Postgres 17 · `pxfmvncfdfiuxobjzihw`(서울) — **v2.0에서 신규 프로젝트로 분리(§1-D4, §16)** |
| 배포 | Vercel `seoul-imosamchon` · GitHub 자동 배포 연결됨 |
| 알림 인프라 | **전무** (이메일·알림톡·SMS 없음) — v2.0의 핵심 신설 대상 |

### 0.2 v1.2~v1.4 소급 기록 (문서화 안 됐던 것)

| 릴리스 | 마이그레이션 | 내용 |
|---|---|---|
| **v1.2 폼 일반화** | `0015_forms.sql` | 폼을 '행'으로: `forms` 테이블, 구글폼 도메인 CHECK, senior/cooking/hiking 3종 시드. site_config는 연락처만 남김. popups 개편(image_path·link_kind·form_key) |
| **v1.3 한/영** | `0016_i18n.sql` | EN을 언어 토글로. 코드 사전(DICT ~150키) + DB `_en` 컬럼 + `pick()` ko 폴백 |
| **v1.4 클래스 상세** | `0017_class_detail.sql` | IA 개편: `/guest` → `/about/[key]` 상세. `forms.detail`(마크다운) 추가 |

파생 모듈(전부 미문서화였음): `lib/forms.ts`/`forms.server.ts`, `lib/i18n.ts`/`locale.server.ts`, `lib/links.ts`, `app/about/[key]/page.tsx`, `components/ClassCard.tsx`·`LanguageToggle.tsx`.

### 0.3 현재 DB (테이블 8 + 미사용 2)

`admins` · `notices` · `attachments` · `site_config`(연락처만) · `link_clicks` · `popups` · `people` · `forms` (+ 미사용 `events`·`faqs`).
함수: `is_admin()` · `touch_updated_at()` · `increment_download()` · `link_click_summary()`.

### 0.4 v2.0의 출발점이 되는 실측 사실 3가지

1. **`forms`는 이미 체험(Experience) 엔티티의 원형이다.** 목록·상세·sitemap·팝업·QR·계측이 전부 이 테이블에서 동적 생성된다.
2. **그러나 날짜·가격·정원이 문자열 안에 있다.** "통인시장 · 8월 18일(화) 15:00"은 `subtitle`에, "정가 135,000원 → 30,000원, 선착순 5명"은 `description`에, 상세 표는 `detail`에 — **세 곳에 흩어져 있다.** 이 구조화가 플랫폼화의 제1과제이며, 정리 대상은 세 컬럼 전부다.
3. **`people`은 호스트 프로필의 원형이다.** `slug`(이미 `text unique` + 형식 CHECK)·`story`가 0013에서 선반영됐으나 미사용. forms↔people 연결이 없어 `/about/[key]`는 `getPeople("senior").slice(0,3)`을 보여줄 뿐이다.

## 1. 확정된 사업 결정 (2026-08-07, 부록 A ADR-9~12)

| # | 결정 | 내용 |
|---|---|---|
| **D1** | **예약 = 승인제 + 무결제** | 회차·인원 선택해 신청 → 운영자 승인(24h SLA) → 확정 메일. 결제는 계좌이체/현장. PG·통신판매업 신고는 v2.x 게이트(부록 B) |
| **D2** | **호스트 = 운영자 큐레이션** | 시니어 호스트는 프로필로 노출되되 계정 없음. 등록·관리 전부 `/admin` |
| **D3** | **게스트 = 비회원** | 회원가입 없음. 예약 조회·취소는 이메일로 보낸 **서명 토큰 URL** |
| **D4** | **DB = 신규 Supabase로 분리** | 예약 PII가 쌓이기 전에 소유권 분리. 0000~0017 재생 + 데이터·스토리지 복사(§16) |

## 2. 부채 현황

| # | 부채 | v2.0 처리 |
|---|---|---|
| D1~D3 (v1.1) | 마이그레이션·스토리지 정책 → 해소됨 | — |
| D4 (v1.1) | 계측 — `SUPABASE_SERVICE_ROLE_KEY` 미설정으로 `link_clicks` **0건** | §16 DB 분리와 함께 신규 키 설정으로 해소 |
| D5 | `events`·`faqs` 미사용 | v2.0 범위 밖 유지(§9) |
| D6 | 전 페이지 force-dynamic | 유지(ADR-6). 캐싱 전환은 Phase X 독립 릴리스 |
| **D7** | 레거시 CSS 507→582줄 역행 | **v2.0 신규 화면은 Tailwind+shadcn만**(ADR-12). 레거시 블록 신규 추가 금지 |
| **D8** | CSP/보안 헤더 미적용 | **Phase 0 적용** (예약 PII 저장 전) |
| **D9** | admin에서 체험 행 생성·`detail` 편집 불가 — SQL로만 | F16-1에서 해소 |

---

# Part 1 — PRD

## 3. 배경 & 문제 정의

### 3.1 왜 구글폼을 대체하는가

| 구글폼의 한계 | 결과 |
|---|---|
| **정원을 모른다** | "5석 선착순"인데 6번째 신청을 막지 못함 → 운영자가 수동 거절(감정 노동) |
| **잔여석을 못 보여준다** | "3자리 남음" 같은 전환 장치가 원천 불가 |
| **회차가 없다** | 날짜가 폼 텍스트에 박혀 회차 추가 = 폼 새로 파기 |
| **신청 이후가 암흑** | 확정·리마인더·취소 전부 수동 개별 연락 → 노쇼 방치 |
| **외부 이탈** | 도메인이 google.com으로 바뀌는 순간 브랜드 신뢰 흐름 단절 |

### 3.2 에어비앤비 모티브의 적용 원칙

에어비앤비 = 공급 무한·양면 셀프서비스 마켓플레이스. 우리 = **공급 유한(체험 3~10종)·운영자 개입형 부티크 큐레이션**. 이 차이가 모든 취사선택의 축이다.

- **가져오는 것**: 카드 정보 설계, 상세 페이지 해부(호스트 블록 상단 — "호스트가 곧 상품"), 회차 슬롯 선택, 예약 위젯, 승인제
- **버리는 것**: 검색·필터, 개인화 섹션, 계정 중심 설계, 양방향 리뷰, 다국 통화, 지도 탐색, ML 랭킹 → §9

## 4. 목표 & 성공지표

### 4.1 정성 목표

| ID | 목표 |
|---|---|
| G1'~G4' | v1 계승: 시니어 자력 완결 · 자녀세대 3초 신뢰 · 셀프 운영 · 로컬 온기 |
| **G5** | **외국인 게스트가 상세 페이지만 보고 예약을 끝낸다** — 영어로 무엇을·언제·어디서·얼마에·몇 명이 하는지 판단 가능. **취소 조건도 영어로 읽을 수 있어야 한다**(F17-1) |
| **G6** | **운영자가 관리자 페이지를 열지 않아도 예약을 놓치지 않는다** |
| **G7** | **정원 사고 0건** — 6번째 신청이 DB에서 거부된다. 단, **정원의 단일 진실은 native 모드 체험에서만 성립한다**(§13.2) |

### 4.2 KPI

| # | 지표 | 목표 | 측정 |
|---|---|---|---|
| K1' | 상세 조회 → 예약 시작 | ≥ 20% | 분자: `link_clicks`의 `book:{key}` 건수(**시작 전용 키**) / 분모: Vercel Analytics 대시보드에서 `/about/[key]` PV 수동 조회(Hobby는 API 없음 — 월 1회 수기 기록) |
| K2' | 예약 시작 → 제출 완료 | ≥ 60% | 분자: `bookings` INSERT 건수(제출은 클릭 로그에 기록하지 않는다 — 분모 오염 방지) / 분모: 위 `book:{key}` |
| K3' | 신청 → 확정 SLA | 24h 내 처리 ≥ 90% | `confirmed_at`·`declined_at` − `created_at` |
| K4' | 노쇼율 | < 20% | `no_show` ÷ (`done`+`no_show`) |
| K5·K6 | LCP ≤ 2.5s · Lighthouse a11y ≥ 95 | v1 계승 | 동일 |
| K9' | 시니어 실사용 | 60세+ 1명이 예약 신청 완료 | 관찰 테스트 |

## 5. 페르소나 & 여정

### 5.1 페르소나 (v1 3인 + 1인 추가)

| # | 이름 | 요약 |
|---|---|---|
| ①~③ | 김순자(67, 시니어) · 이지현(38, 자녀세대) · **김범수(개발·운영)** | v1 그대로 (PRD.md §4). 단 페르소나 ③의 실제 담당자가 2026-08-07부터 송채우 → 김범수로 바뀌었다. 개발이 가능한 사람이 운영도 맡게 되어, "비개발 운영자" 전제였던 제약 일부(SQL 없이 완결)는 완화되지만 **요구사항은 그대로 둔다** — 운영은 다시 넘어갈 수 있다 |
| **④** | **Maria(29, 외국인 게스트)** | 서울 여행 중. 영어 정보만으로 판단. **한국 전화번호 없음** → 예약 폼의 전화 필드는 국제번호를 받아야 하고(§8.2), 이메일이 유일한 통지 채널. 불안: "내 예약이 접수된 건가" → 접수 즉시 이메일 + 24h 내 확정/거절 통지가 신뢰의 전부 |

### 5.2 예약 여정

```
상세(/about/cooking) → 회차 카드 선택 → /book/cooking?s={id}
  → 인원 스테퍼 → 이름·이메일·전화·요청사항 → 동의 + 만 14세 확인
  → 제출 → 완료 화면(예약 요약 + 조회·취소 링크 + "캡처해 두세요" + 전화 안내)
  → [메일] 게스트 접수 확인 / 운영자 새 신청 통지
  → 운영자 /admin/bookings → [승인] 또는 [거절(사유)]
     → [메일] 확정(장소·시간·취소 링크) 또는 거절(사유·다른 회차 안내)
  → (Phase 3) D-1 리마인더 → 체험 진행 → done / no_show 기록
```

**이메일을 쓰지 않는 시니어 게스트**(H-1): 웹 폼은 이메일을 요구한다(유일한 통지 채널이므로). 이 분들의 경로는 **전화 → 운영자가 `/admin/bookings`에서 수동 등록**(F16-7)이다. 수동 등록도 같은 RPC를 거치므로 정원에 정확히 반영된다. 예약 폼과 상세 페이지에 "이메일이 없으시면 전화로 도와드립니다" 안내를 상시 노출한다.

**취소 링크를 잃은 게스트**: 완료 화면·404 화면에 "링크를 잃으셨나요?" 안내 + 전화·이메일 문의. 운영자는 admin에서 [조회 링크 재발송](F16-6).

## 6. 기능 요구사항

### F9. 체험 구조화 메타 — **M**

- F9-1 상세 메타 바: 소요시간 · 진행 언어 · 최대 인원 · 가격. 값이 null이면 그 항목만 숨김
- F9-2 만남 장소: 텍스트(한/영) + 구글맵·네이버맵 링크 병기. 지도 임베드 없음(외부 스크립트·CSP·성능)
- F9-3 포함사항 리스트(문자열 배열, `_en` 쌍)
- F9-4 `detail` 마크다운은 "What we'll do" 서사로 존속. **`subtitle`·`description`·`detail` 세 곳의 이중 기재 날짜·가격·정원을 0018 시드에서 전부 제거**
- F9-5 수용기준: cooking 카드·상세에서 날짜/가격/정원이 **구조화 필드에서만** 렌더되고 세 텍스트 컬럼에 해당 숫자가 남아 있지 않다

### F10. 회차(슬롯) 모델 — **M**

- F10-1 회차 = `sessions` 행: 시작 일시(KST)·소요시간(체험 기본값 상속)·정원·예약 인원·수동 마감
- F10-2 **상태는 저장하지 않고 파생**(ADR-13): `past`(starts_at ≤ now) / `cutoff`(starts_at − `forms.cutoff_hours` ≤ now) / `closed`(is_closed ∨ booked_count ≥ capacity) / `soon-full`(잔여 ≤ 2) / `open`. **마감 컷오프는 `forms.cutoff_hours` 컬럼이 단일 출처** — 파생 규칙과 RPC 검증이 같은 값을 읽는다
- F10-3 반복 규칙 엔진은 만들지 않는다 — 운영자가 회차를 개별 생성
- F10-4 상세: **예약 가능 회차만 세로 카드 리스트**. 그리드 캘린더 금지(§8.2). 마감 회차는 "마감" 텍스트 라벨(색만으로 구분 금지)
- F10-5 수용기준: 잔여 0 도달 시 목록·상세·홈 배지가 즉시 "마감". 지난 회차 자동 제외

### F11. 자체 예약 플로우 — **M**

**폼별 하이브리드**: `forms.booking_mode`('external'|'native')로 체험 단위 전환. external은 기존 /api/go→구글폼 그대로(롤백 스위치 겸용).

- F11-1 `/book/[key]`: 회차 확인 → 인원 스테퍼(1~잔여석, −/+ 각 52×52px) → 이름·이메일·전화·요청사항 → 동의·14세 체크 → 제출
- F11-2 정원 검증은 **DB 원자 연산**(RPC: 행 잠금 → 잔여 확인 → INSERT → 카운트 증가). 프론트 표시는 참고용
- F11-3 완료 화면: 예약 요약 · "24시간 내 확정 안내" · **조회·취소 링크(cancel_token)** · "캡처해 두세요" · 전화 안전망
- F11-4 실패 사유는 구체 한국어/영어 + `aria-live`
- F11-5 **계측 키 분리**: 예약 **시작**만 `link_clicks`에 `book:{key}`로 기록. **제출은 기록하지 않는다**(`bookings` INSERT 자체가 집계원 — K2' 분모 오염 방지)
- F11-6 수용기준: 정원 1 남은 회차에 동시 2건 제출 시 1건만 성공. `booking_mode='external'` 복귀 시 즉시 구글폼

### F12. 예약 조회·취소 — **M**

- F12-1 `/booking/[token]`: 서명 토큰으로 조회 — 상태·회차·인원·장소
- F12-2 취소: 확인 단계 → RPC → 카운트 원자 감소 → 확인 메일(게스트·운영자). **v2.0(무결제) 규칙: 체험 시작 전까지 언제든 취소 가능**(§21-U11에서 확정. 48시간 규정은 유료화 시 발효 — 약관 문안도 동일하게 통일)
- F12-3 토큰은 URL로만 전달. `crypto.randomBytes(32)` base64url
- F12-4 수용기준: 취소 즉시 잔여석 복구, 카톡 인앱에서 조회·취소 동작

### F13. 이메일 알림 — **M**

- F13-1 트리거 **5종**: ①신청 접수→게스트+운영자 ②**승인**→게스트(확정) ③**거절**→게스트(사유·대안 회차) ④취소→게스트+운영자 ⑤(Phase 3) D-1 리마인더
- F13-2 템플릿 한/영 — `bookings.locale` 기준, `pick()` 재사용. 시간은 항상 KST 명시
- F13-3 장소 안내에 구글맵+네이버맵 링크 병기
- F13-4 **발송 실패가 예약·승인을 되돌리지 않는다**. 실패는 로그 + admin에 [메일 재발송] 버튼
- F13-5 전제: 자체 도메인 + SPF/DKIM(§21-U3). 발송자는 미국 사업자 → 방침 §4 국외이전 행 추가와 같은 커밋
- F13-6 **D-1 리마인더 멱등성**: `bookings.reminded_at`이 null인 건만 발송하고 즉시 기록. Cron 재실행에도 중복 발송 없음

### F14. 호스트 프로필 — **M**

- F14-1 `form_hosts` 연결 테이블로 상세의 호스트 블록을 실제 담당자로 교체
- F14-2 `/people/[slug]` 활성화(0013 선반영 `slug`·`story` 사용)
- F14-3 호스트 블록은 설명 본문보다 **위** — "호스트가 곧 상품"
- F14-4 수용기준: 동의 없는 인물은 호스트로 연결해도 공개 페이지에 안 나온다(기존 CHECK+RLS 보장)

### F15. 카탈로그·홈 재설계 — **M**

- F15-1 체험 카드 v2: 포스터·제목·소요시간·가격·다음 회차·**잔여 배지**. **단, 잔여 배지·잔여 수는 `booking_mode='native'` 체험에만 표시한다**(§13.2) — external은 일시만
- F15-2 홈 섹션 "지금 예약받고 있어요": 열린 회차가 있는 체험 카드(세로 스택 — 체험 3종에 캐러셀은 과잉)
- F15-3 검색·필터 없음(§9). 관리자 `sort`가 곧 랭킹
- F15-4 팝업 `link_kind`에 'class' 추가 → **`0022_popup_class.sql` 필요**(§11.6)

### F16. admin 확장 — **M**

- F16-1 `/admin/experiences`: 체험 **생성**(D9 해소)·편집·`detail` 편집·booking_mode 토글·구조화 메타·호스트 연결. **`key`는 생성 후 읽기 전용**(§11.7)
- F16-2 `/admin/experiences/[key]/sessions`: 회차 생성·정원 수정·수동 마감. `booked_count`는 읽기 전용
- F16-3 `/admin/bookings`: 상태 탭 · 회차별 그룹 · **[승인]/[거절(사유)]/[취소]/[노쇼]/[완료]** — 상태 변경은 전부 `admin_set_booking_status` RPC 경유(§11.5)
- F16-4 파기(Phase 3): "체험 종료 6개월 경과 N건" 배지 + 일괄 삭제. **예약이 0건이 된 지난 회차도 함께 삭제**(FK restrict 체인 정리)
- F16-5 부수효과(메일 발송·카운트 변경)가 있는 쓰기는 **서버 액션**으로. 기존 admin의 클라이언트 직접 쓰기 패턴은 예약 도메인에 쓰지 않는다
- F16-6 [조회 링크 재발송] — 토큰 분실 게스트 구제
- F16-7 **[수동 예약 추가]** — 전화·종이 접수분을 같은 RPC로 등록해 정원에 반영. 이메일은 비워 둘 수 있고, 그 경우 운영자가 전화로 확정 통지(메모에 기록)
- F16-8 신규 admin 페이지는 **전부 `getAdmin()` 가드 필수**(공통 `app/admin/layout.tsx` 신설 권장 — 현재는 페이지별 개별 가드라 하나만 빠뜨려도 예약 PII가 무인증 노출)
- F16-9 수용기준: 체험 등록 → 회차 개설 → 예약 승인/거절 → 수동 등록까지 **SQL 없이** 완결

### F17. 법적 페이지·동의 — **M**

- F17-1 `/terms` 이용약관 + 취소 규정 — **한/영 병행**(G5: Maria가 취소 조건을 영어로 읽어야 한다)
- F17-2 예약 폼 동의 UI: "개인정보 수집·이용 동의(필수)" + 항목·목적·보유기간 요약 + 방침 링크. "만 14세 이상입니다" 확인 체크
- F17-3 `/privacy` 개정(같은 커밋 규칙): 수집 방법 "Google Forms"→"웹사이트 예약 폼", Supabase 위탁에 예약자 정보 추가, 이메일 발송 수탁자(국외이전) 행 추가, 시행일 갱신+7일 전 공지
- F17-4 footer에 사업자 정보 표기 확장(PG 도입 시 등록번호·신고번호 자리)

## 7. IA 변경

```
홈 (히어로 + "지금 예약받고 있어요" + 공지 + 호스트 스트립)
├─ 브랜드소개 /about ── 체험 상세 /about/[key] ── 예약 /book/[key] ── 완료
├─ 사람들 /people ── 호스트 상세 /people/[slug]        ★
├─ 공지 /notice ── /notice/[id]
├─ FAQ /faq
├─ 신청 안내 /apply (체험 목록 + 종이 신청 경로 B 유지)
├─ 예약 조회 /booking/[token]                          ★ 내비 미노출·robots 차단·noindex
├─ 이용약관 /terms                                     ★ footer
└─ 개인정보처리방침 /privacy (개정)

[비공개] /admin — experiences · sessions · bookings 신설
```

내비게이션은 바꾸지 않는다. 예약은 상세에서 시작되는 흐름이지 메뉴가 아니다.

## 8. 비기능 요구사항

### 8.1 접근성 기준 단일화 (P11)

**실측값(AGENTS.md)이 v2.0의 단일 기준**: 본문 17px · 최소 14px · 버튼 52px(내비 CTA 44px) · 포커스 링 3px · `--fs-scale` 연동(rem 필수). PRD v1.0의 18px/56px 표기는 이력으로 격하.

### 8.2 예약 UI 시니어·다국적 원칙 (양보 불가)

| 요소 | 규칙 |
|---|---|
| 날짜 선택 | **그리드 캘린더 금지.** 예약 가능 회차만 세로 카드(≥52px, "8월 21일 (금) 오전 10:00 · 3자리 남음"). 요일 항상 병기. 회차 1개면 선택 단계 생략 |
| 회차 라디오 | accessible name은 **날짜 → 시간 → 잔여** 순으로 한 문장. 마감 카드는 `aria-disabled="true"` + "마감" 텍스트 유지(DOM에서 제거하지 않음 — 왜 못 고르는지 보여야 한다) |
| 인원 스테퍼 | −/+ 각 52×52px, **`aria-label`("인원 한 명 줄이기"/"늘리기") 필수**, 숫자 20px+ 굵게, 한계 시 `disabled` + 이유 텍스트, 값 변경 `aria-live="polite"`. 자유 숫자 입력란 없음 |
| 전화 필드 | `inputmode="tel"`. **국제번호 허용** — EN 로케일 힌트 "International numbers OK (+34…)". 검증은 숫자 8자 이상 |
| 폼 | 라벨 상시 표시(placeholder 대용 금지), 에러는 필드 바로 아래 구체 문장 + 첫 에러 포커스 |
| 흐름 | 한 화면 한 결정 · 세션 타임아웃 없음 · 제출 이중 클릭 방지 · 전화 안전망 상시 |
| 언어 | EN: "Fri, Aug 21 · 10:00 AM (KST)" |

### 8.3 성능·렌더링

전 페이지 `force-dynamic` 유지(ADR-6). 홈 추가 쿼리는 sessions 집계 1회로 제한. 캐싱 전환은 Phase X.

### 8.4 보안 (상세 §17)

`bookings`는 공개 정책 0개 · 쓰기 service_role 전용 · **RPC 실행권한은 `public`까지 회수**(§11.5) · 본인 조회는 토큰 · CSP/보안 헤더 Phase 0.

## 9. 범위 밖

| 기능 | 왜 안 하나 |
|---|---|
| 검색·필터·지도 탐색 | 체험 10종 미만에서 검색은 빈 방 뒤지기 |
| 회원가입·위시리스트 동기화 | 로그인 Out 원칙(D3) |
| 리뷰 자동 수집 | 리뷰 0개 문제 + 검수 부담. v2.0은 수동 큐레이션 인용 |
| PG 결제·통신판매업 신고 | 행정 트랙 선행(부록 B) |
| 알림톡·SMS | 이메일 단일로 시작. 알림톡은 사업자·템플릿 건별 심사 부담 |
| 호스트 셀프 등록·인앱 메시징·양방향 리뷰·다국 통화·ML 랭킹 | 마켓플레이스 전제 기능 |
| `events`·`faqs` 전용 | v2.0 범위 밖(D5) |
| 제3언어·`_en`→jsonb | 한/영 고정 |

---

# Part 2 — TSD

## 10. 아키텍처

### 10.1 예약 시퀀스

```
[게스트]  GET /book/cooking?s={id}   (서버 컴포넌트 — 회차·잔여 조회)
          POST 서버 액션 submitBooking
   ▼
[Next.js 서버]
   1. 입력 검증 + 동의·14세 확인 + honeypot
   2. 서버에서 cancel_token 생성 (crypto.randomBytes(32))
   3. service client → RPC request_booking(...)     ← 원자적 정원 검증+INSERT
   4. link_clicks 기록 없음 (F11-5 — 시작 시점에만 기록)
   5. 이메일 발송 (게스트 접수확인 + 운영자 통지, 실패 무해·로그)
   ▼
[Supabase] sessions.booked_count ← 행 잠금 하에 증가 (초과 시 예외)
           bookings INSERT
```

승인/거절/취소/노쇼/완료는 전부 `admin_set_booking_status` RPC 경유(§11.5). 게스트 취소는 `cancel_booking(token)`.

### 10.2 설계 원칙 (v1.1 §8.2 계승 + 추가)

1~12는 PLAN.md 그대로. 추가:

13. **예약 도메인의 쓰기는 서버에서만.** 클라이언트 anon+RLS 직접 쓰기(기존 admin CRUD 패턴)는 쓰지 않는다.
14. **하이브리드 전환기.** booking_mode 스위치로 체험 단위 전환. 구글폼 CHECK·/api/go 계측은 폐기하지 않는다.
15. **신규 화면은 Tailwind+shadcn만.** 레거시 `.class` 블록 신규 추가 금지.
16. **카운트를 바꾸는 경로는 RPC 하나뿐.** `booked_count`를 직접 UPDATE하는 코드는 어디에도 두지 않는다 — 좌석 누수의 유일한 예방책.
17. **클램프하지 않는다.** 카운트 감소에 `greatest(0, …)`를 쓰지 않는다. 음수 도달은 어딘가 이중 감소가 있다는 신호이고, CHECK 위반으로 시끄럽게 터져야 고칠 수 있다.

## 11. 데이터 모델 & 마이그레이션

연번 0018~0022, 전부 멱등, **적용 전 커밋**(AGENTS.md). **신규 DB(§16)에 적용한다.**

### 11.1 `0018_experience_meta.sql` — forms 구조화 (F9)

```sql
alter table public.forms
  add column if not exists duration_min  int,
  add column if not exists price_krw     int,
  add column if not exists max_guests    int,
  add column if not exists language      text not null default 'ko',
  add column if not exists meet_place    text not null default '',
  add column if not exists meet_place_en text not null default '',
  add column if not exists includes      jsonb not null default '[]'::jsonb,
  add column if not exists includes_en   jsonb not null default '[]'::jsonb,
  add column if not exists booking_mode  text not null default 'external',
  add column if not exists cutoff_hours  int  not null default 0;  -- 마감 컷오프 단일 출처(F10-2)

-- CHECK: booking_mode in ('external','native') / language in ('ko','en','ko-en')
--        price_krw >= 0 / max_guests 1~50 / cutoff_hours 0~168
-- 기존 forms_url_ok(구글폼 도메인)는 유지 — external용. native는 url null 허용

-- 시드: senior/cooking/hiking의 구조화 값 백필 +
--       subtitle·description·detail 세 곳의 날짜·가격·정원 텍스트 제거 (F9-4)
```

**⚠ 배포 순서 위험**: `lib/forms.ts`의 `FORM_PUBLIC_COLS`에 신규 컬럼을 추가하는 커밋이 **마이그레이션 적용보다 먼저 배포되면 전 페이지가 빈 목록이 된다**(`getForms`가 명시적 컬럼 select → 에러 → `[]` 폴백). 순서: **마이그레이션 적용 → 코드 배포**. §19 Phase 1 검증 항목.

### 11.2 `0019_sessions.sql` — 회차 (F10)

```sql
create table if not exists public.sessions (
  id           uuid primary key default gen_random_uuid(),
  form_key     text not null references public.forms(key) on update cascade on delete restrict,
  starts_at    timestamptz not null,
  duration_min int,                                   -- null → forms.duration_min
  capacity     int  not null check (capacity between 1 and 50),
  booked_count int  not null default 0 check (booked_count >= 0),
  is_closed    boolean not null default false,
  note         text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint sessions_capacity_ok check (booked_count <= capacity)
);
create index if not exists idx_sessions_listing on public.sessions (form_key, starts_at);

drop trigger if exists trg_sessions_updated on public.sessions;
create trigger trg_sessions_updated
  before update on public.sessions
  for each row execute function public.touch_updated_at();

alter table public.sessions enable row level security;
drop policy if exists "sessions 공개 읽기" on public.sessions;
create policy "sessions 공개 읽기" on public.sessions for select
  using (exists (select 1 from public.forms f
                 where f.key = form_key and (f.is_published or public.is_admin())));
drop policy if exists "sessions 관리자" on public.sessions;
create policy "sessions 관리자" on public.sessions for all
  using (public.is_admin()) with check (public.is_admin());
```

### 11.3 `0020_form_hosts.sql` — 체험↔호스트 (F14)

```sql
create table if not exists public.form_hosts (
  form_key  text not null references public.forms(key)  on update cascade on delete cascade,
  person_id uuid not null references public.people(id)  on delete cascade,
  sort      int  not null default 100,
  primary key (form_key, person_id)
);
-- RLS: 공개 읽기(민감정보 없음 — 노출은 people.is_published·forms.is_published가 거른다), 쓰기 관리자
-- people.slug 백필(4명). slug는 0013에서 이미 `text unique` + 형식 CHECK가 있다 —
-- 인덱스를 새로 만들지 않는다. 백필 값이 형식 CHECK를 통과하는지만 확인.
```

### 11.4 `0021_bookings.sql` — 예약

```sql
create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete restrict,
  name          text not null check (length(btrim(name)) between 1 and 50),
  -- 이메일은 nullable: 전화 접수분을 운영자가 수동 등록할 수 있어야 한다(F16-7).
  -- 웹 폼에서는 필수 — 유일한 통지 채널이므로 서버 액션이 강제한다.
  email         text check (email is null or position('@' in email) > 1),
  -- 국제번호 허용(+34…). 숫자 8자 이상을 별도 CHECK로 강제 — 기호만 든 값 차단.
  phone         text not null check (phone ~ '^[0-9+\-\s()]{9,25}$'
                                     and length(regexp_replace(phone,'\D','','g')) >= 8),
  guests        int  not null check (guests between 1 and 20),
  note          text not null default '',
  locale        text not null default 'ko' check (locale in ('ko','en')),
  status        text not null default 'requested'
                check (status in ('requested','confirmed','declined','cancelled','no_show','done')),
  source        text not null default 'web' check (source in ('web','admin')),  -- 수동 등록 구분
  consent_at    timestamptz not null,
  age_confirmed boolean not null check (age_confirmed),
  cancel_token  text not null unique,
  confirmed_at  timestamptz,
  declined_at   timestamptz,
  cancelled_at  timestamptz,
  decline_reason text not null default '',
  reminded_at   timestamptz,                     -- D-1 리마인더 멱등성(F13-6)
  admin_memo    text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_bookings_session on public.bookings (session_id, status);
create index if not exists idx_bookings_token   on public.bookings (cancel_token);

drop trigger if exists trg_bookings_updated on public.bookings;
create trigger trg_bookings_updated
  before update on public.bookings
  for each row execute function public.touch_updated_at();

alter table public.bookings enable row level security;
-- ⚠ 공개 정책 없음: anon은 SELECT·INSERT 모두 불가. 쓰기는 service_role 전용.
drop policy if exists "bookings 관리자" on public.bookings;
create policy "bookings 관리자" on public.bookings for all
  using (public.is_admin()) with check (public.is_admin());
```

**좌석을 점유하는 상태**(카운트에 포함): `requested` · `confirmed` · `no_show` · `done`.
**해제하는 상태**: `declined` · `cancelled`. 이 정의가 §11.5 RPC들의 유일한 기준이다.

### 11.5 RPC — 정원의 원자성

```sql
-- ① 게스트 신청
create or replace function public.request_booking(
  p_session uuid, p_name text, p_email text, p_phone text,
  p_guests int, p_note text, p_locale text, p_token text, p_source text default 'web'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_s record; v_f record; v_id uuid;
begin
  select * into v_s from sessions where id = p_session for update;   -- 행 잠금
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  select * into v_f from forms where key = v_s.form_key;
  if not v_f.is_published or v_f.booking_mode <> 'native'
     then raise exception 'NOT_BOOKABLE'; end if;
  -- 마감 컷오프는 forms.cutoff_hours 단일 출처 (F10-2). 관리자 수동 등록은 컷오프 면제.
  if v_s.is_closed
     or (p_source <> 'admin'
         and v_s.starts_at - make_interval(hours => v_f.cutoff_hours) <= now())
     or v_s.starts_at <= now()
     then raise exception 'SESSION_CLOSED'; end if;
  if v_s.booked_count + p_guests > v_s.capacity
     then raise exception 'CAPACITY_EXCEEDED'; end if;

  insert into bookings (session_id, name, email, phone, guests, note, locale,
                        consent_at, age_confirmed, cancel_token, source)
  values (p_session, p_name, nullif(btrim(p_email),''), p_phone, p_guests,
          coalesce(p_note,''), p_locale, now(), true, p_token, p_source)
  returning id into v_id;
  update sessions set booked_count = booked_count + p_guests where id = p_session;
  return v_id;
end $$;

-- ② 게스트 취소 (토큰)
create or replace function public.cancel_booking(p_token text) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_b record;
begin
  select b.id, b.status, b.guests, b.session_id, s.starts_at into v_b
    from bookings b join sessions s on s.id = b.session_id
    where b.cancel_token = p_token
    for update of b;                       -- join 쿼리에서 b만 잠근다 (PostgreSQL 유효 문법)
  if not found or v_b.status not in ('requested','confirmed') then return false; end if;
  if v_b.starts_at <= now() then return false; end if;   -- 시작 후에는 전화로
  update bookings set status='cancelled', cancelled_at=now() where id = v_b.id;
  -- greatest() 클램프 금지(원칙 17): 음수는 CHECK 위반으로 터져야 한다
  update sessions set booked_count = booked_count - v_b.guests where id = v_b.session_id;
  return true;
end $$;

-- ③ 관리자 상태 변경 — 승인·거절·취소·노쇼·완료의 유일한 경로
create or replace function public.admin_set_booking_status(
  p_id uuid, p_status text, p_reason text default '', p_memo text default null
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_b record; v_held_before boolean; v_held_after boolean;
begin
  if p_status not in ('confirmed','declined','cancelled','no_show','done')
     then raise exception 'BAD_STATUS'; end if;
  select * into v_b from bookings where id = p_id for update;
  if not found then return false; end if;
  if v_b.status = p_status then return true; end if;                 -- 멱등
  -- 종결 상태에서 되살리지 않는다 (게스트 취소와 관리자 승인의 경쟁 방지)
  if v_b.status in ('declined','cancelled') then return false; end if;

  v_held_before := v_b.status in ('requested','confirmed','no_show','done');
  v_held_after  := p_status  in ('confirmed','no_show','done');

  update bookings set
    status         = p_status,
    confirmed_at   = case when p_status='confirmed' then now() else confirmed_at end,
    declined_at    = case when p_status='declined'  then now() else declined_at  end,
    cancelled_at   = case when p_status='cancelled' then now() else cancelled_at end,
    decline_reason = case when p_status='declined'  then coalesce(p_reason,'') else decline_reason end,
    admin_memo     = coalesce(p_memo, admin_memo)
  where id = p_id;

  if v_held_before and not v_held_after then
    update sessions set booked_count = booked_count - v_b.guests where id = v_b.session_id;
  elsif not v_held_before and v_held_after then
    update sessions set booked_count = booked_count + v_b.guests where id = v_b.session_id;
  end if;
  return true;
end $$;

-- ⚠ PostgreSQL은 함수 EXECUTE를 PUBLIC에 기본 부여한다. anon·authenticated는 PUBLIC을
--   상속하므로 그 둘에서만 회수하면 PostgREST /rest/v1/rpc/… 직접 호출이 그대로 열려 있다.
--   0011_link_clicks.sql이 이미 `from public, anon` 패턴을 쓴다 — 그것을 따른다.
revoke execute on function public.request_booking(uuid,text,text,text,int,text,text,text,text)
  from public, anon, authenticated;
revoke execute on function public.cancel_booking(text)
  from public, anon, authenticated;
revoke execute on function public.admin_set_booking_status(uuid,text,text,text)
  from public, anon, authenticated;
```

### 11.6 `0022_popup_class.sql` — 팝업에서 체험 상세로 (F15-4, Phase 3)

```sql
alter table public.popups drop constraint if exists popups_link_kind_check;
alter table public.popups add constraint popups_link_kind_check
  check (link_kind in ('form','notice','class','none'));
alter table public.popups drop constraint if exists popups_link_ok;
alter table public.popups add constraint popups_link_ok check (
     (link_kind in ('form','class') and form_key  is not null)
  or (link_kind = 'notice'          and notice_id is not null)
  or (link_kind = 'none')
);
```

### 11.7 운영 규칙 (스키마에 안 적히는 것)

- **`forms.key`는 생성 후 불변.** `on update cascade`가 걸려 있어도 rename하지 않는다 — `popups.form_key`는 의도적으로 FK가 없고(0015), `link_clicks.link_key`·인쇄된 QR·`/about/[key]` URL·sitemap이 전부 텍스트로 key를 물고 있다. admin 편집 폼에서 key는 읽기 전용.
- **체험 폐지 = 삭제가 아니라 은퇴.** `is_published=false` + `booking_mode='external'`. FK restrict 체인(forms←sessions←bookings) 때문에 예약이 남아 있으면 삭제가 막히는 게 정상이다.
- **파기(F16-4)**: bookings 삭제 후, 예약이 0건이 된 지난 sessions도 함께 삭제한다.

### 11.8 ER (v2.0 신규)

```
forms 1 ── * sessions 1 ── * bookings   (PII·토큰·상태 머신·reminded_at)
  └── * form_hosts * ── 1 people (slug 활성화)
popups.link_kind += 'class'    link_clicks.link_key += 'book:{key}' (시작 전용)
```

### 11.9 신규 의존성·환경변수

| 항목 | 값 | 비고 |
|---|---|---|
| (의존성 없음) | 이메일은 **Resend REST API를 `fetch`로 호출** | SDK를 안 넣는다 — 이 앱의 의존성 최소 관행 유지 |
| `RESEND_API_KEY` | 서버 전용 | `lib/email.server.ts`에서만 (`service.ts` 패턴) |
| `BOOKING_FROM_EMAIL` | 예: `예약 <booking@도메인>` | 도메인 확정(U3) 후 |
| `ADMIN_NOTIFY_EMAIL` | 운영자 통지 수신 | 기본값 `site_config.contact_email` |
| (교체) Supabase 3종 | 신규 프로젝트 값 | §16 |

## 12. 라우트·파일 맵 (★ 신규, ◆ 수정)

| 대상 | 구분 | 내용 |
|---|---|---|
| `/book/[key]` (+`/done`) | ★ | 예약 플로우. **완료 화면은 `?t={cancel_token}`으로 조회**(booking id 노출 금지). `noindex` |
| `/booking/[token]` | ★ | 조회·취소. `noindex` + robots 차단 |
| `/people/[slug]` | ★ | 호스트 상세 |
| `/terms` | ★ | 이용약관 + 취소 규정(한/영) |
| `/about/[key]` | ◆ | 메타 바·호스트 블록·회차 리스트·모드별 CTA 분기(§13.2) |
| `/`·`/about`·`/apply` | ◆ | 체험 카드 v2 |
| `/privacy` | ◆ | F17-3 |
| **`lib/forms.ts`** | ◆ | **`ApplyForm` 타입 + `FORM_PUBLIC_COLS`에 신규 9컬럼 추가** — 누락하면 메타가 전부 undefined로 조용히 죽는다(§11.1 배포 순서 경고) |
| **`app/sitemap.ts`** | ◆ | `/terms`·`/people/[slug]` 추가. `/book`·`/booking`은 미포함 |
| **`app/robots.ts`** | ◆ | `/booking` disallow 추가 |
| **`lib/i18n.ts`** | ◆ | 예약 폼 라벨·에러·완료 화면·상태 배지·메타 바 DICT 키 확장 |
| `app/admin/layout.tsx` | ★ | 공통 `getAdmin()` 가드 (F16-8) |
| `/admin/experiences`(+`[key]/edit`·`[key]/sessions`)·`/admin/bookings` | ★ | F16 |
| `/admin/settings` | ◆ | 체험 성격 필드는 experiences로 이동, 연락처·QR만 잔류 |

신규 lib: `lib/sessions.ts`(+`.server.ts`) · `lib/bookings.ts`(+`.server.ts`) · `lib/email.server.ts` · `lib/token.server.ts` · `lib/terms.ts`.
신규 컴포넌트: `SessionPicker` · `GuestStepper` · `BookingForm` · `ExperienceMeta` · `LegalDoc` · admin 폼 3종 — **전부 Tailwind+shadcn**.

## 13. 예약 구현 명세

### 13.1 `/book/[key]` 구성

1. **회차 미선택**: `SessionPicker` — 열린 회차 세로 카드(라디오, 52px+). 1개면 자동 선택
2. **폼**: 회차 요약 고정 → `GuestStepper` → 이름/이메일/전화/요청사항 → 동의 2종 → 제출(52px, 이중 클릭 방지) + honeypot 1필드
3. **서버 액션 `submitBooking`**: 검증 → 토큰 생성 → RPC → `redirect('/book/[key]/done?t={token}')`
4. RPC 예외 → 문구 매핑: `CAPACITY_EXCEEDED`→"방금 마감되었습니다…", `SESSION_CLOSED`→"이 회차는 마감되었습니다", `NOT_BOOKABLE`→`/apply` 리다이렉트

### 13.2 `booking_mode`별 분기표 (isFormAvailable 소비처 전수)

`isFormAvailable() = is_open && url`은 **external 전용 판정**이다. native 폼은 `url`이 null이라 그대로 두면 전부 "준비 중"으로 죽는다.

| 소비처 | external | native |
|---|---|---|
| `/about/[key]` CTA | 기존 `goHref`→구글폼 | `/book/[key]` 링크. 가용성 = **열린 회차 존재 여부**(`is_open`·`url` 무시) |
| `/apply`·홈 카드 | 기존 판정 | 열린 회차 존재 여부 |
| **잔여 배지** | **표시하지 않음** — 구글폼·종이·전화 접수분이 카운트에 없어 허위가 된다 | 표시 |
| `/api/go/[key]` | 그대로 | 도달 시 `/book/[key]`로 리다이렉트 |
| QR | `goHref` 인코딩 유지 | `/book/[key]` 인코딩 |
| 팝업 `link_kind='form'` | 그대로 | `/book/[key]` |
| admin 대시보드 상태 dot | `is_open`·`url` | 열린 회차 수 |

판정 헬퍼는 `lib/forms.ts`에 `isBookable(form, openSessionCount)` 하나로 두고 5곳이 공유한다.

### 13.3 잔여석 표시 규칙 (`lib/sessions.ts`)

`remaining = capacity − booked_count`. 잔여 ≥3 → "예약 가능" / 1~2 → "N자리 남음"(강조) / 0·is_closed·cutoff → "마감" / 지난 회차 → 미표시. **색+텍스트 동시**.

### 13.4 `/booking/[token]` · 완료 화면

서버 컴포넌트가 service client로 토큰 조회(없으면 404 — 존재 힌트 최소화). 요약 + 상태 배지 + [취소] → 확인 화면 → 서버 액션 → `cancel_booking`. 404 화면에 "링크를 잃으셨나요?" 문의 안내(§5.2).

### 13.5 admin 서버 액션

전부 `getAdmin()` 검증 후 `admin_set_booking_status` RPC 호출. 승인 시 확정 메일, 거절 시 사유 포함 거절 메일. **메일 실패가 상태 변경을 되돌리지 않는다** — admin에 [재발송] 노출. RPC가 `false`를 반환하면(이미 취소된 건 등) "이미 처리된 예약입니다" 안내.

## 14. 이메일 (`lib/email.server.ts`)

- Resend REST를 `fetch`로. `import "server-only"`. 키 없으면 no-op + admin 경고 배너(`ClickSummary` 패턴) — **키 없이도 예약은 동작**
- 템플릿 5종(ko/en): `bookingReceived` · `bookingConfirmed` · `bookingDeclined` · `bookingCancelled` · `bookingReminder`
- 공통: KST 명시 · 장소 한/영 + 구글맵·네이버맵 · 토큰 링크 · 회신 주소 = `contact_email`(noreply 금지)
- 발송 로그 테이블 없음. 실패는 `console.error` + Vercel 로그 (v2.0 규모에서 충분)

## 15. admin 상세

- `/admin/experiences`: 목록(게시·모드 배지) + 생성 폼. 편집 = 기존 필드 + 구조화 메타 + `detail` 마크다운 + `form_hosts` 체크박스 + `booking_mode` 토글(native 전환 시 "열린 회차 1개 이상" 검증). **`key` 읽기 전용**
- `/admin/experiences/[key]/sessions`: 회차 추가·수정·수동 마감. `booked_count` 읽기 전용
- `/admin/bookings`: 상태 탭 · 회차 그룹 · 행(이름·인원·연락처·요청사항·경과 시간, SLA 24h 초과 강조) · [승인]/[거절]/[취소]/[노쇼]/[완료]/[링크 재발송] · **[수동 예약 추가]**(F16-7) · CSV 내보내기 없음
- `/admin`: "미처리 신청 N건" 카드 최상단

## 16. DB 분리 이전 (D4 — Phase 0)

| 단계 | 내용 | 검증 |
|---|---|---|
| 1 | 신규 Supabase 프로젝트(서울 리전, 내 organization) | — |
| 2 | 0000_baseline → 0010~0017 순차 적용 | `list_tables`로 파일↔DB 대조 |
| 3 | 데이터 복사: site_config·forms·people·popups·notices·attachments 행 + **Storage `files` 버킷 객체**(posters/·people/·첨부 — 다운로드 후 재업로드 스크립트) | 행 수·객체 수 대조 |
| 4 | **Auth는 복사되지 않는다** — 관리자 계정을 신규 생성하고(U10) `admins` 행을 새 `auth.users.id`로 삽입 | /admin 로그인 실측 |
| 5 | env 전환: `.env.local` + Vercel 3종(**service_role을 이번에 설정 — 계측 D4 동시 해소**) | 배포 후 전 라우트 회귀 + `link_clicks` 적재 확인 |
| 6 | 구 프로젝트는 **손대지 않는다**(친구 사이트가 참조 중일 수 있음) | — |

롤백: env를 구 프로젝트 값으로 되돌리면 즉시 복귀(코드 변경 없음).

## 17. 보안·개인정보

- **`bookings` 접근**: 공개 정책 0개 · 쓰기 service_role · **RPC 실행권한 `public`까지 회수** · admin은 `is_admin` RLS
- **유출면 축소 대상 전부**: `/booking/[token]`, `/book/[key]/done` — 둘 다 `noindex` + robots 차단 + `Referrer-Policy: strict-origin-when-cross-origin`. 완료 화면은 booking id가 아니라 **토큰**으로 조회(경로 이원화 금지)
- **토큰**: `crypto.randomBytes(32)` base64url. 해시 저장은 하지 않는다(토큰 유출 = DB 유출 시점이라 방어 중복). **로그에 토큰 전문 금지**
- **CSP/보안 헤더**(D8, Phase 0): `next.config.ts` headers() — CSP, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`
- **파기**: `sessions.starts_at` 기준 6개월 경과 → 배지 + 일괄 삭제(F16-4). `declined`·`cancelled`·`no_show` 포함
- **스팸**: honeypot 1필드. CAPTCHA는 시니어 접근성과 상충이라 도입하지 않음. 동일 이메일+회차 중복은 하드 차단하지 않고 안내(가족 대리 신청)

## 18. 성능·접근성 체크

- 홈 쿼리 예산: 기존 4 + sessions 집계 1 = 5회 이내
- 예약 페이지 JS 최소: 폼·피커는 서버 컴포넌트+서버 액션, `GuestStepper`만 클라이언트
- `prefers-reduced-motion` · 카톡 인앱 실기기 · 200% · 360px 무결 · Lighthouse a11y ≥ 95

---

# Part 3 — 실행

## 19. 개발 단계

### Phase 0 — 기반 (선행: U10)
DB 분리(§16) · CSP/보안 헤더 · `/terms` · `/privacy` 개정 **준비**(시행은 Phase 2) · 문서 등재
검증: 신 DB로 전 라우트 회귀 · `link_clicks` 적재 시작 · 보안 헤더 실측
**이 시점에도 사이트는 구글폼 체제로 완전 동작**

### Phase 1 — 체험 구조화 (0018~0020)
forms 메타+시드 · sessions·form_hosts · 상세 재조립 · `/people/[slug]` · 카드 v2 · admin experiences+sessions
검증: **마이그레이션 적용 → 코드 배포 순서 준수**(§11.1) · 날짜·가격·정원이 구조화 필드에서만 렌더(3컬럼 이중 기재 0) · SQL 없이 체험 생성 · **레거시 CSS 582줄 동결** · external 체험에 잔여 배지 미표시

### Phase 2 — 자체 예약 ★ 본체 (선행: Phase 1 + U3 도메인 + U7 전화번호 + U11 취소 규정)
0021 · `/book/[key]`·완료 · `/booking/[token]` · 이메일 5종 · admin bookings(승인·거절·수동 등록·재발송) · booking_mode 스위치 · 방침 개정 **시행**(같은 커밋)
검증: 정원 1석 동시 2건 → 1건만 성공 · **anon 키로 RPC 직접 호출 실패 실측** · 게스트 취소와 관리자 승인 경쟁 시 카운트 정합 · **cooking만 native**(senior·hiking 구글폼 병행) · 카톡 인앱 완결 · 60세+ 실사용 1건 · 이메일 5종 실발송
롤백: `booking_mode='external'`

### Phase 3 — 운영 자동화
0022(팝업 class) · D-1 리마인더(Cron + `reminded_at`) · 컷오프 자동 마감 · 파기 화면 · 노쇼 · 잔여 강조 · 전 체험 native 전환
검증: 리마인더 **중복 발송 없음**(재실행 테스트) · 만료 회차 자동 제외 · G6 관찰

### Phase 4 — v2.x 게이트 (부록 B 선행)
리뷰 · PG 결제 · 알림톡 · 대기자 · 위시리스트

### Phase X — 캐싱 전환 (독립 릴리스, 기능과 혼합 금지 — ADR-6)

의존: `P0 → P1 → P2 → P3`.

## 20. QA 체크리스트

**기능**: 정원 경쟁 1건만 성공 / 마감·컷오프·지난 회차 신청 불가 / 취소→잔여 복구 / **거절→잔여 복구** / **관리자 승인 vs 게스트 취소 경쟁 후 카운트 == 실합계** / 토큰 오류 404 / 승인→확정 메일·거절→거절 메일 / 수동 등록이 정원에 반영 / external 폼 기존 흐름 무결 / SQL 없이 전 운영 완결
**접근성**: 회차 카드·스테퍼 52px / **스테퍼 버튼 aria-label** / 마감 카드 `aria-disabled`+사유 / **스크린리더로 예약 완주** / 키보드 완주 / aria-live / 색+텍스트 / `--fs-scale` 125% / EN 날짜·KST / **국제번호 입력 성공**
**환경**: 카톡 인앱(제출·메일 링크) / 360px / 200% / a11y ≥ 95 / LCP ≤ 2.5s
**보안**: **anon으로 bookings SELECT/INSERT 실패** / **anon으로 RPC 3종 직접 호출 실패** / 신규 admin 라우트 무인증 접근 차단 / 보안 헤더 / 토큰 비로그 / `/book/*/done`·`/booking/*` noindex
**법적**: 동의·14세 미확인 시 제출 불가 / 약관·방침 링크 / **약관 취소 문안 == RPC 실제 동작**(F12-2) / 방침 개정 커밋 == 예약 시행 커밋

## 21. 착수 전 확정 필요

| ID | 항목 | 게이트 |
|---|---|---|
| U10 | 신규 DB 관리자 계정 이메일 | ⬜ **Phase 0** |
| U3 | **도메인명·구매** — 확정 메일 SPF/DKIM의 전제 | ⬜ **Phase 2** |
| U7 | **전화 안전망 노출 번호** — 이메일 없는 시니어·토큰 분실의 유일한 출구 | ⬜ **Phase 2** |
| U11 | 취소 규정 — 제안: **v2.0 무결제는 "시작 전까지 취소 가능", 48시간 규정은 유료화 시 발효**. 약관 문안과 RPC를 이 하나로 통일 | ⬜ **Phase 2** |
| U2 | Vercel Hobby 상업성·Supabase 티어 | ⬜ Phase 4 |
| 해소 | U5(방침)·U6(F13이 흡수)·U8(CSP → Phase 0) | ✅ |

## 22. 리스크 & 대응

| 리스크 | 대응 |
|---|---|
| 도메인 확정 지연 → Phase 2 블로킹 | Phase 0·1은 도메인 무관. 최악 시 운영자 통지만 켠 소프트 런칭 |
| 무결제 노쇼 | D-1 리마인더 + 원클릭 취소 + 노쇼 기록. 지속 시 Phase 4 예약금 |
| 동시성·카운트 드리프트 | RPC 단일 경로(원칙 16) + 행 잠금 + CHECK + 클램프 금지(원칙 17). QA에 경쟁 테스트 |
| 하이브리드 기간의 정원 불일치 | external은 잔여 미표시(§13.2) + 전화·종이분은 수동 등록(F16-7) |
| 운영자 SLA 미준수 | admin SLA 시계 + 운영자 통지. 지속 시 자동 확정 전환 조건 발동 |
| 친구 운영 DB | §16-6: 구 프로젝트 무단절. 읽기만 |
| 행정 회색지대 | 부록 B — 개발 비블로킹, 유료화 게이트 |

---

## 부록 A — ADR

| # | 결정 | 근거 |
|---|---|---|
| ADR-9 | 예약 편입, **무결제 승인제** (PRD v1.0 "결제·예약 Out" 부분 번복) | §3.1. 결제 제외로 행정 트랙과 분리 |
| ADR-10 | 게스트 신원 = **이메일 서명 토큰** | 시니어·외국인 마찰 최소 + 비밀번호 문의 0 |
| ADR-11 | **DB 신규 분리** | 소유권·책임 경계. 마이그레이션 체계(v1.1 투자)가 이전 비용을 최소화 |
| ADR-12 | 신규 화면 **Tailwind+shadcn 전용**, 레거시 CSS 동결 | D7 역행 차단 |
| ADR-13 | 회차 상태는 **파생**, 컷오프는 `forms.cutoff_hours` 단일 출처 | 상태-실제 불일치 원천 차단 |
| ADR-14 | booking_mode 하이브리드 — 구글폼 경로 **유지** | 점진 전환 + 즉시 롤백 + 외부 폼 지원 |
| ADR-15 | 카운트 변경은 **RPC 3종이 유일 경로**, 클램프 금지 | 좌석 누수는 조용히 생기고 되돌릴 수 없다 |
| ADR-16 | 이메일 SDK 미도입, **REST + fetch** | 의존성 최소 관행 유지 |

## 부록 B — 행정 트랙 (개발과 분리, 유료화 게이트)

| 항목 | 내용 | 시점 |
|---|---|---|
| 통신판매업 신고 | 면제(연 50회 미만·간이과세) 해당 여부 → PG 도입 시 필수 | Phase 4 전 |
| 여행업 등록 | 외국인 유상 하이킹 인솔 — 관할 구청 질의 [확인필요] | 유료화 전 |
| 식품위생 | 쿠킹클래스 조리·시식 형태의 허가 요부 [확인필요] | 유료화 전 |
| 보험 | 영업배상책임·단체상해 | 유료화 전 |
| 50플러스 지원사업 규정 | 유상 전환과의 충돌 [확인필요] | 유료화 전 |

---

## 부록 C — 구현 현황 (2026-08-07)

**DB에 손대지 않은 채 가능한 코드는 전부 작성했다.** 마이그레이션 0018~0022는 파일로만 존재하고 **적용하지 않았다**(AGENTS.md의 "적용 전에 커밋" 규칙과 §16 DB 분리가 선행돼야 하므로).

### C.1 완료

| 영역 | 산출물 |
|---|---|
| 보안 (D8) | `next.config.ts` — CSP·nosniff·X-Frame-Options·Referrer-Policy·Permissions-Policy. 응답 헤더 실측 확인 |
| 마이그레이션 | `0018_experience_meta` · `0019_sessions` · `0020_form_hosts` · `0021_bookings`(RPC 3종) · `0022_popup_class` — **미적용** |
| 순수 로직 | `lib/sessions.ts`(상태 파생·KST 포맷) · `lib/bookings.ts`(검증·상태 라벨·에러 문구) · `lib/terms.ts` |
| 서버 모듈 | `lib/sessions.server.ts` · `lib/bookings.server.ts` · `lib/admin-bookings.server.ts` · `lib/token.server.ts` · `lib/email.server.ts`(템플릿 6종) · `lib/admin-guard.server.ts` |
| 공개 화면 | `/terms`(한/영) · `/book/[key]` · `/book/[key]/done` · `/booking/[token]` · `/about/[key]` 메타 바·회차·모드별 CTA |
| 관리자 | `/admin/bookings` — 승인·거절(사유)·취소·불참·완료·링크 재발송, SLA 24h 강조 |
| 컴포넌트 | `SessionPicker` · `GuestStepper` · `BookingForm` · `ExperienceMeta` · `CancelBookingForm` · `BookingActions` · `LegalDoc`(방침·약관 공용) |
| 부수 | i18n 키 60여 개 · sitemap `/terms` · robots `/book`·`/booking` 차단 · 푸터 약관 링크 · `isBookableForm`/`showsSeatCount`(§13.2 분기) |

### C.2 지금 배포해도 사이트가 그대로인 이유

신규 컬럼을 `FORM_PUBLIC_COLS`에 **넣지 않았다**. `ApplyForm`의 v2.0 필드는 전부 옵셔널이라 값이 `undefined`로 오고, `ExperienceMeta`는 통째로 렌더되지 않으며, `booking_mode`가 없으니 모든 체험이 `external`로 판정돼 기존 구글폼 경로 그대로다. `sessions`·`bookings` 조회는 테이블이 없으면 빈 배열·null로 떨어진다. 실측: 전 라우트 200, `/book/cooking` → `/about/cooking` 리다이렉트, `/about/cooking`의 CTA는 여전히 `/api/go/cooking?src=class`.

### C.3 남은 작업 (전부 DB 연동 이후)

1. **§16 DB 분리** — 신규 Supabase 생성, 0000~0017 재생, 데이터·Storage 복사, Auth 계정 재생성, env 3종 교체
2. 0018~0022 적용 → **그 다음에** `FORM_PUBLIC_COLS`에 신규 9컬럼 추가 (순서 뒤집으면 전 체험이 사라진다)
3. `RESEND_API_KEY`·`BOOKING_FROM_EMAIL`(도메인 U3 선행) — 없으면 승인해도 메일이 안 나가고 admin에 배너가 뜬다
4. 미구현 화면: `/admin/experiences`(체험·회차 CRUD, F16-1·2) · `/people/[slug]`(F14-2) · 수동 예약 등록(F16-7) · 카드 v2 잔여 배지(F15-1) · D-1 리마인더(F13-6)
5. `/privacy` 개정 — 예약 시행 커밋과 **같은 커밋**(F17-3)

---

**작성**: 2026-08-07 · draft.2(적대적 검증 42건 반영) + 부록 C(구현 현황) · §21 확정(U10 → U3·U7·U11) 후 Phase 0 착수.
