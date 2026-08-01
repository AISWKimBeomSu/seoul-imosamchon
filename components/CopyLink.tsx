"use client";

import { useState } from "react";

/**
 * 링크 복사. 모바일 팝업에서 "카톡으로 부모님께 보내기" 용도가 주다.
 * (자기 폰 화면의 QR은 자기 폰으로 못 찍는다 — PLAN.md §1.3)
 *
 * clipboard API 실패 시 안내 문구로 폴백한다. 조용히 실패하지 않는다.
 */
export default function CopyLink({
  value,
  label = "링크 복사",
  className = "btn btn-ghost nav-cta",
}: {
  value: string;
  label?: string;
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
    <button
      type="button"
      className={className}
      onClick={copy}
      aria-live="polite"
    >
      {state === "done" ? "복사됨 ✓" : state === "fail" ? "주소창에서 복사해 주세요" : label}
    </button>
  );
}
