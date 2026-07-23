import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "브랜드소개" };

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <div className="eyebrow">브랜드소개</div>
          <h1 style={{ fontSize: "clamp(1.6rem,3.2vw,2.2rem)", fontWeight: 800, margin: "0.2rem 0 0.8rem" }}>
            평범한 서울의 이모·삼촌이 하기에 특별합니다
          </h1>
          <p style={{ fontSize: "1.15rem", color: "#433e37", maxWidth: "60ch" }}>
            서울에 온 외국인 여행자들은 유명 관광지보다 ‘진짜 한국 사람들의 일상’을 더 궁금해합니다.
            그런데 그걸 보여줄 사람이 없습니다. 서울이모삼촌이 바로 그 자리를 채웁니다.
          </p>
          <blockquote
            style={{
              fontSize: "clamp(1.3rem,2.6vw,1.7rem)",
              lineHeight: 1.55,
              color: "var(--ink)",
              borderLeft: "4px solid var(--point)",
              padding: "0.2rem 0 0.2rem 1.1rem",
              margin: "1.6rem 0",
            }}
          >
            “부엌은 빌릴 수 있어도, 40년 단골 관계와 손맛은 빌릴 수 없습니다. 그건 60년을 살아야만 얻어지는 것이니까요.”
          </blockquote>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, margin: "1.2rem 0" }}>
            {[
              ["손맛", "요리학원에서 못 배웁니다. 40년 부엌에서 나옵니다."],
              ["단골 관계", "돈으로 못 삽니다. 30년 같은 시장을 다녀야 생깁니다."],
              ["이야기", "복제되지 않습니다. 그 사람의 인생이니까요."],
            ].map(([t, d]) => (
              <div key={t} className="card">
                <b style={{ color: "var(--point)", display: "block", marginBottom: "0.25rem" }}>{t}</b>
                {d}
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "2rem 0 0.3rem" }}>이렇게 함께합니다</h2>
          <p className="sec-sub" style={{ marginBottom: "1rem" }}>
            두 갈래로 함께해요. 요리가 아니어도, 아직 뭐가 특별한지 몰라도 괜찮아요.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="about-tracks">
            <div className="card">
              <b style={{ color: "var(--point)" }}>트랙 1</b>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0.3rem 0" }}>쿠킹 클래스</h3>
              <p style={{ color: "#4b453d" }}>시장 장보기 + 집밥 만들기. 우리 대표 프로그램.</p>
            </div>
            <div className="card">
              <b style={{ color: "var(--point)" }}>트랙 2</b>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0.3rem 0" }}>나만의 특별함</h3>
              <p style={{ color: "#4b453d" }}>산책·손재주·이야기까지, 어르신만의 특별함을 체험으로.</p>
            </div>
          </div>

          <div style={{ marginTop: "1.8rem" }}>
            <Link className="btn btn-primary" href="/apply">
              시니어 호스트 신청하기
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
