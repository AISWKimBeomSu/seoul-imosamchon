import { getActivePopups } from "@/lib/popups.server";
import { popupImageUrl } from "@/lib/popups";
import { getForm } from "@/lib/forms.server";
import { isFormAvailable } from "@/lib/forms";
import { qrVersion } from "@/lib/qr";
import { getSiteOrigin } from "@/lib/origin";
import { goHref } from "@/lib/links";
import { getT } from "@/lib/locale.server";
import { pick } from "@/lib/i18n";
import PopupNotice, { type PopupItem } from "@/components/PopupNotice";

/**
 * 서버에서 활성 팝업을 찾아 클라이언트 컴포넌트에 넘긴다.
 * QR/포스터는 여기서 '주소만' 만들어 전달하므로 생성 코드는 클라이언트 번들에 없다.
 * 문구도 여기서 번역해 넘긴다 — 사전이 클라이언트로 가지 않는다.
 *
 * 루트 레이아웃이 아니라 페이지별로 마운트한다 —
 * 그래야 /admin에 뜨지 않고, scope(홈전용/전체) 처리가 가능하다.
 */
export default async function PopupMount({
  page,
  preview = false,
}: {
  page: "home" | "other";
  preview?: boolean;
}) {
  const popups = await getActivePopups(page, { preview });
  if (popups.length === 0) return null;

  const [{ t, locale }, site] = await Promise.all([getT(), getSiteOrigin()]);
  const items: PopupItem[] = [];

  for (const p of popups) {
    let href: string | null = null;
    let external = false;
    let qrSrc: string | null = null;

    if (p.link_kind === "form" && p.form_key) {
      const form = await getForm(p.form_key);
      // 눌러도 아무 데도 못 가는 팝업 카드는 띄우지 않는다.
      if (!form || !isFormAvailable(form)) continue;
      href = goHref(form.key, "popup");
      external = true;
      if (p.show_qr) qrSrc = `/api/qr/${form.key}?v=${qrVersion(form.url)}`;
    } else if (p.link_kind === "class" && p.form_key) {
      // 신청으로 바로 보내지 않고 상세를 읽게 한다. 회차가 여럿이거나
      // 참가비가 있는 체험은 무엇인지 알고 고르는 편이 취소가 적다.
      const form = await getForm(p.form_key);
      if (!form) continue;
      href = `/about/${form.key}`;
      if (p.show_qr) qrSrc = `/api/qr/${form.key}?v=${qrVersion(form.url)}`;
    } else if (p.link_kind === "notice") {
      if (!p.notice_id) continue;
      href = `/notice/${p.notice_id}`;
    }

    items.push({
      id: p.id,
      title: pick(locale, p.title, p.title_en),
      subtitle: pick(locale, p.subtitle, p.subtitle_en),
      body: pick(locale, p.body, p.body_en),
      ctaLabel: pick(locale, p.cta_label, p.cta_label_en),
      href,
      external,
      qrSrc,
      imageSrc: popupImageUrl(p.image_path),
      imageAlt: p.image_alt,
      shareUrl: href ? `${site}${href}` : null,
    });
  }

  if (items.length === 0) return null;

  return (
    <PopupNotice
      items={items}
      preview={preview}
      labels={{
        heading: locale === "en" ? "Open for applications" : "지금 신청받고 있어요",
        close: locale === "en" ? "Close" : "닫기",
        zoom:
          locale === "en"
            ? "Tap the poster to enlarge"
            : "포스터를 누르면 크게 보입니다",
        scanQr:
          locale === "en"
            ? "Or scan with your phone"
            : "휴대폰으로 찍어서 신청하셔도 됩니다",
        copy: t("common.copyLink"),
        copied: t("common.copied"),
        copyFail: t("common.copyFail"),
        hideToday: locale === "en" ? "Hide for today" : "오늘 하루 보지 않기",
      }}
    />
  );
}
