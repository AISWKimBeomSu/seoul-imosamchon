import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ApplyButton from "@/components/ApplyButton";
import ExperienceCard from "@/components/ExperienceCard";
import PrivacyNote from "@/components/PrivacyNote";
import PopupMount from "@/components/PopupMount";
import { getFormsFor } from "@/lib/forms.server";
import { getSessionsByForm } from "@/lib/sessions.server";
import { getT, getLocale } from "@/lib/locale.server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const en = (await getLocale()) === "en";
  return {
    title: en ? "About" : "브랜드소개",
    description: en
      ? "The story behind Seoul Imo·Samchon, and the classes you can join."
      : "서울이모삼촌 브랜드 이야기와 참여할 수 있는 클래스.",
  };
}

export default async function AboutPage() {
  const [{ t, locale }, classes, sessionsByForm] = await Promise.all([
    getT(),
    getFormsFor("guest"),
    getSessionsByForm(),
  ]);

  const cards = [
    [t("about.card1t"), t("about.card1d")],
    [t("about.card2t"), t("about.card2d")],
    [t("about.card3t"), t("about.card3d")],
  ];

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap">
          <div style={{ maxWidth: 820 }}>
            <div className="eyebrow">{t("about.eyebrow")}</div>
            <h1
              style={{
                fontSize: "clamp(1.6rem,3.2vw,2.2rem)",
                fontWeight: 800,
                margin: "0.2rem 0 0.8rem",
              }}
            >
              {t("about.title")}
            </h1>
            <p style={{ fontSize: "1.15rem", color: "#433e37", maxWidth: "60ch" }}>
              {t("about.lead")}
            </p>
            <blockquote
              style={{
                fontSize: "clamp(1.25rem,2.6vw,1.6rem)",
                lineHeight: 1.55,
                color: "var(--ink)",
                borderLeft: "4px solid var(--point)",
                padding: "0.2rem 0 0.2rem 1.1rem",
                margin: "1.6rem 0",
              }}
            >
              {t("about.quote")}
            </blockquote>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                gap: 14,
                margin: "1.2rem 0",
              }}
            >
              {cards.map(([title, desc]) => (
                <div key={title} className="card">
                  <b
                    style={{
                      color: "var(--point)",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {title}
                  </b>
                  {desc}
                </div>
              ))}
            </div>
          </div>

          {/* ── 클래스 목록 ─────────────────────────────────
              예전에는 '손님 안내'라는 별도 메뉴가 이 자리를 대신했다.
              무엇이 브랜드소개와 다른지 알 수 없어 여기로 들여왔다. */}
          <section id="classes" className="about-classes">
            <div className="eyebrow">{t("about.classesEyebrow")}</div>
            <h2
              style={{
                fontSize: "clamp(1.4rem,2.8vw,1.9rem)",
                fontWeight: 800,
                margin: "0.2rem 0 0.4rem",
              }}
            >
              {t("about.classesTitle")}
            </h2>
            <p className="sec-sub" style={{ marginBottom: "1.6rem", maxWidth: "56ch" }}>
              {t("about.classesSub")}
            </p>

            {classes.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {classes.map((f) => (
                  <ExperienceCard
                    key={f.key}
                    form={f}
                    sessions={sessionsByForm.get(f.key) ?? []}
                    locale={locale}
                  />
                ))}
              </div>
            ) : (
              <div className="empty">{t("about.classesEmpty")}</div>
            )}
          </section>

          <div className="people-cta" style={{ marginTop: "2.4rem" }}>
            <h2>{t("about.hostCtaTitle")}</h2>
            <p>{t("about.hostCtaSub")}</p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.7rem",
                justifyContent: "center",
              }}
            >
              <ApplyButton source="about" label={t("about.ctaApply")} />
              <Link className="btn btn-ghost" href="/people">
                {t("about.ctaPeople")}
              </Link>
            </div>
            <PrivacyNote className="mt-5" />
          </div>
        </div>
      </main>
      <SiteFooter />
      <PopupMount page="other" />
    </>
  );
}
