import { createClient } from "@/lib/supabase/server";
import { SOURCE_LABEL } from "@/lib/links";

type Row = { link_key: string; source: string; clicks: number };

/**
 * 최근 30일 신청 클릭 (진입점별).
 * 어떤 경로가 실제로 신청을 만들어내는지 — 팝업인지 QR인지 메뉴인지 — 를 본다.
 */
export default async function ClickSummary({ days = 30 }: { days?: number }) {
  // 키가 없으면 리다이렉트는 정상 동작하지만 클릭이 기록되지 않는다.
  // 조용히 0으로 보이면 "아무도 안 눌렀다"고 오해하게 되므로 명시한다.
  const trackingReady = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!trackingReady) {
    return (
      <div className="alert err">
        <b>클릭 집계가 아직 꺼져 있습니다.</b>
        <br />
        Vercel과 <code>.env.local</code>에 <code>SUPABASE_SERVICE_ROLE_KEY</code>를
        추가하면 이 자리에 진입점별 신청 클릭 수가 표시됩니다. 키가 없어도 신청
        버튼과 QR은 정상 동작합니다.
      </div>
    );
  }

  let rows: Row[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("link_click_summary", { days });
    rows = (data ?? []) as Row[];
  } catch {
    rows = [];
  }

  const senior = rows.filter((r) => r.link_key === "senior");
  const guest = rows.filter((r) => r.link_key === "guest");
  const total = rows.reduce((s, r) => s + Number(r.clicks), 0);

  if (total === 0) {
    return (
      <div className="empty">
        아직 집계된 신청 클릭이 없습니다. 신청 버튼이나 QR을 누르면 여기에 쌓입니다.
      </div>
    );
  }

  const max = Math.max(...rows.map((r) => Number(r.clicks)), 1);

  function bars(list: Row[], title: string) {
    if (list.length === 0) return null;
    const sum = list.reduce((s, r) => s + Number(r.clicks), 0);
    return (
      <div style={{ marginBottom: "1.2rem" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.6rem" }}>
          {title} <span style={{ color: "var(--sub)", fontWeight: 600 }}>· 합계 {sum}회</span>
        </h3>
        <div className="admin-bars">
          {list.map((r) => (
            <div className="admin-bar" key={`${r.link_key}-${r.source}`}>
              <span className="lbl">{SOURCE_LABEL[r.source] ?? r.source}</span>
              <span className="track">
                <span
                  className="fill"
                  style={{ width: `${(Number(r.clicks) / max) * 100}%` }}
                />
              </span>
              <span className="n">{r.clicks}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {bars(senior, "시니어 모집 폼")}
      {bars(guest, "손님 모객 폼")}
      <p className="hint" style={{ color: "var(--sub)", fontSize: "0.82rem" }}>
        최근 {days}일 · 봇 트래픽 제외 · 개인정보(IP·쿠키)는 저장하지 않습니다.
      </p>
    </div>
  );
}
