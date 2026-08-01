import { NextResponse, after, userAgent } from "next/server";
import { getSiteConfig, formState, FORM_URL_PATTERN } from "@/lib/config";
import { createServiceClient } from "@/lib/supabase/service";
import { LINK_KEYS, LINK_SOURCES, type LinkKey } from "@/lib/links";

// 리다이렉트가 캐시되면 '마감' 처리가 먹지 않는다.
export const dynamic = "force-dynamic";

const KEYS = new Set<string>(LINK_KEYS);
const SOURCES = new Set<string>(LINK_SOURCES);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const reqUrl = new URL(req.url);
  const origin = reqUrl.origin;

  // ★ 이동 대상은 '키'로만 지정된다. URL을 쿼리로 받지 않으므로
  //   오픈 리다이렉트가 구조적으로 불가능하다(PLAN.md P3 / §18.1).
  if (!KEYS.has(key)) {
    return NextResponse.redirect(new URL("/apply", origin), 302);
  }
  const linkKey = key as LinkKey;

  const cfg = await getSiteConfig();
  const { url: target, available } = formState(cfg, linkKey);

  // 방어 3선: DB CHECK를 통과했더라도 리다이렉트 직전에 한 번 더 본다.
  if (!available || !target || !FORM_URL_PATTERN.test(target)) {
    const to = linkKey === "senior" ? "/apply?closed=1" : "/guest?closed=1";
    return NextResponse.redirect(new URL(to, origin), 302);
  }

  // ── 계측 ────────────────────────────────────────────────────────────────
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
        .insert({ link_key: linkKey, source, ref_host: refHost, device });
    } catch {
      // 계측 실패가 사용자 여정을 막지 않는다.
    }
  });

  return NextResponse.redirect(target, 302);
}
