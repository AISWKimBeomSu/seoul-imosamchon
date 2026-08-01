import { getSiteConfig, formState } from "@/lib/config";
import { renderQrSvg } from "@/lib/qr";
import { LINK_KEYS, type LinkKey } from "@/lib/links";

export const dynamic = "force-dynamic";

const KEYS = new Set<string>(LINK_KEYS);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  if (!KEYS.has(key)) {
    return new Response("Not found", { status: 404 });
  }

  const cfg = await getSiteConfig();
  const { url } = formState(cfg, key as LinkKey);
  if (!url) {
    return new Response("Not configured", { status: 404 });
  }

  // ★ QR은 구글폼 원본이 아니라 계측 경유 링크를 가리킨다.
  //   그래야 "QR로 몇 명이 들어왔는가"를 셀 수 있다.
  //   주소는 환경변수가 아니라 실제 요청 호스트에서 유도한다(lib/origin.ts 참고).
  const origin = new URL(req.url).origin;
  const svg = await renderQrSvg(`${origin}/api/go/${key}?src=qr`);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // 호출부가 ?v={폼URL 해시}를 붙이므로 장기 캐시가 안전하다.
      // URL이 바뀌면 v가 바뀌어 자동으로 새 QR을 받는다.
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Disposition": `inline; filename="seoul-imosamchon-${key}-qr.svg"`,
    },
  });
}
