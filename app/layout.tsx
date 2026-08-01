import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-noto",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "서울이모삼촌 — 시니어 로컬 라이프 크리에이터",
    template: "%s · 서울이모삼촌",
  },
  description:
    "여러분만이 알고 있는 서울의 '로컬함'을 알려주세요. 만 60세 이상 시니어와 함께하는 유급 로컬 체험, 서울이모삼촌 시니어 호스트를 모집합니다.",
  openGraph: {
    title: "서울이모삼촌 — 시니어 호스트 모집",
    description: "만 60세 이상 시니어와 함께하는 유급 로컬 체험.",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={noto.variable}>
      <body>
        {children}
        {/* 쿠키리스 페이지뷰 — KPI 분모(신청 시작률의 '세션') 확보용 */}
        <Analytics />
      </body>
    </html>
  );
}
