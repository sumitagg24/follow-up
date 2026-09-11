import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Trash2 } from "lucide-react";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  busyLabel = "Deleting…",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  busyLabel?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon="danger"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} loading={busy}>
            {busy ? busyLabel : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 text-red-600 grid place-items-center shrink-0">
            <Trash2 size={18} />
          </div>
          <div>
            <p className="text-sm text-brand-600 leading-relaxed">{message}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
