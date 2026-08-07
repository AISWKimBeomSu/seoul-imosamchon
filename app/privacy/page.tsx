import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PopupMount from "@/components/PopupMount";
import { LegalBody, LegalToc } from "@/components/LegalDoc";
import { getSiteConfig } from "@/lib/config";
import { getT } from "@/lib/locale.server";
import { pick } from "@/lib/i18n";
import { buildPolicy, POLICY_EFFECTIVE_LABEL } from "@/lib/privacy";

export const dynamic = "force-dynamic";

// 푸터와 같은 출처를 쓴다 — 두 곳이 어긋나면 방침 쪽이 허위 고지가 된다.
const OFFICER_NAME = process.env.NEXT_PUBLIC_REP_NAME || "신승민";
const OFFICER_EMAIL =
  process.env.NEXT_PUBLIC_REP_EMAIL || "harry147017@gachon.ac.kr";

export async function generateMetadata() {
  const { t, locale } = await getT();
  return {
    title: t("privacy.title"),
    description:
      locale === "en"
        ? "What personal data Seoul Imo·Samchon collects, why, how long we keep it, and how to have it removed."
        : "서울이모삼촌이 어떤 개인정보를 왜 수집하고 얼마나 보관하는지, 어떻게 지워 달라고 요청하실 수 있는지 안내합니다.",
    // 방침은 검색 노출보다 '항상 찾을 수 있는 것'이 중요하다. 색인은 막지 않는다.
    alternates: { canonical: "/privacy" },
  };
}

export default async function PrivacyPage() {
  const [{ t, locale }, cfg] = await Promise.all([getT(), getSiteConfig()]);

  const sections = buildPolicy({
    officerName: OFFICER_NAME,
    officerEmail: OFFICER_EMAIL,
    requestEmail: cfg.contact_email,
    phone: cfg.contact_phone,
  });

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap">
          <div className="max-w-[820px]">
            <div className="eyebrow">{t("privacy.eyebrow")}</div>
            <h1 className="mt-1 mb-3 text-[clamp(1.7rem,3.4vw,2.3rem)] font-extrabold">
              {t("privacy.title")}
            </h1>
            <p className="sec-sub max-w-[58ch]">{t("privacy.lead")}</p>
            <p className="mt-3 text-sub">
              {t("privacy.effective")} ·{" "}
              {pick(locale, POLICY_EFFECTIVE_LABEL.ko, POLICY_EFFECTIVE_LABEL.en)}
            </p>

            {/* 목차 — 11개 절이라 스크롤만으로는 원하는 항목을 못 찾는다 */}
            <LegalToc sections={sections} label={t("privacy.toc")} locale={locale} />
            <LegalBody sections={sections} locale={locale} />
          </div>
        </div>
      </main>
      <SiteFooter />
      <PopupMount page="other" />
    </>
  );
}
