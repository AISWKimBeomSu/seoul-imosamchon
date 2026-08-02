import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import {
  LOCALE_COOKIE,
  DEFAULT_LOCALE,
  normalizeLocale,
  translator,
  type Locale,
} from "@/lib/i18n";

/** 현재 요청의 언어. 쿠키 하나로 결정되고, 없으면 한국어다. */
export const getLocale = cache(async (): Promise<Locale> => {
  try {
    const store = await cookies();
    return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
  } catch {
    return DEFAULT_LOCALE;
  }
});

/** 서버 컴포넌트에서 `const { t, locale } = await getT()` 로 쓴다. */
export async function getT() {
  const locale = await getLocale();
  return { locale, t: translator(locale) };
}
