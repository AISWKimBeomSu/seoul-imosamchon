"use client";

import { useEffect, useState } from "react";

/**
 * 현재 페이지의 맨 위로 되돌리는 떠 있는 버튼. 모든 페이지에 나온다.
 *
 * 홈으로 가는 링크가 아니다 — 예전 푸터의 "↑ 처음으로"가 화살표를 달고
 * 홈(/)으로 이동해 헷갈렸다. 이 버튼은 스크롤만 되돌린다.
 */
export default function ScrollToTop({ label }: { label: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // 한 화면 이상 내려갔을 때만 나타난다. 맨 위에서는 눌러도 할 일이 없고,
    // 콘텐츠를 가리기만 한다.
    const onScroll = () => setShown(window.scrollY > 400);
    onScroll(); // 새로고침으로 스크롤 위치가 복원된 경우를 잡는다
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      className="to-top"
      data-shown={shown ? "1" : "0"}
      // 화면에는 화살표만 두되, 스크린리더에는 무슨 버튼인지 알려야 한다.
      aria-label={label}
      // 숨어 있을 때는 탭 순서에서도 빠진다. visibility:hidden이 이미
      // 초점을 막지만, 브라우저별 편차가 있어 명시해 둔다.
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      onClick={() => {
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}
