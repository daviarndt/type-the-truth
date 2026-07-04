"use client";

/**
 * Estado global client-side: settings (IndexedDB) + i18n + tema.
 * Carrega as configurações no mount, aplica tema/idioma/fonte no <html> e
 * reconcilia a sequência (zera se o usuário sumiu por mais de um dia).
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
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

interface AppContextValue {
  settings: Settings;
  ready: boolean;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
}

const AppContext = createContext<AppContextValue | null>(null);

function applyToDocument(s: Settings) {
  const el = document.documentElement;
  el.setAttribute("data-theme", s.theme);
  el.lang = s.uiLanguage;
  el.style.setProperty("--font-scale", String(s.fontScale));
  // Espelha no localStorage para o script anti-flash aplicar antes da pintura
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

  useEffect(() => {
    let active = true;
    (async () => {
      const s = await getSettings();
      if (!active) return;
      setSettings(s);
      applyToDocument(s);
      setReady(true);
      // Reconcilia a sequência uma vez por carga
      const streak = await getStreak();
      const fixed = reconcileStreak(streak);
      if (fixed !== streak) await saveStreak(fixed);
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = await persistSettings(patch);
    setSettings(next);
    applyToDocument(next);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(settings.uiLanguage, key, params),
    [settings.uiLanguage]
  );

  const locale = settings.uiLanguage === "en" ? "en-US" : "pt-BR";

  return (
    <AppContext.Provider value={{ settings, ready, updateSettings, t, locale }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de <AppProvider>");
  return ctx;
}
