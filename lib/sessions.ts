/**
 * 회차(슬롯). 서버·클라이언트 공용 순수 로직만 둔다.
 * DB 조회는 lib/sessions.server.ts.
 *
 * 상태를 저장하지 않는 이유 — open/full/closed를 컬럼으로 두면 예약이 들어오고
 * 나갈 때마다 갱신해야 하고, 한 번이라도 놓치면 화면과 실제가 어긋난 채로
 * 아무도 모르게 굴러간다. 사실(시작 시각·정원·예약 수·수동 마감)만 저장하고
 * 상태는 읽을 때 계산한다. 시간이 지나면 자동으로 '지남'이 되는 것도 공짜다.
 *
 * 참조: docs/PLATFORM.md §11.2·§13.3, F10, ADR-13
 */

export type Session = {
  id: string;
  form_key: string;
  starts_at: string; // ISO
  duration_min: number | null;
  capacity: number;
  booked_count: number;
  is_closed: boolean;
};

export type AdminSession = Session & { note: string };

export const SESSION_PUBLIC_COLS =
  "id, form_key, starts_at, duration_min, capacity, booked_count, is_closed";

export const SESSION_ADMIN_COLS = `${SESSION_PUBLIC_COLS}, note`;

/**
 * 회차의 상태. 위에서부터 먼저 걸리는 것이 이긴다 —
 * 이미 지난 회차는 '마감'이 아니라 '지남'이어야 목록에서 빼기 쉽다.
 */
export type SessionState =
  | "past" // 시작 시각이 지났다
  | "cutoff" // 아직 안 열렸지만 마감 컷오프를 넘겼다
  | "closed" // 정원이 찼거나 운영자가 닫았다
  | "soon-full" // 자리가 얼마 안 남았다
  | "open";

export function remainingSeats(s: Session): number {
  return Math.max(0, s.capacity - s.booked_count);
}

/**
 * @param cutoffHours forms.cutoff_hours — 마감 컷오프의 단일 출처.
 *   같은 값을 request_booking RPC도 읽는다. 두 곳에 숫자를 적어 두면
 *   화면은 열려 있는데 제출이 거부되는 상황이 생긴다.
 */
export function sessionState(s: Session, cutoffHours = 0, now = new Date()): SessionState {
  const starts = new Date(s.starts_at).getTime();
  const t = now.getTime();

  if (starts <= t) return "past";
  if (s.is_closed || remainingSeats(s) <= 0) return "closed";
  if (starts - cutoffHours * 3600_000 <= t) return "cutoff";
  return remainingSeats(s) <= 2 ? "soon-full" : "open";
}

/** 지금 이 회차로 예약을 받을 수 있는가 */
export function isBookable(s: Session, cutoffHours = 0, now = new Date()): boolean {
  const state = sessionState(s, cutoffHours, now);
  return state === "open" || state === "soon-full";
}

/** 목록에 보여줄 회차 — 지난 것은 뺀다(F10-5). 마감된 것은 남긴다(왜 못 고르는지 보여야 한다). */
export function visibleSessions(
  sessions: Session[],
  cutoffHours = 0,
  now = new Date(),
): Session[] {
  return sessions
    .filter((s) => sessionState(s, cutoffHours, now) !== "past")
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

export function openSessionCount(
  sessions: Session[],
  cutoffHours = 0,
  now = new Date(),
): number {
  return sessions.filter((s) => isBookable(s, cutoffHours, now)).length;
}

/** 다음으로 열리는 회차. 카드에 "다음 회차" 한 줄을 띄우는 용도. */
export function nextOpenSession(
  sessions: Session[],
  cutoffHours = 0,
  now = new Date(),
): Session | null {
  return (
    visibleSessions(sessions, cutoffHours, now).find((s) =>
      isBookable(s, cutoffHours, now),
    ) ?? null
  );
}

// ── 표시 ────────────────────────────────────────────────────────────────────

const KST = "Asia/Seoul";

/**
 * 날짜는 언제나 요일을 같이 적는다. "8월 21일"만 보고 무슨 요일인지 세어 보게
 * 만들면 안 된다(§8.2). 영어는 KST를 명시한다 — 여행 중인 게스트는 자기 폰이
 * 어느 시간대인지도 헷갈린다.
 */
export function formatSessionDate(iso: string, locale: "ko" | "en"): string {
  const d = new Date(iso);
  return locale === "en"
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: KST,
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(d)
    : new Intl.DateTimeFormat("ko-KR", {
        timeZone: KST,
        month: "long",
        day: "numeric",
        weekday: "short",
      }).format(d);
}

export function formatSessionTime(iso: string, locale: "ko" | "en"): string {
  const d = new Date(iso);
  const time = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ko-KR", {
    timeZone: KST,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return locale === "en" ? `${time} (KST)` : time;
}

export function formatSessionWhen(iso: string, locale: "ko" | "en"): string {
  return `${formatSessionDate(iso, locale)} · ${formatSessionTime(iso, locale)}`;
}

/** "3.5시간" / "3.5 hours" — 분을 그대로 보여주면 시니어가 암산하게 된다. */
export function formatDuration(min: number | null, locale: "ko" | "en"): string {
  if (!min || min <= 0) return "";
  const h = min / 60;
  const n = Number.isInteger(h) ? String(h) : h.toFixed(1);
  return locale === "en" ? `${n} hours` : `${n}시간`;
}

export function formatPrice(krw: number | null, locale: "ko" | "en"): string {
  if (krw == null) return "";
  if (krw === 0) return locale === "en" ? "Free" : "무료";
  const n = new Intl.NumberFormat(locale === "en" ? "en-US" : "ko-KR").format(krw);
  return locale === "en" ? `KRW ${n}` : `${n}원`;
}
