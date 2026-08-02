import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NoticeCard from "@/components/NoticeCard";
import PopupMount from "@/components/PopupMount";
import { getT, getLocale } from "@/lib/locale.server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const en = (await getLocale()) === "en";
  return {
    title: en ? "Notices" : "공지사항",
    description: en ? "Announcements and recruitment notices." : "서울이모삼촌 공지사항과 모집 공고.",
  };
}

export default async function NoticeListPage() {
  const supabase = await createClient();
  const [{ data: notices }, { t, locale }] = await Promise.all([
    supabase
      .from("notices")
      .select("id, category, title, dday, created_at, attachments(count)")
      .eq("is_published", true)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    getT(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap">
          <div className="eyebrow">{t("notice.eyebrow")}</div>
          <h1
            style={{
              fontSize: "clamp(1.6rem,3vw,2rem)",
              fontWeight: 800,
              margin: "0.2rem 0 0.3rem",
            }}
          >
            {t("notice.title")}
          </h1>
          <p className="sec-sub" style={{ marginBottom: "1.6rem" }}>
            {t("notice.sub")}
          </p>

          {/* 공지 본문은 한국어로만 작성된다. 영어 사용자에게 그 사실을 미리 알린다. */}
          {locale === "en" && (
            <div className="alert ok" style={{ marginBottom: "1.4rem" }}>
              {t("notice.koreanOnly")}
            </div>
          )}

          {notices && notices.length > 0 ? (
            <div className="cards">
              {notices.map((n) => (
                <NoticeCard key={n.id} n={n} />
              ))}
            </div>
          ) : (
            <div className="empty">{t("notice.empty")}</div>
          )}
        </div>
      </main>
      <SiteFooter />
      <PopupMount page="other" />
    </>
  );
}
