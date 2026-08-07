import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SessionPicker from "@/components/SessionPicker";
import BookingForm from "@/components/BookingForm";
import { getForm } from "@/lib/forms.server";
import { getSessionsFor } from "@/lib/sessions.server";
import { getSiteConfig } from "@/lib/config";
import { getT } from "@/lib/locale.server";
import { pick } from "@/lib/i18n";
import { isNative } from "@/lib/forms";
import {
  formatSessionWhen,
  isBookable,
  openSessionCount,
  remainingSeats,
} from "@/lib/sessions";

export const dynamic = "force-dynamic";

// 예약 화면은 검색에 뜰 이유가 없다. 개인 정보를 넣는 자리이기도 하다.
export const metadata = { robots: { index: false, follow: false } };

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const [{ key }, { s: sessionId }] = await Promise.all([params, searchParams]);

  const form = await getForm(key);
  if (!form) notFound();

  const [{ t, locale }, sessions, cfg] = await Promise.all([
    getT(),
    getSessionsFor(key),
    getSiteConfig(),
  ]);

  // 구글폼을 쓰는 체험은 여기 올 일이 없다. 링크를 직접 친 경우 원래 경로로 돌려보낸다.
  // (0018 적용 전에는 booking_mode 자체가 없으므로 전부 여기서 걸린다 —
  //  마이그레이션 전에 이 페이지가 노출돼도 사이트가 이상해지지 않는다)
  if (!isNative(form)) redirect(`/about/${key}`);

  const cutoff = form.cutoff_hours ?? 0;
  const title = pick(locale, form.title, form.title_en);
  const selected = sessionId ? sessions.find((x) => x.id === sessionId) : undefined;
  const openCount = openSessionCount(sessions, cutoff);

  // 고른 회차가 그새 마감됐을 수 있다. 조용히 목록으로 되돌리지 않고 그대로
  // 회차 선택 화면을 보여 준다 — 무엇이 바뀌었는지는 카드의 '마감'이 말해 준다.
  const usable = selected && isBookable(selected, cutoff) ? selected : null;

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap">
          <div className="max-w-[720px]">
            <Link href={`/about/${key}`} className="backlink">
              ← {title}
            </Link>

            <div className="eyebrow mt-4">{t("book.eyebrow")}</div>
            <h1 className="mt-1 mb-6 text-[clamp(1.6rem,3.2vw,2.1rem)] font-extrabold">
              {title}
            </h1>

            {openCount === 0 && !usable ? (
              <div className="rounded-[22px] border border-line bg-soft px-6 py-6">
                <p className="m-0 mb-4">{t("session.none")}</p>
                <Link href={`/about/${key}`} className="btn btn-ghost">
                  {t("class.back")}
                </Link>
              </div>
            ) : usable ? (
              <>
                <div className="mb-7 rounded-[22px] border border-point bg-point-soft px-6 py-5">
                  <div className="text-sub text-[0.95rem]">{t("book.selected")}</div>
                  <p className="m-0 mt-1 text-[1.15rem] font-extrabold">
                    {formatSessionWhen(usable.starts_at, locale)}
                  </p>
                  <Link
                    href={`/book/${key}`}
                    className="mt-2 inline-block underline"
                  >
                    {t("book.changeSession")}
                  </Link>
                </div>

                <BookingForm
                  formKey={key}
                  sessionId={usable.id}
                  maxGuests={Math.min(remainingSeats(usable), 20)}
                  locale={locale}
                  contactPhone={cfg.contact_phone}
                />
              </>
            ) : (
              <>
                <h2 className="mb-4 text-[1.25rem] font-extrabold">
                  {t("book.pickSession")}
                </h2>
                <SessionPicker
                  formKey={key}
                  sessions={sessions}
                  cutoffHours={cutoff}
                  locale={locale}
                  selectedId={sessionId}
                />
              </>
            )}

            {/* 이메일을 안 쓰시는 분의 출구. 이 안내가 없으면 그분들은 여기서 멈춘다. */}
            {cfg.contact_phone && (
              <p className="mt-8 rounded-[18px] bg-soft px-5 py-4 text-sub">
                {t("book.noEmail")}{" "}
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
