import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  PERSON_ADMIN_COLS,
  PERSON_PUBLIC_COLS,
  type AdminPerson,
  type Person,
  type PersonKind,
} from "@/lib/people";

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

/**
 * 관리자 화면용. 공개 여부·동의 기록까지 읽는다.
 *
 * getPeople과 나눈 이유 — 공개 페이지가 쓰는 조회에 동의 메모 같은 걸
 * 섞으면, 언젠가 그게 화면으로 새어 나간다. 필요한 쪽만 넓게 읽는다.
 */
export async function getAdminPeople(kind?: PersonKind): Promise<AdminPerson[]> {
  try {
    const supabase = await createClient();
    let q = supabase
      .from("people")
      .select(PERSON_ADMIN_COLS)
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true });
    if (kind) q = q.eq("kind", kind);

    const { data } = await q;
    return (data ?? []) as AdminPerson[];
  } catch {
    return [];
  }
}
