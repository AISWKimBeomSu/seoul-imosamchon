"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/notices";

type SupabaseClient = ReturnType<typeof createClient>;

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export default function NoticeComposer() {
  const router = useRouter();
  const [category, setCategory] = useState("모집공고");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [gform, setGform] = useState("");
  const [dday, setDday] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [otherFiles, setOtherFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const formFileRef = useRef<HTMLInputElement>(null);
  const otherRef = useRef<HTMLInputElement>(null);

  async function uploadOne(
    supabase: SupabaseClient,
    noticeId: string,
    file: File,
    kind: "form" | "notice" | "etc",
    sort: number,
  ) {
    const path = `notices/${noticeId}/${Date.now()}-${sort}${extOf(file.name)}`;
    const { error: upErr } = await supabase.storage
      .from("files")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (upErr) throw new Error(`파일 업로드 실패 (${file.name}): ${upErr.message}`);
    const { error: insErr } = await supabase.from("attachments").insert({
      notice_id: noticeId,
      storage_path: path,
      original_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
      kind,
      sort,
    });
    if (insErr) throw new Error(`첨부 기록 실패 (${file.name}): ${insErr.message}`);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setMsg({ type: "err", text: "제목을 입력해 주세요." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    try {
      const { data: notice, error } = await supabase
        .from("notices")
        .insert({
          category,
          title: title.trim(),
          body,
          google_form_url: gform.trim() || null,
          dday: dday || null,
          is_published: true,
        })
        .select("id")
        .single();
      if (error || !notice) {
        throw new Error(
          error?.message || "공지 저장에 실패했습니다. 관리자 권한을 확인해 주세요.",
        );
      }

      let sort = 0;
      if (formFile) await uploadOne(supabase, notice.id, formFile, "form", sort++);
      for (const f of otherFiles)
        await uploadOne(supabase, notice.id, f, "etc", sort++);

      setMsg({
        type: "ok",
        text: "공지가 게시되었습니다. 공개 페이지에서 바로 확인·다운로드할 수 있어요.",
      });
      setTitle("");
      setBody("");
      setGform("");
      setDday("");
      setFormFile(null);
      setOtherFiles([]);
      if (formFileRef.current) formFileRef.current.value = "";
      if (otherRef.current) otherRef.current.value = "";
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

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1rem" }}>
        새 공지 · 공고문 작성
      </h2>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}

      <div className="field">
        <label htmlFor="category">분류</label>
        <select
          id="category"
          className="select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="title">제목</label>
        <input
          id="title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 2026 서울이모삼촌 시니어 호스트 1차 모집"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="body">본문 (마크다운 지원)</label>
        <textarea
          id="body"
          className="textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={"모집 대상, 활동 내용, 보수 등을 자유롭게 작성하세요.\n\n- 목록도 사용할 수 있어요\n- **굵게** 도 가능합니다"}
        />
      </div>

      <div className="field">
        <label htmlFor="gform">구글폼 신청 링크 (선택)</label>
        <input
          id="gform"
          className="input"
          type="url"
          value={gform}
          onChange={(e) => setGform(e.target.value)}
          placeholder="https://forms.gle/..."
        />
        <span className="hint">입력하면 공지 상세페이지에 “휴대폰으로 신청하기” 버튼이 표시됩니다.</span>
      </div>

      <div className="field">
        <label htmlFor="dday">마감일 (선택)</label>
        <input
          id="dday"
          className="input"
          type="date"
          value={dday}
          onChange={(e) => setDday(e.target.value)}
          style={{ maxWidth: 220 }}
        />
      </div>

      <div className="field">
        <label htmlFor="formfile">신청서 양식 파일 (PDF·HWP 등, 선택)</label>
        <div className="filebox">
          <input
            id="formfile"
            ref={formFileRef}
            type="file"
            accept=".pdf,.hwp,.hwpx,.doc,.docx,image/*"
            onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <span className="hint">
          시니어가 상세페이지에서 “신청서 내려받기”로 받을 수 있는 대표 첨부입니다.
        </span>
      </div>

      <div className="field">
        <label htmlFor="others">추가 첨부파일 (공고문 등, 여러 개 가능)</label>
        <div className="filebox">
          <input
            id="others"
            ref={otherRef}
            type="file"
            multiple
            accept=".pdf,.hwp,.hwpx,.doc,.docx,image/*"
            onChange={(e) => setOtherFiles(Array.from(e.target.files ?? []))}
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "게시 중…" : "공지 게시하기"}
      </button>
    </form>
  );
}
