import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSiteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api/go 는 계측 리다이렉트라 크롤러가 긁으면 통계가 오염된다.
      // (라우트 안에서도 봇을 걸러내지만, 애초에 안 오는 게 낫다)
      // /booking 은 예약자 개인 정보가 담긴 토큰 URL이다. 페이지에도 noindex를
      // 걸지만, 크롤러가 애초에 요청하지 않게 여기서도 막는다.
      disallow: ["/admin", "/api/", "/booking", "/book/"],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
