"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  POPUP_STORAGE_PREFIX,
  POPUP_DISMISS_EVENT,
} from "@/lib/popup-storage";

/**
 * '오늘 하루 보지 않기'를 눌렀다가 마음이 바뀐 사람을 위한 문.
 *
 * 이게 없으면 한 번 숨긴 사람은 24시간을 기다리거나 브라우저 저장소를 지우는
 * 수밖에 없다. 운영자가 자기 팝업을 확인하려다 막히는 일이 실제로 있었다.
 *
 * 숨긴 기록이 있을 때만 나타난다 — 평소에는 푸터를 어지럽히지 않는다.
 */

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange); // 다른 탭에서 바뀐 경우
  window.addEventListener(POPUP_DISMISS_EVENT, onChange); // 이 탭에서 숨긴 경우
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(POPUP_DISMISS_EVENT, onChange);
  };
}

function hasDismissal(): boolean {
  try {
    return Object.keys(window.localStorage).some((k) =>
      k.startsWith(POPUP_STORAGE_PREFIX),
    );
  } catch {
    return false;
  }
}

/** 서버에는 저장소가 없다. 하이드레이션 불일치를 만들지 않으려면 false. */
function noDismissal(): boolean {
  return false;
}

export default function PopupResetLink({ label }: { label: string }) {
  const router = useRouter();
  const hidden = useSyncExternalStore(subscribe, hasDismissal, noDismissal);

  if (!hidden) return null;

  function reset() {
    try {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith(POPUP_STORAGE_PREFIX))
        .forEach((k) => window.localStorage.removeItem(k));
      window.dispatchEvent(new Event(POPUP_DISMISS_EVENT));
    } catch {
      /* 저장소 접근 실패는 무시 */
    }
    router.refresh();
  }

  return (
    <button type="button" className="popup-reset" onClick={reset}>
      {label}
    </button>
  );
}
