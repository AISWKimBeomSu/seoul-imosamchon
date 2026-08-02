import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_CONFIG, type SiteConfig } from "@/lib/site";

export { type SiteConfig } from "@/lib/site";

/** 연락처 등 사이트 전역 값. 폼 설정은 lib/forms.server.ts 참고. */
export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_config")
      .select("contact_email, contact_phone")
      .eq("id", 1)
      .maybeSingle();
    return data ? { ...FALLBACK_CONFIG, ...data } : FALLBACK_CONFIG;
  } catch {
    return FALLBACK_CONFIG;
  }
});
