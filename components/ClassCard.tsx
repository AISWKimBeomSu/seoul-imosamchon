import Link from "next/link";
import Image from "next/image";
import { isFormAvailable, posterUrl, type ApplyForm } from "@/lib/forms";
import { getT } from "@/lib/locale.server";
import { pick } from "@/lib/i18n";

/**
 * 브랜드소개 아래 클래스 목록의 카드 한 장.
 * 여기서는 신청으로 바로 보내지 않는다 — 무엇인지 읽고 나서 정하도록
 * 상세 페이지로만 연결한다. 신청 버튼은 상세 페이지에 있다.
 */
export default async function ClassCard({ form }: { form: ApplyForm }) {
  const { t, locale } = await getT();
  const poster = posterUrl(form.poster_path);
  const title = pick(locale, form.title, form.title_en);
  const subtitle = pick(locale, form.subtitle, form.subtitle_en);
  const description = pick(locale, form.description, form.description_en);
  const open = isFormAvailable(form);

  return (
    <Link href={`/about/${form.key}`} className={`ccard accent-${form.accent}`}>
      {poster && (
        <div className="ccard-poster">
          <Image
            src={poster}
            alt=""
            aria-hidden="true"
            width={800}
            height={1000}
            sizes="(max-width: 720px) 92vw, 400px"
          />
        </div>
      )}
      <div className="ccard-body">
        <span className={`badge ${open ? "live" : "soon"}`}>
          {open ? t("class.open") : t("class.preparing")}
        </span>
        <h3>{title}</h3>
        {subtitle && <p className="ccard-eyebrow">{subtitle}</p>}
        {description && <p className="ccard-desc">{description}</p>}
        <span className="ccard-go">{t("class.readMore")}</span>
      </div>
    </Link>
  );
}
