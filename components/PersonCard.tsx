import PersonAvatar from "@/components/PersonAvatar";
import type { Person } from "@/lib/people";

/**
 * 시니어 카드는 인용구를 강조하고(브랜드 서사의 증거),
 * 팀 카드는 역할 중심으로 담백하게 — 시니어가 주인공이고 팀은 조력자라는
 * 위계를 시각적으로 만든다.
 */
export default function PersonCard({ person }: { person: Person }) {
  const isTeam = person.kind === "team";

  return (
    <article className={`pcard${isTeam ? " team" : ""}`}>
      <PersonAvatar person={person} size={isTeam ? 96 : 132} />
      <h3>{person.name}</h3>
      {(person.role || person.region) && (
        <p className="pcard-role">
          {person.role}
          {person.role && person.region ? " · " : ""}
          {person.region ?? ""}
        </p>
      )}
      {person.tagline && <p className="pcard-tagline">{person.tagline}</p>}
      {!isTeam && person.quote && (
        <blockquote className="pcard-quote">“{person.quote}”</blockquote>
      )}
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
