import "server-only"; // ★ 클라이언트 컴포넌트가 실수로 임포트하면 빌드가 실패한다

import { createClient } from "@supabase/supabase-js";

/**
 * service_role 키를 쓰는 서버 전용 클라이언트. RLS를 우회한다.
 *
 * 용도는 단 하나 — /api/go 의 클릭 로그 INSERT.
 * link_clicks 에 anon INSERT 정책을 열면 누구나 Supabase REST로 통계를
 * 오염시킬 수 있어서, 쓰기 경로를 서버 라우트 하나로 좁혔다.
 *
 * 키가 없으면 null을 돌려준다. 계측은 실패해도 사용자 여정을 막지 않는다.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
