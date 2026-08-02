import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getPeople } from "@/lib/people.server";
import { getT } from "@/lib/locale.server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NoticeCard from "@/components/NoticeCard";
import PeopleStrip from "@/components/PeopleStrip";
import PopupMount from "@/components/PopupMount";
import PreviewBanner from "@/components/PreviewBanner";
import { isPreviewMode } from "@/lib/preview";

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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const isPreview = await isPreviewMode(preview);

  // 병렬 실행 — 직렬로 쌓이면 그만큼 LCP가 밀린다
  const [notices, seniors, { t, locale }] = await Promise.all([
    getLatestNotices(),
    getPeople("senior", { includeUnpublished: isPreview }),
    getT(),
  ]);

  return (
    <>
      {isPreview && (
        <PreviewBanner note="비공개 인물과 미게시 팝업을 함께 보여주고 있습니다." />
      )}
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
              SEOUL 50<span>+</span>
              {locale === "en" ? " SELECTED PROJECT" : " 선정사업"}
            </div>
            <h1 className="hero-h1">
              {locale === "en" ? (
                <>
                  Show us the Seoul
                  <br />
                  <span className="kw">only you</span> know
                </>
              ) : (
                <>
                  여러분만이 알고 있는
                  <br />
                  서울의 <span className="kw">‘로컬함’</span>을 알려주세요
                </>
              )}
            </h1>
            <p className="hero-sub">{t("home.sub")}</p>
            <div className="hero-actions">
              {/* 신청 종류가 셋이라 폼 직행 대신 선택 페이지로 보낸다 */}
              <Link className="btn btn-primary" href="/apply">
                {t("nav.apply")}
              </Link>
              <Link className="link-chev" href="/notice">
                {t("home.viewNotice")}
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="sec-top">
              <div>
                <div className="eyebrow">{t("home.noticeEyebrow")}</div>
                <h2>{t("home.noticeTitle")}</h2>
                <p className="sec-sub">{t("home.noticeSub")}</p>
              </div>
              <Link className="more" href="/notice">
                {t("home.noticeAll")}
              </Link>
            </div>
            {notices.length > 0 ? (
              <div className="cards">
                {notices.map((n) => (
                  <NoticeCard key={n.id} n={n} />
                ))}
              </div>
            ) : (
              <div className="empty">{t("home.noticeEmpty")}</div>
            )}
          </div>
        </section>

        <PeopleStrip people={seniors} />
      </main>
      <SiteFooter />
      <PopupMount page="home" preview={isPreview} />
    </>
  );
}
