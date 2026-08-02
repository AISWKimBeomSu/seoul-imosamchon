/**
 * 팝업. 서버·클라이언트 공용 순수 로직만 둔다.
 * DB 조회는 lib/popups.server.ts.
 */

export type PopupLinkKind = "form" | "notice" | "none";
export type PopupScope = "home" | "all";

export type Popup = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  link_kind: PopupLinkKind;
  form_key: string | null;
  notice_id: string | null;
  cta_label: string;
  show_qr: boolean;
  image_path: string | null;
  image_alt: string;
  scope: PopupScope;
  starts_at: string;
  ends_at: string | null;
  sort: number;
  is_published: boolean;
};

export const POPUP_COLS =
  "id, title, subtitle, body, link_kind, form_key, notice_id, cta_label, show_qr, image_path, image_alt, scope, starts_at, ends_at, sort, is_published";

/**
 * 포스터 주소.
 * '/'로 시작하면 저장소에 함께 들어 있는 파일(public/), 아니면 관리자가 올린
 * Supabase Storage 경로다. 두 출처를 같은 컬럼으로 다루기 위한 규칙이다.
 */
export function popupImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("/")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${path}`;
}

/** 관리자 목록용 상태 라벨 */
export function popupStatus(p: Popup): {
  label: string;
  cls: "live" | "soon" | "done" | "draft";
} {
  if (!p.is_published) return { label: "임시저장", cls: "draft" };
  const now = Date.now();
  if (new Date(p.starts_at).getTime() > now) return { label: "예정", cls: "soon" };
  if (p.ends_at && new Date(p.ends_at).getTime() <= now)
    return { label: "종료", cls: "done" };
  return { label: "노출 중", cls: "live" };
}
