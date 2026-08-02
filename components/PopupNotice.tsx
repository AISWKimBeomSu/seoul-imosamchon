"use client";

import { useEffect, useRef, useState } from "react";
import CopyLink from "@/components/CopyLink";

const OPEN_DELAY_MS = 900; // 첫 페인트/LCP 이후에 뜬다
const DAY_MS = 24 * 60 * 60 * 1000;

export type PopupItem = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  href: string | null;
  external: boolean;
  qrSrc: string | null;
  imageSrc: string | null;
  imageAlt: string;
  shareUrl: string | null;
};

/**
 * 노출 중인 팝업 묶음 기준으로 저장한다.
 * 새 팝업이 하나라도 추가되면 키가 바뀌어, 예전에 '다시 보지 않기'를 눌렀어도
 * 새 소식은 다시 보인다.
 */
function storageKey(items: PopupItem[]) {
  return `imo:popup:${items.map((i) => i.id).sort().join("|")}`;
}

function isDismissed(key: string): boolean {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return false;
    if (raw === "forever") return true;
    return Number(raw) > Date.now();
  } catch {
    // 인앱 브라우저 등에서 저장소 접근이 막히면 그냥 보여준다
    return false;
  }
}

function remember(key: string, mode: "today" | "forever") {
  try {
    window.localStorage.setItem(
      key,
      mode === "forever" ? "forever" : String(Date.now() + DAY_MS),
    );
  } catch {
    /* 저장 실패는 무시 */
  }
}

export type PopupLabels = {
  heading: string;
  close: string;
  zoom: string;
  scanQr: string;
  copy: string;
  copied: string;
  copyFail: string;
  hideToday: string;
  hideForever: string;
};

export default function PopupNotice({
  items,
  preview = false,
  labels,
}: {
  items: PopupItem[];
  preview?: boolean;
  labels: PopupLabels;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  const key = storageKey(items);
  const multi = items.length > 1;

  useEffect(() => {
    // 미리보기에서는 '오늘 하루 보지 않기' 기록을 무시한다.
    // 한 번 닫으면 다시 못 보는 미리보기는 쓸모가 없다.
    if (!preview && isDismissed(key)) return;

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
  }, [key, preview]);

  /**
   * 기본은 '이번만 닫기'다 — 홈에 다시 오면 팝업이 다시 뜬다.
   * 그냥 닫기·ESC·배경클릭·CTA 클릭이 모두 여기에 해당한다.
   *
   * 아래 두 버튼('오늘 하루'·'다시 보지 않기')을 눌렀을 때만 기억한다.
   * 매번 뜨는 팝업에 빠져나갈 문이 없으면 그때부터는 광고가 된다.
   */
  function close(mode: "today" | "forever" | "once") {
    if (mode !== "once" && !preview) remember(key, mode);
    ref.current?.close(); // 닫으면 브라우저가 원래 포커스를 복원한다
    document.body.style.overflow = "";
  }

  const headingId = `popup-heading-${items[0].id}`;

  return (
    <dialog
      ref={ref}
      className={`popup${multi ? " popup-multi" : ""}`}
      aria-labelledby={headingId}
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
          <span aria-hidden="true">✕</span> {labels.close}
        </button>

        {multi && (
          <h2 id={headingId} className="popup-heading">
            {labels.heading}
          </h2>
        )}

        <div className="popup-items">
          {items.map((it, idx) => (
            <article className="popup-item" key={it.id}>
              {it.imageSrc && (
                <a
                  className="popup-poster"
                  href={it.imageSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="포스터 크게 보기"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- 다이얼로그 안, 원본 비율 유지가 중요 */}
                  <img src={it.imageSrc} alt={it.imageAlt} />
                </a>
              )}
              {it.imageSrc && <p className="popup-zoom">{labels.zoom}</p>}

              {it.subtitle && <p className="popup-eyebrow">{it.subtitle}</p>}
              {multi ? (
                <h3 className="popup-title">{it.title}</h3>
              ) : (
                <h2 id={idx === 0 ? headingId : undefined} className="popup-title">
                  {it.title}
                </h2>
              )}
              {it.body && <p className="popup-body">{it.body}</p>}

              {/* 버튼이 QR보다 위에 온다. 포스터 바로 아래에 있어야 스크롤 없이
                  눌리고, QR은 어차피 데스크톱 보조 수단이다. */}
              {it.href && (
                <a
                  className="btn btn-primary popup-cta"
                  href={it.href}
                  {...(it.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  onClick={() => close("once")}
                >
                  {it.ctaLabel}
                </a>
              )}

              {/* 데스크톱에서만 보인다 — 자기 폰 화면의 QR은 자기 폰으로 못 찍는다 */}
              {it.qrSrc && (
                <div className="popup-qr">
                  {/* eslint-disable-next-line @next/next/no-img-element -- 서버 생성 SVG */}
                  <img src={it.qrSrc} width={200} height={200} alt={`${it.title} QR 코드`} />
                  <span>{labels.scanQr}</span>
                </div>
              )}

              {/* 모바일 전용 — QR 대신 '보내기'가 답이다 */}
              {it.shareUrl && (
                <div className="popup-copy">
                  <CopyLink
                    value={it.shareUrl}
                    label={labels.copy}
                    copiedLabel={labels.copied}
                    failLabel={labels.copyFail}
                    className="btn btn-ghost popup-cta"
                  />
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="popup-foot">
          <button type="button" className="popup-link" onClick={() => close("today")}>
            {labels.hideToday}
          </button>
          <button type="button" className="popup-link" onClick={() => close("forever")}>
            {labels.hideForever}
          </button>
        </div>
      </div>
    </dialog>
  );
}
