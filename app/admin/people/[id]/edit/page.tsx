import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient, getAdmin } from "@/lib/supabase/server";
import { KIND_LABEL, PERSON_ADMIN_COLS, type AdminPerson } from "@/lib/people";
import AdminNav from "@/components/AdminNav";
import PersonForm from "@/app/admin/people/PersonForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "사람 소개 수정" };

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("people")
    .select(PERSON_ADMIN_COLS)
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const person = data as AdminPerson;

  return (
    <main className="admin-wrap">
      <div className="admin-top">
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>사람 소개 수정</h1>
          <p className="sec-sub">
            {KIND_LABEL[person.kind]} · {person.name}
          </p>
        </div>
        <Link href="/admin/people" className="btn btn-ghost nav-cta">
          ← 목록
        </Link>
      </div>

      <AdminNav current="/admin/people" />

      <PersonForm person={person} />
    </main>
  );
}
