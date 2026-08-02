import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PopupMount from "@/components/PopupMount";

export const dynamic = "force-dynamic";

export const metadata = { title: "FAQ" };

const FAQS: { q: string; a: string }[] = [
  {
    q: "영어를 못 해도 지원할 수 있나요?",
    a: "네, 지원하실 수 있어요. 분야에 따라 영어가 거의 필요 없고(손기술·동네 산책 등), 필요한 자리엔 통역과 젊은 팀원이 함께합니다.",
  },
  {
    q: "정말 급여를 받나요?",
    a: "네. 무급 봉사가 아니라 시급 2만 원 수준(안)의 실제 일자리입니다. 식재료비·교통비 등 실비와 교육·보험도 지원합니다.",
  },
  {
    q: "스마트폰이 서툴러도 되나요?",
    a: "괜찮습니다. 휴대폰으로 5분이면 신청되고, 어려우면 신청서를 내려받아 작성 후 사진을 보내거나 전화로 도와드립니다.",
  },
  {
    q: "어디에서 활동하나요?",
    a: "망원시장(마포)을 중심으로 시작합니다. 마포·서대문·은평·영등포 등 인근 거주 시 우대하며, 그 외 지역도 지원하실 수 있어요.",
  },
];

export default async function FaqPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <div className="eyebrow">자주 묻는 질문</div>
          <h1 style={{ fontSize: "clamp(1.6rem,3vw,2rem)", fontWeight: 800, margin: "0.2rem 0 1.2rem" }}>
            궁금한 점을 모았어요
          </h1>
          <div>
            {FAQS.map((f, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-q">{f.q}</summary>
                <div className="faq-a">{f.a}</div>
              </details>
            ))}
          </div>

          <div className="people-cta" style={{ marginTop: "2rem" }}>
            <h2>궁금증이 풀리셨나요?</h2>
            <p>더 궁금한 점은 신청 후에도 전화·이메일로 도와드립니다.</p>
            <Link className="btn btn-primary" href="/apply">
              신청하러 가기
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
      <PopupMount page="other" />
    </>
  );
}
