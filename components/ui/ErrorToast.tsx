"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ErrorToastProps {
  message: string | null;
  onDismiss: () => void;
  autoHideMs?: number;
  title?: string;
}

export default function ErrorToast({
  message,
  onDismiss,
  autoHideMs = 6000,
  title = "Request Notice",
}: ErrorToastProps) {
  useEffect(() => {
    if (!message || autoHideMs <= 0) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, autoHideMs);
    return () => clearTimeout(timer);
  }, [message, autoHideMs, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="print:hidden fixed top-4 right-4 sm:top-6 sm:right-6 z-[100] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-rose-300 bg-rose-50/95 backdrop-blur-md p-4 text-rose-900 shadow-2xl transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
          <AlertTriangle className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-800">
            {title}
          </p>
          <p className="mt-0.5 text-xs font-medium leading-relaxed text-rose-900">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error notification"
          className="shrink-0 rounded-lg p-1 text-rose-500 hover:bg-rose-100 hover:text-rose-800 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

