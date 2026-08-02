/**
 * 팝업 숨김 상태를 브라우저에 저장할 때 쓰는 약속.
 *
 * 컴포넌트 파일이 아니라 여기 두는 이유: PopupNotice는 "use client" 컴포넌트라
 * 서버 트리와 클라이언트 트리 양쪽에서 참조된다. 그런 파일에서 비-컴포넌트
 * 상수를 내보내면 번들러가 export를 못 찾는 일이 생긴다(실제로 겪었다).
 * 지시어 없는 평범한 모듈이 두 곳 모두에서 안전하다.
 */

/** 저장소 키 접두사 — 푸터의 '다시 보기' 링크가 이걸로 찾아 지운다 */
export const POPUP_STORAGE_PREFIX = "imo:popup:";

/** 숨김 상태가 바뀌었음을 같은 탭 안에서 알린다(storage 이벤트는 타 탭에서만 온다) */
export const POPUP_DISMISS_EVENT = "imo:popup-dismiss-changed";
