"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CopyLink from "@/components/CopyLink";

const OPEN_DELAY_MS = 900; // 첫 페인트/LCP 이후에 뜬다
const DAY_MS = 24 * 60 * 60 * 1000;

/** 저장소 접두사 — 푸터의 '다시 보기' 링크가 이걸로 찾아 지운다 */
export const POPUP_STORAGE_PREFIX = "imo:popup:";

/** 숨김 상태가 바뀌었음을 같은 탭 안에서 알린다(storage 이벤트는 타 탭에서만 온다) */
export const POPUP_DISMISS_EVENT = "imo:popup-dismiss-changed";

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
  return `${POPUP_STORAGE_PREFIX}${items.map((i) => i.id).sort().join("|")}`;
}

function isDismissed(key: string): boolean {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return false;
    // 예전 버전이 남긴 'forever'는 되돌릴 방법이 없었다. 만료로 취급해 흘려보낸다.
    if (raw === "forever") {
      window.localStorage.removeItem(key);
      return false;
    }
    return Number(raw) > Date.now();
  } catch {
    // 인앱 브라우저 등에서 저장소 접근이 막히면 그냥 보여준다
    return false;
  }
}

/**
 * 숨김은 24시간짜리 하나뿐이다.
 * '영영 안 보기'는 두지 않는다 — 한 번 잘못 누르면 되돌릴 방법이 없어
 * 운영자조차 자기 팝업을 못 보게 되는 함정이었다.
 */
function remember(key: string) {
  try {
    window.localStorage.setItem(key, String(Date.now() + DAY_MS));
    // 푸터의 '다시 보기' 링크가 즉시 나타나도록 알린다
    window.dispatchEvent(new Event(POPUP_DISMISS_EVENT));
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

  const open = useCallback(() => {
    // 미리보기에서는 '오늘 하루 보지 않기' 기록을 무시한다.
    // 한 번 닫으면 다시 못 보는 미리보기는 쓸모가 없다.
    if (!preview && isDismissed(key)) return;

    const el = ref.current;
    // showModal이 없는 구형 브라우저에서는 팝업을 포기한다.
    // 본문은 그대로 동작하므로 우아하게 열화된다.
    if (!el || typeof el.showModal !== "function" || el.open) return;

    setMounted(true);
    el.showModal(); // 포커스 트랩·ESC·백드롭은 브라우저가 공짜로 준다
    document.body.style.overflow = "hidden";
  }, [key, preview]);

  useEffect(() => {
    const timer = window.setTimeout(open, OPEN_DELAY_MS);

    /**
     * 이미 홈에 있는 상태에서 '홈'이나 로고를 다시 누른 경우.
     *
     * Next는 같은 경로로의 이동을 무시하므로 이 컴포넌트가 다시 마운트되지
     * 않는다. 즉 위 useEffect가 재실행되지 않아 팝업이 영영 안 뜬다.
     * 사용자 눈에는 "홈으로 왔는데 팝업이 없다"로 보이므로 직접 잡아 준다.
     */
    function onSamePathClick(e: MouseEvent) {
      // defaultPrevented는 보지 않는다 — next/link가 클라이언트 내비게이션을
      // 하려고 이미 preventDefault를 부른 상태라 항상 true다.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      try {
        const url = new URL(anchor.href, window.location.href);
        if (
          url.origin === window.location.origin &&
          url.pathname === window.location.pathname
        ) {
          // 내비게이션이 정리된 뒤에 연다
          window.setTimeout(open, 80);
        }
      } catch {
        /* 잘못된 href는 무시 */
      }
    }

    /** 뒤로/앞으로 캐시(bfcache)에서 복원된 경우 — 마운트가 일어나지 않는다 */
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) open();
    }

    /** 푸터의 '공지 팝업 다시 보기'를 눌러 숨김이 풀린 경우 */
    function onDismissChanged() {
      open();
    }

    // 캡처 단계 — next/link의 핸들러보다 먼저 본다
    document.addEventListener("click", onSamePathClick, true);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener(POPUP_DISMISS_EVENT, onDismissChanged);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onSamePathClick, true);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener(POPUP_DISMISS_EVENT, onDismissChanged);
      document.body.style.overflow = "";
    };
  }, [open]);

  /**
   * 기본은 '이번만 닫기'다 — 홈에 다시 오면 팝업이 다시 뜬다.
   * 그냥 닫기·ESC·배경클릭·CTA 클릭이 모두 여기에 해당한다.
   *
   * '오늘 하루 보지 않기'를 눌렀을 때만 24시간 기억한다.
   * 매번 뜨는 팝업에 빠져나갈 문이 없으면 그때부터는 광고가 된다.
   */
  function close(mode: "today" | "once") {
    if (mode === "today" && !preview) remember(key);
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
        </div>
      </div>
    </dialog>
  );
}
