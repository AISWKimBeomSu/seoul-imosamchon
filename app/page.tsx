import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getPeople } from "@/lib/people.server";
import { getFormsFor } from "@/lib/forms.server";
import { getSessionsByForm } from "@/lib/sessions.server";
import { isBookableForm } from "@/lib/forms";
import { openSessionCount } from "@/lib/sessions";
import { getT } from "@/lib/locale.server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NoticeCard from "@/components/NoticeCard";
import PeopleStrip from "@/components/PeopleStrip";
import PopupMount from "@/components/PopupMount";
import PreviewBanner from "@/components/PreviewBanner";
import ExperienceCard from "@/components/ExperienceCard";
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
  const [notices, seniors, { t, locale }, classes, sessionsByForm] =
    await Promise.all([
      getLatestNotices(),
      getPeople("senior", { includeUnpublished: isPreview }),
      getT(),
      getFormsFor("guest"),
      getSessionsByForm(),
    ]);

  // 지금 실제로 신청을 받고 있는 체험만 첫 화면에 올린다.
  // 마감된 걸 섞으면 "뭘 눌러야 하지"가 되고, 전환이 떨어진다.
  const openClasses = classes.filter((f) =>
    isBookableForm(
      f,
      openSessionCount(sessionsByForm.get(f.key) ?? [], f.cutoff_hours ?? 0),
    ),
  );

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

        {/* 지금 예약받는 체험 — 히어로 바로 아래.
            공지보다 먼저 두는 이유: 손님이 첫 화면에서 찾는 건 "무엇을 언제
            할 수 있나"이지 공지사항이 아니다. 열린 체험이 없으면 통째로 빠진다. */}
        {openClasses.length > 0 && (
          <section className="section">
            <div className="wrap">
              <div className="sec-top">
                <div>
                  <div className="eyebrow">{t("home.bookingEyebrow")}</div>
                  <h2>{t("home.bookingTitle")}</h2>
                  <p className="sec-sub">{t("home.bookingSub")}</p>
                </div>
                <Link className="more" href="/about#classes">
                  {t("home.bookingAll")}
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {openClasses.map((f) => (
                  <ExperienceCard
                    key={f.key}
                    form={f}
                    sessions={sessionsByForm.get(f.key) ?? []}
                    locale={locale}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

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
