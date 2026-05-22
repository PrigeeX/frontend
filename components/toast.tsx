"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { Icon } from "./icons";

type Toast = { id: string; title: string; body?: string; kind?: "success" | "error"; duration?: number };
type ToastInput = Omit<Toast, "id">;

const ToastCtx = createContext<((t: ToastInput) => void) | null>(null);
export const useToast = () => {
  const fn = useContext(ToastCtx);
  if (!fn) throw new Error("useToast must be used within ToastProvider");
  return fn;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: ToastInput) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((x) => x.id !== id)),
      t.duration ?? 3500,
    );
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-host">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span style={{ marginTop: 2, color: t.kind === "error" ? "var(--danger)" : "var(--accent)" }}>
              {t.kind === "error" ? <Icon.Close size={14} /> : <Icon.Check />}
            </span>
            <div className="col gap-4" style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
              {t.body && <div style={{ fontSize: 12, color: "var(--text-2)" }}>{t.body}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};
