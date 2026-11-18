import { Button } from "@common/components/Button";
import { Modal } from "@common/components/Modal";
import { useThemeStore } from "@common/stores/themeStore";
import { useState, type ReactNode } from "react";
import { errorMessage } from "../utils/error";

/** 확인 · 취소 모달. onConfirm 이 실패하면 BE 메시지를 모달 안에 보여 주고 닫지 않는다. */
export function ConfirmModal({
  isOpen,
  title,
  children,
  confirmLabel = "확인",
  onConfirm,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const { theme } = useThemeStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setError(null);
    onClose();
  };
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title={title}>
      <div style={{ fontSize: theme.fontSize.base, lineHeight: 1.7, color: theme.colors.text }}>{children}</div>
      {error && (
        <p role="alert" style={{ color: theme.colors.danger, fontSize: theme.fontSize.sm, margin: "12px 0 0" }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px" }}>
        <Button type="button" variant="secondary" onClick={close} disabled={busy}>
          취소
        </Button>
        <Button type="button" onClick={run} disabled={busy}>
          {busy ? "처리 중..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
