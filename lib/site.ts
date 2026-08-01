import type { LinkKey } from "@/lib/links";

/**
 * 서버·클라이언트 양쪽에서 쓰는 순수 로직만 둔다.
 * (DB 접근은 lib/config.ts — 그쪽은 next/headers에 의존해 서버 전용이다)
 */

export type SiteConfig = {
  senior_form_url: string | null;
  senior_form_open: boolean;
  senior_form_label: string;
  senior_closed_note: string;
  guest_form_url: string | null;
  guest_form_open: boolean;
  guest_form_label: string;
  contact_email: string;
  contact_phone: string | null;
};

/** 구글폼 도메인만 허용 (site_config의 DB CHECK 제약과 동일한 규칙) */
export const FORM_URL_PATTERN =
  /^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)/;

export function isValidFormUrl(url: string): boolean {
  return FORM_URL_PATTERN.test(url.trim());
}

/** DB를 못 읽어도 페이지는 떠야 한다. 폴백은 '마감' 쪽으로 안전하게 잡는다. */
export const FALLBACK_CONFIG: SiteConfig = {
  senior_form_url: null,
  senior_form_open: false,
  senior_form_label: "휴대폰으로 5분 신청하기",
  senior_closed_note: "이번 모집은 마감되었습니다. 다음 공고를 기다려 주세요.",
  guest_form_url: null,
  guest_form_open: false,
  guest_form_label: "Book a class",
  contact_email:
    process.env.NEXT_PUBLIC_APPLICATION_EMAIL || "songchaewoo0@gmail.com",
  contact_phone: null,
};

/** 폼 하나의 상태를 한 번에 꺼내는 헬퍼 */
export function formState(cfg: SiteConfig, key: LinkKey) {
  const isSenior = key === "senior";
  const url = isSenior ? cfg.senior_form_url : cfg.guest_form_url;
  const open = isSenior ? cfg.senior_form_open : cfg.guest_form_open;
  const label = isSenior ? cfg.senior_form_label : cfg.guest_form_label;
  return { url, open, label, available: Boolean(open && url) };
}
