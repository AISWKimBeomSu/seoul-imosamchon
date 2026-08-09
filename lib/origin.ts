import "server-only";

import { headers } from "next/headers";

/**
 * 헤더를 못 읽는 맥락에서만 쓰인다. 실제 서비스 주소여야 한다 —
 * 여기 적힌 주소가 QR이나 메일 링크로 나갈 수 있기 때문이다.
 * (2026-08-09 자체 도메인 연결)
 */
const FALLBACK = "https://seoulimosamchon.com";

/**
 * 지금 요청이 들어온 실제 주소.
 *
 * NEXT_PUBLIC_SITE_URL을 믿지 않는 이유: 로컬 .env.local에는 localhost가 들어 있고,
 * 이 값이 배포 환경에 잘못 복사되면 QR이 localhost를 가리키는 조용한 사고가 난다.
 * 요청 헤더에서 유도하면 어떤 환경에서도 항상 맞다.
 */
export async function getSiteOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto =
        h.get("x-forwarded-proto") ??
        (host.startsWith("localhost") || host.startsWith("127.0.0.1")
          ? "http"
          : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // 정적 렌더 등 헤더가 없는 맥락
  }
  return process.env.NEXT_PUBLIC_SITE_URL || FALLBACK;
}
