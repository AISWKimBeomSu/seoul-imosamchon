import Link from "next/link";
import { getT } from "@/lib/locale.server";

/**
 * 신청 버튼 곁에 붙는 개인정보 고지.
 *
 * 신청 폼으로 나가는 문은 /apply 하나가 아니다 — 브랜드소개의 호스트 CTA,
 * 클래스 상세의 예약 버튼에서도 바로 구글폼으로 빠진다. 그 문마다 같은
 * 고지가 서 있어야 해서 컴포넌트로 뺐다(PLAN.md §6.3 PR4).
 *
 * 글자 크기는 0.95rem 아래로 내리지 않는다. 시니어 대상 사이트에서
 * 14px 이하는 금지고, 고지문이라고 예외가 되지는 않는다(AGENTS.md 접근성).
 */
export default async function PrivacyNote({
  className = "",
}: {
  className?: string;
}) {
  const { t } = await getT();

  return (
    <p className={`text-[0.95rem] leading-relaxed text-sub ${className}`}>
      {t("apply.privacy")}{" "}
      <Link href="/privacy" className="font-semibold text-point underline">
        {t("privacy.readMore")}
      </Link>
    </p>
  );
}
