import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { BOOKING_COLS, type Booking, type BookingStatus } from "@/lib/bookings";
import { SESSION_PUBLIC_COLS, type Session } from "@/lib/sessions";

/**
 * 관리자용 예약 조회.
 *
 * admin은 RLS(is_admin)로도 읽을 수 있지만 service_role을 쓴다 — 이 화면은
 * 상태 변경 RPC(admin_set_booking_status)와 짝인데 그 RPC는 anon·authenticated
 * 실행권한이 회수돼 있어서 어차피 서버에서 service_role로 불러야 한다.
 * 읽기와 쓰기의 경로를 갈라 두면 한쪽만 고쳐지는 일이 생긴다.
 */

export type AdminBookingRow = Booking & {
  session: Session | null;
  formTitle: string;
  /** 신청 후 지난 시간(시). SLA 24시간 초과를 화면에서 강조하는 데 쓴다. */
  hoursWaiting: number;
};

export type BookingBuckets = {
  pending: AdminBookingRow[]; // requested — 손이 필요한 것
  upcoming: AdminBookingRow[]; // confirmed & 아직 안 지남
  past: AdminBookingRow[]; // 지난 회차의 confirmed / no_show / done
  closed: AdminBookingRow[]; // declined / cancelled
  /** 서버 키가 없어 아무것도 못 읽는 상태인가 */
  unavailable: boolean;
};

const EMPTY: BookingBuckets = {
  pending: [],
  upcoming: [],
  past: [],
  closed: [],
  unavailable: true,
};

export async function getAdminBookings(): Promise<BookingBuckets> {
  const supabase = createServiceClient();
  if (!supabase) return EMPTY;

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_COLS)
      .order("created_at", { ascending: false });
    // 테이블이 아직 없으면(0021 미적용) 여기서 에러가 난다. 빈 화면으로 둔다.
    if (error) return { ...EMPTY, unavailable: true };

    const bookings = (data ?? []) as unknown as Booking[];
    if (bookings.length === 0) {
      return { pending: [], upcoming: [], past: [], closed: [], unavailable: false };
    }

    const [{ data: sessionRows }, { data: formRows }] = await Promise.all([
      supabase
        .from("sessions")
        .select(SESSION_PUBLIC_COLS)
        .in("id", [...new Set(bookings.map((b) => b.session_id))]),
      supabase.from("forms").select("key, title"),
    ]);

    const sessions = new Map(
      ((sessionRows ?? []) as unknown as Session[]).map((s) => [s.id, s]),
    );
    const titles = new Map(
      ((formRows ?? []) as { key: string; title: string }[]).map((f) => [
        f.key,
        f.title,
      ]),
    );

    const now = Date.now();
    const rows: AdminBookingRow[] = bookings.map((b) => {
      const session = sessions.get(b.session_id) ?? null;
      return {
        ...b,
        session,
        formTitle: session ? (titles.get(session.form_key) ?? session.form_key) : "",
        hoursWaiting: Math.floor((now - new Date(b.created_at).getTime()) / 3600_000),
      };
    });

    const isPast = (r: AdminBookingRow) =>
      r.session ? new Date(r.session.starts_at).getTime() <= now : false;

    return {
      pending: rows.filter((r) => r.status === "requested"),
      upcoming: rows.filter((r) => r.status === "confirmed" && !isPast(r)),
      past: rows.filter(
        (r) =>
          r.status === "no_show" ||
          r.status === "done" ||
          (r.status === "confirmed" && isPast(r)),
      ),
      closed: rows.filter(
        (r) => r.status === "declined" || r.status === "cancelled",
      ),
      unavailable: false,
    };
  } catch {
    return EMPTY;
  }
}

/** 상태 변경. 카운트 정합을 위해 반드시 RPC를 거친다(ADR-15). */
export async function setBookingStatus(
  id: string,
  status: BookingStatus,
  reason = "",
): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc("admin_set_booking_status", {
      p_id: id,
      p_status: status,
      p_reason: reason,
    });
    if (error) {
      console.error("[admin] set status failed:", error.message);
      return false;
    }
    return data === true;
  } catch (e) {
    console.error("[admin] set status threw:", e instanceof Error ? e.message : e);
    return false;
  }
}

/** 메일 재발송·확정 메일에 쓸 한 건 조회 */
export async function getAdminBooking(id: string): Promise<AdminBookingRow | null> {
  const all = await getAdminBookings();
  return (
    [...all.pending, ...all.upcoming, ...all.past, ...all.closed].find(
      (b) => b.id === id,
    ) ?? null
  );
}

/** 전화 접수분을 넣을 수 있는 회차 — 앞으로 열려 있고 자리가 남은 것 */
export async function getBookableSessions(): Promise<
  (Session & { formTitle: string })[]
> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("sessions")
      .select(SESSION_PUBLIC_COLS)
      .gt("starts_at", new Date().toISOString())
      .eq("is_closed", false)
      .order("starts_at", { ascending: true });
    if (error) return [];

    const sessions = ((data ?? []) as unknown as Session[]).filter(
      (s) => s.capacity > s.booked_count,
    );
    if (sessions.length === 0) return [];

    const { data: forms } = await supabase.from("forms").select("key, title");
    const titles = new Map(
      ((forms ?? []) as { key: string; title: string }[]).map((f) => [f.key, f.title]),
    );

    return sessions.map((s) => ({
      ...s,
      formTitle: titles.get(s.form_key) ?? s.form_key,
    }));
  } catch {
    return [];
  }
}

/**
 * 파기 대상 (F16-4).
 *
 * 방침이 "체험 후 6개월 파기"라고 적혀 있다. 그건 문장이 아니라 운영자의
 * 실제 의무다 — 지킬 수단이 화면에 없으면 안 지켜진다.
 *
 * 자동 삭제(pg_cron)를 안 쓰는 이유: 지운 건 되돌릴 수 없다. 사람이 건수를
 * 보고 누르는 편이 사고 확률이 낮다.
 */
export type PurgeTarget = { count: number; oldest: string | null };

export async function getPurgeTarget(): Promise<PurgeTarget> {
  const supabase = createServiceClient();
  if (!supabase) return { count: 0, oldest: null };

  try {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 6);

    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, starts_at")
      .lt("starts_at", cutoff.toISOString());

    const ids = ((sessions ?? []) as { id: string; starts_at: string }[]).map(
      (s) => s.id,
    );
    if (ids.length === 0) return { count: 0, oldest: null };

    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("session_id", ids);

    const oldest = (sessions ?? [])
      .map((s: { starts_at: string }) => s.starts_at)
      .sort()[0];

    return { count: count ?? 0, oldest: oldest ?? null };
  } catch {
    return { count: 0, oldest: null };
  }
}

/** 파기 실행. 예약을 지우고, 예약이 0건이 된 지난 회차도 함께 정리한다. */
export async function purgeOldBookings(): Promise<{ bookings: number; sessions: number }> {
  const supabase = createServiceClient();
  if (!supabase) return { bookings: 0, sessions: 0 };

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 6);

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id")
    .lt("starts_at", cutoff.toISOString());

  const ids = ((sessions ?? []) as { id: string }[]).map((s) => s.id);
  if (ids.length === 0) return { bookings: 0, sessions: 0 };

  const { data: deleted } = await supabase
    .from("bookings")
    .delete()
    .in("session_id", ids)
    .select("id");

  // 예약이 사라진 지난 회차는 남겨 둘 이유가 없다.
  // FK restrict가 있으니 예약이 남아 있으면 여기서 조용히 실패한다 — 그게 맞다.
  const { data: deletedSessions } = await supabase
    .from("sessions")
    .delete()
    .in("id", ids)
    .select("id");

  return {
    bookings: (deleted ?? []).length,
    sessions: (deletedSessions ?? []).length,
  };
}
