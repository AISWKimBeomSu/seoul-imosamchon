/**
 * 진입점(source)만 코드가 고정하고, 이동 대상(폼 키)은 데이터다.
 * 키는 /api/go에서 forms 테이블 조회로 검증되므로 화이트리스트 상수가 필요 없다.
 */
export type LinkSource =
  | "nav"
  | "hero"
  | "popup"
  | "qr"
  | "people"
  | "apply"
  | "notice"
  | "about"
  | "guest"
  | "class"
  | "faq"
  | "footer"
  | "admin"
  | "unknown";

export const LINK_SOURCES: LinkSource[] = [
  "nav",
  "hero",
  "popup",
  "qr",
  "people",
  "apply",
  "notice",
  "about",
  "guest",
  "class",
  "faq",
  "footer",
  "admin",
  "unknown",
];

/** 진입점 코드 → 관리자 화면에 보여줄 한글 이름 */
export const SOURCE_LABEL: Record<string, string> = {
  nav: "상단 메뉴",
  hero: "홈 첫 화면",
  popup: "팝업",
  qr: "QR 코드",
  people: "소개 페이지",
  apply: "신청 페이지",
  notice: "공지 상세",
  about: "브랜드소개",
  guest: "손님 안내",
  class: "클래스 상세",
  faq: "FAQ",
  footer: "하단 메뉴",
  admin: "관리자 확인",
  unknown: "기타",
};

/**
 * 모든 외부 이동은 이 헬퍼를 거친다.
 * 구글폼 주소를 <a href>에 직접 박지 않는 이유 — 계측·마감처리·URL 검증이
 * /api/go 한 곳에 모여야 관리가 된다.
 */
export function goHref(formKey: string, source: LinkSource): string {
  return `/api/go/${formKey}?src=${source}`;
}
