import type { NextConfig } from "next";

/**
 * 보안 헤더 (docs/PLATFORM.md §17, 부채 D8).
 *
 * 예약이 들어오면 이 사이트가 개인정보를 직접 받기 시작한다. 그 전에 켜 둔다.
 *
 * CSP에서 'unsafe-inline'을 style-src에 남긴 이유 — 이 앱은 인라인 style
 * 속성(app/about/[key]/page.tsx의 헤딩 크기 등)과 Next.js가 주입하는 인라인
 * <style>에 의존한다. nonce 방식으로 가려면 그 의존을 먼저 걷어내야 하므로
 * 별도 작업으로 남긴다. script-src는 'unsafe-inline' 없이 간다.
 */
const CSP = [
  "default-src 'self'",
  // Next.js 런타임이 인라인 부트스트랩 스크립트를 쓴다. 개발 모드는 eval도 필요.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  // Supabase Storage(포스터·인물 사진) + data:(QR SVG 인라인)
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  // Supabase REST/Auth + Vercel Analytics 수집
  "connect-src 'self' https://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // 예약 조회 토큰이 URL에 담긴다 — 외부로 전문이 새지 않게 한다.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pxfmvncfdfiuxobjzihw.supabase.co" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
