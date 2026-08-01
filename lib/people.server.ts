import "server-only";

import { createClient } from "@/lib/supabase/server";
import { PERSON_PUBLIC_COLS, type Person, type PersonKind } from "@/lib/people";

export async function getPeople(kind?: PersonKind): Promise<Person[]> {
  try {
    const supabase = await createClient();
    let q = supabase
      .from("people")
      .select(PERSON_PUBLIC_COLS)
      .eq("is_published", true)
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true });
    if (kind) q = q.eq("kind", kind);

    const { data } = await q;
    return (data ?? []) as Person[];
  } catch {
    // 인물 조회 실패가 페이지를 죽여서는 안 된다
    return [];
  }
}
