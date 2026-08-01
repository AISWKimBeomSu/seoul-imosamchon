import "server-only";

import { createHash } from "node:crypto";
import QRCode from "qrcode";

/**
 * QR은 파일이 아니라 함수다(PLAN.md P5).
 * 관리자가 업로드하는 방식이면 폼 URL을 바꾸고 QR 갱신을 잊는 사고가 반드시 난다.
 * URL을 입력으로 그때그때 생성하면 둘이 어긋날 수 없다.
 */
export async function renderQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M", // 인쇄물이 일부 손상돼도 인식된다
    margin: 2, // quiet zone. 0이면 스캐너가 못 읽는다
    width: 512,
    color: { dark: "#23201cff", light: "#ffffffff" }, // --ink / --bg
  });
}

/**
 * 폼 URL이 바뀌면 값이 바뀌는 8자 해시.
 * <img src="/api/qr/senior?v={hash}"> 로 붙여 캐시를 자동 무효화한다.
 */
export function qrVersion(url: string | null): string {
  return createHash("sha1")
    .update(url ?? "")
    .digest("hex")
    .slice(0, 8);
}
