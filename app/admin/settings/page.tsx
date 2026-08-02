import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getAdmin } from "@/lib/supabase/server";
import { getSiteConfig } from "@/lib/config";
import { FORM_ADMIN_COLS, isFormAvailable, type AdminForm } from "@/lib/forms";
import AdminNav from "@/components/AdminNav";
import QrPanel from "@/components/QrPanel";
import SettingsForm from "./SettingsForm";
import ContactForm from "./ContactForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "신청 폼 설정" };

export default async function AdminSettingsPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");

  const supabase = await createClient();
  const [{ data }, cfg] = await Promise.all([
    supabase
      .from("forms")
      .select(FORM_ADMIN_COLS)
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true }),
    getSiteConfig(),
  ]);

  const forms = (data ?? []) as AdminForm[];

  return (
    <main className="admin-wrap">
      <div className="admin-top">
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>신청 폼 설정</h1>
          <p className="sec-sub">
            여기서 바꾼 주소가 신청 페이지·팝업·QR에 그대로 쓰입니다.
          </p>
        </div>
        <Link href="/apply" className="btn btn-ghost nav-cta">
          신청 페이지 보기
        </Link>
      </div>

      <AdminNav current="/admin/settings" />

      <div className="admin-status">
        {forms.map((f) => (
          <div className="admin-stat" key={f.id}>
            <span className="k">{f.title}</span>
            <span className="v">
              <span className={`dot ${isFormAvailable(f) ? "on" : "off"}`} />
              {isFormAvailable(f)
                ? "접수 중"
                : f.url
                  ? "준비 중"
                  : "주소 미설정"}
            </span>
          </div>
        ))}
      </div>

      {forms.map((f) => (
        <SettingsForm key={f.id} form={f} />
      ))}

      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "2rem 0 0.8rem" }}>
        연락 정보
      </h2>
      <ContactForm initial={cfg} />

      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "2.2rem 0 0.3rem" }}>
        QR 코드
      </h2>
      <p className="sec-sub" style={{ marginBottom: "1rem" }}>
        폼 주소를 바꾸면 QR도 자동으로 바뀝니다. 포스터·현수막에 쓰실 땐 저장해서 쓰세요.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 16,
        }}
      >
        {forms.filter(isFormAvailable).map((f) => (
          <div key={f.id}>
            <p style={{ fontWeight: 800, marginBottom: "0.5rem" }}>{f.title}</p>
            <QrPanel formKey={f.key} caption="스캔하면 신청 화면이 열립니다" />
          </div>
        ))}
        {forms.filter(isFormAvailable).length === 0 && (
          <div className="empty">
            접수 중인 폼이 없습니다. 위에서 구글폼 주소를 넣고 &lsquo;접수 중&rsquo;으로 바꿔 주세요.
          </div>
        )}
      </div>
    </main>
  );
}
