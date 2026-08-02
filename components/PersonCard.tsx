import PersonAvatar from "@/components/PersonAvatar";
import { getT } from "@/lib/locale.server";
import { pick } from "@/lib/i18n";
import type { Person } from "@/lib/people";

/**
 * 시니어 카드는 인용구를 강조하고(브랜드 서사의 증거),
 * 팀 카드는 역할 중심으로 담백하게 — 시니어가 주인공이고 팀은 조력자라는
 * 위계를 시각적으로 만든다.
 */
export default async function PersonCard({ person }: { person: Person }) {
  const { locale } = await getT();
  const isTeam = person.kind === "team";

  const role = pick(locale, person.role, person.role_en);
  const region = pick(locale, person.region, person.region_en);
  const tagline = pick(locale, person.tagline, person.tagline_en);
  const quote = pick(locale, person.quote, person.quote_en);

  return (
    <article className={`pcard${isTeam ? " team" : ""}`}>
      <PersonAvatar person={person} size={isTeam ? 96 : 132} />
      <h3>{person.name}</h3>
      {(role || region) && (
        <p className="pcard-role">
          {role}
          {role && region ? " · " : ""}
          {region}
        </p>
      )}
      {tagline && <p className="pcard-tagline">{tagline}</p>}
      {!isTeam && quote && <blockquote className="pcard-quote">“{quote}”</blockquote>}
      {person.tags.length > 0 && (
        <ul className="pcard-tags">
          {person.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
