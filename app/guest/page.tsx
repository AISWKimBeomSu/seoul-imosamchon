import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PersonAvatar from "@/components/PersonAvatar";
import ApplyButton from "@/components/ApplyButton";
import PopupMount from "@/components/PopupMount";
import { getSiteConfig, formState } from "@/lib/config";
import { getPeople } from "@/lib/people.server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Home Cooking with Seoul Aunts and Uncles",
  description:
    "Cook a real Korean home meal with a Seoul local in their sixties. Traditional market shopping, a home kitchen, and stories you cannot get from a restaurant.",
  alternates: { canonical: "/guest" },
  openGraph: {
    title: "Seoul Imo Samchon — Home Cooking with Seoul Locals",
    description:
      "Market shopping, home cooking, and real stories with Seoul residents in their sixties.",
    type: "website",
    locale: "en_US",
  },
};

const STEPS = [
  {
    n: "1",
    title: "Meet at the market",
    body: "Start at Mangwon Market with your host. Taste as you go, and pick up what you will cook together.",
  },
  {
    n: "2",
    title: "Cook in a real home kitchen",
    body: "Not a studio. An actual Seoul kitchen, with the pots and the recipes a family has used for forty years.",
  },
  {
    n: "3",
    title: "Eat, and hear the stories",
    body: "Sit down to the meal you made. Your host has lived in this neighbourhood longer than most guidebooks have existed.",
  },
];

export default async function GuestPage({
  searchParams,
}: {
  searchParams: Promise<{ closed?: string }>;
}) {
  const [{ closed }, cfg, hosts] = await Promise.all([
    searchParams,
    getSiteConfig(),
    getPeople("senior"),
  ]);
  const guest = formState(cfg, "guest");

  return (
    <>
      <SiteHeader />
      {/* 루트 레이아웃은 lang="ko"다. 이 서브트리만 영어로 선언해
          스크린리더가 영어 발음으로 읽도록 한다 (WCAG 3.1.2) */}
      <main lang="en">
        <section className="guest-hero">
          <div className="wrap">
            <div className="eyebrow" style={{ justifyContent: "center" }}>
              Seoul Imo Samchon
            </div>
            <h1
              style={{
                fontSize: "clamp(1.8rem,4vw,2.7rem)",
                fontWeight: 800,
                lineHeight: 1.25,
                margin: "0.3rem auto 0.8rem",
                maxWidth: "18ch",
              }}
            >
              Cook a real Korean home meal with a Seoul local
            </h1>
            <p
              style={{
                color: "var(--sub)",
                fontSize: "1.12rem",
                maxWidth: "46ch",
                margin: "0 auto 1.6rem",
              }}
            >
              Your host is in their sixties and has shopped at the same market for
              thirty years. A kitchen can be rented. That cannot.
            </p>

            {closed === "1" && (
              <div
                className="alert err"
                role="status"
                style={{ maxWidth: 520, margin: "0 auto 1.2rem" }}
              >
                Bookings are not open right now. Please write to us at{" "}
                <a href={`mailto:${cfg.contact_email}`}>{cfg.contact_email}</a>.
              </div>
            )}

            {guest.available ? (
              <ApplyButton linkKey="guest" source="guest" />
            ) : (
              <div style={{ color: "var(--sub)" }}>
                <p style={{ marginBottom: "0.6rem" }}>
                  <b>Bookings open soon.</b>
                </p>
                <p>
                  Write to us at{" "}
                  <a href={`mailto:${cfg.contact_email}`}>{cfg.contact_email}</a> and
                  we will let you know first.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="eyebrow">What you will do</div>
            <h2
              style={{
                fontSize: "clamp(1.35rem,2.6vw,1.9rem)",
                fontWeight: 800,
                margin: "0.2rem 0 1.3rem",
              }}
            >
              Three hours, one neighbourhood
            </h2>
            <div className="guest-cards">
              {STEPS.map((s) => (
                <div className="card" key={s.n}>
                  <div className="guest-step" aria-hidden="true">
                    {s.n}
                  </div>
                  <h3
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 800,
                      marginBottom: "0.4rem",
                    }}
                  >
                    {s.title}
                  </h3>
                  <p style={{ color: "#4b453d" }}>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {hosts.length > 0 && (
          <section className="section soft">
            <div className="wrap">
              <div className="eyebrow">Your hosts</div>
              <h2
                style={{
                  fontSize: "clamp(1.35rem,2.6vw,1.9rem)",
                  fontWeight: 800,
                  margin: "0.2rem 0 1.3rem",
                }}
              >
                Real people, not a company
              </h2>
              <div className="people-grid team">
                {hosts.slice(0, 3).map((p) => (
                  <article className="pcard team" key={p.id}>
                    <PersonAvatar person={p} size={96} />
                    <h3>{p.name}</h3>
                    {p.region && <p className="pcard-role">{p.region}</p>}
                    {p.tagline && <p className="pcard-tagline">{p.tagline}</p>}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="section">
          <div className="wrap">
            <div className="people-cta">
              <h2>Ready to cook?</h2>
              <p>
                No Korean needed. A younger team member joins to help with
                translation.
              </p>
              {guest.available ? (
                <ApplyButton linkKey="guest" source="guest" />
              ) : (
                <a className="btn btn-ghost" href={`mailto:${cfg.contact_email}`}>
                  Email us
                </a>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <PopupMount page="other" />
    </>
  );
}
