import axios from "axios";

/** 보내기 전 입력 확인 실패 — 메시지를 그대로 사용자에게 보인다. */
export class InputError extends Error {}

/** API 에러를 화면에 보일 한 줄로. BE 409 · 404 는 detail 문자열, 422 는 첫 검증 메시지. */
export function errorMessage(e: unknown): string {
  if (e instanceof InputError) return e.message;
  if (axios.isAxiosError(e)) {
    const detail = e.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) return "입력 형식이 맞지 않습니다";
    if (e.response?.status === 403) return "권한이 없습니다";
  }
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도하세요";
}

/** 목록 조회 실패 문구 — 빈 목록("없습니다")과 헷갈리지 않게 실패와 이유를 말한다. */
export function loadFailText(e: unknown): string {
  let reason = errorMessage(e);
  if (axios.isAxiosError(e)) {
    const status = e.response?.status;
    if (!e.response) reason = "서버에 연결하지 못했습니다";
    else if (status === 502 || status === 503 || status === 504) {
      if (typeof e.response.data?.detail !== "string") reason = "서버가 응답하지 않습니다";
    }
  }
  return `목록을 불러오지 못했습니다 — ${reason}`;
}
