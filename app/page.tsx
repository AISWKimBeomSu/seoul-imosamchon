import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NoticeCard from "@/components/NoticeCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: notices } = await supabase
    .from("notices")
    .select("id, category, title, dday, created_at, attachments(count)")
    .eq("is_published", true)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4);

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
              <Link className="btn btn-primary" href="/apply">
                신청하기
              </Link>
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
            {notices && notices.length > 0 ? (
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
      </main>
      <SiteFooter />
    </>
  );
}
