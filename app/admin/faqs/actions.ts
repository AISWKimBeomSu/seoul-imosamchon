"use server";

import { revalidatePath } from "next/cache";
import { type ActionState } from "@/lib/action-state";

import { isAdminRequest } from "@/lib/admin-guard.server";
import { createServiceClient } from "@/lib/supabase/service";


const DENIED: ActionState = { ok: false, message: "권한이 없습니다." };

function payload(formData: FormData) {
  return {
    question: String(formData.get("question") ?? "").trim(),
    answer: String(formData.get("answer") ?? "").trim(),
    question_en: String(formData.get("question_en") ?? "").trim(),
    answer_en: String(formData.get("answer_en") ?? "").trim(),
    audience: String(formData.get("audience") ?? "senior"),
    sort: Number(formData.get("sort") ?? 100) || 100,
    is_published: formData.get("is_published") === "on",
  };
}

/** 문항 추가 */
export async function createFaq(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await isAdminRequest())) return DENIED;

  const d = payload(formData);
  if (!d.question) return { ok: false, message: "질문을 입력해 주세요." };
  if (!d.answer) return { ok: false, message: "답변을 입력해 주세요." };

  const supabase = createServiceClient();
  if (!supabase) return { ok: false, message: "서버 키가 설정되지 않았습니다." };

  const { error } = await supabase.from("faqs").insert(d);
  if (error) return { ok: false, message: "저장하지 못했습니다." };

  revalidatePath("/admin/faqs");
  revalidatePath("/faq");
  return { ok: true, message: "문항을 추가했습니다." };
}

/** 문항 수정 · 삭제 */
export async function updateFaq(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await isAdminRequest())) return DENIED;

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "잘못된 요청입니다." };

  const supabase = createServiceClient();
  if (!supabase) return { ok: false, message: "서버 키가 설정되지 않았습니다." };

  if (String(formData.get("action") ?? "") === "delete") {
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) return { ok: false, message: "삭제하지 못했습니다." };
    revalidatePath("/admin/faqs");
    revalidatePath("/faq");
    return { ok: true, message: "문항을 삭제했습니다." };
  }

  const d = payload(formData);
  if (!d.question) return { ok: false, message: "질문을 입력해 주세요." };
  if (!d.answer) return { ok: false, message: "답변을 입력해 주세요." };

  const { error } = await supabase.from("faqs").update(d).eq("id", id);
  if (error) return { ok: false, message: "저장하지 못했습니다." };

  revalidatePath("/admin/faqs");
  revalidatePath("/faq");
  return { ok: true, message: "저장했습니다." };
}
