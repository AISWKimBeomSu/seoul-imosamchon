import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { BOOKING_COLS, type Booking } from "@/lib/bookings";
import { SESSION_PUBLIC_COLS, type Session } from "@/lib/sessions";

/**
 * 예약 조회는 전부 서버에서, service_role로 한다.
 * bookings에는 공개 RLS 정책이 아예 없어서(0021) anon 클라이언트로는 한 줄도
 * 읽히지 않는다. 게스트 본인 조회도 서버가 토큰으로 대신 읽어 준다.
 */

export type BookingWithSession = Booking & {
  session: Session | null;
  /**
   * 조회 시점에 이미 시작한 회차인가.
   *
   * 렌더 중에 Date.now()를 부르면 같은 입력이 렌더마다 다른 결과를 내므로
   * (react-hooks/purity) 시각 판단은 데이터를 읽는 이 자리에서 끝낸다.
   */
  hasStarted: boolean;
};

/** 토큰으로 예약 한 건. 없으면 null — 토큰의 존재 여부를 밖으로 흘리지 않는다. */
export async function getBookingByToken(
  token: string,
): Promise<BookingWithSession | null> {
  if (!token || token.length < 20) return null;

  const supabase = createServiceClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_COLS)
      .eq("cancel_token", token)
      .maybeSingle();
    if (error || !data) return null;

    const booking = data as unknown as Booking;

    const { data: s } = await supabase
      .from("sessions")
      .select(SESSION_PUBLIC_COLS)
      .eq("id", booking.session_id)
      .maybeSingle();

    const session = (s as unknown as Session) ?? null;
    const hasStarted = session
      ? new Date(session.starts_at).getTime() <= Date.now()
      : false;

    return { ...booking, session, hasStarted };
  } catch {
    return null;
  }
}

/** 게스트 취소. 성공 여부만 돌려준다 — 실패 사유는 화면에서 한 가지로 안내한다. */
export async function cancelBookingByToken(token: string): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc("cancel_booking", { p_token: token });
    if (error) {
      // 토큰 전문은 남기지 않는다.
      console.error("[booking] cancel failed:", error.message);
      return false;
    }
    return data === true;
  } catch (e) {
    console.error("[booking] cancel threw:", e instanceof Error ? e.message : e);
    return false;
  }
}
