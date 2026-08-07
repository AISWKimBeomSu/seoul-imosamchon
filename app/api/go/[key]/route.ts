import { NextResponse, after, userAgent } from "next/server";
import { getForm } from "@/lib/forms.server";
import { FORM_URL_PATTERN, FORM_KEY_PATTERN, isNative } from "@/lib/forms";
import { createServiceClient } from "@/lib/supabase/service";
import { LINK_SOURCES } from "@/lib/links";

// 리다이렉트가 캐시되면 '마감' 처리가 먹지 않는다.
export const dynamic = "force-dynamic";

const SOURCES = new Set<string>(LINK_SOURCES);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const reqUrl = new URL(req.url);
  const origin = reqUrl.origin;

  // ★ 이동 대상은 '키'로만 지정된다. URL을 쿼리로 받지 않으므로
  //   오픈 리다이렉트가 구조적으로 불가능하다.
  //   키가 폼 목록에 없으면 그대로 신청 페이지로 되돌린다.
  if (!FORM_KEY_PATTERN.test(key)) {
    return NextResponse.redirect(new URL("/apply", origin), 302);
  }

  const form = await getForm(key);
  if (!form) {
    return NextResponse.redirect(new URL("/apply", origin), 302);
  }

  // ── 목적지 결정 ─────────────────────────────────────────────────────────
  // 자체 예약으로 전환한 체험은 사이트 안에서 이어진다. 이 분기가 없으면
  // 인쇄된 QR·포스터·팝업이 전부 구글폼으로 계속 나간다 — 종이는 회수할 수
  // 없으니, 그 링크가 늘 맞는 곳을 가리키게 하는 건 이 라우트의 몫이다.
  let destination: string;
  if (isNative(form)) {
    destination = new URL(`/book/${key}`, origin).toString();
  } else if (!form.is_open || !form.url || !FORM_URL_PATTERN.test(form.url)) {
    // 방어 2선: DB CHECK를 통과했더라도 리다이렉트 직전에 한 번 더 본다.
    // 마감 안내는 계측하지 않는다 — '신청하려 한 클릭'이 아니다.
    return NextResponse.redirect(
      new URL(`/apply?closed=${encodeURIComponent(key)}`, origin),
      302,
    );
  } else {
    destination = form.url;
  }

  // ── 계측 ────────────────────────────────────────────────────────────────
  // 목적지가 구글폼이든 우리 예약 페이지든 '신청하려 눌렀다'는 사실은 같다.
  // 자체 예약으로 옮겨도 퍼널 지표가 끊기지 않게 여기서 계속 기록한다.
  const rawSrc = reqUrl.searchParams.get("src") ?? "unknown";
  const source = SOURCES.has(rawSrc) ? rawSrc : "unknown"; // 임의 문자열 저장 방지

  const ua = userAgent({ headers: req.headers });
  const deviceType = ua.device.type; // desktop이면 undefined
  const device = ua.isBot
    ? "bot"
    : deviceType === "mobile" || deviceType === "tablet"
      ? "mobile"
      : "desktop";

  // 리퍼러는 호스트명만. 경로·쿼리는 버린다(개인정보 최소 수집).
  let refHost: string | null = null;
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      refHost = new URL(referer).hostname;
    } catch {
      refHost = null;
    }
  }

  // 응답을 보낸 뒤에 기록한다 → 사용자가 기다리는 시간 0.
  after(async () => {
    try {
      const svc = createServiceClient();
      if (!svc) return; // SUPABASE_SERVICE_ROLE_KEY 미설정 시 조용히 건너뜀
      await svc
        .from("link_clicks")
        .insert({ link_key: key, source, ref_host: refHost, device });
    } catch {
      // 계측 실패가 사용자 여정을 막지 않는다.
    }
  });

  return NextResponse.redirect(destination, 302);
}
