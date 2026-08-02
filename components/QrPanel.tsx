import { getForm } from "@/lib/forms.server";
import { qrVersion } from "@/lib/qr";
import { getSiteOrigin } from "@/lib/origin";
import { goHref } from "@/lib/links";
import { getT } from "@/lib/locale.server";
import { pick } from "@/lib/i18n";
import CopyLink from "@/components/CopyLink";

/**
 * QR + 이미지 저장 + 링크 복사.
 *
 * QR만 단독으로 두는 진입점은 만들지 않는다. QR은 시각·인지·기기 접근성
 * 모두에서 배타적 수단이라 텍스트 대안(CTA 버튼)이 반드시 함께 붙는다.
 */
export default async function QrPanel({
  formKey = "senior",
  caption,
  size = 180,
}: {
  formKey?: string;
  caption?: string;
  size?: number;
}) {
  const [form, { t, locale }, site] = await Promise.all([
    getForm(formKey),
    getT(),
    getSiteOrigin(),
  ]);
  if (!form?.url) return null;

  const title = pick(locale, form.title, form.title_en);
  // 폼 URL이 바뀌면 v가 바뀌어 캐시된 옛 QR이 자동으로 버려진다.
  const src = `/api/qr/${form.key}?v=${qrVersion(form.url)}`;

  return (
    <figure className="qr-panel">
      {/* eslint-disable-next-line @next/next/no-img-element -- 서버 생성 SVG. 벡터라 최적화 이득 없음 */}
      <img src={src} width={size} height={size} alt={`${title} QR`} />
      <figcaption>{caption ?? t("common.scanQr")}</figcaption>
      <div className="qr-actions">
        <a
          className="btn btn-ghost nav-cta"
          href={src}
          download={`seoul-imosamchon-${form.key}-QR.svg`}
        >
          {t("common.saveQr")}
        </a>
        <CopyLink
          value={`${site}${goHref(form.key, "qr")}`}
          label={t("common.copyLink")}
          copiedLabel={t("common.copied")}
          failLabel={t("common.copyFail")}
        />
      </div>
    </figure>
  );
}
