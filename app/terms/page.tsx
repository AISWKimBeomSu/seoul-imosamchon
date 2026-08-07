import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PopupMount from "@/components/PopupMount";
import { LegalBody, LegalToc } from "@/components/LegalDoc";
import { getSiteConfig } from "@/lib/config";
import { getT } from "@/lib/locale.server";
import { pick } from "@/lib/i18n";
import { buildTerms, TERMS_EFFECTIVE_LABEL } from "@/lib/terms";

export const dynamic = "force-dynamic";

// 방침 페이지와 같은 출처를 쓴다 — 두 문서가 다른 사람을 가리키면 둘 다 못 믿는다.
const REP_NAME = process.env.NEXT_PUBLIC_REP_NAME || "신승민";

export async function generateMetadata() {
  const { t, locale } = await getT();
  return {
    title: t("terms.title"),
    description:
      locale === "en"
        ? "Booking conditions, cancellation and refunds for Seoul Imo·Samchon experiences."
        : "서울이모삼촌 체험의 예약 조건과 취소·환불 규정을 안내합니다.",
    alternates: { canonical: "/terms" },
  };
}

export default async function TermsPage() {
  const [{ t, locale }, cfg] = await Promise.all([getT(), getSiteConfig()]);

  const sections = buildTerms({
    operatorName: pick(locale, "팀 theOne", "Team theOne"),
    repName: REP_NAME,
    contactEmail: cfg.contact_email,
    phone: cfg.contact_phone,
  });

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap">
          <div className="max-w-[820px]">
            <div className="eyebrow">{t("terms.eyebrow")}</div>
            <h1 className="mt-1 mb-3 text-[clamp(1.7rem,3.4vw,2.3rem)] font-extrabold">
              {t("terms.title")}
            </h1>
            <p className="sec-sub max-w-[58ch]">{t("terms.lead")}</p>
            <p className="mt-3 text-sub">
              {t("terms.effective")} ·{" "}
              {pick(locale, TERMS_EFFECTIVE_LABEL.ko, TERMS_EFFECTIVE_LABEL.en)}
            </p>

            <LegalToc sections={sections} label={t("terms.toc")} locale={locale} />
            <LegalBody sections={sections} locale={locale} />
          </div>
        </div>
      </main>
      <SiteFooter />
      <PopupMount page="other" />
    </>
  );
}
