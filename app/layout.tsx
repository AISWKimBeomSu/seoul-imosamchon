import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { getLocale } from "@/lib/locale.server";
import { getSiteOrigin } from "@/lib/origin";
import "./globals.css";

// 본문 폰트는 Noto Sans KR 고정. shadcn init이 Geist를 끼워 넣으려 하는데,
// Geist에는 한글 글리프가 없어 사이트 전체가 폴백 폰트로 떨어진다.
// `shadcn add`를 다시 돌린 뒤에는 이 파일이 되돌려지지 않았는지 확인할 것.
const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-noto",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  // 브라우저 탭 제목과 공유 카드도 화면 언어를 따라간다.
  // 주소는 환경변수가 아니라 실제 요청 호스트에서 유도한다 — 로컬 .env의
  // localhost가 배포 환경에 복사되면 공유 카드 이미지 주소가 통째로 깨진다.
  const [locale, siteUrl] = await Promise.all([getLocale(), getSiteOrigin()]);
  const en = locale === "en";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: en
        ? "Seoul Imo·Samchon — local experiences hosted by Seoul seniors"
        : "서울이모삼촌 — 시니어 로컬 라이프 크리에이터",
      template: en ? "%s · Seoul Imo·Samchon" : "%s · 서울이모삼촌",
    },
    description: en
      ? "Cook and walk with Seoul residents in their sixties. We are also recruiting senior hosts."
      : "여러분만이 알고 있는 서울의 '로컬함'을 알려주세요. 만 60세 이상 시니어와 함께하는 유급 로컬 체험, 서울이모삼촌 시니어 호스트를 모집합니다.",
    openGraph: {
      title: en
        ? "Seoul Imo·Samchon"
        : "서울이모삼촌 — 시니어 호스트 모집",
      description: en
        ? "Local experiences hosted by Seoul residents aged 60+."
        : "만 60세 이상 시니어와 함께하는 유급 로컬 체험.",
      type: "website",
      locale: en ? "en_US" : "ko_KR",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // 문서 언어를 실제 표시 언어와 맞춘다. 스크린리더 발음과 브라우저 번역 제안이
  // 여기에 달려 있어서, lang이 틀리면 영어 페이지를 한국어로 읽는다.
  const locale = await getLocale();

  return (
    <html lang={locale} className={noto.variable}>
      <body>
        {children}
        {/* 쿠키리스 페이지뷰 — KPI 분모(신청 시작률의 '세션') 확보용 */}
        <Analytics />
      </body>
    </html>
  );
}
