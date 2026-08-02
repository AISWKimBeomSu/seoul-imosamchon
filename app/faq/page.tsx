import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PopupMount from "@/components/PopupMount";
import { getT, getLocale } from "@/lib/locale.server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const en = (await getLocale()) === "en";
  return {
    title: en ? "FAQ" : "FAQ",
    description: en ? "Frequently asked questions." : "서울이모삼촌 자주 묻는 질문.",
  };
}

const FAQS: { q: string; a: string; q_en: string; a_en: string }[] = [
  {
    q: "영어를 못 해도 지원할 수 있나요?",
    a: "네, 지원하실 수 있어요. 분야에 따라 영어가 거의 필요 없고(손기술·동네 산책 등), 필요한 자리엔 통역과 젊은 팀원이 함께합니다.",
    q_en: "Can I apply if I do not speak English?",
    a_en: "Yes. Many activities barely need English (crafts, neighbourhood walks), and where it helps, an interpreter and a younger team member join you.",
  },
  {
    q: "정말 급여를 받나요?",
    a: "네. 무급 봉사가 아니라 시급 2만 원 수준(안)의 실제 일자리입니다. 식재료비·교통비 등 실비와 교육·보험도 지원합니다.",
    q_en: "Is this actually paid?",
    a_en: "Yes. This is real work at around ₩20,000 per hour — not volunteering. Ingredients, travel costs, training and insurance are covered.",
  },
  {
    q: "스마트폰이 서툴러도 되나요?",
    a: "괜찮습니다. 휴대폰으로 5분이면 신청되고, 어려우면 신청서를 내려받아 작성 후 사진을 보내거나 전화로 도와드립니다.",
    q_en: "What if I am not comfortable with smartphones?",
    a_en: "That is fine. The online form takes five minutes, and you can instead print the form, photograph it and email it — or call us and we will help.",
  },
  {
    q: "어디에서 활동하나요?",
    a: "망원시장(마포)을 중심으로 시작합니다. 마포·서대문·은평·영등포 등 인근 거주 시 우대하며, 그 외 지역도 지원하실 수 있어요.",
    q_en: "Where does this take place?",
    a_en: "We are starting around Mangwon Market in Mapo. Living nearby (Mapo, Seodaemun, Eunpyeong, Yeongdeungpo) helps, but anyone in Seoul may apply.",
  },
];

export default async function FaqPage() {
  const { t, locale } = await getT();
  const en = locale === "en";

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <div className="eyebrow">{t("faq.eyebrow")}</div>
          <h1
            style={{
              fontSize: "clamp(1.6rem,3vw,2rem)",
              fontWeight: 800,
              margin: "0.2rem 0 1.2rem",
            }}
          >
            {t("faq.title")}
          </h1>
          <div>
            {FAQS.map((f, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-q">{en ? f.q_en : f.q}</summary>
                <div className="faq-a">{en ? f.a_en : f.a}</div>
              </details>
            ))}
          </div>

          <div className="people-cta" style={{ marginTop: "2rem" }}>
            <h2>{t("faq.ctaTitle")}</h2>
            <p>{t("faq.ctaSub")}</p>
            <Link className="btn btn-primary" href="/apply">
              {t("faq.ctaBtn")}
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
      <PopupMount page="other" />
    </>
  );
}
