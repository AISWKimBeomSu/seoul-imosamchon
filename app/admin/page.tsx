import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getAdmin } from "@/lib/supabase/server";
import { getSiteConfig, formState } from "@/lib/config";
import { getActivePopup } from "@/lib/popups";
import { signOut } from "./actions";
import NoticeComposer from "./NoticeComposer";
import AdminNav from "@/components/AdminNav";
import ClickSummary from "@/components/ClickSummary";
import { tagClass, formatDate } from "@/lib/notices";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");

  const supabase = await createClient();
  const [{ data: notices }, cfg, popup, { count: peopleCount }] =
    await Promise.all([
      supabase
        .from("notices")
        .select("id, category, title, is_published, created_at, attachments(count)")
        .order("created_at", { ascending: false }),
      getSiteConfig(),
      getActivePopup("home"),
      supabase
        .from("people")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
    ]);

  const senior = formState(cfg, "senior");
  const guest = formState(cfg, "guest");

  return (
    <main className="admin-wrap">
      <div className="admin-top">
        <div>
          <h1 style={{ fontSize: "1.7rem", fontWeight: 800 }}>관리자</h1>
          <p className="sec-sub">
            {admin.name} 님 · {admin.email}
          </p>
        </div>
        <div className="row">
          <Link href="/" className="btn btn-ghost nav-cta">
            사이트 보기
          </Link>
          <form action={signOut}>
            <button className="btn btn-ghost nav-cta" type="submit">
              로그아웃
            </button>
          </form>
        </div>
      </div>

      <AdminNav current="/admin" />

      {/* 로그인 직후 "지금 무엇이 켜져 있는가"를 한눈에 */}
      <div className="admin-status">
        <div className="admin-stat">
          <span className="k">시니어 모집 폼</span>
          <span className="v">
            <span className={`dot ${senior.available ? "on" : "off"}`} />
            {senior.available ? "접수 중" : senior.url ? "접수 마감" : "미설정"}
          </span>
        </div>
        <div className="admin-stat">
          <span className="k">손님 모객 폼</span>
          <span className="v">
            <span className={`dot ${guest.available ? "on" : "off"}`} />
            {guest.available ? "접수 중" : guest.url ? "접수 마감" : "미설정"}
          </span>
        </div>
        <div className="admin-stat">
          <span className="k">팝업</span>
          <span className="v">
            <span className={`dot ${popup ? "on" : "off"}`} />
            {popup
              ? `노출 중${popup.ends_at ? ` (~${formatDate(popup.ends_at)})` : ""}`
              : "없음"}
          </span>
        </div>
        <div className="admin-stat">
          <span className="k">소개된 사람</span>
          <span className="v">
            <span className={`dot ${peopleCount ? "on" : "off"}`} />
            {peopleCount ?? 0}명 게시 중
          </span>
        </div>
      </div>

      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 0.8rem" }}>
        최근 30일 신청 클릭
      </h2>
      <ClickSummary />

      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "2.2rem 0 0.8rem" }}>
        새 공지 작성
      </h2>
      <NoticeComposer />

      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: "2.2rem" }}>
        게시된 공지
      </h2>
      <ul className="admin-list">
        {(notices ?? []).map(
          (n: {
            id: string;
            category: string;
            title: string;
            is_published: boolean;
            created_at: string;
            attachments?: { count: number }[];
          }) => (
            <li key={n.id}>
              <span className={tagClass(n.category)}>{n.category}</span>
              <Link href={`/notice/${n.id}`} className="t">
                {n.title}
              </Link>
              <span className="m">
                첨부 {n.attachments?.[0]?.count ?? 0} · {formatDate(n.created_at)}
                {n.is_published ? "" : " · 비공개"}
              </span>
              <Link
                href={`/admin/notice/${n.id}/edit`}
                className="more"
                style={{ fontSize: "0.9rem", flex: "none" }}
              >
                수정
              </Link>
            </li>
          ),
        )}
        {(!notices || notices.length === 0) && (
          <li style={{ border: "none", padding: 0 }}>
            <div className="empty">
              아직 게시된 공지가 없습니다. 위에서 첫 공지를 작성해 보세요.
            </div>
          </li>
        )}
      </ul>
    </main>
  );
}
