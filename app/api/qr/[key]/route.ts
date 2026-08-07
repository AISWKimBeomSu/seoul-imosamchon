import { getForm } from "@/lib/forms.server";
import { FORM_KEY_PATTERN, isNative } from "@/lib/forms";
import { renderQrSvg } from "@/lib/qr";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  if (!FORM_KEY_PATTERN.test(key)) {
    return new Response("Not found", { status: 404 });
  }

  const form = await getForm(key);
  // 자체 예약 체험은 구글폼 주소가 없다(있어도 안 쓴다). 그래도 QR은 필요하다 —
  // 목적지는 /api/go가 모드를 보고 정한다.
  if (!form || (!isNative(form) && !form.url)) {
    return new Response("Not configured", { status: 404 });
  }

  // ★ QR은 구글폼 원본이 아니라 계측 경유 링크를 가리킨다.
  //   그래야 "QR로 몇 명이 들어왔는가"를 셀 수 있다.
  //   주소는 환경변수가 아니라 실제 요청 호스트에서 유도한다.
  const origin = new URL(req.url).origin;
  const svg = await renderQrSvg(`${origin}/api/go/${key}?src=qr`);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // 호출부가 ?v={폼URL 해시}를 붙이므로 장기 캐시가 안전하다.
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Disposition": `inline; filename="seoul-imosamchon-${key}-qr.svg"`,
    },
  });
}
