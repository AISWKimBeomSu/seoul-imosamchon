"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Popup, PopupLinkKey, PopupScope } from "@/lib/popups";

export type NoticeOption = { id: string; title: string };

/** ISO → <input type="datetime-local"> 값 (사용자 로컬 시간) */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const t = new Date(v);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}

type Draft = {
  title: string;
  subtitle: string;
  body: string;
  link_key: PopupLinkKey;
  notice_id: string;
  cta_label: string;
  show_qr: boolean;
  scope: PopupScope;
  starts_at: string;
  ends_at: string;
  sort: number;
  is_published: boolean;
};

function initialDraft(p?: Popup): Draft {
  return {
    title: p?.title ?? "",
    subtitle: p?.subtitle ?? "",
    body: p?.body ?? "",
    link_key: p?.link_key ?? "senior",
    notice_id: p?.notice_id ?? "",
    cta_label: p?.cta_label ?? "신청하러 가기",
    show_qr: p?.show_qr ?? true,
    scope: p?.scope ?? "home",
    starts_at: toLocalInput(p?.starts_at ?? new Date().toISOString()),
    ends_at: toLocalInput(p?.ends_at ?? null),
    sort: p?.sort ?? 0,
    is_published: p?.is_published ?? false,
  };
}

export default function PopupForm({
  popup,
  notices,
}: {
  popup?: Popup;
  notices: NoticeOption[];
}) {
  const router = useRouter();
  const isEdit = Boolean(popup);
  const [d, setD] = useState<Draft>(initialDraft(popup));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setD((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.title.trim()) {
      setMsg({ type: "err", text: "제목을 입력해 주세요." });
      return;
    }
    if (d.link_key === "notice" && !d.notice_id) {
      setMsg({ type: "err", text: "연결할 공지를 선택해 주세요." });
      return;
    }
    const startsAt = fromLocalInput(d.starts_at) ?? new Date().toISOString();
    const endsAt = fromLocalInput(d.ends_at);
    if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setMsg({ type: "err", text: "종료 일시는 시작 일시보다 뒤여야 합니다." });
      return;
    }

    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const payload = {
      title: d.title.trim(),
      subtitle: d.subtitle.trim(),
      body: d.body.trim(),
      link_key: d.link_key,
      notice_id: d.link_key === "notice" ? d.notice_id : null,
      cta_label: d.cta_label.trim() || "신청하러 가기",
      show_qr: d.show_qr,
      scope: d.scope,
      starts_at: startsAt,
      ends_at: endsAt,
      sort: d.sort,
      is_published: d.is_published,
    };

    const { error } = isEdit
      ? await supabase.from("popups").update(payload).eq("id", popup!.id)
      : await supabase.from("popups").insert(payload);

    setBusy(false);
    if (error) {
      setMsg({ type: "err", text: `저장하지 못했습니다: ${error.message}` });
      return;
    }
    if (isEdit) {
      setMsg({ type: "ok", text: "저장했습니다." });
      router.refresh();
    } else {
      router.push("/admin/popups");
      router.refresh();
    }
  }

  async function onDelete() {
    if (!popup) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("popups").delete().eq("id", popup.id);
    setBusy(false);
    if (error) {
      setMsg({ type: "err", text: `삭제하지 못했습니다: ${error.message}` });
      return;
    }
    router.push("/admin/popups");
    router.refresh();
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}

      <div className="field">
        <label htmlFor="p-title">제목</label>
        <input
          id="p-title"
          className="input"
          value={d.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="시니어 호스트를 모집합니다"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="p-sub">윗줄 문구 (선택)</label>
        <input
          id="p-sub"
          className="input"
          value={d.subtitle}
          onChange={(e) => set("subtitle", e.target.value)}
          placeholder="8월 30일 마감"
        />
      </div>

      <div className="field">
        <label htmlFor="p-body">본문 (선택)</label>
        <textarea
          id="p-body"
          className="textarea"
          style={{ minHeight: 90 }}
          value={d.body}
          onChange={(e) => set("body", e.target.value)}
          placeholder="만 60세 이상이면 누구나 지원하실 수 있어요. 5분이면 신청이 끝납니다."
        />
      </div>

      <div className="field">
        <label htmlFor="p-link">연결 대상</label>
        <select
          id="p-link"
          className="select"
          value={d.link_key}
          onChange={(e) => set("link_key", e.target.value as PopupLinkKey)}
        >
          <option value="senior">시니어 모집 폼</option>
          <option value="guest">손님 모객 폼 (영문)</option>
          <option value="notice">특정 공지 페이지</option>
          <option value="none">링크 없음 (안내만)</option>
        </select>
        <span className="hint">
          폼이 &lsquo;접수 마감&rsquo; 상태면 이 팝업은 자동으로 뜨지 않습니다.
        </span>
      </div>

      {d.link_key === "notice" && (
        <div className="field">
          <label htmlFor="p-notice">공지 선택</label>
          <select
            id="p-notice"
            className="select"
            value={d.notice_id}
            onChange={(e) => set("notice_id", e.target.value)}
          >
            <option value="">— 선택하세요 —</option>
            {notices.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {d.link_key !== "none" && (
        <div className="field">
          <label htmlFor="p-cta">버튼 문구</label>
          <input
            id="p-cta"
            className="input"
            value={d.cta_label}
            onChange={(e) => set("cta_label", e.target.value)}
          />
        </div>
      )}

      {(d.link_key === "senior" || d.link_key === "guest") && (
        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={d.show_qr}
              onChange={(e) => set("show_qr", e.target.checked)}
            />
            QR 코드 함께 보여주기
          </label>
          <span className="hint">
            ※ QR은 PC 화면에서만 보입니다. 휴대폰 사용자는 자기 화면의 QR을 찍을 수 없어서,
            모바일에는 큰 버튼과 &lsquo;링크 복사&rsquo;가 대신 나옵니다.
          </span>
        </div>
      )}

      <div className="field">
        <label htmlFor="p-scope">노출 범위</label>
        <select
          id="p-scope"
          className="select"
          value={d.scope}
          onChange={(e) => set("scope", e.target.value as PopupScope)}
        >
          <option value="home">홈 화면에서만 (권장)</option>
          <option value="all">모든 페이지</option>
        </select>
        <span className="hint">관리자 페이지에는 어느 쪽이든 뜨지 않습니다.</span>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="p-start">시작 일시</label>
          <input
            id="p-start"
            className="input"
            type="datetime-local"
            value={d.starts_at}
            onChange={(e) => set("starts_at", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="p-end">종료 일시 (비우면 무기한)</label>
          <input
            id="p-end"
            className="input"
            type="datetime-local"
            value={d.ends_at}
            onChange={(e) => set("ends_at", e.target.value)}
          />
          <span className="hint">
            모집 마감일을 넣어두면 그날 이후 팝업이 저절로 사라집니다.
          </span>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="p-sort">노출 순서</label>
          <input
            id="p-sort"
            className="input"
            type="number"
            value={d.sort}
            onChange={(e) => set("sort", Number(e.target.value) || 0)}
          />
          <span className="hint">작은 숫자가 먼저. 동시에 여러 개면 1개만 뜹니다.</span>
        </div>
        <div className="field">
          <label htmlFor="p-pub">게시</label>
          <select
            id="p-pub"
            className="select"
            value={d.is_published ? "1" : "0"}
            onChange={(e) => set("is_published", e.target.value === "1")}
          >
            <option value="0">임시저장 (안 뜸)</option>
            <option value="1">게시 (기간 안이면 노출)</option>
          </select>
        </div>
      </div>

      <div className="row">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "저장 중…" : isEdit ? "저장하기" : "팝업 만들기"}
        </button>
        {isEdit && (
          <button
            className="btn btn-ghost"
            type="button"
            disabled={busy}
            onClick={onDelete}
          >
            삭제
          </button>
        )}
      </div>
    </form>
  );
}
