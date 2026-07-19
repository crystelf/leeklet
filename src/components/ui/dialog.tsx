"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import "./ui.css";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger";
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  variant = "primary",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const closing = useRef(false);

  useEffect(() => {
    if (!open) {
      setLeaving(false);
      setBusy(false);
      closing.current = false;
    }
  }, [open]);

  if (!open) return null;

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    setLeaving(true);
    setTimeout(onClose, 180);
  };

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className="dialog-backdrop"
        data-leaving={leaving}
        onClick={close}
        aria-hidden="true"
      />
      <div
        className="dialog-panel"
        data-leaving={leaving}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <h3
          id="confirm-title"
          className="font-display text-lg font-bold"
          style={{ color: "var(--fg)" }}
        >
          {title}
        </h3>
        {description && (
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: "var(--fg-soft)" }}
          >
            {description}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="md" onClick={close} disabled={busy}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="md"
            loading={busy}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </>
  );
}
