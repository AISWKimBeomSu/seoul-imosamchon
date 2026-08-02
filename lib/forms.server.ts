import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  FORM_PUBLIC_COLS,
  type ApplyForm,
  type FormAudience,
} from "@/lib/forms";

/**
 * 게시된 폼 전체. 요청 단위로 메모이즈하므로 헤더·본문·팝업이 각각 불러도
 * Supabase 왕복은 1회다.
 */
export const getForms = cache(async (): Promise<ApplyForm[]> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("forms")
      .select(FORM_PUBLIC_COLS)
      .eq("is_published", true)
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true });
    return (data ?? []) as ApplyForm[];
  } catch {
    // 폼 조회 실패가 페이지를 죽여서는 안 된다
    return [];
  }
});

export async function getForm(key: string): Promise<ApplyForm | null> {
  const forms = await getForms();
  return forms.find((f) => f.key === key) ?? null;
}

export async function getFormsFor(
  audience: FormAudience,
): Promise<ApplyForm[]> {
  const forms = await getForms();
  return forms.filter((f) => f.audience === audience);
}
