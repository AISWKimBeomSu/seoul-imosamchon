import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PersonCard from "@/components/PersonCard";
import ApplyButton from "@/components/ApplyButton";
import PopupMount from "@/components/PopupMount";
import PreviewBanner from "@/components/PreviewBanner";
import { getPeople } from "@/lib/people.server";
import { getT, getLocale } from "@/lib/locale.server";
import { isPreviewMode } from "@/lib/preview";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const en = (await getLocale()) === "en";
  return {
    title: en ? "Our people" : "우리 이모·삼촌",
    description: en ? "Meet the senior hosts and the team behind Seoul Imo·Samchon." : "서울이모삼촌과 함께하는 시니어 호스트와 팀을 소개합니다. 평범한 서울의 이모·삼촌이라서 특별합니다.",
  };
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const isPreview = await isPreviewMode(preview);

  const [seniors, team, { t }] = await Promise.all([
    getPeople("senior", { includeUnpublished: isPreview }),
    getPeople("team", { includeUnpublished: isPreview }),
    getT(),
  ]);

  return (
    <>
      {isPreview && (
        <PreviewBanner
          note="아직 공개하지 않은 분들까지 함께 보여주고 있습니다."
          backTo="/admin/people"
        />
      )}
      <SiteHeader />
      <main className="section">
        <div className="wrap">
          <div className="people-hero">
            <div className="eyebrow">{t("people.eyebrow")}</div>
            <h1
              style={{
                fontSize: "clamp(1.6rem,3.2vw,2.2rem)",
                fontWeight: 800,
                margin: "0.2rem 0 0.8rem",
              }}
            >
              {t("people.title")}
            </h1>
            <p style={{ fontSize: "1.1rem", color: "#433e37", maxWidth: "58ch" }}>
              {t("people.intro")}
            </p>
          </div>

          <section id="seniors" className="people-sec">
            <div className="eyebrow">{t("people.seniorsEyebrow")}</div>
            <h2
              style={{
                fontSize: "clamp(1.35rem,2.6vw,1.8rem)",
                fontWeight: 800,
                margin: "0.2rem 0 0.4rem",
              }}
            >
              {t("people.seniorsTitle")}
            </h2>
            <p className="sec-sub" style={{ marginBottom: "1.4rem" }}>
              {t("people.seniorsSub")}
            </p>
            {seniors.length > 0 ? (
              <div className="people-grid">
                {seniors.map((p) => (
                  <PersonCard key={p.id} person={p} />
                ))}
              </div>
            ) : (
              <div className="empty">{t("people.seniorsEmpty")}</div>
            )}
          </section>

          <section id="team" className="people-sec">
            <div className="eyebrow">{t("people.teamEyebrow")}</div>
            <h2
              style={{
                fontSize: "clamp(1.35rem,2.6vw,1.8rem)",
                fontWeight: 800,
                margin: "0.2rem 0 0.4rem",
              }}
            >
              {t("people.teamTitle")}
            </h2>
            <p className="sec-sub" style={{ marginBottom: "1.4rem" }}>
              {t("people.teamSub")}
            </p>
            {team.length > 0 ? (
              <div className="people-grid team">
                {team.map((p) => (
                  <PersonCard key={p.id} person={p} />
                ))}
              </div>
            ) : (
              <div className="empty">{t("people.teamEmpty")}</div>
            )}
          </section>

          <div className="people-cta">
            <h2>{t("people.ctaTitle")}</h2>
            <p>{t("people.ctaSub")}</p>
            <ApplyButton source="people" label={t("people.ctaBtn")} />
          </div>
        </div>
      </main>
      <SiteFooter />
      <PopupMount page="other" preview={isPreview} />
    </>
  );
}
