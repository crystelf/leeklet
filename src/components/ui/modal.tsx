"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import "./ui.css";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger";
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  children?: React.ReactNode;
  disableConfirmOnSubmit?: boolean;
}

export function Modal({
  open,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  variant = "primary",
  busy,
  onConfirm,
  onClose,
  children,
}: ModalProps) {
  const [leaving, setLeaving] = useState(false);
  const closing = useRef(false);

  useEffect(() => {
    if (!open) {
      setLeaving(false);
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
    await onConfirm();
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
        className={cn("dialog-panel", "dialog-panel-wide")}
        data-leaving={leaving}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h3 id="modal-title" className="font-display text-lg font-bold" style={{ color: "var(--fg)" }}>
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--fg-soft)" }}>
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
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
