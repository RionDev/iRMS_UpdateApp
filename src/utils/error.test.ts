import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { InputError, errorMessage, loadFailText } from "./error";

function httpError(status: number, detail: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("x", "ERR", config, null, { status, statusText: "", headers: {}, config, data: { detail } });
}

describe("errorMessage", () => {
  it("입력 확인 실패는 무엇이 틀렸는지 그대로 보인다", () => {
    expect(errorMessage(new InputError("시각을 HH:MM 으로 넣어 주세요"))).toBe("시각을 HH:MM 으로 넣어 주세요");
  });
  it("BE detail 문자열을 그대로 보인다", () => {
    expect(errorMessage(httpError(409, "이미 있는 시각입니다"))).toBe("이미 있는 시각입니다");
  });
  it("알 수 없는 오류는 일반 문구", () => {
    expect(errorMessage(new TypeError("boom"))).toBe("요청을 처리하지 못했습니다. 잠시 후 다시 시도하세요");
  });
});

describe("loadFailText", () => {
  it("목록을 못 읽으면 '없음' 대신 실패와 이유를 말한다", () => {
    expect(loadFailText(httpError(503, "irms-db 에 연결할 수 없습니다"))).toBe(
      "목록을 불러오지 못했습니다 — irms-db 에 연결할 수 없습니다",
    );
  });
  it("게이트웨이가 서비스에 못 닿으면(502·503·504) 서버가 응답하지 않는다고 말한다", () => {
    expect(loadFailText(httpError(502, undefined))).toBe("목록을 불러오지 못했습니다 — 서버가 응답하지 않습니다");
  });
  it("응답이 없으면(서버 꺼짐 · 네트워크) 그렇게 말한다", () => {
    expect(loadFailText(new AxiosError("Network Error", "ERR_NETWORK"))).toBe(
      "목록을 불러오지 못했습니다 — 서버에 연결하지 못했습니다",
    );
  });
});
