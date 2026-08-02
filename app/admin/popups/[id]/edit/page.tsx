import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient, getAdmin } from "@/lib/supabase/server";
import { popupStatus, POPUP_COLS, type Popup } from "@/lib/popups";
import AdminNav from "@/components/AdminNav";
import PopupForm, {
  type NoticeOption,
  type FormOption,
} from "@/app/admin/popups/PopupForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "팝업 수정" };

export default async function EditPopupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const supabase = await createClient();
  const [{ data: popup }, { data: notices }, { data: formRows }] =
    await Promise.all([
      supabase.from("popups").select(POPUP_COLS).eq("id", id).maybeSingle(),
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

  if (!popup) notFound();
  const p = popup as Popup;
  const st = popupStatus(p);
  const forms: FormOption[] = (
    (formRows ?? []) as {
      key: string;
      title: string;
      is_open: boolean;
      url: string | null;
    }[]
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
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>팝업 수정</h1>
          <p className="sec-sub">
            <span className={`badge ${st.cls}`}>{st.label}</span> {p.title}
          </p>
        </div>
        <Link href="/admin/popups" className="btn btn-ghost nav-cta">
          ← 팝업 목록
        </Link>
      </div>

      <AdminNav current="/admin/popups" />

      <PopupForm
        popup={p}
        notices={(notices ?? []) as NoticeOption[]}
        forms={forms}
      />
    </main>
  );
}
