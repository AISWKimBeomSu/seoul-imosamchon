import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PersonAvatar from "@/components/PersonAvatar";
import ApplyButton from "@/components/ApplyButton";
import PopupMount from "@/components/PopupMount";
import { getSiteConfig } from "@/lib/config";
import { getFormsFor } from "@/lib/forms.server";
import { isFormAvailable } from "@/lib/forms";
import { getPeople } from "@/lib/people.server";
import { getT, getLocale } from "@/lib/locale.server";
import { pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const en = (await getLocale()) === "en";
  return {
    title: en ? "For guests" : "손님 안내",
    description: en ? "Book a cooking class or a neighbourhood walk with a Seoul local." : "외국인 손님을 위한 안내와 예약.",
  };
}

export default async function GuestPage({
  searchParams,
}: {
  searchParams: Promise<{ closed?: string }>;
}) {
  const [{ closed }, cfg, hosts, guestForms, { t, locale }] = await Promise.all([
    searchParams,
    getSiteConfig(),
    getPeople("senior"),
    getFormsFor("guest"), // 쿠킹클래스 · 하이킹
    getT(),
  ]);
  const openForms = guestForms.filter(isFormAvailable);

  const steps = [
    { n: "1", t: t("guest.step1t"), d: t("guest.step1d") },
    { n: "2", t: t("guest.step2t"), d: t("guest.step2d") },
    { n: "3", t: t("guest.step3t"), d: t("guest.step3d") },
  ];

  return (
    <>
      <SiteHeader />
      <main>
        <section className="guest-hero">
          <div className="wrap">
            <div className="eyebrow" style={{ justifyContent: "center" }}>
              {t("guest.eyebrow")}
            </div>
            <h1
              style={{
                fontSize: "clamp(1.8rem,4vw,2.7rem)",
                fontWeight: 800,
                lineHeight: 1.25,
                margin: "0.3rem auto 0.8rem",
                maxWidth: "20ch",
              }}
            >
              {t("guest.title")}
            </h1>
            <p
              style={{
                color: "var(--sub)",
                fontSize: "1.12rem",
                maxWidth: "48ch",
                margin: "0 auto 1.6rem",
              }}
            >
              {t("guest.lead")}
            </p>

            {closed && (
              <div
                className="alert err"
                role="status"
                style={{ maxWidth: 540, margin: "0 auto 1.2rem" }}
              >
                {t("guest.closedNow")}{" "}
                <a href={`mailto:${cfg.contact_email}`}>{cfg.contact_email}</a>
              </div>
            )}

            {openForms.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.7rem",
                  justifyContent: "center",
                }}
              >
                {openForms.map((f, i) => (
                  <ApplyButton
                    key={f.key}
                    formKey={f.key}
                    source="guest"
                    className={i === 0 ? "btn btn-primary" : "btn btn-ghost"}
                  />
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--sub)" }}>
                <p style={{ marginBottom: "0.6rem" }}>
                  <b>{t("guest.soon")}</b>
                </p>
                <p>
                  {t("guest.soonSub")}{" "}
                  <a href={`mailto:${cfg.contact_email}`}>{cfg.contact_email}</a>
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="eyebrow">{t("guest.stepsEyebrow")}</div>
            <h2
              style={{
                fontSize: "clamp(1.35rem,2.6vw,1.9rem)",
                fontWeight: 800,
                margin: "0.2rem 0 1.3rem",
              }}
            >
              {t("guest.stepsTitle")}
            </h2>
            <div className="guest-cards">
              {steps.map((s) => (
                <div className="card" key={s.n}>
                  <div className="guest-step" aria-hidden="true">
                    {s.n}
                  </div>
                  <h3
                    style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.4rem" }}
                  >
                    {s.t}
                  </h3>
                  <p style={{ color: "#4b453d" }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {hosts.length > 0 && (
          <section className="section soft">
            <div className="wrap">
              <div className="eyebrow">{t("guest.hostsEyebrow")}</div>
              <h2
                style={{
                  fontSize: "clamp(1.35rem,2.6vw,1.9rem)",
                  fontWeight: 800,
                  margin: "0.2rem 0 1.3rem",
                }}
              >
                {t("guest.hostsTitle")}
              </h2>
              <div className="people-grid team">
                {hosts.slice(0, 3).map((p) => (
                  <article className="pcard team" key={p.id}>
                    <PersonAvatar person={p} size={96} />
                    <h3>{p.name}</h3>
                    {pick(locale, p.region, p.region_en) && (
                      <p className="pcard-role">{pick(locale, p.region, p.region_en)}</p>
                    )}
                    {pick(locale, p.tagline, p.tagline_en) && (
                      <p className="pcard-tagline">
                        {pick(locale, p.tagline, p.tagline_en)}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="section">
          <div className="wrap">
            <div className="people-cta">
              <h2>{t("guest.ctaTitle")}</h2>
              <p>{t("guest.ctaSub")}</p>
              {openForms.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.7rem",
                    justifyContent: "center",
                  }}
                >
                  {openForms.map((f) => (
                    <ApplyButton key={f.key} formKey={f.key} source="guest" />
                  ))}
                </div>
              ) : (
                <a className="btn btn-ghost" href={`mailto:${cfg.contact_email}`}>
                  {t("guest.emailUs")}
                </a>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <PopupMount page="other" />
    </>
  );
}
