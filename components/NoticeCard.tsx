import Link from "next/link";
import { tagClass, ddayLabel } from "@/lib/notices";
import { getT } from "@/lib/locale.server";

export type NoticeCardData = {
  id: string;
  category: string;
  title: string;
  dday: string | null;
  attachments?: { count: number }[];
};

export default async function NoticeCard({ n }: { n: NoticeCardData }) {
  const { t, locale } = await getT();
  const dd = ddayLabel(n.dday);
  const count = n.attachments?.[0]?.count ?? 0;

  return (
    <Link href={`/notice/${n.id}`} className="ncard">
      <div className="ncard-body">
        <span className={tagClass(n.category)}>{n.category}</span>
        <h3>{n.title}</h3>
        {count > 0 && (
          <span className="nfile">
            ▸{" "}
            {locale === "en"
              ? `${count} ${t("notice.attachCount")}`
              : `첨부파일 ${count}개`}
          </span>
        )}
      </div>
      <div className="ncard-bar">
        {t("common.more")}{" "}
        {dd && (
          <span className="dday">{dd === "마감" ? t("notice.deadline") : dd}</span>
        )}
      </div>
    </Link>
  );
}
