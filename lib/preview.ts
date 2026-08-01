import "server-only";

import { getAdmin } from "@/lib/supabase/server";

/**
 * 관리자 미리보기 모드.
 *
 * 배경: 로컬 개발도 운영 Supabase를 함께 쓴다. 그래서 "공개 전에 어떻게 보이는지"를
 * 확인하려면 실제로 게시해야 했다. 인물은 더 심각한데, 동의 기록이 없으면 DB가
 * 게시를 막으므로 아예 확인할 방법이 없다(동의를 임의로 채우는 건 있을 수 없다).
 *
 * ?preview=1 + 관리자 로그인 세션이 둘 다 있을 때만 비공개 항목을 함께 보여준다.
 * 쿼리 파라미터만으로는 아무 일도 일어나지 않는다 — 세션이 없으면 그냥 무시된다.
 */
export async function isPreviewMode(preview?: string): Promise<boolean> {
  if (preview !== "1") return false;
  const admin = await getAdmin();
  return Boolean(admin);
}
