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

/**
 * DB를 못 읽어도 페이지는 떠야 한다.
 *
 * 이 주소는 문의·신청 접수·개인정보 열람청구 세 곳에 같이 쓰인다.
 * 바꿀 때는 DB의 site_config.contact_email도 같이 고친다 — 여기는 폴백일 뿐이다.
 */
export const FALLBACK_CONFIG: SiteConfig = {
  contact_email:
    process.env.NEXT_PUBLIC_APPLICATION_EMAIL || "beomsu9665@gachon.ac.kr",
  contact_phone: null,
};
