import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PersonCard from "@/components/PersonCard";
import ApplyButton from "@/components/ApplyButton";
import PopupMount from "@/components/PopupMount";
import PreviewBanner from "@/components/PreviewBanner";
import { getPeople } from "@/lib/people.server";
import { isPreviewMode } from "@/lib/preview";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "우리 이모·삼촌",
  description:
    "서울이모삼촌과 함께하는 시니어 호스트와 팀을 소개합니다. 평범한 서울의 이모·삼촌이라서 특별합니다.",
  openGraph: {
    title: "우리 이모·삼촌 — 서울이모삼촌",
    description: "서울이모삼촌과 함께하는 시니어 호스트와 팀을 소개합니다.",
    type: "website",
    locale: "ko_KR",
  },
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const isPreview = await isPreviewMode(preview);

  const [seniors, team] = await Promise.all([
    getPeople("senior", { includeUnpublished: isPreview }),
    getPeople("team", { includeUnpublished: isPreview }),
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
            <div className="eyebrow">우리 사람들</div>
            <h1
              style={{
                fontSize: "clamp(1.6rem,3.2vw,2.2rem)",
                fontWeight: 800,
                margin: "0.2rem 0 0.8rem",
              }}
            >
              평범한 서울의 이모·삼촌이라서 특별합니다
            </h1>
            <p style={{ fontSize: "1.1rem", color: "#433e37", maxWidth: "58ch" }}>
              부엌은 빌릴 수 있어도, 40년 단골 관계와 손맛은 빌릴 수 없습니다.
              서울이모삼촌과 함께하는 분들을 소개합니다.
            </p>
          </div>

          <section id="seniors" className="people-sec">
            <div className="eyebrow">시니어 호스트</div>
            <h2
              style={{
                fontSize: "clamp(1.35rem,2.6vw,1.8rem)",
                fontWeight: 800,
                margin: "0.2rem 0 0.4rem",
              }}
            >
              우리 이모·삼촌
            </h2>
            <p className="sec-sub" style={{ marginBottom: "1.4rem" }}>
              60년의 세월이 그대로 프로그램이 되는 분들입니다.
            </p>
            {seniors.length > 0 ? (
              <div className="people-grid">
                {seniors.map((p) => (
                  <PersonCard key={p.id} person={p} />
                ))}
              </div>
            ) : (
              <div className="empty">
                첫 이모·삼촌을 곧 소개해 드릴게요.
              </div>
            )}
          </section>

          <section id="team" className="people-sec">
            <div className="eyebrow">팀 theOne</div>
            <h2
              style={{
                fontSize: "clamp(1.35rem,2.6vw,1.8rem)",
                fontWeight: 800,
                margin: "0.2rem 0 0.4rem",
              }}
            >
              함께 만드는 사람들
            </h2>
            <p className="sec-sub" style={{ marginBottom: "1.4rem" }}>
              시니어가 주인공이고, 저희는 옆에서 거듭니다. 통역·모객·정산은 저희 몫입니다.
            </p>
            {team.length > 0 ? (
              <div className="people-grid team">
                {team.map((p) => (
                  <PersonCard key={p.id} person={p} />
                ))}
              </div>
            ) : (
              <div className="empty">팀 소개를 준비하고 있어요.</div>
            )}
          </section>

          <div className="people-cta">
            <h2>다음은 당신의 이야기입니다</h2>
            <p>
              요리가 아니어도 좋아요. 동네 산책, 손재주, 살아온 이야기 —
              무엇이든 특별함이 됩니다.
            </p>
            <ApplyButton source="people" label="나도 신청하기" />
          </div>
        </div>
      </main>
      <SiteFooter />
      <PopupMount page="other" preview={isPreview} />
    </>
  );
}
