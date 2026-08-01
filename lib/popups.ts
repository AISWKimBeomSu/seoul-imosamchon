import { createClient } from "@/lib/supabase/server";

export type PopupLinkKey = "senior" | "guest" | "notice" | "none";
export type PopupScope = "home" | "all";

export type Popup = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  link_key: PopupLinkKey;
  notice_id: string | null;
  cta_label: string;
  show_qr: boolean;
  scope: PopupScope;
  starts_at: string;
  ends_at: string | null;
  sort: number;
  is_published: boolean;
};

const COLS =
  "id, title, subtitle, body, link_key, notice_id, cta_label, show_qr, scope, starts_at, ends_at, sort, is_published";

/**
 * 지금 노출되어야 할 팝업 1건.
 *
 * 기간(starts_at ~ ends_at)으로 거른다 — 운영자가 "지우기"를 잊어도
 * 마감된 모집의 팝업이 계속 뜨는 사고가 나지 않는다(PLAN.md P4/G2).
 */
export async function getActivePopup(
  page: "home" | "other",
  opts?: { preview?: boolean },
): Promise<Popup | null> {
  const nowIso = new Date().toISOString();
  const scopes = page === "home" ? ["home", "all"] : ["all"];

  try {
    const supabase = await createClient();
    let q = supabase.from("popups").select(COLS).in("scope", scopes);

    // 미리보기에서는 게시 여부와 기간을 무시한다.
    // "아직 시작 안 한 팝업이 어떻게 보이는지"를 확인하는 게 목적이기 때문이다.
    if (!opts?.preview) {
      q = q
        .eq("is_published", true)
        .lte("starts_at", nowIso)
        .or(`ends_at.is.null,ends_at.gt.${nowIso}`);
    }

    const { data } = await q
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(1);

    return (data?.[0] as Popup | undefined) ?? null;
  } catch {
    // 팝업 조회 실패가 페이지를 죽여서는 안 된다
    return null;
  }
}

/** 관리자 목록용 상태 라벨 */
export function popupStatus(p: Popup): {
  label: string;
  cls: "live" | "soon" | "done" | "draft";
} {
  if (!p.is_published) return { label: "임시저장", cls: "draft" };
  const now = Date.now();
  if (new Date(p.starts_at).getTime() > now) return { label: "예정", cls: "soon" };
  if (p.ends_at && new Date(p.ends_at).getTime() <= now)
    return { label: "종료", cls: "done" };
  return { label: "노출 중", cls: "live" };
}
