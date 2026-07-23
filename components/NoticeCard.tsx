import Link from "next/link";
import { tagClass, ddayLabel } from "@/lib/notices";

export type NoticeCardData = {
  id: string;
  category: string;
  title: string;
  dday: string | null;
  attachments?: { count: number }[];
};

export default function NoticeCard({ n }: { n: NoticeCardData }) {
  const dd = ddayLabel(n.dday);
  const count = n.attachments?.[0]?.count ?? 0;
  return (
    <Link href={`/notice/${n.id}`} className="ncard">
      <div className="ncard-body">
        <span className={tagClass(n.category)}>{n.category}</span>
        <h3>{n.title}</h3>
        {count > 0 && <span className="nfile">▸ 첨부파일 {count}개</span>}
      </div>
      <div className="ncard-bar">
        자세히 보기 {dd && <span className="dday">{dd}</span>}
      </div>
    </Link>
  );
}
