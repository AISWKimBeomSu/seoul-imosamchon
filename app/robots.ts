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
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
