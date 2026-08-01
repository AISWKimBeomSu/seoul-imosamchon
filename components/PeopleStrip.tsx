import Link from "next/link";
import PersonCard from "@/components/PersonCard";
import type { Person } from "@/lib/people";

/**
 * 홈의 인물 섹션. 인원이 0명이면 아무것도 렌더하지 않는다 —
 * 빈 섹션이 홈에 구멍을 내는 것보다 없는 편이 낫다.
 */
export default function PeopleStrip({ people }: { people: Person[] }) {
  if (people.length === 0) return null;

  return (
    <section className="section soft">
      <div className="wrap">
        <div className="sec-top">
          <div>
            <div className="eyebrow">우리 사람들</div>
            <h2>이런 분들이 함께합니다</h2>
            <p className="sec-sub">
              평범한 서울의 이모·삼촌이라서 특별합니다.
            </p>
          </div>
          <Link className="more" href="/people">
            우리 이모·삼촌 모두 보기 →
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
