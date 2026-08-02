import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getAdmin } from "@/lib/supabase/server";
import { popupStatus, POPUP_COLS, type Popup } from "@/lib/popups";
import { formatDate } from "@/lib/notices";
import AdminNav from "@/components/AdminNav";
import PopupForm, { type NoticeOption, type FormOption } from "./PopupForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "팝업 관리" };

export default async function AdminPopupsPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");

  const supabase = await createClient();
  const [{ data: popups }, { data: notices }, { data: formRows }] =
    await Promise.all([
      supabase
        .from("popups")
        .select(POPUP_COLS)
        .order("sort", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("notices")
        .select("id, title")
        .eq("is_published", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("forms")
        .select("key, title, is_open, url")
        .order("sort", { ascending: true }),
    ]);

  const list = (popups ?? []) as Popup[];
  const forms: FormOption[] = (
    (formRows ?? []) as { key: string; title: string; is_open: boolean; url: string | null }[]
  ).map((f) => ({
    key: f.key,
    title: f.title,
    is_open: f.is_open,
    has_url: Boolean(f.url),
  }));

  return (
    <main className="admin-wrap">
      <div className="admin-top">
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>팝업 관리</h1>
          <p className="sec-sub">
            기간을 정해두면 시작일에 저절로 뜨고 종료일에 저절로 사라집니다.
          </p>
        </div>
        <Link href="/" className="btn btn-ghost nav-cta">
          사이트 보기
        </Link>
      </div>

      <AdminNav current="/admin/popups" />

      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.8rem" }}>
        등록된 팝업
      </h2>
      <ul className="admin-list" style={{ marginTop: 0 }}>
        {list.map((p) => {
          const st = popupStatus(p);
          return (
            <li key={p.id}>
              <span className={`badge ${st.cls}`}>{st.label}</span>
              <span className="t">{p.title}</span>
              <span className="m">
                {p.image_path ? "포스터 있음 · " : ""}
                {p.link_kind === "form" && p.form_key ? `${p.form_key} · ` : ""}
                {p.scope === "home" ? "홈에서만" : "모든 페이지"} ·{" "}
                {formatDate(p.starts_at)}
                {p.ends_at ? ` ~ ${formatDate(p.ends_at)}` : " ~ 무기한"}
              </span>
              <Link
                href={`/admin/popups/${p.id}/edit`}
                className="more"
                style={{ fontSize: "0.9rem", flex: "none" }}
              >
                수정
              </Link>
            </li>
          );
        })}
        {list.length === 0 && (
          <li style={{ border: "none", padding: 0 }}>
            <div className="empty">
              아직 만든 팝업이 없습니다. 아래에서 첫 팝업을 만들어 보세요.
            </div>
          </li>
        )}
      </ul>

      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "2.2rem 0 0.8rem" }}>
        새 팝업 만들기
      </h2>
      <PopupForm notices={(notices ?? []) as NoticeOption[]} forms={forms} />
    </main>
  );
}
