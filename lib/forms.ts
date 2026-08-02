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
};

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

/** 지금 이 폼으로 실제 이동할 수 있는가 */
export function isFormAvailable(form: Pick<ApplyForm, "is_open" | "url">) {
  return Boolean(form.is_open && form.url);
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
