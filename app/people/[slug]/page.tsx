import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PopupMount from "@/components/PopupMount";
import PersonAvatar from "@/components/PersonAvatar";
import ExperienceCard from "@/components/ExperienceCard";
import { getPeople } from "@/lib/people.server";
import { getHostForms } from "@/lib/hosts.server";
import { getSessionsByForm } from "@/lib/sessions.server";
import { getT } from "@/lib/locale.server";
import { pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

async function getPerson(slug: string) {
  const people = await getPeople();
  return people.find((p) => p.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const person = await getPerson(slug);
  if (!person) return { title: "Not found" };
  return {
    // 브랜드명은 layout의 title.template이 붙인다. 여기서 또 붙이면 두 번 나온다.
    title: person.name,
    description: person.tagline || person.bio.slice(0, 120) || person.role,
    alternates: { canonical: `/people/${slug}` },
  };
}

/**
 * 호스트 상세.
 *
 * 체험 상품에서 호스트는 곁들임이 아니라 상품 자체다. 손님이 "누구와
 * 4시간을 보내는가"를 알아야 예약을 결심한다. 그래서 소개와 함께
 * 이분이 진행하는 체험을 바로 이어 붙인다.
 */
export default async function PersonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const person = await getPerson(slug);
  if (!person) notFound();

  const [{ t, locale }, forms, sessionsByForm] = await Promise.all([
    getT(),
    getHostForms(person.id),
    getSessionsByForm(),
  ]);

  const role = pick(locale, person.role, person.role_en);
  const region = pick(locale, person.region, person.region_en);
  const tagline = pick(locale, person.tagline, person.tagline_en);
  const bio = pick(locale, person.bio, person.bio_en);
  const quote = pick(locale, person.quote, person.quote_en);
  const en = locale === "en";

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap">
          <Link href="/people" className="backlink">
            ← {t("nav.people")}
          </Link>

          <div className="mt-6 max-w-[760px]">
            <div className="flex flex-wrap items-center gap-6">
              <PersonAvatar person={person} size={132} />
              <div>
                <h1 className="m-0 text-[clamp(1.7rem,3.4vw,2.3rem)] font-extrabold">
                  {person.name}
                </h1>
                <p className="m-0 mt-1 text-[1.1rem] font-bold text-point-dark">
                  {role}
                  {region && ` · ${region}`}
                </p>
              </div>
            </div>

            {tagline && (
              <p className="mt-6 text-[1.25rem] font-bold leading-relaxed">{tagline}</p>
            )}

            {quote && (
              <blockquote className="my-7 border-l-4 border-brand pl-5 text-[1.15rem] leading-relaxed text-ink2 italic">
                “{quote}”
              </blockquote>
            )}

            {bio && <p className="mt-5 leading-relaxed whitespace-pre-line">{bio}</p>}

            {person.story && (
              <div className="prose mt-8">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                >
                  {person.story}
                </ReactMarkdown>
              </div>
            )}

            {person.tags.length > 0 && (
              <ul className="mt-7 flex list-none flex-wrap gap-2 p-0">
                {person.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-soft px-4 py-2 font-bold text-sub"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {forms.length > 0 && (
            <section className="mt-14">
              <div className="eyebrow">{en ? "Experiences" : "진행하는 체험"}</div>
              <h2 className="mt-1 mb-6 text-[clamp(1.3rem,2.4vw,1.7rem)] font-extrabold">
                {en
                  ? `Join ${person.name}`
                  : `${person.name}님과 함께하는 체험`}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {forms.map((f) => (
                  <ExperienceCard
                    key={f.key}
                    form={f}
                    sessions={sessionsByForm.get(f.key) ?? []}
                    locale={locale}
                  />
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
