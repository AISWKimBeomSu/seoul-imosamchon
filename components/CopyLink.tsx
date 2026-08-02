"use client";

import { useState } from "react";

/**
 * 링크 복사. 모바일 팝업에서 "카톡으로 부모님께 보내기" 용도가 주다.
 * (자기 폰 화면의 QR은 자기 폰으로 못 찍는다)
 *
 * clipboard API 실패 시 안내 문구로 폴백한다. 조용히 실패하지 않는다.
 * 문구는 서버에서 번역해 내려준다 — 클라이언트에 사전을 싣지 않기 위해서다.
 */
export default function CopyLink({
  value,
  label = "링크 복사",
  copiedLabel = "복사됨 ✓",
  failLabel = "주소창에서 복사해 주세요",
  className = "btn btn-ghost nav-cta",
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  failLabel?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("done");
    } catch {
      setState("fail");
    }
    setTimeout(() => setState("idle"), 2200);
  }

  return (
    <button type="button" className={className} onClick={copy} aria-live="polite">
      {state === "done" ? copiedLabel : state === "fail" ? failLabel : label}
    </button>
  );
}
