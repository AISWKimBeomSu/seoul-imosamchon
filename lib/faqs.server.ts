import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { FAQ_ADMIN_COLS, FAQ_PUBLIC_COLS, type AdminFaq, type Faq } from "@/lib/faqs";

/**
 * 조회 실패를 빈 배열로 삼키는 건 forms·people과 같은 관행이다.
 * FAQ가 안 뜨는 것보다 페이지 전체가 죽는 게 훨씬 나쁘다.
 */
export const getFaqs = cache(async (): Promise<Faq[]> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("faqs")
      .select(FAQ_PUBLIC_COLS)
      .eq("is_published", true)
      .order("sort", { ascending: true });
    if (error) return [];
    return (data ?? []) as Faq[];
  } catch {
    return [];
  }
});

/** 관리자용 — 비공개 문항까지 */
export async function getAdminFaqs(): Promise<AdminFaq[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("faqs")
      .select(FAQ_ADMIN_COLS)
      .order("audience", { ascending: true })
      .order("sort", { ascending: true });
    if (error) return [];
    return (data ?? []) as AdminFaq[];
  } catch {
    return [];
  }
}
