import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

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
  const pending = open && busy;

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
    <Modal open={pending || open} onClose={onClose} title={title} icon="danger">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 grid place-items-center shrink-0">
          <AlertTriangle size={18} />
        </div>
        <div className="text-sm text-slate-600">{message}</div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button onClick={onClose} disabled={busy} className="px-4 py-2 rounded-xl border text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
          Cancel
        </button>
        <button
          onClick={confirm}
          disabled={busy}
          aria-busy={busy}
          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
