import Image from "next/image";
import { qrVersion } from "@/lib/qr";
import { getSiteOrigin } from "@/lib/origin";
import { goHref } from "@/lib/links";
import { isFormAvailable, posterUrl, type ApplyForm } from "@/lib/forms";
import { getT } from "@/lib/locale.server";
import { pick } from "@/lib/i18n";
import CopyLink from "@/components/CopyLink";

/**
 * /apply의 신청 카드 한 장. 포스터 → 설명 → 큰 버튼 → QR(데스크톱) 순.
 *
 * QR을 데스크톱에서만 보여주는 이유: 자기 폰 화면의 QR은 자기 폰으로 스캔할 수
 * 없다. 모바일에는 대신 큰 버튼과 '링크 복사'가 나온다.
 */
export default async function ApplyFormCard({
  form,
  highlight = false,
}: {
  form: ApplyForm;
  highlight?: boolean;
}) {
  const [{ t, locale }, site] = await Promise.all([getT(), getSiteOrigin()]);

  const available = isFormAvailable(form);
  const poster = posterUrl(form.poster_path);
  const href = goHref(form.key, "apply");

  const title = pick(locale, form.title, form.title_en);
  const subtitle = pick(locale, form.subtitle, form.subtitle_en);
  const description = pick(locale, form.description, form.description_en);
  const ctaLabel = pick(locale, form.cta_label, form.cta_label_en);
  const closedNote = pick(locale, form.closed_note, form.closed_note_en);

  return (
    <article
      className={`fcard accent-${form.accent}${highlight ? " is-highlight" : ""}`}
      id={`form-${form.key}`}
    >
      {poster && (
        <div className="fcard-poster">
          <Image
            src={poster}
            alt={form.poster_alt}
            width={800}
            height={1000}
            sizes="(max-width: 720px) 92vw, 360px"
          />
        </div>
      )}

      <div className="fcard-body">
        {subtitle && <p className="fcard-eyebrow">{subtitle}</p>}
        <h2>{title}</h2>
        {description && <p className="fcard-desc">{description}</p>}

        {available ? (
          <>
            <a
              className="btn btn-primary fcard-cta"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ctaLabel}
              <span className="sr-only">{t("common.newWindow")}</span>
            </a>

            <div className="fcard-qr">
              {/* eslint-disable-next-line @next/next/no-img-element -- 서버 생성 SVG */}
              <img
                src={`/api/qr/${form.key}?v=${qrVersion(form.url)}`}
                width={170}
                height={170}
                alt={`${title} QR`}
              />
              <span>{t("common.scanQr")}</span>
            </div>

            <div className="fcard-copy">
              <CopyLink
                value={`${site}${href}`}
                label={t("common.copyLink")}
                copiedLabel={t("common.copied")}
                failLabel={t("common.copyFail")}
                className="btn btn-ghost fcard-cta"
              />
            </div>
          </>
        ) : (
          <div className="fcard-closed">
            <span className="btn is-closed" aria-disabled="true">
              {t("common.preparing")}
            </span>
            <p>{closedNote}</p>
          </div>
        )}
      </div>
    </article>
  );
}
