import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { SESSION_PUBLIC_COLS, type Session } from "@/lib/sessions";

/**
 * 회차 조회.
 *
 * 조회 실패를 빈 배열로 삼키는 것은 lib/forms.server.ts와 같은 관행이다.
 * 여기서는 이유가 하나 더 있다 — 0019 마이그레이션을 적용하기 전에는
 * sessions 테이블 자체가 없다. 그때도 사이트는 구글폼 체제로 멀쩡히 돌아야 하고,
 * 회차 영역만 조용히 비어 있으면 된다.
 */
export const getAllSessions = cache(async (): Promise<Session[]> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .select(SESSION_PUBLIC_COLS)
      .order("starts_at", { ascending: true });
    if (error) return [];
    return (data ?? []) as Session[];
  } catch {
    return [];
  }
});

export async function getSessionsFor(formKey: string): Promise<Session[]> {
  const all = await getAllSessions();
  return all.filter((s) => s.form_key === formKey);
}

export async function getSession(id: string): Promise<Session | null> {
  const all = await getAllSessions();
  return all.find((s) => s.id === id) ?? null;
}

/** 체험 키 → 회차 목록. 카드·홈이 한 번에 쓰려고 미리 묶는다. */
export async function getSessionsByForm(): Promise<Map<string, Session[]>> {
  const all = await getAllSessions();
  const map = new Map<string, Session[]>();
  for (const s of all) {
    const list = map.get(s.form_key);
    if (list) list.push(s);
    else map.set(s.form_key, [s]);
  }
  return map;
}
