import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getBookingByToken } from "@/lib/bookings.server";
import { getForm } from "@/lib/forms.server";
import { getSiteConfig } from "@/lib/config";
import { getT } from "@/lib/locale.server";
import { pick } from "@/lib/i18n";
import { formatSessionWhen } from "@/lib/sessions";

export const dynamic = "force-dynamic";

// 예약 요약이 담긴 화면이다. 색인 대상이 아니다(§17).
export const metadata = { robots: { index: false, follow: false } };

/**
 * 신청 완료 화면.
 *
 * booking id가 아니라 취소 토큰으로 조회한다. id로 열면 조회 경로가 둘이 되고,
 * 그중 하나(id)만 보호가 빠지는 상황이 생긴다 — 입구를 하나로 둔다.
 */
export default async function BookDonePage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const [{ key }, { t: token }] = await Promise.all([params, searchParams]);
  const [{ t, locale }, cfg] = await Promise.all([getT(), getSiteConfig()]);

  const booking = token ? await getBookingByToken(token) : null;
  const form = await getForm(key);
  const title = form ? pick(locale, form.title, form.title_en) : "";
  const en = locale === "en";

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap">
          <div className="max-w-[640px]">
            <div className="eyebrow">{t("book.eyebrow")}</div>
            <h1 className="mt-1 mb-3 text-[clamp(1.6rem,3.2vw,2.1rem)] font-extrabold">
              {t("book.doneTitle")}
            </h1>
            <p className="sec-sub">{t("book.doneLead")}</p>

            {booking?.session && (
              <dl className="my-7 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-[22px] border border-point bg-point-soft px-6 py-6 text-[1.05rem]">
                <dt className="text-sub">{en ? "Experience" : "체험"}</dt>
                <dd className="m-0 font-bold">{title}</dd>
                <dt className="text-sub">{en ? "When" : "일시"}</dt>
                <dd className="m-0 font-bold">
                  {formatSessionWhen(booking.session.starts_at, locale)}
                </dd>
                <dt className="text-sub">{en ? "Guests" : "인원"}</dt>
                <dd className="m-0 font-bold">
                  {en ? `${booking.guests} people` : `${booking.guests}명`}
                </dd>
              </dl>
            )}

            <p className="rounded-[18px] bg-soft px-5 py-4">{t("book.doneCapture")}</p>

            {token && (
              <p className="mt-6">
                <Link
                  href={`/booking/${encodeURIComponent(token)}`}
                  className="btn btn-primary"
                >
                  {t("book.manageLink")}
                </Link>
              </p>
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
