import { createClient } from "@supabase/supabase-js";

/**
 * Supabase 클라이언트 (브라우저에서만 사용)
 * Publishable Key는 RLS를 전제로 공개해도 되는 키입니다. Secret Key는 절대 여기에 넣지 않습니다.
 * 두 테이블 모두 익명 사용자는 INSERT만 가능합니다 (database/schema.sql 참고).
 */
const SUPABASE_PROJECT_ID = "fvbzihiyytjqnjkeuykh";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_FCYTUNqaYI_kTX8WYGKwww_8sb8tUgA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // 로그인 기능이 없으므로 세션을 저장하거나 갱신하지 않습니다.
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
