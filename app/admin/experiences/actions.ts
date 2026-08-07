"use server";

import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-guard.server";
import { createServiceClient } from "@/lib/supabase/service";
import { deleteSession } from "@/lib/admin-experiences.server";
import { FORM_KEY_PATTERN, FORM_URL_PATTERN } from "@/lib/forms";

export type AdminState = { ok: boolean; message: string };
export const ADMIN_INIT: AdminState = { ok: false, message: "" };

const DENIED: AdminState = { ok: false, message: "권한이 없습니다." };

function fail(message: string): AdminState {
  return { ok: false, message };
}

/** 체험 생성. 지금까지 SQL로만 가능했던 것(부채 D9) */
export async function createExperience(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await isAdminRequest())) return DENIED;

  const key = String(formData.get("key") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const audience = String(formData.get("audience") ?? "guest");

  if (!FORM_KEY_PATTERN.test(key)) {
    return fail(
      "키는 영문 소문자로 시작하고 소문자·숫자·하이픈만 쓸 수 있습니다 (예: pottery, tea-class).",
    );
  }
  if (!title) return fail("제목을 입력해 주세요.");

  const supabase = createServiceClient();
  if (!supabase) return fail("서버 키가 설정되지 않았습니다.");

  const { error } = await supabase.from("forms").insert({
    key,
    title,
    audience,
    // 새 체험은 비공개로 시작한다 — 내용을 채우기도 전에 목록에 뜨면 안 된다.
    is_published: false,
    is_open: false,
    booking_mode: "external",
  });

  if (error) {
    return fail(
      error.code === "23505"
        ? `'${key}' 키는 이미 쓰이고 있습니다.`
        : "체험을 만들지 못했습니다.",
    );
  }

  revalidatePath("/admin/experiences");
  return { ok: true, message: `'${title}'을(를) 만들었습니다. 이어서 내용을 채워 주세요.` };
}

/** 체험 내용 수정 */
export async function updateExperience(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await isAdminRequest())) return DENIED;

  const key = String(formData.get("key") ?? "");
  if (!key) return fail("잘못된 요청입니다.");

  const num = (name: string): number | null => {
    const raw = String(formData.get(name) ?? "").trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  const lines = (name: string): string[] =>
    String(formData.get(name) ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  const url = String(formData.get("url") ?? "").trim();
  const bookingMode = String(formData.get("booking_mode") ?? "external");

  // 구글폼 방식인데 주소가 형식에 안 맞으면 DB CHECK가 거부한다.
  // 거기까지 가기 전에 사람이 읽을 문장으로 막는다.
  if (bookingMode === "external" && url && !FORM_URL_PATTERN.test(url)) {
    return fail("구글폼 주소만 넣을 수 있습니다 (docs.google.com/forms/… 또는 forms.gle/…).");
  }

  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    detail: String(formData.get("detail") ?? ""),
    title_en: String(formData.get("title_en") ?? "").trim(),
    subtitle_en: String(formData.get("subtitle_en") ?? "").trim(),
    description_en: String(formData.get("description_en") ?? "").trim(),
    detail_en: String(formData.get("detail_en") ?? ""),
    cta_label: String(formData.get("cta_label") ?? "").trim() || "신청하기",
    closed_note: String(formData.get("closed_note") ?? "").trim(),
    url: url || null,
    booking_mode: bookingMode,
    is_open: formData.get("is_open") === "on",
    is_published: formData.get("is_published") === "on",
    accent: String(formData.get("accent") ?? "green"),
    sort: num("sort") ?? 0,
    duration_min: num("duration_min"),
    price_krw: num("price_krw"),
    max_guests: num("max_guests"),
    cutoff_hours: num("cutoff_hours") ?? 0,
    language: String(formData.get("language") ?? "ko"),
    meet_place: String(formData.get("meet_place") ?? "").trim(),
    meet_place_en: String(formData.get("meet_place_en") ?? "").trim(),
    includes: lines("includes"),
    includes_en: lines("includes_en"),
  };

  const supabase = createServiceClient();
  if (!supabase) return fail("서버 키가 설정되지 않았습니다.");

  // 자체 예약으로 켜는데 열린 회차가 없으면, 손님이 상세에 와도 고를 게 없다.
  if (payload.booking_mode === "native" && payload.is_published) {
    const { count } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("form_key", key)
      .gt("starts_at", new Date().toISOString());
    if ((count ?? 0) === 0) {
      return fail(
        "자체 예약으로 게시하려면 앞으로의 회차가 최소 1개 있어야 합니다. 회차를 먼저 추가해 주세요.",
      );
    }
  }

  const { error } = await supabase.from("forms").update(payload).eq("key", key);
  if (error) return fail(`저장하지 못했습니다. ${error.message}`);

  revalidatePath("/admin/experiences");
  revalidatePath(`/about/${key}`);
  revalidatePath("/apply");
  revalidatePath("/");
  return { ok: true, message: "저장했습니다." };
}

/** 회차 추가 */
export async function createSession(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await isAdminRequest())) return DENIED;

  const formKey = String(formData.get("form_key") ?? "");
  // datetime-local은 타임존이 없는 문자열을 준다. 운영자는 한국에서 입력하므로
  // KST로 해석해야 한다 — 서버가 UTC면 9시간 밀린다.
  const local = String(formData.get("starts_at") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 0);
  const note = String(formData.get("note") ?? "").trim();

  if (!formKey || !local) return fail("일시를 입력해 주세요.");
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) {
    return fail("정원은 1~50명 사이로 입력해 주세요.");
  }

  const startsAt = new Date(`${local}:00+09:00`);
  if (Number.isNaN(startsAt.getTime())) return fail("일시 형식이 올바르지 않습니다.");
  if (startsAt.getTime() <= Date.now()) {
    return fail("이미 지난 시각입니다. 앞으로의 날짜를 골라 주세요.");
  }

  const supabase = createServiceClient();
  if (!supabase) return fail("서버 키가 설정되지 않았습니다.");

  const { error } = await supabase.from("sessions").insert({
    form_key: formKey,
    starts_at: startsAt.toISOString(),
    capacity,
    note,
  });
  if (error) return fail(`회차를 추가하지 못했습니다. ${error.message}`);

  revalidatePath("/admin/experiences");
  revalidatePath(`/about/${formKey}`);
  return { ok: true, message: "회차를 추가했습니다." };
}

/** 회차 마감 토글 · 정원 수정 · 삭제 */
export async function updateSession(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await isAdminRequest())) return DENIED;

  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!id) return fail("잘못된 요청입니다.");

  if (action === "delete") {
    const err = await deleteSession(id);
    if (err) return fail(err);
    revalidatePath("/admin/experiences");
    return { ok: true, message: "회차를 삭제했습니다." };
  }

  const supabase = createServiceClient();
  if (!supabase) return fail("서버 키가 설정되지 않았습니다.");

  if (action === "toggle-closed") {
    const closed = formData.get("is_closed") === "true";
    const { error } = await supabase
      .from("sessions")
      .update({ is_closed: !closed })
      .eq("id", id);
    if (error) return fail("상태를 바꾸지 못했습니다.");
    revalidatePath("/admin/experiences");
    return { ok: true, message: closed ? "다시 열었습니다." : "마감했습니다." };
  }

  if (action === "capacity") {
    const capacity = Number(formData.get("capacity") ?? 0);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) {
      return fail("정원은 1~50명 사이로 입력해 주세요.");
    }
    // 이미 찬 인원보다 적게 줄이면 DB의 booked_count <= capacity CHECK가 막는다.
    const { error } = await supabase
      .from("sessions")
      .update({ capacity })
      .eq("id", id);
    if (error) {
      return fail("이미 예약된 인원보다 적게 줄일 수는 없습니다.");
    }
    revalidatePath("/admin/experiences");
    return { ok: true, message: "정원을 바꿨습니다." };
  }

  return fail("알 수 없는 동작입니다.");
}

/** 체험에 호스트 연결 */
export async function setHosts(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await isAdminRequest())) return DENIED;

  const formKey = String(formData.get("form_key") ?? "");
  if (!formKey) return fail("잘못된 요청입니다.");
  const ids = formData.getAll("host").map(String).filter(Boolean);

  const supabase = createServiceClient();
  if (!supabase) return fail("서버 키가 설정되지 않았습니다.");

  await supabase.from("form_hosts").delete().eq("form_key", formKey);
  if (ids.length > 0) {
    const { error } = await supabase
      .from("form_hosts")
      .insert(ids.map((person_id, i) => ({ form_key: formKey, person_id, sort: (i + 1) * 10 })));
    if (error) return fail("호스트를 저장하지 못했습니다.");
  }

  revalidatePath("/admin/experiences");
  revalidatePath(`/about/${formKey}`);
  return { ok: true, message: "호스트를 저장했습니다." };
}
