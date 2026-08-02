/**
 * 사이트 전역 연락 정보. 서버·클라이언트 공용 순수 로직만 둔다.
 * (DB 접근은 lib/config.ts — next/headers 의존이라 서버 전용)
 *
 * 폼 설정은 v1.2에서 forms 테이블로 옮겼다 → lib/forms.ts
 */

export type SiteConfig = {
  contact_email: string;
  contact_phone: string | null;
};

/** DB를 못 읽어도 페이지는 떠야 한다. */
export const FALLBACK_CONFIG: SiteConfig = {
  contact_email:
    process.env.NEXT_PUBLIC_APPLICATION_EMAIL || "songchaewoo0@gmail.com",
  contact_phone: null,
};
