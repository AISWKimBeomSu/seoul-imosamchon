import Link from "next/link";
import PersonCard from "@/components/PersonCard";
import { getT } from "@/lib/locale.server";
import type { Person } from "@/lib/people";

/**
 * 홈의 인물 섹션. 인원이 0명이면 아무것도 렌더하지 않는다 —
 * 빈 섹션이 홈에 구멍을 내는 것보다 없는 편이 낫다.
 */
export default async function PeopleStrip({ people }: { people: Person[] }) {
  if (people.length === 0) return null;
  const { t } = await getT();

  return (
    <section className="section soft">
      <div className="wrap">
        <div className="sec-top">
          <div>
            <div className="eyebrow">{t("home.peopleEyebrow")}</div>
            <h2>{t("home.peopleTitle")}</h2>
            <p className="sec-sub">{t("home.peopleSub")}</p>
          </div>
          <Link className="more" href="/people">
            {t("home.peopleAll")}
          </Link>
        </div>
        <div className="people-grid">
          {people.slice(0, 3).map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
