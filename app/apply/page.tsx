import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CopyEmail from "@/components/CopyEmail";

export const metadata = { title: "신청하기" };

const APP_EMAIL =
  process.env.NEXT_PUBLIC_APPLICATION_EMAIL || "songchaewoo0@gmail.com";

export default function ApplyPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap" style={{ maxWidth: 900 }}>
          <div className="eyebrow">신청하기</div>
          <h1 style={{ fontSize: "clamp(1.6rem,3vw,2rem)", fontWeight: 800, margin: "0.2rem 0 0.4rem" }}>
            편하신 방법으로 신청하세요
          </h1>
          <p className="sec-sub" style={{ marginBottom: "1.6rem" }}>
            휴대폰으로 바로 신청하거나, 종이 신청서를 내려받아 이메일로 보내셔도 됩니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
            <div className="card" style={{ border: "2px solid var(--point)" }}>
              <span className="ntag noti" style={{ display: "inline-block", marginBottom: "0.7rem" }}>
                방법 1 · 가장 쉬워요
              </span>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.4rem" }}>
                휴대폰으로 5분 신청
              </h2>
              <p style={{ color: "#4b453d" }}>
                손가락으로 톡톡 고르면 끝. 한글·워드 작성이 필요 없어요. 공지사항의 모집공고에서 신청 버튼을 눌러 주세요.
              </p>
              <div style={{ marginTop: "1.1rem" }}>
                <Link className="btn btn-primary" href="/notice">
                  모집 공고 보러 가기
                </Link>
              </div>
            </div>

            <div className="card">
              <span className="ntag info" style={{ display: "inline-block", marginBottom: "0.7rem" }}>
                방법 2 · 종이로 하고 싶으면
              </span>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.6rem" }}>
                신청서 내려받아 이메일로
              </h2>
              <ol style={{ margin: "0 0 1rem", paddingLeft: "1.2rem", color: "#4b453d", lineHeight: 1.9 }}>
                <li>공지사항 모집공고에서 신청서 내려받기</li>
                <li>출력해서 작성</li>
                <li>사진 촬영</li>
                <li>아래 이메일로 전송</li>
              </ol>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "0.6rem",
                  background: "var(--soft)",
                  border: "1px dashed var(--line2)",
                  borderRadius: 12,
                  padding: "0.7rem 0.9rem",
                }}
              >
                <code style={{ fontWeight: 700, fontSize: "1.02rem", fontFamily: "var(--font-sans)" }}>
                  {APP_EMAIL}
                </code>
                <CopyEmail email={APP_EMAIL} />
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--point-soft)",
              borderRadius: 14,
              padding: "1rem 1.2rem",
              color: "var(--point-dark)",
            }}
          >
            <b style={{ color: "var(--point)" }}>어려우시면 전화 주세요.</b>
            <span>자녀·손주분과 함께 신청하셔도 좋아요. (연락처는 공지에서 안내드립니다.)</span>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
