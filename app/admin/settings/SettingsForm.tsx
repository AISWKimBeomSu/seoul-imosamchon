"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isValidFormUrl, type SiteConfig } from "@/lib/site";

/** 비개발자에게 "정규식 불일치"는 아무 의미가 없다. 무엇을 어디서 복사할지 알려준다. */
const URL_HELP =
  "구글폼 주소가 아닙니다. 구글폼에서 [보내기] → 링크(🔗) 아이콘의 주소를 붙여넣어 주세요.";

export default function SettingsForm({ initial }: { initial: SiteConfig }) {
  const router = useRouter();
  const [cfg, setCfg] = useState<SiteConfig>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  function set<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    setCfg((c) => ({ ...c, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const senior = (cfg.senior_form_url ?? "").trim();
    const guest = (cfg.guest_form_url ?? "").trim();
    if (senior && !isValidFormUrl(senior)) {
      setMsg({ type: "err", text: `시니어 모집 폼 — ${URL_HELP}` });
      return;
    }
    if (guest && !isValidFormUrl(guest)) {
      setMsg({ type: "err", text: `손님 모객 폼 — ${URL_HELP}` });
      return;
    }

    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("site_config")
      .update({
        senior_form_url: senior || null,
        senior_form_open: cfg.senior_form_open,
        senior_form_label: cfg.senior_form_label.trim() || "휴대폰으로 5분 신청하기",
        senior_closed_note: cfg.senior_closed_note,
        guest_form_url: guest || null,
        guest_form_open: cfg.guest_form_open,
        guest_form_label: cfg.guest_form_label.trim() || "Book a class",
        contact_email: cfg.contact_email.trim(),
        contact_phone: (cfg.contact_phone ?? "").trim() || null,
      })
      .eq("id", 1);

    setBusy(false);
    if (error) {
      setMsg({
        type: "err",
        text: `저장하지 못했습니다: ${error.message}`,
      });
      return;
    }
    setMsg({
      type: "ok",
      text: "저장했습니다. 사이트의 모든 신청 버튼에 바로 반영됩니다.",
    });
    router.refresh(); // QR 미리보기도 함께 갱신된다
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}

      <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "1rem" }}>
        시니어 모집 폼
      </h2>

      <div className="field">
        <label htmlFor="senior_url">구글폼 주소</label>
        <input
          id="senior_url"
          className="input"
          type="url"
          inputMode="url"
          placeholder="https://docs.google.com/forms/d/e/.../viewform"
          value={cfg.senior_form_url ?? ""}
          onChange={(e) => set("senior_form_url", e.target.value)}
        />
        <span className="hint">
          구글폼 → [보내기] → 링크(🔗) 탭의 주소를 붙여넣으세요. 저장하면 QR도 자동으로 바뀝니다.
        </span>
      </div>

      <div className="field">
        <label htmlFor="senior_open">접수 상태</label>
        <select
          id="senior_open"
          className="select"
          value={cfg.senior_form_open ? "open" : "closed"}
          onChange={(e) => set("senior_form_open", e.target.value === "open")}
        >
          <option value="open">접수 중 — 사이트 전체에 신청 버튼이 보입니다</option>
          <option value="closed">접수 마감 — 모든 신청 버튼이 &lsquo;접수 마감&rsquo;으로 바뀝니다</option>
        </select>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="senior_label">버튼 문구</label>
          <input
            id="senior_label"
            className="input"
            value={cfg.senior_form_label}
            onChange={(e) => set("senior_form_label", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="contact_phone">안내 전화번호 (선택)</label>
          <input
            id="contact_phone"
            className="input"
            inputMode="tel"
            placeholder="02-000-0000"
            value={cfg.contact_phone ?? ""}
            onChange={(e) => set("contact_phone", e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="closed_note">마감 안내 문구</label>
        <textarea
          id="closed_note"
          className="textarea"
          style={{ minHeight: 80 }}
          value={cfg.senior_closed_note}
          onChange={(e) => set("senior_closed_note", e.target.value)}
        />
        <span className="hint">마감 상태에서 신청 페이지에 표시됩니다.</span>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "1.6rem 0" }} />

      <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.4rem" }}>
        외국인 손님 모객 폼
      </h2>
      <p className="sec-sub" style={{ marginBottom: "1rem" }}>
        영문 안내 페이지(/guest)에서 사용합니다. 주소를 비워두면 &lsquo;준비 중&rsquo;으로 표시됩니다.
      </p>

      <div className="field">
        <label htmlFor="guest_url">구글폼 주소 (영문 폼)</label>
        <input
          id="guest_url"
          className="input"
          type="url"
          inputMode="url"
          placeholder="https://docs.google.com/forms/d/e/.../viewform"
          value={cfg.guest_form_url ?? ""}
          onChange={(e) => set("guest_form_url", e.target.value)}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="guest_open">접수 상태</label>
          <select
            id="guest_open"
            className="select"
            value={cfg.guest_form_open ? "open" : "closed"}
            onChange={(e) => set("guest_form_open", e.target.value === "open")}
          >
            <option value="open">접수 중</option>
            <option value="closed">접수 마감 / 준비 중</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="guest_label">버튼 문구 (영문)</label>
          <input
            id="guest_label"
            className="input"
            value={cfg.guest_form_label}
            onChange={(e) => set("guest_form_label", e.target.value)}
          />
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "1.6rem 0" }} />

      <div className="field">
        <label htmlFor="contact_email">신청서 접수 이메일</label>
        <input
          id="contact_email"
          className="input"
          type="email"
          value={cfg.contact_email}
          onChange={(e) => set("contact_email", e.target.value)}
        />
        <span className="hint">
          종이 신청서(경로 B)를 받는 주소입니다. 신청 안내 페이지에 표시됩니다.
        </span>
      </div>

      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "저장 중…" : "저장하기"}
      </button>
    </form>
  );
}
