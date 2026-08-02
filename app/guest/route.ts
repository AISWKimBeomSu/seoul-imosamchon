import { redirect } from "next/navigation";

/**
 * 예전 '손님 안내' 페이지. 내용은 쿠킹클래스 상세로 옮겼다.
 * 이미 공유된 링크가 죽지 않도록 영구 리다이렉트로 남긴다.
 */
export function GET() {
  redirect("/about/cooking");
}
