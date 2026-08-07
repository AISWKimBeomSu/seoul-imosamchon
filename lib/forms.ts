/**
 * 신청 폼. 서버·클라이언트 공용 순수 로직만 둔다.
 * DB 조회는 lib/forms.server.ts.
 *
 * v1.1까지는 폼이 senior/guest 2개라고 코드에 박혀 있었다. 쿠킹클래스·하이킹이
 * 추가되면서 그 가정이 깨졌고, 이제 폼은 '행'이다 — 넷째가 생겨도 코드는 그대로다.
 */

export type FormAudience = "senior" | "guest";
export type FormAccent = "green" | "gold" | "lime";

export type ApplyForm = {
  id: string;
  key: string;
  title: string;
  subtitle: string;
  description: string;
  url: string | null;
  is_open: boolean;
  cta_label: string;
  closed_note: string;
  audience: FormAudience;
  poster_path: string | null;
  poster_alt: string;
  accent: FormAccent;
  sort: number;
  // 비어 있으면 한국어로 떨어진다 (lib/i18n.ts의 pick)
  title_en: string;
  subtitle_en: string;
  description_en: string;
  cta_label_en: string;
  closed_note_en: string;
  detail: string;      // 상세 페이지 본문 (마크다운)
  detail_en: string;

  // ── v2.0 구조화 메타 (0018_experience_meta.sql) ──────────────────────────
  // ⚠ 전부 옵셔널이다. 마이그레이션을 적용하기 전에는 이 컬럼들이 DB에 없고,
  //    FORM_PUBLIC_COLS에도 아직 넣지 않았으므로 값이 undefined로 온다.
  //    화면은 값이 없으면 그 부분을 숨기게 되어 있어(ExperienceMeta) 안전하다.
  //    마이그레이션 적용 후 FORM_PUBLIC_COLS에 컬럼을 추가하면 한꺼번에 켜진다.
  //    순서를 뒤집으면(코드 먼저) getForms의 select가 통째로 실패해 사이트의
  //    모든 체험이 사라진다 — docs/PLATFORM.md §11.1의 경고.
  duration_min?: number | null;
  price_krw?: number | null;
  max_guests?: number | null;
  language?: string;
  meet_place?: string;
  meet_place_en?: string;
  includes?: string[];
  includes_en?: string[];
  booking_mode?: BookingMode;
  cutoff_hours?: number;
};

/** external=구글폼(/api/go 경유), native=자체 예약(/book/[key]) */
export type BookingMode = "external" | "native";

export type AdminForm = ApplyForm & {
  is_published: boolean;
};

export const FORM_PUBLIC_COLS =
  "id, key, title, subtitle, description, url, is_open, cta_label, closed_note, audience, poster_path, poster_alt, accent, sort, title_en, subtitle_en, description_en, cta_label_en, closed_note_en, detail, detail_en";

export const FORM_ADMIN_COLS = `${FORM_PUBLIC_COLS}, is_published`;

/** 구글폼 도메인만 허용 (forms 테이블의 CHECK 제약과 동일한 규칙) */
export const FORM_URL_PATTERN =
  /^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)/;

export function isValidFormUrl(url: string): boolean {
  return FORM_URL_PATTERN.test(url.trim());
}

/** 키 형식 — forms.key CHECK와 동일 */
export const FORM_KEY_PATTERN = /^[a-z][a-z0-9-]{1,30}$/;

/**
 * 지금 이 폼으로 실제 이동할 수 있는가.
 *
 * ⚠ external(구글폼) 전용 판정이다. native 폼은 url이 null이라 여기서 항상
 *   false가 나온다 — 자체 예약 체험을 이 함수로 판정하면 통째로 '준비 중'이
 *   된다. 모드를 아우르는 판정은 isBookableForm()을 쓸 것.
 */
export function isFormAvailable(form: Pick<ApplyForm, "is_open" | "url">) {
  return Boolean(form.is_open && form.url);
}

/** 이 체험이 자체 예약을 쓰는가 (컬럼이 아직 없으면 external로 본다) */
export function isNative(form: Pick<ApplyForm, "booking_mode">): boolean {
  return form.booking_mode === "native";
}

/**
 * 모드를 아우르는 가용성 판정. 상세·목록·홈·admin·팝업 다섯 곳이 이걸 공유한다.
 *
 * external — 구글폼이 열려 있는가 (기존 규칙 그대로)
 * native   — 예약 가능한 회차가 하나라도 있는가. is_open·url은 보지 않는다.
 *            자체 예약에서 '열림'은 사람이 켜는 스위치가 아니라 회차의 존재다.
 *
 * 참조: docs/PLATFORM.md §13.2 분기표
 */
export function isBookableForm(
  form: Pick<ApplyForm, "is_open" | "url" | "booking_mode">,
  openSessionCount = 0,
): boolean {
  return isNative(form) ? openSessionCount > 0 : isFormAvailable(form);
}

/**
 * 신청 버튼이 향할 곳.
 * native는 사이트 안에 머물고, external은 계측 리다이렉트를 거쳐 구글폼으로 나간다.
 * 호출부는 external일 때만 target="_blank"를 붙인다.
 */
export function bookHref(form: Pick<ApplyForm, "key" | "booking_mode">): string | null {
  return isNative(form) ? `/book/${form.key}` : null;
}

/**
 * 잔여석 배지를 보여도 되는가.
 *
 * external 체험에서는 보여주면 안 된다. 구글폼·종이·전화로 들어온 신청이
 * booked_count에 없으므로 '3자리 남음'이 사실이 아니다. 틀린 숫자를 보여주느니
 * 아무 숫자도 안 보여주는 편이 낫다.
 */
export function showsSeatCount(form: Pick<ApplyForm, "booking_mode">): boolean {
  return isNative(form);
}

/**
 * 포스터 주소.
 * '/'로 시작하면 저장소에 함께 들어 있는 파일(public/), 아니면 관리자가 올린
 * Supabase Storage 경로다.
 */
export function posterUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("/")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${path}`;
}

export const AUDIENCE_LABEL: Record<FormAudience, string> = {
  senior: "시니어 모집",
  guest: "손님 모객",
};
