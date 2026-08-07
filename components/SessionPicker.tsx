import Link from "next/link";
import {
  formatSessionDate,
  formatSessionTime,
  remainingSeats,
  sessionState,
  visibleSessions,
  type Session,
} from "@/lib/sessions";

/**
 * 회차 고르기.
 *
 * 달력 격자를 쓰지 않는다. 7열을 52px 터치 타깃으로 그리면 360px 화면을
 * 넘어가고, 무엇보다 한 달에 두세 번 여는 체험에서 달력은 빈칸을 29개
 * 보여주는 UI다. 열리는 날짜만 세로로 쌓으면 훑기도 쉽고 누르기도 쉽다.
 *
 * 마감된 회차를 목록에서 지우지 않는 이유 — 사라지면 "내가 잘못 봤나" 싶다.
 * 남겨 두고 왜 못 고르는지 적어 준다.
 *
 * 참조: docs/PLATFORM.md §8.2·§13.1, F10-4
 */
export default function SessionPicker({
  formKey,
  sessions,
  cutoffHours,
  locale,
  selectedId,
}: {
  formKey: string;
  sessions: Session[];
  cutoffHours: number;
  locale: "ko" | "en";
  selectedId?: string;
}) {
  const en = locale === "en";
  const list = visibleSessions(sessions, cutoffHours);

  if (list.length === 0) {
    return (
      <p className="rounded-[22px] border border-line bg-soft px-6 py-5 text-sub">
        {en
          ? "No dates are open at the moment. Please check back soon."
          : "지금은 열린 회차가 없습니다. 곧 다시 열립니다."}
      </p>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {list.map((s) => {
        const state = sessionState(s, cutoffHours);
        const left = remainingSeats(s);
        const bookable = state === "open" || state === "soon-full";
        const selected = s.id === selectedId;

        // 스크린리더가 읽는 순서: 날짜 → 시간 → 남은 자리.
        // 화면에서 눈이 훑는 순서와 같게 맞춘다.
        const when = `${formatSessionDate(s.starts_at, locale)} ${formatSessionTime(s.starts_at, locale)}`;
        const seats = bookable
          ? left <= 2
            ? en
              ? `${left} places left`
              : `${left}자리 남음`
            : en
              ? "Places available"
              : "예약 가능"
          : en
            ? "Closed"
            : "마감";

        const inner = (
          <>
            <span className="block text-[1.05rem] font-bold">{when}</span>
            <span
              className={`mt-1 block ${
                bookable && left <= 2 ? "font-bold text-point-dark" : "text-sub"
              }`}
            >
              {seats}
            </span>
          </>
        );

        const base =
          "flex min-h-[52px] w-full flex-col justify-center rounded-[18px] border px-5 py-4 text-left transition-colors";

        return (
          <li key={s.id}>
            {bookable ? (
              <Link
                href={`/book/${formKey}?s=${s.id}`}
                aria-label={`${when} · ${seats}`}
                aria-current={selected ? "true" : undefined}
                className={`${base} ${
                  selected
                    ? "border-point bg-point-soft"
                    : "border-line bg-white hover:border-point hover:bg-soft"
                }`}
              >
                {inner}
              </Link>
            ) : (
              // 마감 카드는 DOM에 남기되 조작 대상에서 뺀다.
              <div
                aria-disabled="true"
                className={`${base} border-line bg-soft opacity-70`}
              >
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
