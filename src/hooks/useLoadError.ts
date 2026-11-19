import { useCallback, useState } from "react";
import { loadFailText } from "../utils/error";

/** 목록 조회 실패 이유를 기억한다. track(promise) 로 감싸면 성공 시 지우고, 실패 시 문구를 남긴 뒤 그대로 던진다. */
export function useLoadError() {
  const [error, setError] = useState<string | null>(null);
  const track = useCallback(
    <T,>(p: Promise<T>): Promise<T> =>
      p.then(
        (v) => {
          setError(null);
          return v;
        },
        (e: unknown) => {
          setError(loadFailText(e));
          throw e;
        },
      ),
    [],
  );
  return { error, track };
}
