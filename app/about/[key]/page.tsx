import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PersonAvatar from "@/components/PersonAvatar";
import PopupMount from "@/components/PopupMount";
import CopyLink from "@/components/CopyLink";
import { getForm, getFormsFor } from "@/lib/forms.server";
import { getPeople } from "@/lib/people.server";
import { isFormAvailable, posterUrl } from "@/lib/forms";
import { qrVersion } from "@/lib/qr";
import { getSiteOrigin } from "@/lib/origin";
import { goHref } from "@/lib/links";
import { getSiteConfig } from "@/lib/config";
import { getT, getLocale } from "@/lib/locale.server";
import { pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/** 클래스만 상세 페이지를 갖는다. 시니어 모집은 공지/신청 페이지 소관이다. */
async function getClass(key: string) {
  const form = await getForm(key);
  if (!form || form.audience !== "guest") return null;
  return form;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const [form, locale] = await Promise.all([getClass(key), getLocale()]);
  if (!form) return { title: "Not found" };
  return {
    title: pick(locale, form.title, form.title_en),
    description: pick(locale, form.description, form.description_en),
  };
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const form = await getClass(key);
  if (!form) notFound();

  const [{ t, locale }, hosts, others, cfg, site] = await Promise.all([
    getT(),
    getPeople("senior"),
    getFormsFor("guest"),
    getSiteConfig(),
    getSiteOrigin(),
  ]);

  const title = pick(locale, form.title, form.title_en);
  const subtitle = pick(locale, form.subtitle, form.subtitle_en);
  const description = pick(locale, form.description, form.description_en);
  const ctaLabel = pick(locale, form.cta_label, form.cta_label_en);
  const closedNote = pick(locale, form.closed_note, form.closed_note_en);
  const detail = pick(locale, form.detail, form.detail_en);

  const poster = posterUrl(form.poster_path);
  const available = isFormAvailable(form);
  // ★ 이 페이지의 신청 버튼은 이 클래스의 폼으로만 간다.
  const href = goHref(form.key, "class");
  const siblings = others.filter((f) => f.key !== form.key);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap">
          <Link href="/about" className="backlink">
            {t("class.back")}
          </Link>

          <div className={`cdetail accent-${form.accent}`}>
            <div className="cdetail-main">
              <div className="eyebrow">{t("class.eyebrow")}</div>
              <h1>{title}</h1>
              {subtitle && <p className="cdetail-sub">{subtitle}</p>}
              {description && <p className="cdetail-lead">{description}</p>}

              {poster && (
                <a
                  className="cdetail-poster"
                  href={poster}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src={poster}
                    alt={form.poster_alt}
                    width={1200}
                    height={1600}
                    sizes="(max-width: 900px) 92vw, 620px"
                    priority
                  />
                  <span className="popup-zoom">{t("class.zoom")}</span>
                </a>
              )}

              {detail && (
                <div className="prose cdetail-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                  >
                    {detail}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* 따라다니는 신청 상자 — 스크롤이 길어도 신청이 늘 손에 닿는다 */}
            <aside className="cdetail-side">
              <div className="cbox">
                <h2>{title}</h2>
                {subtitle && <p className="cbox-sub">{subtitle}</p>}

                {available ? (
                  <>
                    <a
                      className="btn btn-primary cbox-cta"
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {ctaLabel}
                      <span className="sr-only">{t("common.newWindow")}</span>
                    </a>
                    <div className="cbox-qr">
                      {/* eslint-disable-next-line @next/next/no-img-element -- 서버 생성 SVG */}
                      <img
                        src={`/api/qr/${form.key}?v=${qrVersion(form.url)}`}
                        width={160}
                        height={160}
                        alt={`${title} QR`}
                      />
                      <span>{t("common.scanQr")}</span>
                    </div>
                    <div className="cbox-copy">
                      <CopyLink
                        value={`${site}${href}`}
                        label={t("common.copyLink")}
                        copiedLabel={t("common.copied")}
                        failLabel={t("common.copyFail")}
                        className="btn btn-ghost cbox-cta"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <span className="btn is-closed cbox-cta" aria-disabled="true">
                      {t("common.preparing")}
                    </span>
                    <p className="cbox-note">{closedNote}</p>
                    <a className="btn btn-ghost cbox-cta" href={`mailto:${cfg.contact_email}`}>
                      {t("class.emailUs")}
                    </a>
                  </>
                )}
              </div>
            </aside>
          </div>

          {hosts.length > 0 && (
            <section className="section" style={{ paddingBottom: 0 }}>
              <div className="eyebrow">{t("guest.hostsEyebrow")}</div>
              <h2
                style={{
                  fontSize: "clamp(1.3rem,2.4vw,1.7rem)",
                  fontWeight: 800,
                  margin: "0.2rem 0 1.2rem",
                }}
              >
                {t("guest.hostsTitle")}
              </h2>
              <div className="people-grid team">
                {hosts.slice(0, 3).map((p) => (
                  <article className="pcard team" key={p.id}>
                    <PersonAvatar person={p} size={96} />
                    <h3>{p.name}</h3>
                    {pick(locale, p.region, p.region_en) && (
                      <p className="pcard-role">{pick(locale, p.region, p.region_en)}</p>
                    )}
                    {pick(locale, p.tagline, p.tagline_en) && (
                      <p className="pcard-tagline">{pick(locale, p.tagline, p.tagline_en)}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {siblings.length > 0 && (
            <section className="section" style={{ paddingBottom: 0 }}>
              <div className="eyebrow">{t("class.otherEyebrow")}</div>
              <h2
                style={{
                  fontSize: "clamp(1.3rem,2.4vw,1.7rem)",
                  fontWeight: 800,
                  margin: "0.2rem 0 1.2rem",
                }}
              >
                {t("class.otherTitle")}
              </h2>
              <div className="row">
                {siblings.map((f) => (
                  <Link key={f.key} className="btn btn-ghost" href={`/about/${f.key}`}>
                    {pick(locale, f.title, f.title_en)} →
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
      <PopupMount page="other" />
    </>
  );
}
