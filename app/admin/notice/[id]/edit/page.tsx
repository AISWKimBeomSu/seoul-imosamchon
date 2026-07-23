import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAdmin, createClient } from "@/lib/supabase/server";
import NoticeEditor from "@/app/admin/NoticeEditor";

export const dynamic = "force-dynamic";

export default async function EditNoticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const supabase = await createClient();
  const { data: notice } = await supabase
    .from("notices")
    .select("*, attachments(*)")
    .eq("id", id)
    .maybeSingle();

  if (!notice) notFound();

  const attachments = [...(notice.attachments ?? [])].sort(
    (a: { sort: number }, b: { sort: number }) => a.sort - b.sort,
  );

  return (
    <main className="admin-wrap">
      <div className="admin-top">
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>공지 수정</h1>
          <p className="sec-sub">{notice.title}</p>
        </div>
        <Link href="/admin" className="btn btn-ghost nav-cta">
          ← 관리자
        </Link>
      </div>
      <NoticeEditor notice={notice} attachments={attachments} />
    </main>
  );
}
