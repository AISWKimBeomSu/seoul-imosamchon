import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CopyEmail from "@/components/CopyEmail";
import ApplyButton from "@/components/ApplyButton";
import QrPanel from "@/components/QrPanel";
import PopupMount from "@/components/PopupMount";
import { getSiteConfig, formState } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata = { title: "신청하기" };

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ closed?: string }>;
}) {
  const [{ closed }, cfg] = await Promise.all([searchParams, getSiteConfig()]);
  const senior = formState(cfg, "senior");
  const appEmail = cfg.contact_email;

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap" style={{ maxWidth: 900 }}>
          <div className="eyebrow">신청하기</div>
          <h1
            style={{
              fontSize: "clamp(1.6rem,3vw,2rem)",
              fontWeight: 800,
              margin: "0.2rem 0 0.4rem",
            }}
          >
            편하신 방법으로 신청하세요
          </h1>
          <p className="sec-sub" style={{ marginBottom: "1.6rem" }}>
            휴대폰으로 바로 신청하거나, 종이 신청서를 내려받아 이메일로 보내셔도 됩니다.
          </p>

          {/* /api/go 가 마감 상태에서 되돌려보낸 경우 */}
          {closed === "1" && (
            <div
              className="alert err"
              role="status"
              style={{ marginBottom: "1.2rem" }}
            >
              {cfg.senior_closed_note}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 18,
            }}
          >
            <div className="card" style={{ border: "2px solid var(--point)" }}>
              <span
                className="ntag noti"
                style={{ display: "inline-block", marginBottom: "0.7rem" }}
              >
                방법 1 · 가장 쉬워요
              </span>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  marginBottom: "0.4rem",
                }}
              >
                휴대폰으로 5분 신청
              </h2>
              <p style={{ color: "#4b453d" }}>
                손가락으로 톡톡 고르면 끝. 한글·워드 작성이 필요 없어요.
                아래 버튼을 누르면 신청서가 바로 열립니다.
              </p>
              <div
                style={{
                  marginTop: "1.1rem",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.6rem",
                }}
              >
                <ApplyButton source="apply" />
                <Link className="btn btn-ghost" href="/notice">
                  모집 공고 읽어보기
                </Link>
              </div>
              <p
                style={{
                  color: "var(--sub)",
                  fontSize: "0.85rem",
                  marginTop: "0.9rem",
                }}
              >
                지원서는 Google Forms에서 접수되며, 개인정보 처리 주체는 팀 theOne입니다.
              </p>
            </div>

            <div className="card">
              <span
                className="ntag info"
                style={{ display: "inline-block", marginBottom: "0.7rem" }}
              >
                방법 2 · 종이로 하고 싶으면
              </span>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  marginBottom: "0.6rem",
                }}
              >
                신청서 내려받아 이메일로
              </h2>
              <ol
                style={{
                  margin: "0 0 1rem",
                  paddingLeft: "1.2rem",
                  color: "#4b453d",
                  lineHeight: 1.9,
                }}
              >
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
                <code
                  style={{
                    fontWeight: 700,
                    fontSize: "1.02rem",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {appEmail}
                </code>
                <CopyEmail email={appEmail} />
              </div>
            </div>
          </div>

          {/* QR — 자녀가 PC로 보고 부모님 폰으로 넘기는 경로 */}
          {senior.available && (
            <div style={{ marginTop: 22, maxWidth: 420 }}>
              <QrPanel caption="자녀·손주분께 이 화면을 보여드리거나, QR을 저장해 전달하셔도 좋아요" />
            </div>
          )}

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
            <span>
              자녀·손주분과 함께 신청하셔도 좋아요.
              {cfg.contact_phone
                ? ` (${cfg.contact_phone})`
                : " (연락처는 공지에서 안내드립니다.)"}
            </span>
          </div>
        </div>
      </main>
      <SiteFooter />
      <PopupMount page="other" />
    </>
  );
}
