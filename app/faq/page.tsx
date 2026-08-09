import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PopupMount from "@/components/PopupMount";
import { getT, getLocale } from "@/lib/locale.server";
import { getFaqs } from "@/lib/faqs.server";
import { groupByAudience, type Faq } from "@/lib/faqs";
import { pick, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const en = (await getLocale()) === "en";
  return {
    title: "FAQ",
    description: en ? "Frequently asked questions." : "서울이모삼촌 자주 묻는 질문.",
  };
}

/**
 * 아코디언 한 덩어리.
 *
 * details/summary를 그대로 쓴다 — 자바스크립트 없이 키보드로 열리고,
 * 브라우저 찾기(Ctrl+F)로도 닫힌 답이 검색된다. 직접 만든 아코디언은
 * 그 두 가지를 대개 잃는다.
 */
function FaqList({ faqs, locale }: { faqs: Faq[]; locale: Locale }) {
  return (
    <div>
      {faqs.map((f) => (
        <details key={f.id} className="faq-item">
          <summary className="faq-q">
            {pick(locale, f.question, f.question_en)}
          </summary>
          <div className="faq-a">{pick(locale, f.answer, f.answer_en)}</div>
        </details>
      ))}
    </div>
  );
}

export default async function FaqPage() {
  const [{ t, locale }, faqs] = await Promise.all([getT(), getFaqs()]);
  const en = locale === "en";

  // 시니어 지원자와 체험 손님은 궁금한 게 전혀 다르다.
  // 한 목록에 섞으면 둘 다 자기 질문을 못 찾는다.
  const { senior, guest } = groupByAudience(faqs);

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

          {faqs.length === 0 ? (
            <p className="empty">{t("faq.empty")}</p>
          ) : (
            <>
              {guest.length > 0 && (
                <section className="mt-8">
                  <h2 className="mb-3 text-[1.2rem] font-extrabold">
                    {en ? "Booking an experience" : "체험 예약이 궁금해요"}
                  </h2>
                  <FaqList faqs={guest} locale={locale} />
                </section>
              )}

              {senior.length > 0 && (
                <section className="mt-10">
                  <h2 className="mb-3 text-[1.2rem] font-extrabold">
                    {en ? "Becoming a host" : "호스트 지원이 궁금해요"}
                  </h2>
                  <FaqList faqs={senior} locale={locale} />
                </section>
              )}
            </>
          )}

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
