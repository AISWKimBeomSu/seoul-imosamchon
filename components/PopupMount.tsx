import { getActivePopups } from "@/lib/popups.server";
import { popupImageUrl } from "@/lib/popups";
import { getForm } from "@/lib/forms.server";
import { isFormAvailable } from "@/lib/forms";
import { qrVersion } from "@/lib/qr";
import { getSiteOrigin } from "@/lib/origin";
import { goHref } from "@/lib/links";
import PopupNotice, { type PopupItem } from "@/components/PopupNotice";

/**
 * 서버에서 활성 팝업을 찾아 클라이언트 컴포넌트에 넘긴다.
 * QR/포스터는 여기서 '주소만' 만들어 전달하므로 생성 코드는 클라이언트 번들에 없다.
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

  const site = await getSiteOrigin();
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
    } else if (p.link_kind === "notice") {
      if (!p.notice_id) continue;
      href = `/notice/${p.notice_id}`;
    }

    items.push({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      body: p.body,
      ctaLabel: p.cta_label,
      href,
      external,
      qrSrc,
      imageSrc: popupImageUrl(p.image_path),
      imageAlt: p.image_alt,
      shareUrl: href ? `${site}${href}` : null,
    });
  }

  if (items.length === 0) return null;

  return <PopupNotice items={items} preview={preview} />;
}
