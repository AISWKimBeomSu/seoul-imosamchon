"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { popupImageUrl, type Popup, type PopupLinkKind, type PopupScope } from "@/lib/popups";

export type NoticeOption = { id: string; title: string };
export type FormOption = { key: string; title: string; is_open: boolean; has_url: boolean };

const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];
const MAX_BYTES = 10 * 1024 * 1024;

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

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
  link_kind: PopupLinkKind;
  form_key: string;
  notice_id: string;
  cta_label: string;
  show_qr: boolean;
  image_alt: string;
  title_en: string;
  subtitle_en: string;
  body_en: string;
  cta_label_en: string;
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
    link_kind: p?.link_kind ?? "form",
    form_key: p?.form_key ?? "senior",
    notice_id: p?.notice_id ?? "",
    cta_label: p?.cta_label ?? "신청하러 가기",
    show_qr: p?.show_qr ?? true,
    image_alt: p?.image_alt ?? "",
    title_en: p?.title_en ?? "",
    subtitle_en: p?.subtitle_en ?? "",
    body_en: p?.body_en ?? "",
    cta_label_en: p?.cta_label_en ?? "",
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
  forms,
}: {
  popup?: Popup;
  notices: NoticeOption[];
  forms: FormOption[];
}) {
  const router = useRouter();
  const isEdit = Boolean(popup);
  const [d, setD] = useState<Draft>(initialDraft(popup));
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const existingImage = popup?.image_path ?? null;
  const willHaveImage = Boolean(file) || (Boolean(existingImage) && !removeImage);

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setD((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.title.trim()) {
      setMsg({ type: "err", text: "제목을 입력해 주세요." });
      return;
    }
    if ((d.link_kind === "form" || d.link_kind === "class") && !d.form_key) {
      setMsg({ type: "err", text: "연결할 체험을 선택해 주세요." });
      return;
    }
    if (d.link_kind === "notice" && !d.notice_id) {
      setMsg({ type: "err", text: "연결할 공지를 선택해 주세요." });
      return;
    }
    if (willHaveImage && !d.image_alt.trim()) {
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
    const startsAt = fromLocalInput(d.starts_at) ?? new Date().toISOString();
    const endsAt = fromLocalInput(d.ends_at);
    if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setMsg({ type: "err", text: "종료 일시는 시작 일시보다 뒤여야 합니다." });
      return;
    }

    setBusy(true);
    setMsg(null);
    const supabase = createClient();

    try {
      let imagePath: string | null = removeImage ? null : existingImage;
      if (file) {
        const path = `popups/${crypto.randomUUID()}-${Date.now()}.${extOf(file.name)}`;
        const { error: upErr } = await supabase.storage
          .from("files")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw new Error(`포스터 업로드 실패: ${upErr.message}`);
        imagePath = path;
      }

      const payload = {
        title: d.title.trim(),
        subtitle: d.subtitle.trim(),
        body: d.body.trim(),
        link_kind: d.link_kind,
        form_key:
          d.link_kind === "form" || d.link_kind === "class" ? d.form_key : null,
        notice_id: d.link_kind === "notice" ? d.notice_id : null,
        cta_label: d.cta_label.trim() || "신청하러 가기",
        show_qr: d.show_qr,
        image_path: imagePath,
        image_alt: imagePath ? d.image_alt.trim() : "",
        scope: d.scope,
        starts_at: startsAt,
        ends_at: endsAt,
        sort: d.sort,
        is_published: d.is_published,
        title_en: d.title_en.trim(),
        subtitle_en: d.subtitle_en.trim(),
        body_en: d.body_en.trim(),
        cta_label_en: d.cta_label_en.trim(),
      };

      const { error } = isEdit
        ? await supabase.from("popups").update(payload).eq("id", popup!.id)
        : await supabase.from("popups").insert(payload);
      if (error) throw new Error(error.message);

      if (existingImage && existingImage !== imagePath) {
        await supabase.storage.from("files").remove([existingImage]);
      }

      if (isEdit) {
        setMsg({ type: "ok", text: "저장했습니다." });
        setFile(null);
        setRemoveImage(false);
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } else {
        router.push("/admin/popups");
        router.refresh();
      }
    } catch (err) {
      setMsg({
        type: "err",
        text: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!popup) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("popups").delete().eq("id", popup.id);
    if (!error && popup.image_path) {
      await supabase.storage.from("files").remove([popup.image_path]);
    }
    setBusy(false);
    if (error) {
      setMsg({ type: "err", text: `삭제하지 못했습니다: ${error.message}` });
      return;
    }
    router.push("/admin/popups");
    router.refresh();
  }

  const currentImage = popupImageUrl(existingImage);

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
          placeholder="쿠킹클래스 참가자를 모집합니다"
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
          style={{ minHeight: 80 }}
          value={d.body}
          onChange={(e) => set("body", e.target.value)}
        />
      </div>

      <fieldset className="en-block">
        <legend>English (비우면 한국어가 그대로 보입니다)</legend>
        <div className="field-row">
          <div className="field">
            <label htmlFor="p-title-en">Title</label>
            <input id="p-title-en" className="input" lang="en"
              value={d.title_en} onChange={(e) => set("title_en", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="p-sub-en">Eyebrow</label>
            <input id="p-sub-en" className="input" lang="en"
              value={d.subtitle_en} onChange={(e) => set("subtitle_en", e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="p-body-en">Body</label>
          <textarea id="p-body-en" className="textarea" lang="en" style={{ minHeight: 70 }}
            value={d.body_en} onChange={(e) => set("body_en", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p-cta-en">Button label</label>
          <input id="p-cta-en" className="input" lang="en"
            value={d.cta_label_en} onChange={(e) => set("cta_label_en", e.target.value)} />
        </div>
      </fieldset>

      {/* ── 포스터 ─────────────────────────────────── */}
      <div className="field">
        <label htmlFor="p-image">포스터 이미지</label>
        {currentImage && !removeImage && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.5rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- 관리자 미리보기 */}
            <img
              src={currentImage}
              alt=""
              width={80}
              height={100}
              style={{ objectFit: "cover", borderRadius: 8, border: "1px solid var(--line2)" }}
            />
            <button
              type="button"
              className="btn btn-ghost nav-cta"
              onClick={() => setRemoveImage(true)}
            >
              포스터 삭제
            </button>
          </div>
        )}
        <div className="filebox">
          <input
            id="p-image"
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <span className="hint">
          포스터가 팝업 맨 위에 크게 뜹니다. 세로형(3:4 정도)이 가장 잘 맞습니다.
        </span>
      </div>

      {willHaveImage && (
        <div className="field">
          <label htmlFor="p-alt">포스터 설명 (필수)</label>
          <input
            id="p-alt"
            className="input"
            value={d.image_alt}
            onChange={(e) => set("image_alt", e.target.value)}
            placeholder="쿠킹클래스 모집 포스터. 신청 기간과 참가비가 적혀 있습니다."
            required
          />
        </div>
      )}

      {/* ── 연결 대상 ───────────────────────────────── */}
      <div className="field">
        <label htmlFor="p-kind">연결 대상</label>
        <select
          id="p-kind"
          className="select"
          value={d.link_kind}
          onChange={(e) => set("link_kind", e.target.value as PopupLinkKind)}
        >
          <option value="form">신청 폼 (바로 신청)</option>
          <option value="class">체험 상세 페이지 (읽고 나서 신청)</option>
          <option value="notice">특정 공지 페이지</option>
          <option value="none">링크 없음 (안내만)</option>
        </select>
      </div>

      {(d.link_kind === "form" || d.link_kind === "class") && (
        <div className="field">
          <label htmlFor="p-form">체험 선택</label>
          <select
            id="p-form"
            className="select"
            value={d.form_key}
            onChange={(e) => set("form_key", e.target.value)}
          >
            {forms.map((f) => (
              <option key={f.key} value={f.key}>
                {f.title}
                {f.is_open && f.has_url ? "" : " — 접수 준비 중"}
              </option>
            ))}
          </select>
          <span className="hint">
            {d.link_kind === "form"
              ? "선택한 폼이 ‘접수 중’이 아니면 이 팝업은 자동으로 뜨지 않습니다."
              : "상세 페이지로 보냅니다. 접수 중이 아니어도 팝업은 뜹니다 — 상세에서 마감을 안내합니다."}
          </span>
        </div>
      )}

      {d.link_kind === "notice" && (
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

      {d.link_kind !== "none" && (
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

      {d.link_kind === "form" && (
        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={d.show_qr}
              onChange={(e) => set("show_qr", e.target.checked)}
            />
            QR 코드 크게 보여주기
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
            마감일을 넣어두면 그날 이후 팝업이 저절로 사라집니다.
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
          <span className="hint">
            작은 숫자가 왼쪽. 동시에 여러 개면 한 창 안에 나란히 뜹니다(최대 4개).
          </span>
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
          <button className="btn btn-ghost" type="button" disabled={busy} onClick={onDelete}>
            삭제
          </button>
        )}
      </div>
    </form>
  );
}
