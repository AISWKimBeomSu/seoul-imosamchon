import "server-only";

import { randomBytes } from "node:crypto";

/**
 * 예약 조회·취소 토큰.
 *
 * 회원가입을 만들지 않기로 했으므로(D3) 이 문자열이 본인 확인의 전부다.
 * 32바이트 난수 — 추측으로 남의 예약을 여는 것은 현실적으로 불가능하다.
 *
 * 해시로 저장하지 않는 이유: 토큰이 새는 시점은 DB가 새는 시점이라 한 겹 더
 * 감싸도 막아 주는 게 없다. 대신 로그에 전문을 남기지 않는 쪽을 지킨다.
 */
export function newCancelToken(): string {
  return randomBytes(32).toString("base64url");
}

/** 로그·에러 메시지에 토큰을 적어야 할 때. 전문은 절대 남기지 않는다. */
export function maskToken(token: string): string {
  return token.length <= 8 ? "****" : `${token.slice(0, 4)}…${token.slice(-2)}`;
}
