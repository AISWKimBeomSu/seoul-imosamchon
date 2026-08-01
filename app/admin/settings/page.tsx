import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdmin } from "@/lib/supabase/server";
import { getSiteConfig, formState } from "@/lib/config";
import AdminNav from "@/components/AdminNav";
import QrPanel from "@/components/QrPanel";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "신청 폼 설정" };

export default async function AdminSettingsPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");

  const cfg = await getSiteConfig();
  const senior = formState(cfg, "senior");
  const guest = formState(cfg, "guest");

  return (
    <main className="admin-wrap">
      <div className="admin-top">
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>신청 폼 설정</h1>
          <p className="sec-sub">
            여기서 바꾼 주소가 사이트의 모든 신청 버튼과 QR에 그대로 쓰입니다.
          </p>
        </div>
        <Link href="/" className="btn btn-ghost nav-cta">
          사이트 보기
        </Link>
      </div>

      <AdminNav current="/admin/settings" />

      <div className="admin-status">
        <div className="admin-stat">
          <span className="k">시니어 모집 폼</span>
          <span className="v">
            <span className={`dot ${senior.available ? "on" : "off"}`} />
            {senior.available ? "접수 중" : senior.url ? "접수 마감" : "주소 미설정"}
          </span>
        </div>
        <div className="admin-stat">
          <span className="k">손님 모객 폼</span>
          <span className="v">
            <span className={`dot ${guest.available ? "on" : "off"}`} />
            {guest.available ? "접수 중" : guest.url ? "접수 마감" : "주소 미설정"}
          </span>
        </div>
      </div>

      <SettingsForm initial={cfg} />

      {senior.available && (
        <>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: "2rem 0 0.3rem" }}>
            시니어 모집 QR
          </h2>
          <p className="sec-sub" style={{ marginBottom: "1rem" }}>
            폼 주소를 바꾸면 이 QR도 자동으로 바뀝니다. 포스터·현수막에 쓰실 땐 아래에서 저장하세요.
          </p>
          <div style={{ maxWidth: 380 }}>
            <QrPanel caption="스캔하면 신청 화면이 열립니다 (QR 유입도 자동 집계됩니다)" />
          </div>
        </>
      )}

      {guest.available && (
        <>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: "2rem 0 1rem" }}>
            손님 모객 QR
          </h2>
          <div style={{ maxWidth: 380 }}>
            <QrPanel linkKey="guest" caption="Scan to open the booking form" />
          </div>
        </>
      )}
    </main>
  );
}
