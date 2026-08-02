import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CopyEmail from "@/components/CopyEmail";
import ApplyFormCard from "@/components/ApplyFormCard";
import PopupMount from "@/components/PopupMount";
import { getSiteConfig } from "@/lib/config";
import { getForms } from "@/lib/forms.server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "신청하기",
  description:
    "서울이모삼촌 시니어 호스트 신청, 쿠킹클래스 신청, 하이킹 신청 — 원하시는 곳으로 바로 이동하세요.",
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ closed?: string }>;
}) {
  const [{ closed }, cfg, forms] = await Promise.all([
    searchParams,
    getSiteConfig(),
    getForms(),
  ]);

  // /api/go가 마감 상태에서 되돌려보낸 폼
  const closedForm = closed ? forms.find((f) => f.key === closed) : undefined;

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap">
          <div className="eyebrow">신청하기</div>
          <h1
            style={{
              fontSize: "clamp(1.7rem,3.4vw,2.3rem)",
              fontWeight: 800,
              margin: "0.2rem 0 0.5rem",
            }}
          >
            어떤 신청을 하시나요?
          </h1>
          <p className="sec-sub" style={{ marginBottom: "1.8rem", maxWidth: "52ch" }}>
            아래에서 하나를 고르시면 신청서가 바로 열립니다. QR을 휴대폰으로 비추셔도 됩니다.
          </p>

          {closedForm && (
            <div
              className="alert err"
              role="status"
              style={{ marginBottom: "1.4rem" }}
            >
              <b>{closedForm.title}</b> — {closedForm.closed_note}
            </div>
          )}

          {forms.length > 0 ? (
            <div className="fcards">
              {forms.map((f) => (
                <ApplyFormCard
                  key={f.key}
                  form={f}
                  highlight={f.key === "senior"}
                />
              ))}
            </div>
          ) : (
            <div className="empty">
              준비 중입니다. 곧 신청을 받을 예정이에요.
            </div>
          )}

          {/* 경로 B — 종이 신청서. 시니어 지원자 전용 안전망이다. */}
          <section className="apply-alt">
            <div className="eyebrow">그 밖의 방법</div>
            <h2>손으로 쓴 신청서를 보내고 싶으세요?</h2>
            <p className="sec-sub" style={{ marginBottom: "1.1rem" }}>
              시니어 호스트 신청은 종이로도 받습니다. 휴대폰이 어려우시면 이 방법을 쓰세요.
            </p>
            <ol className="apply-steps">
              <li>공지사항 모집공고에서 신청서 내려받기</li>
              <li>출력해서 작성</li>
              <li>사진 촬영</li>
              <li>아래 이메일로 전송</li>
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
              <b style={{ color: "var(--point)" }}>어려우시면 전화 주세요.</b>{" "}
              자녀·손주분과 함께 신청하셔도 좋아요.
              {cfg.contact_phone
                ? ` (${cfg.contact_phone})`
                : " (연락처는 공지에서 안내드립니다.)"}
            </p>
            <p
              style={{
                color: "var(--sub)",
                fontSize: "0.85rem",
                marginTop: "0.9rem",
              }}
            >
              지원서는 Google Forms에서 접수되며, 개인정보 처리 주체는 팀 theOne입니다.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
      <PopupMount page="other" />
    </>
  );
}
