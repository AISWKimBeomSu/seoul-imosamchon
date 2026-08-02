"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/**
 * 지금 보는 페이지를 그대로 두고 언어만 바꾼다.
 * 예전에는 EN이 /guest로 '이동'했는데, 그건 번역이 아니라 다른 페이지였다.
 *
 * 쿠키 한 개로 서버 렌더를 갈아끼운다. 클라이언트 번역 사전을 내려보내지 않으니
 * 번들이 늘지 않고, 첫 페인트부터 올바른 언어로 그려진다.
 */
export default function LanguageToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    // 1년 유지. UI 선호값이라 httpOnly가 아니어도 된다.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      className="lang-toggle"
      role="group"
      aria-label={locale === "ko" ? "언어 선택" : "Language"}
      data-pending={pending ? "1" : "0"}
    >
      <button
        type="button"
        lang="ko"
        onClick={() => switchTo("ko")}
        aria-pressed={locale === "ko"}
        className={locale === "ko" ? "is-on" : ""}
      >
        KO
      </button>
      <button
        type="button"
        lang="en"
        onClick={() => switchTo("en")}
        aria-pressed={locale === "en"}
        className={locale === "en" ? "is-on" : ""}
      >
        EN
      </button>
    </div>
  );
}
