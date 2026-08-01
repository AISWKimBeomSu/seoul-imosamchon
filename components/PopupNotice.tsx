"use client";

import { useEffect, useRef, useState } from "react";
import CopyLink from "@/components/CopyLink";

const OPEN_DELAY_MS = 900; // 첫 페인트/LCP 이후에 뜬다
const DAY_MS = 24 * 60 * 60 * 1000;

/** 팝업 ID 기준으로 저장 → 새 팝업은 '다시 보지 않기'와 무관하게 다시 뜬다 */
function storageKey(id: string) {
  return `imo:popup:${id}`;
}

function isDismissed(id: string): boolean {
  try {
    const raw = window.localStorage.getItem(storageKey(id));
    if (!raw) return false;
    if (raw === "forever") return true;
    return Number(raw) > Date.now();
  } catch {
    // 인앱 브라우저 등에서 저장소 접근이 막히면 그냥 보여준다
    return false;
  }
}

function remember(id: string, mode: "today" | "forever") {
  try {
    window.localStorage.setItem(
      storageKey(id),
      mode === "forever" ? "forever" : String(Date.now() + DAY_MS),
    );
  } catch {
    /* 저장 실패는 무시 */
  }
}

export default function PopupNotice({
  id,
  title,
  subtitle,
  body,
  ctaLabel,
  href,
  external,
  qrSrc,
  shareUrl,
}: {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  href: string | null;
  external: boolean;
  qrSrc: string | null;
  shareUrl: string | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isDismissed(id)) return;

    const timer = window.setTimeout(() => {
      const el = ref.current;
      // showModal이 없는 구형 브라우저에서는 팝업을 포기한다.
      // 본문은 그대로 동작하므로 우아하게 열화된다.
      if (!el || typeof el.showModal !== "function") return;
      setMounted(true);
      el.showModal(); // 포커스 트랩·ESC·백드롭은 브라우저가 공짜로 준다
      document.body.style.overflow = "hidden";
    }, OPEN_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [id]);

  function close(mode: "today" | "forever" | "once") {
    if (mode !== "once") remember(id, mode);
    ref.current?.close(); // 닫으면 브라우저가 원래 포커스를 복원한다
    document.body.style.overflow = "";
  }

  return (
    <dialog
      ref={ref}
      className="popup"
      aria-labelledby={`popup-title-${id}`}
      data-mounted={mounted ? "1" : "0"}
      onCancel={(e) => {
        e.preventDefault(); // 기본 close를 막고 스크롤 잠금까지 함께 푼다
        close("once");
      }}
      onClick={(e) => {
        if (e.target === ref.current) close("once"); // 배경 클릭
      }}
    >
      <div className="popup-inner">
        <button type="button" className="popup-close" onClick={() => close("once")}>
          <span aria-hidden="true">✕</span> 닫기
        </button>

        {subtitle && <p className="popup-eyebrow">{subtitle}</p>}
        <h2 id={`popup-title-${id}`} className="popup-title">
          {title}
        </h2>
        {body && <p className="popup-body">{body}</p>}

        {/* 데스크톱에서만 보인다 — CSS로만 제어해 하이드레이션 불일치를 만들지 않는다 */}
        {qrSrc && (
          <div className="popup-qr">
            {/* eslint-disable-next-line @next/next/no-img-element -- 서버 생성 SVG */}
            <img src={qrSrc} width={168} height={168} alt="신청 페이지로 이동하는 QR 코드" />
            <span>휴대폰 카메라로 비춰 주세요</span>
          </div>
        )}

        {href && (
          <a
            className="btn btn-primary popup-cta"
            href={href}
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            onClick={() => close("today")}
          >
            {ctaLabel}
          </a>
        )}

        {/* 모바일 전용 — 자기 폰의 QR은 못 찍으니 '보내기'가 답이다 */}
        {shareUrl && (
          <div className="popup-copy">
            <CopyLink
              value={shareUrl}
              label="링크 복사해서 보내기"
              className="btn btn-ghost popup-cta"
            />
          </div>
        )}

        <div className="popup-foot">
          <button type="button" className="popup-link" onClick={() => close("today")}>
            오늘 하루 보지 않기
          </button>
          <button type="button" className="popup-link" onClick={() => close("forever")}>
            다시 보지 않기
          </button>
        </div>
      </div>
    </dialog>
  );
}
