import { getActivePopup } from "@/lib/popups";
import { getSiteConfig, formState } from "@/lib/config";
import { qrVersion } from "@/lib/qr";
import { getSiteOrigin } from "@/lib/origin";
import { goHref, type LinkKey } from "@/lib/links";
import PopupNotice from "@/components/PopupNotice";

/**
 * 서버에서 활성 팝업을 찾아 클라이언트 컴포넌트에 넘긴다.
 * QR은 여기서 '주소만' 만들어 전달하므로 QR 생성 코드는 클라이언트 번들에 없다.
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
  const popup = await getActivePopup(page, { preview });
  if (!popup) return null;

  const cfg = await getSiteConfig();

  let href: string | null = null;
  let external = false;
  let qrSrc: string | null = null;

  if (popup.link_key === "senior" || popup.link_key === "guest") {
    const key = popup.link_key as LinkKey;
    const { url, available } = formState(cfg, key);
    // 링크 대상이 마감/미설정이면 팝업 자체를 띄우지 않는다.
    // 눌러도 아무 데도 못 가는 팝업만큼 나쁜 건 없다.
    if (!available || !url) return null;
    href = goHref(key, "popup");
    external = true;
    if (popup.show_qr) qrSrc = `/api/qr/${key}?v=${qrVersion(url)}`;
  } else if (popup.link_key === "notice") {
    if (!popup.notice_id) return null;
    href = `/notice/${popup.notice_id}`;
  }

  const site = await getSiteOrigin();

  return (
    <PopupNotice
      id={popup.id}
      title={popup.title}
      subtitle={popup.subtitle}
      body={popup.body}
      ctaLabel={popup.cta_label}
      href={href}
      external={external}
      qrSrc={qrSrc}
      shareUrl={href ? `${site}${href}` : null}
      preview={preview}
    />
  );
}
