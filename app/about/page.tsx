import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ApplyButton from "@/components/ApplyButton";
import PopupMount from "@/components/PopupMount";
import { getT, getLocale } from "@/lib/locale.server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const en = (await getLocale()) === "en";
  return {
    title: en ? "About" : "브랜드소개",
    description: en ? "The story behind Seoul Imo·Samchon." : "서울이모삼촌 브랜드 이야기.",
  };
}

export default async function AboutPage() {
  const { t } = await getT();

  const cards = [
    [t("about.card1t"), t("about.card1d")],
    [t("about.card2t"), t("about.card2d")],
    [t("about.card3t"), t("about.card3d")],
  ];

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap" style={{ maxWidth: 820 }}>
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
                <b style={{ color: "var(--point)", display: "block", marginBottom: "0.25rem" }}>
                  {title}
                </b>
                {desc}
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "2rem 0 0.3rem" }}>
            {t("about.tracksTitle")}
          </h2>
          <p className="sec-sub" style={{ marginBottom: "1rem" }}>
            {t("about.tracksSub")}
          </p>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
            className="about-tracks"
          >
            <div className="card">
              <b style={{ color: "var(--point)" }}>{t("about.track1")}</b>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0.3rem 0" }}>
                {t("about.track1t")}
              </h3>
              <p style={{ color: "#4b453d" }}>{t("about.track1d")}</p>
            </div>
            <div className="card">
              <b style={{ color: "var(--point)" }}>{t("about.track2")}</b>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0.3rem 0" }}>
                {t("about.track2t")}
              </h3>
              <p style={{ color: "#4b453d" }}>{t("about.track2d")}</p>
            </div>
          </div>

          <div
            style={{ marginTop: "1.8rem", display: "flex", flexWrap: "wrap", gap: "0.7rem" }}
          >
            <ApplyButton source="about" label={t("about.ctaApply")} />
            <Link className="btn btn-ghost" href="/people">
              {t("about.ctaPeople")}
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
      <PopupMount page="other" />
    </>
  );
}
