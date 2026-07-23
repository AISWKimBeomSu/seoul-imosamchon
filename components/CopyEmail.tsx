"use client";

import { useState } from "react";

export default function CopyEmail({ email }: { email: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      // clipboard 미지원 시 무시 (주소는 화면에 노출되어 있음)
    }
  }
  return (
    <button type="button" className="btn btn-ghost nav-cta" onClick={copy}>
      {done ? "복사됨 ✓" : "주소 복사"}
    </button>
  );
}
