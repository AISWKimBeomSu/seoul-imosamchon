import "server-only";

import { createClient } from "@/lib/supabase/server";
import { PERSON_PUBLIC_COLS, type Person, type PersonKind } from "@/lib/people";

export async function getPeople(
  kind?: PersonKind,
  opts?: { includeUnpublished?: boolean },
): Promise<Person[]> {
  try {
    const supabase = await createClient();
    let q = supabase
      .from("people")
      .select(PERSON_PUBLIC_COLS)
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true });
    // 비공개 포함은 관리자 미리보기에서만 호출된다(lib/preview.ts).
    // RLS도 is_published or is_admin() 이라 세션이 없으면 애초에 안 온다.
    if (!opts?.includeUnpublished) q = q.eq("is_published", true);
    if (kind) q = q.eq("kind", kind);

    const { data } = await q;
    return (data ?? []) as Person[];
  } catch {
    // 인물 조회 실패가 페이지를 죽여서는 안 된다
    return [];
  }
}
