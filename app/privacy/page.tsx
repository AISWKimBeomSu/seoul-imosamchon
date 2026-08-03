import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PopupMount from "@/components/PopupMount";
import { getSiteConfig } from "@/lib/config";
import { getT } from "@/lib/locale.server";
import { pick, type Locale } from "@/lib/i18n";
import {
  buildPolicy,
  POLICY_EFFECTIVE_LABEL,
  type Block,
  type Bi,
} from "@/lib/privacy";

export const dynamic = "force-dynamic";

// 푸터와 같은 출처를 쓴다 — 두 곳이 어긋나면 방침 쪽이 허위 고지가 된다.
const OFFICER_NAME = process.env.NEXT_PUBLIC_REP_NAME || "신승민";
const OFFICER_EMAIL =
  process.env.NEXT_PUBLIC_REP_EMAIL || "harry147017@gachon.ac.kr";

export async function generateMetadata() {
  const { t, locale } = await getT();
  return {
    title: t("privacy.title"),
    description:
      locale === "en"
        ? "What personal data Seoul Imo·Samchon collects, why, how long we keep it, and how to have it removed."
        : "서울이모삼촌이 어떤 개인정보를 왜 수집하고 얼마나 보관하는지, 어떻게 지워 달라고 요청하실 수 있는지 안내합니다.",
    // 방침은 검색 노출보다 '항상 찾을 수 있는 것'이 중요하다. 색인은 막지 않는다.
    alternates: { canonical: "/privacy" },
  };
}

/** 표는 360px에서 넘친다. 페이지가 아니라 표 안에서만 가로로 밀리게 가둔다. */
function PolicyTable({
  head,
  rows,
  locale,
}: {
  head: Bi[];
  rows: Bi[][];
  locale: Locale;
}) {
  return (
    <div className="my-5 overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-[0.98rem]">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                scope="col"
                className="border-b-2 border-line2 bg-soft px-3 py-2.5 text-left align-top font-bold text-ink"
              >
                {pick(locale, h.ko, h.en)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="border-b border-line px-3 py-3 align-top leading-relaxed"
                >
                  {pick(locale, cell.ko, cell.en)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PolicyBlock({ block, locale }: { block: Block; locale: Locale }) {
  switch (block.kind) {
    case "p":
      return <p>{pick(locale, block.text.ko, block.text.en)}</p>;
    case "ul":
      return (
        <ul>
          {block.items.map((it, i) => (
            <li key={i} className="mb-2">
              {pick(locale, it.ko, it.en)}
            </li>
          ))}
        </ul>
      );
    case "note":
      return (
        <p className="my-4 rounded-2xl bg-point-soft px-5 py-4 text-point-dark">
          {pick(locale, block.text.ko, block.text.en)}
        </p>
      );
    case "table":
      return <PolicyTable head={block.head} rows={block.rows} locale={locale} />;
  }
}

export default async function PrivacyPage() {
  const [{ t, locale }, cfg] = await Promise.all([getT(), getSiteConfig()]);

  const sections = buildPolicy({
    officerName: OFFICER_NAME,
    officerEmail: OFFICER_EMAIL,
    requestEmail: cfg.contact_email,
    phone: cfg.contact_phone,
  });

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap">
          <div className="max-w-[820px]">
            <div className="eyebrow">{t("privacy.eyebrow")}</div>
            <h1 className="mt-1 mb-3 text-[clamp(1.7rem,3.4vw,2.3rem)] font-extrabold">
              {t("privacy.title")}
            </h1>
            <p className="sec-sub max-w-[58ch]">{t("privacy.lead")}</p>
            <p className="mt-3 text-sub">
              {t("privacy.effective")} ·{" "}
              {pick(locale, POLICY_EFFECTIVE_LABEL.ko, POLICY_EFFECTIVE_LABEL.en)}
            </p>

            {/* 목차 — 11개 절이라 스크롤만으로는 원하는 항목을 못 찾는다 */}
            <nav
              aria-label={t("privacy.toc")}
              className="mt-7 rounded-[22px] border border-line bg-soft px-6 py-5"
            >
              <h2 className="mb-3 text-[1.05rem] font-bold">{t("privacy.toc")}</h2>
              <ol className="grid list-none gap-x-6 gap-y-1 p-0 sm:grid-cols-2">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="inline-block py-1.5 leading-snug underline"
                    >
                      {pick(locale, s.title.ko, s.title.en)}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="prose mt-8">
              {sections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2>{pick(locale, s.title.ko, s.title.en)}</h2>
                  {s.blocks.map((b, i) => (
                    <PolicyBlock key={i} block={b} locale={locale} />
                  ))}
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
      <PopupMount page="other" />
    </>
  );
}
