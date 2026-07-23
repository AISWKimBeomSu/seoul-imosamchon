import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NoticeCard from "@/components/NoticeCard";

export const dynamic = "force-dynamic";

export const metadata = { title: "공지사항" };

export default async function NoticeListPage() {
  const supabase = await createClient();
  const { data: notices } = await supabase
    .from("notices")
    .select("id, category, title, dday, created_at, attachments(count)")
    .eq("is_published", true)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap">
          <div className="eyebrow">공지사항</div>
          <h1 style={{ fontSize: "clamp(1.6rem,3vw,2rem)", fontWeight: 800, margin: "0.2rem 0 0.3rem" }}>
            공지사항
          </h1>
          <p className="sec-sub" style={{ marginBottom: "1.6rem" }}>
            모집 공고와 안내입니다. 카드를 누르면 상세 내용과 첨부파일을 볼 수 있어요.
          </p>
          {notices && notices.length > 0 ? (
            <div className="cards">
              {notices.map((n) => (
                <NoticeCard key={n.id} n={n} />
              ))}
            </div>
          ) : (
            <div className="empty">아직 등록된 공지가 없습니다.</div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
