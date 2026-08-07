import { pick, type Locale } from "@/lib/i18n";
import type { Block, Bi, Section } from "@/lib/privacy";

/**
 * 법정 문서(개인정보처리방침·이용약관) 공용 렌더러.
 *
 * 두 문서는 형식이 같다 — 절 목록 + 목차 + 블록(문단/목록/표/강조). 렌더러를
 * 두 벌 두면 한쪽만 고쳐지고 다른 쪽이 낡는다. 블록 타입 정의는 먼저 만들어진
 * lib/privacy.ts에 그대로 둔다(타입을 옮기면 방침 쪽 diff만 커진다).
 */

/** 표는 360px에서 넘친다. 페이지가 아니라 표 안에서만 가로로 밀리게 가둔다. */
function LegalTable({
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

export function LegalBlock({
  block,
  locale,
}: {
  block: Block;
  locale: Locale;
}) {
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
      return <LegalTable head={block.head} rows={block.rows} locale={locale} />;
  }
}

/** 절이 여러 개라 스크롤만으로는 원하는 항목을 못 찾는다. */
export function LegalToc({
  sections,
  label,
  locale,
}: {
  sections: Section[];
  label: string;
  locale: Locale;
}) {
  return (
    <nav
      aria-label={label}
      className="mt-7 rounded-[22px] border border-line bg-soft px-6 py-5"
    >
      <h2 className="mb-3 text-[1.05rem] font-bold">{label}</h2>
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
  );
}

export function LegalBody({
  sections,
  locale,
}: {
  sections: Section[];
  locale: Locale;
}) {
  return (
    <div className="prose mt-8">
      {sections.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-24">
          <h2>{pick(locale, s.title.ko, s.title.en)}</h2>
          {s.blocks.map((b, i) => (
            <LegalBlock key={i} block={b} locale={locale} />
          ))}
        </section>
      ))}
    </div>
  );
}
