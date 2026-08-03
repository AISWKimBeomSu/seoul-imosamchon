"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * 모바일(≤820px)에서 주요 메뉴를 드롭다운 패널로 접는다.
 * 데스크톱에서는 토글 버튼이 숨고 링크가 그대로 가로로 펼쳐지므로,
 * 화면 크기 분기는 전부 globals.css의 `.nav-toggle` / `.nav-links`가 담당한다.
 * 여기서 하는 일은 열림 상태를 들고 있는 것뿐이다.
 */
export default function NavMenu({
  label,
  openLabel,
  closeLabel,
  children,
}: {
  label: string;
  openLabel: string;
  closeLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 헤더는 layout에 있어 라우트가 바뀌어도 다시 마운트되지 않는다.
  // 이게 없으면 메뉴에서 링크를 누른 뒤 패널이 열린 채 남는다.
  // effect가 아니라 렌더 중에 조정한다 — effect에서 setState를 부르면
  // 한 번 더 렌더되고, react-hooks/set-state-in-effect에도 걸린다.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="site-nav-links"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-toggle-ic" aria-hidden="true">
          {open ? "✕" : "☰"}
        </span>
        {open ? closeLabel : openLabel}
      </button>
      <nav
        id="site-nav-links"
        className="nav-links"
        data-open={open ? "1" : "0"}
        aria-label={label}
      >
        {children}
      </nav>
    </>
  );
}
