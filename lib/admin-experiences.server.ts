import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { FORM_ADMIN_COLS, type AdminForm } from "@/lib/forms";
import {
  SESSION_ADMIN_COLS,
  type AdminSession,
  openSessionCount,
} from "@/lib/sessions";

/**
 * 관리자용 체험·회차 조회.
 *
 * 읽기는 anon+RLS(is_admin)로 충분하다 — 민감정보가 없고 기존 admin 화면과
 * 같은 방식이다. 쓰기 중 회차 삭제만 service_role을 쓰는데, 예약이 걸린
 * 회차를 지우려다 FK에 막히는 걸 서버에서 판별해 사람이 읽을 문장으로
 * 돌려주기 위해서다.
 *
 * ⚠ 신규 컬럼(duration_min·booking_mode 등)을 여기서 select 한다.
 *   0018 마이그레이션이 적용된 뒤에만 동작한다 — 실패하면 빈 목록으로 떨어져
 *   화면에 "마이그레이션이 아직" 안내가 뜬다.
 */

const EXPERIENCE_COLS = `${FORM_ADMIN_COLS}, duration_min, price_krw, max_guests, language, meet_place, meet_place_en, includes, includes_en, booking_mode, cutoff_hours`;

export type ExperienceRow = AdminForm & {
  sessions: AdminSession[];
  openCount: number;
};

export type ExperienceList = {
  rows: ExperienceRow[];
  /** 0018/0019가 아직 적용되지 않아 읽을 수 없는 상태 */
  unavailable: boolean;
};

export async function getAdminExperiences(): Promise<ExperienceList> {
  try {
    const supabase = await createClient();

    const { data: forms, error } = await supabase
      .from("forms")
      .select(EXPERIENCE_COLS)
      .order("sort", { ascending: true });
    if (error) return { rows: [], unavailable: true };

    const { data: sessions } = await supabase
      .from("sessions")
      .select(SESSION_ADMIN_COLS)
      .order("starts_at", { ascending: true });

    const byForm = new Map<string, AdminSession[]>();
    for (const s of (sessions ?? []) as unknown as AdminSession[]) {
      const list = byForm.get(s.form_key);
      if (list) list.push(s);
      else byForm.set(s.form_key, [s]);
    }

    const rows = ((forms ?? []) as unknown as AdminForm[]).map((f) => {
      const list = byForm.get(f.key) ?? [];
      return {
        ...f,
        sessions: list,
        openCount: openSessionCount(list, f.cutoff_hours ?? 0),
      };
    });

    return { rows, unavailable: false };
  } catch {
    return { rows: [], unavailable: true };
  }
}

export async function getAdminExperience(
  key: string,
): Promise<ExperienceRow | null> {
  const { rows } = await getAdminExperiences();
  return rows.find((r) => r.key === key) ?? null;
}

/**
 * 회차 삭제. 예약이 한 건이라도 걸려 있으면 DB가 막는다(on delete restrict).
 * 그걸 그대로 흘리면 관리자에게 Postgres 에러 코드가 보이므로 여기서 번역한다.
 */
export async function deleteSession(id: string): Promise<string | null> {
  const supabase = createServiceClient();
  if (!supabase) return "서버 키가 설정되지 않아 삭제할 수 없습니다.";

  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("session_id", id);

  if ((count ?? 0) > 0) {
    return `이 회차에는 예약이 ${count}건 있습니다. 예약을 먼저 취소하거나, 삭제 대신 '마감'으로 닫아 주세요.`;
  }

  const { error } = await supabase.from("sessions").delete().eq("id", id);
  return error ? "회차를 삭제하지 못했습니다." : null;
}
