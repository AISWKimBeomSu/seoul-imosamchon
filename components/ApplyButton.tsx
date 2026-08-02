import { getForm } from "@/lib/forms.server";
import { isFormAvailable } from "@/lib/forms";
import { goHref, type LinkSource } from "@/lib/links";

/**
 * 특정 신청 폼으로 가는 CTA. 서버 컴포넌트라 클라이언트 JS가 0바이트다.
 *
 * 마감/미설정이면 버튼이 사라지는 게 아니라 '접수 마감' 상태로 남는다.
 * 버튼이 사라지면 사용자는 "내가 잘못 봤나" 하고 헤맨다.
 */
export default async function ApplyButton({
  formKey = "senior",
  source,
  className = "btn btn-primary",
  label,
  closedLabel = "접수 마감",
}: {
  formKey?: string;
  source: LinkSource;
  className?: string;
  label?: string;
  closedLabel?: string;
}) {
  const form = await getForm(formKey);

  if (!form || !isFormAvailable(form)) {
    return (
      <span className={`${className} is-closed`} aria-disabled="true">
        {closedLabel}
      </span>
    );
  }

  return (
    <a
      className={className}
      href={goHref(form.key, source)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label ?? form.cta_label}
      {/* 새 창이 열리면 스크린리더 사용자는 맥락을 잃는다 (WCAG 3.2.5) */}
      <span className="sr-only"> (새 창에서 열립니다)</span>
    </a>
  );
}
