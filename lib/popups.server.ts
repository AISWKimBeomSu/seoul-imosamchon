import "server-only";

import { createClient } from "@/lib/supabase/server";
import { POPUP_COLS, type Popup } from "@/lib/popups";

/**
 * 지금 노출되어야 할 팝업 전부 (여러 개 가능).
 *
 * 기간(starts_at ~ ends_at)으로 거른다 — 운영자가 "지우기"를 잊어도
 * 마감된 모집의 팝업이 계속 뜨는 사고가 나지 않는다.
 *
 * 여러 건이어도 모달은 하나다. 창을 여러 개 띄우는 건 시니어 대상 사이트에서
 * 최악이라, 한 다이얼로그 안에 카드로 나란히 보여준다.
 */
export async function getActivePopups(
  page: "home" | "other",
  opts?: { preview?: boolean },
): Promise<Popup[]> {
  const nowIso = new Date().toISOString();
  const scopes = page === "home" ? ["home", "all"] : ["all"];

  try {
    const supabase = await createClient();
    let q = supabase.from("popups").select(POPUP_COLS).in("scope", scopes);

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
      .limit(4); // 4장을 넘기면 모달이 아니라 페이지가 되어야 한다

    return (data ?? []) as Popup[];
  } catch {
    // 팝업 조회 실패가 페이지를 죽여서는 안 된다
    return [];
  }
}
