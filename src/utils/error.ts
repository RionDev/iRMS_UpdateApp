import axios from "axios";

/** API 에러를 화면에 보일 한 줄로. BE 409 · 404 는 detail 문자열, 422 는 첫 검증 메시지. */
export function errorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const detail = e.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) return "입력 형식이 맞지 않습니다";
    if (e.response?.status === 403) return "권한이 없습니다";
  }
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도하세요";
}
