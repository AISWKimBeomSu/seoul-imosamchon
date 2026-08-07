import "server-only";

import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/supabase/server";

/**
 * 관리자 페이지·서버 액션의 첫 줄.
 *
 * app/admin/layout.tsx로 한 번에 막지 않는 이유 — /admin/login이 같은 경로
 * 아래에 있어서, 레이아웃에서 막으면 로그인 페이지가 자기 자신으로 리다이렉트
 * 되는 고리가 생긴다. 그래서 페이지마다 부르되, 두 줄을 복사하는 대신 이
 * 헬퍼 하나를 부르게 했다 — 빠뜨리기 어렵게.
 *
 * 예약 화면은 개인정보를 보여주므로 한 페이지라도 빠지면 그대로 노출이다.
 */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/**
 * 서버 액션용. 리다이렉트 대신 false를 돌려준다 —
 * 액션은 화면 전환이 아니라 결과를 반환해야 하는 자리다.
 */
export async function isAdminRequest(): Promise<boolean> {
  return Boolean(await getAdmin());
}
