import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getAdmin } from "@/lib/supabase/server";
import { signOut } from "./actions";
import NoticeComposer from "./NoticeComposer";
import { tagClass, formatDate } from "@/lib/notices";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");

  const supabase = await createClient();
  const { data: notices } = await supabase
    .from("notices")
    .select("id, category, title, is_published, created_at, attachments(count)")
    .order("created_at", { ascending: false });

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
