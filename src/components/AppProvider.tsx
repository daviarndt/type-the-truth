"use client";

/**
 * Estado global client-side: settings (IndexedDB) + i18n + tema + nuvem opcional.
 * Carrega as configurações no mount, aplica tema/idioma/fonte no <html>,
 * reconcilia a sequência e — se o Firebase estiver configurado — gerencia o
 * login e a sincronização do save.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings as persistSettings,
  getStreak,
  saveStreak,
  type Settings,
} from "@/lib/db";
import { reconcileStreak } from "@/lib/streak";
import { translate } from "@/lib/i18n";
import {
  isCloudConfigured,
  subscribeUser,
  signInWithGoogle,
  signOutCloud,
  syncNow,
  pushCurrent,
  type CloudUser,
} from "@/lib/cloud";

type SyncState = "idle" | "syncing" | "done" | "error";

interface AppContextValue {
  settings: Settings;
  ready: boolean;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  // Nuvem (opcional)
  cloudEnabled: boolean;
  user: CloudUser | null;
  syncState: SyncState;
  lastSyncAt: number | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncManually: () => Promise<void>;
  pushIfSignedIn: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function applyToDocument(s: Settings) {
  const el = document.documentElement;
  el.setAttribute("data-theme", s.theme);
  el.lang = s.uiLanguage;
  el.style.setProperty("--font-scale", String(s.fontScale));
  try {
    localStorage.setItem("ttt_theme", s.theme);
    localStorage.setItem("ttt_fontScale", String(s.fontScale));
  } catch {
    /* ignora */
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<CloudUser | null>(null);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const syncedUidRef = useRef<string | null>(null);

  // Carrega settings + reconcilia streak
  useEffect(() => {
    let active = true;
    (async () => {
      const s = await getSettings();
      if (!active) return;
      setSettings(s);
      applyToDocument(s);
      setReady(true);
      const streak = await getStreak();
      const fixed = reconcileStreak(streak);
      if (fixed !== streak) await saveStreak(fixed);
    })();
    return () => {
      active = false;
    };
  }, []);

  const runSync = useCallback(async (uid: string) => {
    setSyncState("syncing");
    try {
      const { changed } = await syncNow(uid);
      setSyncState("done");
      setLastSyncAt(Date.now());
      // Se a nuvem trouxe dados novos, recarrega para as telas relerem o IndexedDB
      if (changed) window.location.reload();
    } catch {
      setSyncState("error");
    }
  }, []);

  // Observa o login; ao entrar, sincroniza uma vez
  useEffect(() => {
    if (!isCloudConfigured) return;
    let unsub = () => {};
    subscribeUser((u) => {
      setUser(u);
      if (u && syncedUidRef.current !== u.uid) {
        syncedUidRef.current = u.uid;
        void runSync(u.uid);
      }
      if (!u) syncedUidRef.current = null;
    }).then((fn) => {
      unsub = fn;
    });
    return () => unsub();
  }, [runSync]);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = await persistSettings(patch);
    setSettings(next);
    applyToDocument(next);
  }, []);

  const signIn = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await signOutCloud();
    setUser(null);
    syncedUidRef.current = null;
    setSyncState("idle");
  }, []);

  const syncManually = useCallback(async () => {
    if (user) await runSync(user.uid);
  }, [user, runSync]);

  const pushIfSignedIn = useCallback(() => {
    if (user) void pushCurrent(user.uid).catch(() => {});
  }, [user]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(settings.uiLanguage, key, params),
    [settings.uiLanguage]
  );
  const locale = settings.uiLanguage === "en" ? "en-US" : "pt-BR";

  return (
    <AppContext.Provider
      value={{
        settings, ready, updateSettings, t, locale,
        cloudEnabled: isCloudConfigured, user, syncState, lastSyncAt,
        signIn, signOut, syncManually, pushIfSignedIn,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de <AppProvider>");
  return ctx;
}
