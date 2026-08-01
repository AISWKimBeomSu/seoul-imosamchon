import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getPeople } from "@/lib/people.server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NoticeCard from "@/components/NoticeCard";
import ApplyButton from "@/components/ApplyButton";
import PeopleStrip from "@/components/PeopleStrip";
import PopupMount from "@/components/PopupMount";

export const dynamic = "force-dynamic";

async function getLatestNotices() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notices")
    .select("id, category, title, dday, created_at, attachments(count)")
    .eq("is_published", true)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4);
  return data ?? [];
}

export default async function Home() {
  // 병렬 실행 — 직렬로 쌓이면 그만큼 LCP가 밀린다
  const [notices, seniors] = await Promise.all([
    getLatestNotices(),
    getPeople("senior"),
  ]);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="wrap">
            <Image
              className="hero-logo"
              src="/brand/logo.png"
              alt="서울이모삼촌 — Authentic Korean Home Cooking and Tours"
              width={1024}
              height={1024}
              priority
            />
            <div className="hero-eyebrow">
              SEOUL 50<span>+</span> 선정사업
            </div>
            <h1 className="hero-h1">
              여러분만이 알고 있는
              <br />
              서울의 <span className="kw">‘로컬함’</span>을 알려주세요
            </h1>
            <p className="hero-sub">
              만 60세 이상 시니어와 함께하는 유급 로컬 체험.
            </p>
            <div className="hero-actions">
              {/* 클릭 1회로 구글폼까지 (v1.1 이전에는 4회였다) */}
              <ApplyButton source="hero" label="신청하기" />
              <Link className="link-chev" href="/notice">
                모집 공고 보기 ›
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="sec-top">
              <div>
                <div className="eyebrow">공지사항</div>
                <h2>최신 소식</h2>
                <p className="sec-sub">
                  모집 공고와 안내를 이곳에 올립니다. 카드를 누르면 상세 페이지로 이동해요.
                </p>
              </div>
              <Link className="more" href="/notice">
                공지사항 전체보기 →
              </Link>
            </div>
            {notices.length > 0 ? (
              <div className="cards">
                {notices.map((n) => (
                  <NoticeCard key={n.id} n={n} />
                ))}
              </div>
            ) : (
              <div className="empty">첫 공지가 곧 올라올 예정이에요.</div>
            )}
          </div>
        </section>

        <PeopleStrip people={seniors} />
      </main>
      <SiteFooter />
      <PopupMount page="home" />
    </>
  );
}
