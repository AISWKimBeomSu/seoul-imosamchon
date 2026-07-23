"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, formatBytes } from "@/lib/notices";

type SupabaseClient = ReturnType<typeof createClient>;

type Att = {
  id: string;
  original_name: string;
  kind: string;
  storage_path: string;
  size_bytes: number | null;
};

type NoticeInput = {
  id: string;
  category: string;
  title: string;
  body: string | null;
  google_form_url: string | null;
  dday: string | null;
  is_published: boolean;
};

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

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

export default function NoticeEditor({
  notice,
  attachments,
}: {
  notice: NoticeInput;
  attachments: Att[];
}) {
  const router = useRouter();
  const [category, setCategory] = useState(notice.category);
  const [title, setTitle] = useState(notice.title);
  const [body, setBody] = useState(notice.body ?? "");
  const [gform, setGform] = useState(notice.google_form_url ?? "");
  const [dday, setDday] = useState(notice.dday ?? "");
  const [published, setPublished] = useState(notice.is_published);
  const [existing, setExisting] = useState<Att[]>(attachments);
  const [removeIds, setRemoveIds] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function markRemove(a: Att) {
    setRemoveIds((p) => [...p, a.id]);
    setExisting((p) => p.filter((x) => x.id !== a.id));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setMsg({ type: "err", text: "제목을 입력해 주세요." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    try {
      const { error: uErr } = await supabase
        .from("notices")
        .update({
          category,
          title: title.trim(),
          body,
          google_form_url: gform.trim() || null,
          dday: dday || null,
          is_published: published,
        })
        .eq("id", notice.id);
      if (uErr) throw new Error("수정 실패: " + uErr.message);

      if (removeIds.length) {
        const toDel = attachments.filter((a) => removeIds.includes(a.id));
        await supabase.storage.from("files").remove(toDel.map((a) => a.storage_path));
        await supabase.from("attachments").delete().in("id", removeIds);
      }

      let sort = existing.length;
      for (const f of newFiles) await uploadOne(supabase, notice.id, f, "etc", sort++);

      router.push(`/notice/${notice.id}`);
      router.refresh();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : String(err) });
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm("이 공지를 삭제할까요? 되돌릴 수 없습니다.")) return;
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    try {
      if (attachments.length)
        await supabase.storage.from("files").remove(attachments.map((a) => a.storage_path));
      const { error } = await supabase.from("notices").delete().eq("id", notice.id);
      if (error) throw new Error(error.message);
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setMsg({ type: "err", text: "삭제 실패: " + (err instanceof Error ? err.message : String(err)) });
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={onSave}>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}

      <div className="field">
        <label htmlFor="category">분류</label>
        <select id="category" className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="title">제목</label>
        <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="field">
        <label htmlFor="body">본문 (마크다운 · 이미지 지원)</label>
        <textarea id="body" className="textarea" style={{ minHeight: 320 }} value={body} onChange={(e) => setBody(e.target.value)} />
        <span className="hint">이미지는 {"![설명](주소)"} 형식으로 넣을 수 있어요.</span>
      </div>

      <div className="field">
        <label htmlFor="gform">구글폼 신청 링크</label>
        <input id="gform" className="input" type="url" value={gform} onChange={(e) => setGform(e.target.value)} placeholder="https://..." />
      </div>

      <div className="field">
        <label htmlFor="dday">마감일</label>
        <input id="dday" className="input" type="date" value={dday} onChange={(e) => setDday(e.target.value)} style={{ maxWidth: 220 }} />
      </div>

      <div className="field">
        <label>
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} style={{ marginRight: 8 }} />
          공개(게시)
        </label>
      </div>

      <div className="field">
        <label>현재 첨부파일</label>
        {existing.length === 0 ? (
          <span className="hint">첨부파일이 없습니다.</span>
        ) : (
          <ul className="admin-list" style={{ marginTop: 4 }}>
            {existing.map((a) => (
              <li key={a.id}>
                <span className="t">{a.original_name}</span>
                <span className="m">
                  {a.kind === "form" ? "신청서 · " : ""}
                  {a.size_bytes ? formatBytes(a.size_bytes) : ""}
                </span>
                <button type="button" className="btn btn-ghost nav-cta" onClick={() => markRemove(a)}>
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="field">
        <label htmlFor="newfiles">첨부파일 추가 (여러 개 가능)</label>
        <div className="filebox">
          <input
            id="newfiles"
            type="file"
            multiple
            accept=".pdf,.hwp,.hwpx,.doc,.docx,image/*"
            onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
          />
        </div>
      </div>

      <div className="row">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "저장 중…" : "저장하기"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDelete} disabled={busy} style={{ color: "#a3261f", borderColor: "#f3c0bb" }}>
          공지 삭제
        </button>
      </div>
    </form>
  );
}
