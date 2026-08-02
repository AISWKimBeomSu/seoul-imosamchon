"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { photoUrl, type AdminPerson, type PersonKind } from "@/lib/people";

const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];
const MAX_BYTES = 10 * 1024 * 1024;

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type Draft = {
  kind: PersonKind;
  name: string;
  role: string;
  region: string;
  tagline: string;
  bio: string;
  quote: string;
  photo_alt: string;
  role_en: string;
  region_en: string;
  tagline_en: string;
  bio_en: string;
  quote_en: string;
  tags: string;
  sort: number;
  is_published: boolean;
  consent_ok: boolean;
  consent_date: string;
  consent_memo: string;
};

function initialDraft(p?: AdminPerson): Draft {
  return {
    kind: p?.kind ?? "senior",
    name: p?.name ?? "",
    role: p?.role ?? "",
    region: p?.region ?? "",
    tagline: p?.tagline ?? "",
    bio: p?.bio ?? "",
    quote: p?.quote ?? "",
    photo_alt: p?.photo_alt ?? "",
    role_en: p?.role_en ?? "",
    region_en: p?.region_en ?? "",
    tagline_en: p?.tagline_en ?? "",
    bio_en: p?.bio_en ?? "",
    quote_en: p?.quote_en ?? "",
    tags: (p?.tags ?? []).join(", "),
    sort: p?.sort ?? 0,
    is_published: p?.is_published ?? false,
    consent_ok: Boolean(p?.consent_at),
    consent_date: toDateInput(p?.consent_at ?? null),
    consent_memo: p?.consent_memo ?? "",
  };
}

export default function PersonForm({ person }: { person?: AdminPerson }) {
  const router = useRouter();
  const isEdit = Boolean(person);
  const [d, setD] = useState<Draft>(initialDraft(person));
  const [file, setFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const existingPhoto = person?.photo_path ?? null;
  const willHavePhoto = Boolean(file) || (Boolean(existingPhoto) && !removePhoto);

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setD((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!d.name.trim()) {
      setMsg({ type: "err", text: "이름을 입력해 주세요." });
      return;
    }
    // 동의 없이는 게시할 수 없다. DB CHECK가 최종 방어선이지만
    // 여기서 먼저 막고 이유를 설명해야 규칙이 이해된다.
    if (d.is_published && !d.consent_ok) {
      setMsg({
        type: "err",
        text: "본인 동의를 확인해야 게시할 수 있습니다. 아래 동의 확인란을 먼저 체크해 주세요.",
      });
      return;
    }
    if (willHavePhoto && !d.photo_alt.trim()) {
      setMsg({
        type: "err",
        text: "사진 설명(대체텍스트)을 입력해 주세요. 눈이 불편한 분께 사진 내용을 읽어주는 문구입니다.",
      });
      return;
    }
    if (file) {
      if (!ALLOWED_EXT.includes(extOf(file.name))) {
        setMsg({ type: "err", text: "사진은 jpg, png, webp 형식만 올릴 수 있습니다." });
        return;
      }
      if (file.size > MAX_BYTES) {
        setMsg({ type: "err", text: "사진 용량은 10MB를 넘을 수 없습니다." });
        return;
      }
    }

    setBusy(true);
    setMsg(null);
    const supabase = createClient();

    try {
      let photoPath: string | null = removePhoto ? null : existingPhoto;

      if (file) {
        // 경로에 타임스탬프를 넣어 사진 교체 시 URL 자체가 바뀌게 한다
        // (Next 16의 이미지 캐시 기본 4시간을 우회하는 가장 단순한 방법)
        const path = `people/${crypto.randomUUID()}-${Date.now()}.${extOf(file.name)}`;
        const { error: upErr } = await supabase.storage
          .from("files")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw new Error(`사진 업로드 실패: ${upErr.message}`);
        photoPath = path;
      }

      const payload = {
        kind: d.kind,
        name: d.name.trim(),
        role: d.role.trim(),
        region: d.region.trim() || null,
        tagline: d.tagline.trim(),
        bio: d.bio.trim(),
        quote: d.quote.trim() || null,
        photo_path: photoPath,
        photo_alt: photoPath ? d.photo_alt.trim() : "",
        tags: d.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        sort: d.sort,
        is_published: d.is_published,
        consent_at: d.consent_ok
          ? d.consent_date
            ? new Date(`${d.consent_date}T00:00:00`).toISOString()
            : (person?.consent_at ?? new Date().toISOString())
          : null,
        consent_memo: d.consent_memo.trim(),
        role_en: d.role_en.trim(),
        region_en: d.region_en.trim(),
        tagline_en: d.tagline_en.trim(),
        bio_en: d.bio_en.trim(),
        quote_en: d.quote_en.trim(),
      };

      const { error } = isEdit
        ? await supabase.from("people").update(payload).eq("id", person!.id)
        : await supabase.from("people").insert(payload);
      if (error) throw new Error(error.message);

      // 사진을 교체·삭제했다면 옛 파일도 지운다. 행만 지우면 사진이 인터넷에 남는다.
      const oldToDelete =
        existingPhoto && existingPhoto !== photoPath ? existingPhoto : null;
      if (oldToDelete) {
        await supabase.storage.from("files").remove([oldToDelete]);
      }

      if (isEdit) {
        setMsg({ type: "ok", text: "저장했습니다." });
        setFile(null);
        setRemovePhoto(false);
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } else {
        router.push("/admin/people");
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
    if (!person) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("people").delete().eq("id", person.id);
    if (!error && person.photo_path) {
      // 사진도 함께 삭제 — 게시 철회 요청 시 흔적이 남으면 안 된다
      await supabase.storage.from("files").remove([person.photo_path]);
    }
    setBusy(false);
    if (error) {
      setMsg({ type: "err", text: `삭제하지 못했습니다: ${error.message}` });
      return;
    }
    router.push("/admin/people");
    router.refresh();
  }

  const currentPhotoUrl = photoUrl(existingPhoto);

  return (
    <form className="card" onSubmit={onSubmit}>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}

      <div className="field-row">
        <div className="field">
          <label htmlFor="pe-kind">구분</label>
          <select
            id="pe-kind"
            className="select"
            value={d.kind}
            onChange={(e) => set("kind", e.target.value as PersonKind)}
          >
            <option value="senior">시니어 호스트</option>
            <option value="team">팀원</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="pe-name">이름</label>
          <input
            id="pe-name"
            className="input"
            value={d.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="김선영"
            required
          />
          <span className="hint">
            본인이 원하는 표기를 그대로 쓰세요 (예: 김선영 / 김선영 이모 / 김○○)
          </span>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="pe-role">역할</label>
          <input
            id="pe-role"
            className="input"
            value={d.role}
            onChange={(e) => set("role", e.target.value)}
            placeholder={d.kind === "senior" ? "쿠킹클래스 호스트" : "대표"}
          />
        </div>
        <div className="field">
          <label htmlFor="pe-region">활동 지역 (선택)</label>
          <input
            id="pe-region"
            className="input"
            value={d.region}
            onChange={(e) => set("region", e.target.value)}
            placeholder="마포 망원동"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="pe-tagline">한 줄 소개</label>
        <input
          id="pe-tagline"
          className="input"
          value={d.tagline}
          onChange={(e) => set("tagline", e.target.value)}
          placeholder="망원시장 40년 단골, 김치찌개 하나로 손님을 울립니다"
        />
      </div>

      {d.kind === "senior" && (
        <div className="field">
          <label htmlFor="pe-quote">인용구 (선택)</label>
          <input
            id="pe-quote"
            className="input"
            value={d.quote}
            onChange={(e) => set("quote", e.target.value)}
            placeholder="이 시장에서 30년을 다녔어요. 상인들이 다 제 친구예요."
          />
          <span className="hint">카드에서 가장 눈에 띄는 문장입니다.</span>
        </div>
      )}

      <div className="field">
        <label htmlFor="pe-bio">소개글 (선택)</label>
        <textarea
          id="pe-bio"
          className="textarea"
          style={{ minHeight: 100 }}
          value={d.bio}
          onChange={(e) => set("bio", e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="pe-tags">태그 (쉼표로 구분, 선택)</label>
        <input
          id="pe-tags"
          className="input"
          value={d.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="쿠킹클래스, 망원시장, 김치"
        />
      </div>

      <fieldset className="en-block">
        <legend>English (비우면 한국어가 그대로 보입니다)</legend>
        <div className="field-row">
          <div className="field">
            <label htmlFor="pe-role-en">Role</label>
            <input id="pe-role-en" className="input" lang="en"
              value={d.role_en} onChange={(e) => set("role_en", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pe-region-en">Area</label>
            <input id="pe-region-en" className="input" lang="en"
              value={d.region_en} onChange={(e) => set("region_en", e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="pe-tagline-en">One-line intro</label>
          <input id="pe-tagline-en" className="input" lang="en"
            value={d.tagline_en} onChange={(e) => set("tagline_en", e.target.value)} />
        </div>
        {d.kind === "senior" && (
          <div className="field">
            <label htmlFor="pe-quote-en">Quote</label>
            <input id="pe-quote-en" className="input" lang="en"
              value={d.quote_en} onChange={(e) => set("quote_en", e.target.value)} />
          </div>
        )}
        <div className="field">
          <label htmlFor="pe-bio-en">Bio</label>
          <textarea id="pe-bio-en" className="textarea" lang="en" style={{ minHeight: 80 }}
            value={d.bio_en} onChange={(e) => set("bio_en", e.target.value)} />
        </div>
      </fieldset>

      {/* ── 사진 ─────────────────────────────────────────── */}
      <div className="field">
        <label htmlFor="pe-photo">사진 (선택 · jpg/png/webp · 10MB 이하)</label>
        {currentPhotoUrl && !removePhoto && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.5rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- 관리자 미리보기 */}
            <img
              src={currentPhotoUrl}
              alt=""
              width={72}
              height={72}
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
            <button
              type="button"
              className="btn btn-ghost nav-cta"
              onClick={() => setRemovePhoto(true)}
            >
              사진 삭제
            </button>
          </div>
        )}
        {removePhoto && (
          <p className="hint" style={{ marginBottom: "0.5rem" }}>
            저장하면 기존 사진이 삭제됩니다.{" "}
            <button
              type="button"
              className="popup-link"
              onClick={() => setRemovePhoto(false)}
            >
              되돌리기
            </button>
          </p>
        )}
        <div className="filebox">
          <input
            id="pe-photo"
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <span className="hint">
          ※ 사진을 올리면 게시 전이라도 주소를 아는 사람은 볼 수 있습니다.
          본인 동의를 받은 뒤에 올려 주세요.
        </span>
      </div>

      {willHavePhoto && (
        <div className="field">
          <label htmlFor="pe-alt">사진 설명 (필수)</label>
          <input
            id="pe-alt"
            className="input"
            value={d.photo_alt}
            onChange={(e) => set("photo_alt", e.target.value)}
            placeholder="망원시장에서 장을 보는 김선영 호스트"
            required
          />
          <span className="hint">
            눈이 불편한 분께 읽어주는 문구입니다. &lsquo;사진&rsquo;, &lsquo;이미지&rsquo; 같은 말 대신
            무엇이 보이는지 적어 주세요.
          </span>
        </div>
      )}

      {/* ── 동의 ─────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--point-soft)",
          border: "1px solid var(--brand-mid)",
          borderRadius: 14,
          padding: "1rem 1.1rem",
          margin: "1.2rem 0",
        }}
      >
        <div className="field" style={{ marginBottom: "0.8rem" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem", lineHeight: 1.55 }}>
            <input
              type="checkbox"
              checked={d.consent_ok}
              onChange={(e) => {
                const ok = e.target.checked;
                set("consent_ok", ok);
                if (ok && !d.consent_date) {
                  set("consent_date", toDateInput(new Date().toISOString()));
                }
                if (!ok) set("is_published", false);
              }}
              style={{ marginTop: "0.35rem" }}
            />
            <span>
              <b>본인에게 웹사이트 공개 게시(이름 · 사진 · 소개)에 대한 동의를 받았습니다.</b>
              <br />
              <span style={{ color: "var(--point-dark)", fontSize: "0.9rem" }}>
                동의 없이는 게시할 수 없습니다. 웹 공개는 검색엔진에도 노출되며 되돌리기 어렵습니다.
              </span>
            </span>
          </label>
        </div>

        {d.consent_ok && (
          <div className="field-row">
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="pe-cdate">동의 받은 날짜</label>
              <input
                id="pe-cdate"
                className="input"
                type="date"
                value={d.consent_date}
                onChange={(e) => set("consent_date", e.target.value)}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="pe-cmemo">동의 방식 기록</label>
              <input
                id="pe-cmemo"
                className="input"
                value={d.consent_memo}
                onChange={(e) => set("consent_memo", e.target.value)}
                placeholder="서면 동의서 수령 / 카톡으로 확인"
              />
            </div>
          </div>
        )}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="pe-sort">노출 순서</label>
          <input
            id="pe-sort"
            className="input"
            type="number"
            value={d.sort}
            onChange={(e) => set("sort", Number(e.target.value) || 0)}
          />
          <span className="hint">작은 숫자가 먼저 나옵니다.</span>
        </div>
        <div className="field">
          <label htmlFor="pe-pub">게시</label>
          <select
            id="pe-pub"
            className="select"
            value={d.is_published ? "1" : "0"}
            onChange={(e) => set("is_published", e.target.value === "1")}
            disabled={!d.consent_ok}
          >
            <option value="0">비공개</option>
            <option value="1">공개</option>
          </select>
          {!d.consent_ok && (
            <span className="hint">동의를 확인해야 공개할 수 있습니다.</span>
          )}
        </div>
      </div>

      <div className="row">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "저장 중…" : isEdit ? "저장하기" : "추가하기"}
        </button>
        {isEdit && (
          <button
            className="btn btn-ghost"
            type="button"
            disabled={busy}
            onClick={onDelete}
          >
            삭제 (사진도 함께 삭제)
          </button>
        )}
      </div>
    </form>
  );
}
