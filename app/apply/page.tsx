import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CopyEmail from "@/components/CopyEmail";
import ApplyFormCard from "@/components/ApplyFormCard";
import PopupMount from "@/components/PopupMount";
import { getSiteConfig } from "@/lib/config";
import { getForms } from "@/lib/forms.server";
import { getT, getLocale } from "@/lib/locale.server";
import { pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const en = (await getLocale()) === "en";
  return {
    title: en ? "Apply / Book" : "신청하기",
    description: en ? "Apply as a senior host, or book the cooking class and the neighbourhood hike." : "서울이모삼촌 시니어 호스트 신청, 쿠킹클래스 신청, 하이킹 신청 — 원하시는 곳으로 바로 이동하세요.",
  };
}

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ closed?: string }>;
}) {
  const [{ closed }, cfg, forms, { t, locale }] = await Promise.all([
    searchParams,
    getSiteConfig(),
    getForms(),
    getT(),
  ]);

  // /api/go가 마감 상태에서 되돌려보낸 폼
  const closedForm = closed ? forms.find((f) => f.key === closed) : undefined;

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap">
          <div className="eyebrow">{t("apply.eyebrow")}</div>
          <h1
            style={{
              fontSize: "clamp(1.7rem,3.4vw,2.3rem)",
              fontWeight: 800,
              margin: "0.2rem 0 0.5rem",
            }}
          >
            {t("apply.title")}
          </h1>
          <p className="sec-sub" style={{ marginBottom: "1.8rem", maxWidth: "52ch" }}>
            {t("apply.sub")}
          </p>

          {closedForm && (
            <div className="alert err" role="status" style={{ marginBottom: "1.4rem" }}>
              <b>{pick(locale, closedForm.title, closedForm.title_en)}</b> —{" "}
              {pick(locale, closedForm.closed_note, closedForm.closed_note_en)}
            </div>
          )}

          {forms.length > 0 ? (
            <div className="fcards">
              {forms.map((f) => (
                <ApplyFormCard key={f.key} form={f} highlight={f.key === "senior"} />
              ))}
            </div>
          ) : (
            <div className="empty">{t("apply.empty")}</div>
          )}

          {/* 경로 B — 종이 신청서. 시니어 지원자 전용 안전망이다. */}
          <section className="apply-alt">
            <div className="eyebrow">{t("apply.altEyebrow")}</div>
            <h2>{t("apply.altTitle")}</h2>
            <p className="sec-sub" style={{ marginBottom: "1.1rem" }}>
              {t("apply.altSub")}
            </p>
            <ol className="apply-steps">
              <li>{t("apply.step1")}</li>
              <li>{t("apply.step2")}</li>
              <li>{t("apply.step3")}</li>
              <li>{t("apply.step4")}</li>
            </ol>
            <div className="apply-mail">
              <code>{cfg.contact_email}</code>
              <CopyEmail email={cfg.contact_email} />
            </div>
            <p
              style={{
                marginTop: "1rem",
                color: "var(--point-dark)",
                background: "var(--point-soft)",
                borderRadius: 14,
                padding: "0.9rem 1.1rem",
              }}
            >
              <b style={{ color: "var(--point)" }}>{t("apply.phone")}</b>{" "}
              {t("apply.phoneSub")}
              {cfg.contact_phone ? ` (${cfg.contact_phone})` : ""}
            </p>
            <p style={{ color: "var(--sub)", fontSize: "0.85rem", marginTop: "0.9rem" }}>
              {t("apply.privacy")}
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
      <PopupMount page="other" />
    </>
  );
}
