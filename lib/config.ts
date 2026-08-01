import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_CONFIG, type SiteConfig } from "@/lib/site";

// 서버 컴포넌트가 한 곳에서 다 꺼내 쓰도록 재수출한다.
// 클라이언트 컴포넌트는 이 파일이 아니라 @/lib/site 에서 직접 가져가야 한다.
export {
  FORM_URL_PATTERN,
  isValidFormUrl,
  formState,
  type SiteConfig,
} from "@/lib/site";

/**
 * 요청 단위 메모이즈. 한 페이지에서 헤더·히어로·팝업·푸터가 각각 불러도
 * Supabase 왕복은 1회다. (영속 캐시가 아니라 force-dynamic과 충돌하지 않는다)
 */
export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_config")
      .select(
        "senior_form_url, senior_form_open, senior_form_label, senior_closed_note, guest_form_url, guest_form_open, guest_form_label, contact_email, contact_phone",
      )
      .eq("id", 1)
      .maybeSingle();
    return data ? { ...FALLBACK_CONFIG, ...data } : FALLBACK_CONFIG;
  } catch {
    return FALLBACK_CONFIG;
  }
});
