import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CancelBookingForm from "@/components/CancelBookingForm";
import { getBookingByToken } from "@/lib/bookings.server";
import { getForm } from "@/lib/forms.server";
import { getSiteConfig } from "@/lib/config";
import { getT } from "@/lib/locale.server";
import { pick } from "@/lib/i18n";
import { formatSessionWhen } from "@/lib/sessions";
import { isCancellable, statusLabel } from "@/lib/bookings";

export const dynamic = "force-dynamic";

// 남의 예약이 검색에 뜨는 일은 없어야 한다. robots.ts에서도 막지만 여기서도 건다.
export const metadata = { robots: { index: false, follow: false } };

export default async function BookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [{ t, locale }, cfg] = await Promise.all([getT(), getSiteConfig()]);
  const en = locale === "en";

  const booking = await getBookingByToken(decodeURIComponent(token));

  // 못 찾았을 때 404를 던지지 않는다. "링크를 잃으셨나요?"로 이어질 출구를
  // 보여줘야 하기 때문이다 — 이메일을 지운 게스트에게 빈 404는 막다른 길이다.
  if (!booking) {
    return (
      <>
        <SiteHeader />
        <main className="section">
          <div className="wrap">
            <div className="max-w-[620px]">
              <h1 className="mb-3 text-[clamp(1.5rem,3vw,2rem)] font-extrabold">
                {t("booking.notFound")}
              </h1>
              <p className="sec-sub">{t("booking.notFoundHelp")}</p>
              <p className="mt-6">
                <a href={`mailto:${cfg.contact_email}`} className="btn btn-primary">
                  {en ? "Email us" : "이메일로 문의하기"}
                </a>
              </p>
              {cfg.contact_phone && (
                <p className="mt-3 text-sub">
                  {en ? "Or call " : "또는 전화 "}
                  <a href={`tel:${cfg.contact_phone}`} className="font-bold underline">
                    {cfg.contact_phone}
                  </a>
                </p>
              )}
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const form = booking.session ? await getForm(booking.session.form_key) : null;
  const title = form ? pick(locale, form.title, form.title_en) : "";
  const meetPlace = form ? pick(locale, form.meet_place, form.meet_place_en) : "";
  const started = booking.hasStarted;

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap">
          <div className="max-w-[620px]">
            <div className="eyebrow">{t("book.eyebrow")}</div>
            <h1 className="mt-1 mb-5 text-[clamp(1.6rem,3.2vw,2.1rem)] font-extrabold">
              {t("booking.title")}
            </h1>

            <p className="mb-6">
              <span className="inline-block rounded-full bg-point px-4 py-2 font-bold text-white">
                {statusLabel(booking.status, locale)}
              </span>
            </p>

            {booking.status === "declined" && booking.decline_reason && (
              <p className="mb-6 rounded-[18px] bg-soft px-5 py-4">
                {booking.decline_reason}
              </p>
            )}

            <dl className="my-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-[22px] border border-line bg-soft px-6 py-6 text-[1.05rem]">
              <dt className="text-sub">{en ? "Experience" : "체험"}</dt>
              <dd className="m-0 font-bold">{title}</dd>
              {booking.session && (
                <>
                  <dt className="text-sub">{en ? "When" : "일시"}</dt>
                  <dd className="m-0 font-bold">
                    {formatSessionWhen(booking.session.starts_at, locale)}
                  </dd>
                </>
              )}
              <dt className="text-sub">{en ? "Name" : "성함"}</dt>
              <dd className="m-0 font-bold">{booking.name}</dd>
              <dt className="text-sub">{en ? "Guests" : "인원"}</dt>
              <dd className="m-0 font-bold">
                {en ? `${booking.guests} people` : `${booking.guests}명`}
              </dd>
              {meetPlace && (
                <>
                  <dt className="text-sub">{en ? "Where" : "만나는 곳"}</dt>
                  <dd className="m-0 font-bold">{meetPlace}</dd>
                </>
              )}
            </dl>

            {isCancellable(booking.status) && !started ? (
              <CancelBookingForm
                token={decodeURIComponent(token)}
                locale={locale}
                contactPhone={cfg.contact_phone}
              />
            ) : (
              isCancellable(booking.status) &&
              started && (
                <p className="rounded-[18px] bg-soft px-5 py-4 text-sub">
                  {en
                    ? "The start time has passed, so this can no longer be cancelled here. Please contact us."
                    : "시작 시각이 지나 화면에서는 취소할 수 없습니다. 연락 주시면 도와드리겠습니다."}
                </p>
              )
            )}

            <p className="mt-8 text-sub">
              {en ? "Questions? " : "궁금한 점이 있으시면 "}
              <a href={`mailto:${cfg.contact_email}`} className="underline">
                {cfg.contact_email}
              </a>
              {cfg.contact_phone && (
                <>
                  {" · "}
                  <a href={`tel:${cfg.contact_phone}`} className="underline">
                    {cfg.contact_phone}
                  </a>
                </>
              )}
            </p>

            <p className="mt-6">
              <Link href="/" className="backlink">
                ← {t("nav.home")}
              </Link>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
