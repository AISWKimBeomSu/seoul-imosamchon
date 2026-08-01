import { getSiteConfig, formState } from "@/lib/config";
import { goHref, type LinkKey, type LinkSource } from "@/lib/links";

/**
 * 사이트 전역의 신청 CTA. 서버 컴포넌트라 클라이언트 JS가 0바이트다.
 *
 * 마감/미설정이면 버튼이 사라지는 게 아니라 '접수 마감' 상태로 남는다.
 * 버튼이 사라지면 사용자는 "내가 잘못 봤나" 하고 헤맨다.
 */
export default async function ApplyButton({
  linkKey = "senior",
  source,
  className = "btn btn-primary",
  label,
  closedLabel,
}: {
  linkKey?: LinkKey;
  source: LinkSource;
  className?: string;
  label?: string;
  closedLabel?: string;
}) {
  const cfg = await getSiteConfig();
  const { available, label: defaultLabel } = formState(cfg, linkKey);

  if (!available) {
    return (
      <span className={`${className} is-closed`} aria-disabled="true">
        {closedLabel ??
          (linkKey === "senior" ? "접수 마감" : "Bookings closed")}
      </span>
    );
  }

  return (
    <a
      className={className}
      href={goHref(linkKey, source)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label ?? defaultLabel}
      {/* 새 창이 열리면 스크린리더 사용자는 맥락을 잃는다 (WCAG 3.2.5) */}
      <span className="sr-only"> (새 창에서 열립니다)</span>
    </a>
  );
}
