import Image from "next/image";
import { qrVersion } from "@/lib/qr";
import { getSiteOrigin } from "@/lib/origin";
import { goHref } from "@/lib/links";
import { isFormAvailable, posterUrl, type ApplyForm } from "@/lib/forms";
import CopyLink from "@/components/CopyLink";

/**
 * /apply의 신청 카드 한 장. 포스터 → 설명 → QR(데스크톱) → 큰 버튼 순.
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
  const available = isFormAvailable(form);
  const poster = posterUrl(form.poster_path);
  const site = await getSiteOrigin();
  const href = goHref(form.key, "apply");

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
        {form.subtitle && <p className="fcard-eyebrow">{form.subtitle}</p>}
        <h2>{form.title}</h2>
        {form.description && <p className="fcard-desc">{form.description}</p>}

        {available ? (
          <>
            <div className="fcard-qr">
              {/* eslint-disable-next-line @next/next/no-img-element -- 서버 생성 SVG */}
              <img
                src={`/api/qr/${form.key}?v=${qrVersion(form.url)}`}
                width={190}
                height={190}
                alt={`${form.title} QR 코드`}
              />
              <span>휴대폰 카메라로 비춰 주세요</span>
            </div>

            <a
              className="btn btn-primary fcard-cta"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {form.cta_label}
              <span className="sr-only"> (새 창에서 열립니다)</span>
            </a>

            <div className="fcard-copy">
              <CopyLink
                value={`${site}${href}`}
                label="링크 복사해서 보내기"
                className="btn btn-ghost fcard-cta"
              />
            </div>
          </>
        ) : (
          <div className="fcard-closed">
            <span className="btn is-closed" aria-disabled="true">
              접수 준비 중
            </span>
            <p>{form.closed_note}</p>
          </div>
        )}
      </div>
    </article>
  );
}
