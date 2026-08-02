import { getForm } from "@/lib/forms.server";
import { isFormAvailable } from "@/lib/forms";
import { goHref, type LinkSource } from "@/lib/links";
import { getT } from "@/lib/locale.server";
import { pick } from "@/lib/i18n";

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
  closedLabel,
}: {
  formKey?: string;
  source: LinkSource;
  className?: string;
  label?: string;
  closedLabel?: string;
}) {
  const [form, { t, locale }] = await Promise.all([getForm(formKey), getT()]);

  if (!form || !isFormAvailable(form)) {
    return (
      <span className={`${className} is-closed`} aria-disabled="true">
        {closedLabel ?? t("common.closed")}
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
      {label ?? pick(locale, form.cta_label, form.cta_label_en)}
      {/* 새 창이 열리면 스크린리더 사용자는 맥락을 잃는다 (WCAG 3.2.5) */}
      <span className="sr-only">{t("common.newWindow")}</span>
    </a>
  );
}
