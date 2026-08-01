import Link from "next/link";

/**
 * 미리보기 상태를 화면에 못박아 둔다.
 * 이게 없으면 "왜 사이트에 안 보이지?"로 30분을 태우게 된다.
 */
export default function PreviewBanner({
  note,
  backTo = "/admin",
}: {
  note: string;
  backTo?: string;
}) {
  return (
    <div className="preview-bar" role="status">
      <div className="wrap">
        <b>미리보기</b>
        <span>{note} 방문자에게는 아직 보이지 않습니다.</span>
        <Link href={backTo}>관리자로 →</Link>
      </div>
    </div>
  );
}
