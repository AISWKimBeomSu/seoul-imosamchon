import Link from "next/link";
import Image from "next/image";
import {
  isBookableForm,
  isNative,
  posterUrl,
  showsSeatCount,
  type ApplyForm,
} from "@/lib/forms";
import {
  formatDuration,
  formatPrice,
  formatSessionWhen,
  nextOpenSession,
  openSessionCount,
  remainingSeats,
  type Session,
} from "@/lib/sessions";
import { pick, type Locale } from "@/lib/i18n";

/**
 * 체험 카드.
 *
 * 에어비앤비 카드에서 가져온 것: 사진 · 제목 · 소요시간 · 가격 · 잔여 배지.
 * 안 가져온 것: 위시리스트 하트(계정이 없다), 평점(리뷰가 아직 없다).
 * 없는 걸 자리만 잡아 두면 "비어 있는 서비스"로 읽힌다.
 *
 * ⚠ 잔여석은 자체 예약 체험에만 보여준다. 구글폼으로 받는 체험은 접수분이
 *   booked_count에 안 잡혀서 '3자리 남음'이 사실이 아니게 된다(§13.2).
 *
 * 서버 컴포넌트다 — 카드가 목록에 여러 장 깔리는데 클라이언트 JS를 붙일 이유가 없다.
 */
export default function ExperienceCard({
  form,
  sessions,
  locale,
}: {
  form: ApplyForm;
  sessions: Session[];
  locale: Locale;
}) {
  const en = locale === "en";
  const cutoff = form.cutoff_hours ?? 0;
  const poster = posterUrl(form.poster_path);
  const title = pick(locale, form.title, form.title_en);
  const description = pick(locale, form.description, form.description_en);

  const native = isNative(form);
  const openCount = openSessionCount(sessions, cutoff);
  const available = isBookableForm(form, openCount);
  const next = native ? nextOpenSession(sessions, cutoff) : null;
  const left = next ? remainingSeats(next) : 0;

  const duration = formatDuration(form.duration_min ?? null, locale);
  const price = formatPrice(form.price_krw ?? null, locale);

  // 배지는 하나만. 여러 개 붙이면 무엇이 중요한지 사라진다.
  let badge: { text: string; cls: string } | null = null;
  if (!available) {
    badge = {
      text: en ? "Closed" : "접수 마감",
      cls: "bg-soft text-sub",
    };
  } else if (showsSeatCount(form) && next && left <= 2) {
    badge = {
      text: en ? `${left} places left` : `${left}자리 남음`,
      cls: "bg-danger-soft text-danger",
    };
  } else if (available) {
    badge = {
      text: en ? "Booking open" : "예약 가능",
      cls: "bg-point-soft text-point-dark",
    };
  }

  const meta = [duration, price].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/about/${form.key}`}
      className="group flex flex-col overflow-hidden rounded-card border border-line bg-white transition-shadow hover:shadow-card-hover focus-visible:shadow-card-hover"
    >
      {poster && (
        <div className="relative aspect-[4/5] overflow-hidden bg-soft">
          <Image
            src={poster}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 720px) 92vw, 380px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {badge && (
            <span
              className={`absolute top-3 left-3 rounded-full px-3.5 py-1.5 text-[0.95rem] font-bold ${badge.cls}`}
            >
              {badge.text}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        {!poster && badge && (
          <span
            className={`mb-2 self-start rounded-full px-3.5 py-1.5 text-[0.95rem] font-bold ${badge.cls}`}
          >
            {badge.text}
          </span>
        )}

        <h3 className="m-0 text-[1.2rem] font-extrabold">{title}</h3>

        {meta && <p className="m-0 mt-1.5 font-bold text-sub">{meta}</p>}

        {/* 다음 회차는 자체 예약일 때만 안다. 구글폼은 날짜가 폼 안에 있다. */}
        {next && (
          <p className="m-0 mt-1.5 font-bold text-point-dark">
            {en ? "Next: " : "다음 회차 · "}
            {formatSessionWhen(next.starts_at, locale)}
          </p>
        )}
        {native && available && openCount > 1 && (
          <p className="m-0 mt-1 text-sub">
            {en ? `${openCount} dates open` : `예약 가능한 날 ${openCount}일`}
          </p>
        )}

        {description && (
          <p className="m-0 mt-3 line-clamp-3 leading-relaxed text-ink2">{description}</p>
        )}

        <span className="mt-4 font-bold text-point underline">
          {en ? "See details" : "자세히 보기"}
        </span>
      </div>
    </Link>
  );
}
