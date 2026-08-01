import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ApplyButton from "@/components/ApplyButton";
import PopupMount from "@/components/PopupMount";
import { getSiteConfig } from "@/lib/config";
import { goHref } from "@/lib/links";
import { tagClass, ddayLabel, formatDate, formatBytes } from "@/lib/notices";

export const dynamic = "force-dynamic";

function extLabel(name: string): string {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  if (ext === "pdf") return "PDF";
  if (ext === "hwp" || ext === "hwpx") return "HWP";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "IMG";
  if (["doc", "docx"].includes(ext)) return "DOC";
  return "FILE";
}

type Attachment = {
  id: string;
  original_name: string;
  size_bytes: number | null;
  kind: string;
  sort: number;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("notices")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  return { title: data?.title ?? "공지" };
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: notice } = await supabase
    .from("notices")
    .select("*, attachments(*)")
    .eq("id", id)
    .maybeSingle();

  if (!notice) notFound();

  const attachments: Attachment[] = [...(notice.attachments ?? [])].sort(
    (a: Attachment, b: Attachment) => a.sort - b.sort,
  );
  const dd = ddayLabel(notice.dday);

  // 공지별 폼이 따로 지정돼 있으면 그것을, 없으면 전역 폼을 쓴다(PLAN.md F1-6).
  // 전역 폼과 같은 주소라면 계측 경유(/api/go)로 보내 클릭을 셀 수 있게 한다.
  const cfg = await getSiteConfig();
  const noticeFormUrl: string | null = notice.google_form_url;
  const useTrackedCta =
    !noticeFormUrl || noticeFormUrl === cfg.senior_form_url;

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="wrap detail">
          <Link href="/notice" className="backlink">
            ← 공지사항 목록
          </Link>
          <div className="detail-head">
            <span className={tagClass(notice.category)}>{notice.category}</span>
            <h1>{notice.title}</h1>
            <div className="detail-meta">
              <span>작성 · 서울이모삼촌</span>
              <span>{formatDate(notice.created_at)}</span>
              {dd && (
                <span style={{ color: "var(--point)", fontWeight: 700 }}>{dd}</span>
              )}
            </div>
          </div>

          {notice.body?.trim() ? (
            <div className="prose">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                  // 공지 본문에 구글폼 주소를 그대로 적어두는 경우가 많다.
                  // 그 링크만 계측·마감 처리를 통째로 우회하므로, 본문(DB)은
                  // 손대지 않고 렌더 시점에 /api/go 로 바꿔 준다.
                  a({ href, children, ...props }) {
                    const isGlobalForm =
                      Boolean(href) &&
                      Boolean(cfg.senior_form_url) &&
                      href === cfg.senior_form_url;
                    return (
                      <a
                        {...props}
                        href={isGlobalForm ? goHref("senior", "notice") : href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {notice.body}
              </ReactMarkdown>
            </div>
          ) : null}

          {attachments.length > 0 && (
            <div className="attach">
              <h4>첨부파일 · 내려받기</h4>
              {attachments.map((a) => (
                <a key={a.id} className="dlbtn" href={`/api/download/${a.id}`}>
                  <span className="ic">{extLabel(a.original_name)}</span>
                  <span>
                    {a.original_name}
                    <small>
                      {a.kind === "form" ? "신청서 양식 · " : ""}
                      내려받기
                      {a.size_bytes ? ` · ${formatBytes(a.size_bytes)}` : ""}
                    </small>
                  </span>
                  <span className="go">내려받기 ▾</span>
                </a>
              ))}
            </div>
          )}

          <div className="apply-card">
            {useTrackedCta ? (
              <ApplyButton source="notice" />
            ) : (
              <a
                className="btn btn-primary"
                href={noticeFormUrl!}
                target="_blank"
                rel="noopener noreferrer"
              >
                휴대폰으로 5분 신청하기
                <span className="sr-only"> (새 창에서 열립니다)</span>
              </a>
            )}
            <Link className="btn btn-ghost" href="/apply">
              신청 방법 자세히 보기
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
      <PopupMount page="other" />
    </>
  );
}
