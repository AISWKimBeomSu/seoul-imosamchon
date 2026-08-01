import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getAdmin } from "@/lib/supabase/server";
import { KIND_LABEL, PERSON_ADMIN_COLS, type AdminPerson } from "@/lib/people";
import AdminNav from "@/components/AdminNav";
import PersonForm from "./PersonForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "사람 소개 관리" };

export default async function AdminPeoplePage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("people")
    .select(PERSON_ADMIN_COLS)
    .order("kind", { ascending: true })
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true });

  const list = (data ?? []) as AdminPerson[];

  return (
    <main className="admin-wrap">
      <div className="admin-top">
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>사람 소개 관리</h1>
          <p className="sec-sub">
            시니어 호스트와 팀원을 <Link href="/people">소개 페이지</Link>에 올립니다.
          </p>
        </div>
        <Link href="/people" className="btn btn-ghost nav-cta">
          소개 페이지 보기
        </Link>
      </div>

      <AdminNav current="/admin/people" />

      <div className="alert ok" style={{ marginBottom: "1.4rem" }}>
        <b>게시 전 확인</b> — 이름과 사진을 웹에 올리는 것은 되돌리기 어렵습니다(검색엔진 노출).
        반드시 본인 동의를 받은 뒤에 공개해 주세요.
      </div>

      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.8rem" }}>
        등록된 사람
      </h2>
      <ul className="admin-list" style={{ marginTop: 0 }}>
        {list.map((p) => (
          <li key={p.id}>
            <span className={`badge ${p.is_published ? "live" : "draft"}`}>
              {p.is_published ? "공개" : "비공개"}
            </span>
            <span className="t">{p.name}</span>
            <span className="m">
              {KIND_LABEL[p.kind]}
              {p.role ? ` · ${p.role}` : ""}
              {p.photo_path ? " · 사진 있음" : " · 사진 없음"}
              {p.consent_at ? "" : " · ⚠ 동의 미확인"}
            </span>
            <Link
              href={`/admin/people/${p.id}/edit`}
              className="more"
              style={{ fontSize: "0.9rem", flex: "none" }}
            >
              수정
            </Link>
          </li>
        ))}
        {list.length === 0 && (
          <li style={{ border: "none", padding: 0 }}>
            <div className="empty">
              아직 등록된 사람이 없습니다. 아래에서 첫 번째 분을 추가해 보세요.
            </div>
          </li>
        )}
      </ul>

      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "2.2rem 0 0.8rem" }}>
        새로 추가하기
      </h2>
      <PersonForm />
    </main>
  );
}
