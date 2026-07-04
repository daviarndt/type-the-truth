"use client";

import { useEffect } from "react";
import { withBase } from "@/lib/basePath";

/** Registra o service worker (apenas em produção — evita conflito com o HMR). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(withBase("/sw.js"), { scope: withBase("/") }).catch(() => {});
  }, []);
  return null;
}
