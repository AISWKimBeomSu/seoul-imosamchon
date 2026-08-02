"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  isValidFormUrl,
  posterUrl,
  type AdminForm,
  type FormAccent,
  type FormAudience,
} from "@/lib/forms";

/** 비개발자에게 "정규식 불일치"는 아무 의미가 없다. 무엇을 어디서 복사할지 알려준다. */
const URL_HELP =
  "구글폼 주소가 아닙니다. 구글폼에서 [보내기] → 링크(🔗) 아이콘의 주소를 붙여넣어 주세요.";

const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];
const MAX_BYTES = 10 * 1024 * 1024;

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export default function SettingsForm({ form }: { form: AdminForm }) {
  const router = useRouter();
  const [d, setD] = useState<AdminForm>(form);
  const [file, setFile] = useState<File | null>(null);
  const [removePoster, setRemovePoster] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const willHavePoster = Boolean(file) || (Boolean(d.poster_path) && !removePoster);

  function set<K extends keyof AdminForm>(k: K, v: AdminForm[K]) {
    setD((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = (d.url ?? "").trim();
    if (url && !isValidFormUrl(url)) {
      setMsg({ type: "err", text: URL_HELP });
      return;
    }
    if (d.is_open && !url) {
      setMsg({
        type: "err",
        text: "접수 중으로 두려면 구글폼 주소가 필요합니다. 주소를 넣거나 '준비 중'으로 바꿔 주세요.",
      });
      return;
    }
    if (willHavePoster && !d.poster_alt.trim()) {
      setMsg({
        type: "err",
        text: "포스터 설명(대체텍스트)을 입력해 주세요. 눈이 불편한 분께 읽어주는 문구입니다.",
      });
      return;
    }
    if (file) {
      if (!ALLOWED_EXT.includes(extOf(file.name))) {
        setMsg({ type: "err", text: "포스터는 jpg, png, webp만 올릴 수 있습니다." });
        return;
      }
      if (file.size > MAX_BYTES) {
        setMsg({ type: "err", text: "포스터 용량은 10MB를 넘을 수 없습니다." });
        return;
      }
    }

    setBusy(true);
    setMsg(null);
    const supabase = createClient();

    try {
      let posterPath: string | null = removePoster ? null : d.poster_path;
      if (file) {
        const path = `forms/${d.key}-${Date.now()}.${extOf(file.name)}`;
        const { error: upErr } = await supabase.storage
          .from("files")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw new Error(`포스터 업로드 실패: ${upErr.message}`);
        posterPath = path;
      }

      const { error } = await supabase
        .from("forms")
        .update({
          title: d.title.trim(),
          subtitle: d.subtitle.trim(),
          description: d.description.trim(),
          url: url || null,
          is_open: d.is_open,
          cta_label: d.cta_label.trim() || "신청하기",
          closed_note: d.closed_note.trim() || "이번 접수는 마감되었습니다.",
          audience: d.audience,
          accent: d.accent,
          poster_path: posterPath,
          poster_alt: posterPath ? d.poster_alt.trim() : "",
          sort: d.sort,
          is_published: d.is_published,
        })
        .eq("id", d.id);
      if (error) throw new Error(error.message);

      const old = d.poster_path;
      if (old && old !== posterPath) {
        await supabase.storage.from("files").remove([old]);
      }

      setMsg({
        type: "ok",
        text: "저장했습니다. 신청 페이지와 QR에 바로 반영됩니다.",
      });
      setFile(null);
      setRemovePoster(false);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err) {
      setMsg({
        type: "err",
        text: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  }

  const currentPoster = posterUrl(d.poster_path);

  return (
    <form className="card" onSubmit={onSubmit} style={{ marginBottom: "1.4rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <span className={`badge ${d.is_open && d.url ? "live" : "draft"}`}>
          {d.is_open && d.url ? "접수 중" : d.url ? "준비 중" : "주소 미설정"}
        </span>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>{d.title}</h2>
        <code style={{ color: "var(--sub)", fontSize: "0.85rem" }}>/{d.key}</code>
      </div>

      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}

      <div className="field">
        <label htmlFor={`url-${d.key}`}>구글폼 주소</label>
        <input
          id={`url-${d.key}`}
          className="input"
          type="url"
          inputMode="url"
          placeholder="https://docs.google.com/forms/d/e/.../viewform"
          value={d.url ?? ""}
          onChange={(e) => set("url", e.target.value)}
        />
        <span className="hint">
          구글폼 → [보내기] → 링크(🔗) 탭의 주소. 저장하면 QR도 자동으로 바뀝니다.
        </span>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`open-${d.key}`}>접수 상태</label>
          <select
            id={`open-${d.key}`}
            className="select"
            value={d.is_open ? "open" : "closed"}
            onChange={(e) => set("is_open", e.target.value === "open")}
          >
            <option value="open">접수 중</option>
            <option value="closed">준비 중 / 마감</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={`cta-${d.key}`}>버튼 문구</label>
          <input
            id={`cta-${d.key}`}
            className="input"
            value={d.cta_label}
            onChange={(e) => set("cta_label", e.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`title-${d.key}`}>제목</label>
          <input
            id={`title-${d.key}`}
            className="input"
            value={d.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`sub-${d.key}`}>부제</label>
          <input
            id={`sub-${d.key}`}
            className="input"
            value={d.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder="트랙 1 · 시장 장보기 + 집밥"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor={`desc-${d.key}`}>설명</label>
        <textarea
          id={`desc-${d.key}`}
          className="textarea"
          style={{ minHeight: 80 }}
          value={d.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor={`poster-${d.key}`}>포스터 이미지 (선택)</label>
        {currentPoster && !removePoster && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.8rem",
              marginBottom: "0.5rem",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 관리자 미리보기 */}
            <img
              src={currentPoster}
              alt=""
              width={72}
              height={90}
              style={{ objectFit: "cover", borderRadius: 8, border: "1px solid var(--line2)" }}
            />
            <button
              type="button"
              className="btn btn-ghost nav-cta"
              onClick={() => setRemovePoster(true)}
            >
              포스터 삭제
            </button>
          </div>
        )}
        <div className="filebox">
          <input
            id={`poster-${d.key}`}
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <span className="hint">신청 페이지 카드와 팝업에 함께 쓸 수 있습니다.</span>
      </div>

      {willHavePoster && (
        <div className="field">
          <label htmlFor={`alt-${d.key}`}>포스터 설명 (필수)</label>
          <input
            id={`alt-${d.key}`}
            className="input"
            value={d.poster_alt}
            onChange={(e) => set("poster_alt", e.target.value)}
            placeholder="쿠킹클래스 모집 포스터. 신청 기간과 참가비가 적혀 있습니다."
            required
          />
        </div>
      )}

      <div className="field-row">
        <div className="field">
          <label htmlFor={`aud-${d.key}`}>대상</label>
          <select
            id={`aud-${d.key}`}
            className="select"
            value={d.audience}
            onChange={(e) => set("audience", e.target.value as FormAudience)}
          >
            <option value="senior">시니어 모집 (한국어)</option>
            <option value="guest">손님 모객 (영문 /guest에도 노출)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={`accent-${d.key}`}>카드 색</label>
          <select
            id={`accent-${d.key}`}
            className="select"
            value={d.accent}
            onChange={(e) => set("accent", e.target.value as FormAccent)}
          >
            <option value="green">딥그린</option>
            <option value="gold">골드</option>
            <option value="lime">라임</option>
          </select>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`sort-${d.key}`}>노출 순서</label>
          <input
            id={`sort-${d.key}`}
            className="input"
            type="number"
            value={d.sort}
            onChange={(e) => set("sort", Number(e.target.value) || 0)}
          />
        </div>
        <div className="field">
          <label htmlFor={`pub-${d.key}`}>신청 페이지 노출</label>
          <select
            id={`pub-${d.key}`}
            className="select"
            value={d.is_published ? "1" : "0"}
            onChange={(e) => set("is_published", e.target.value === "1")}
          >
            <option value="1">노출</option>
            <option value="0">숨김</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor={`closed-${d.key}`}>마감 안내 문구</label>
        <input
          id={`closed-${d.key}`}
          className="input"
          value={d.closed_note}
          onChange={(e) => set("closed_note", e.target.value)}
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "저장 중…" : "저장하기"}
      </button>
    </form>
  );
}
