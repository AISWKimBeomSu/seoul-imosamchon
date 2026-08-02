"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SiteConfig } from "@/lib/site";

export default function ContactForm({ initial }: { initial: SiteConfig }) {
  const router = useRouter();
  const [cfg, setCfg] = useState<SiteConfig>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("site_config")
      .update({
        contact_email: cfg.contact_email.trim(),
        contact_phone: (cfg.contact_phone ?? "").trim() || null,
      })
      .eq("id", 1);
    setBusy(false);
    if (error) {
      setMsg({ type: "err", text: `저장하지 못했습니다: ${error.message}` });
      return;
    }
    setMsg({ type: "ok", text: "저장했습니다." });
    router.refresh();
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <div className="field-row">
        <div className="field">
          <label htmlFor="contact_email">신청서 접수 이메일</label>
          <input
            id="contact_email"
            className="input"
            type="email"
            value={cfg.contact_email}
            onChange={(e) => setCfg({ ...cfg, contact_email: e.target.value })}
          />
          <span className="hint">종이 신청서(사진)를 받는 주소입니다.</span>
        </div>
        <div className="field">
          <label htmlFor="contact_phone">안내 전화번호 (선택)</label>
          <input
            id="contact_phone"
            className="input"
            inputMode="tel"
            placeholder="02-000-0000"
            value={cfg.contact_phone ?? ""}
            onChange={(e) => setCfg({ ...cfg, contact_phone: e.target.value })}
          />
        </div>
      </div>
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "저장 중…" : "저장하기"}
      </button>
    </form>
  );
}
