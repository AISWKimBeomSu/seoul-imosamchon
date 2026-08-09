/**
 * 서버 액션의 결과 형태와 초기값.
 *
 * 왜 액션 파일이 아니라 여기인가 — `"use server"` 파일은 **async 함수만**
 * export 할 수 있다. 초기 상태 객체를 같이 내보내면 빌드는 통과하는데
 * 런타임에 모듈을 읽는 순간 터진다:
 *
 *   A "use server" file can only export async functions, found object.
 *
 * 타입은 `export type`이라 컴파일 후 사라지므로 액션 파일에 둬도 되지만,
 * 값과 짝지어 두는 편이 다음 사람이 헷갈리지 않는다.
 */

export type ActionState = {
  ok: boolean;
  /** 사용자에게 그대로 보여줄 문장. 빈 문자열이면 아직 아무 일도 없었다는 뜻. */
  message: string;
};

export const ACTION_INIT: ActionState = { ok: false, message: "" };
