export type Category = "모집공고" | "안내" | "공지";

export const CATEGORIES: Category[] = ["모집공고", "안내", "공지"];

export function tagClass(category: string): string {
  if (category === "모집공고") return "ntag mo";
  if (category === "안내") return "ntag info";
  return "ntag noti";
}

export function ddayLabel(dday: string | null): string | null {
  if (!dday) return null;
  const end = new Date(dday + "T23:59:59");
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "마감";
  if (diff === 0) return "D-day";
  return `D-${diff}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}·${mm}·${dd}`;
}

export function formatBytes(n: number | null): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export type Notice = {
  id: string;
  category: Category;
  title: string;
  body: string;
  google_form_url: string | null;
  dday: string | null;
  pinned: boolean;
  is_published: boolean;
  created_at: string;
};

export type Attachment = {
  id: string;
  notice_id: string;
  storage_path: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  kind: "form" | "notice" | "etc";
  sort: number;
  download_count: number;
};
