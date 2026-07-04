"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Upload, Trash2, Volume2, VolumeX } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { downloadSave, importSaveFromFile } from "@/lib/save";
import { wipeAll, type ThemeId, type UILanguage } from "@/lib/db";

const THEMES: { id: ThemeId; bg: string; fg: string; accent: string }[] = [
  { id: "dark", bg: "#171614", fg: "#e5e2da", accent: "#4f98a3" },
  { id: "light", bg: "#f7f6f2", fg: "#28251d", accent: "#01696f" },
  { id: "parchment", bg: "#ede8de", fg: "#25201a", accent: "#01696f" },
];
const GOALS = [5, 10, 15, 20, 30, 45, 60];
const FONT_SIZES: { label: string; value: number }[] = [
  { label: "A−", value: 0.85 },
  { label: "A", value: 1 },
  { label: "A+", value: 1.15 },
  { label: "A++", value: 1.3 },
];

export default function SettingsPage() {
  const { t, settings, updateSettings } = useApp();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [flash, setFlash] = useState<string | null>(null);

  function toast(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm(t("settings.importConfirm"))) return;
    try {
      await importSaveFromFile(file);
      toast(t("settings.imported"));
      router.refresh();
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast(t("settings.importError"));
    }
  }

  async function handleReset() {
    if (!confirm(t("settings.resetConfirm"))) return;
    await wipeAll();
    window.location.href = "/dashboard";
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("settings.title")}</h1>
          <p className="page-subtitle">{t("settings.subtitle")}</p>
        </div>
        {flash && (
          <span className="btn-secondary" style={{ pointerEvents: "none" }}>
            <Check size={16} /> {flash}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {/* Perfil */}
        <div className="panel section-card">
          <span className="eyebrow">{t("settings.account")}</span>
          <div className="field-group" style={{ marginTop: 16 }}>
            <label className="field-label" htmlFor="name">{t("settings.displayName")}</label>
            <input
              id="name"
              className="field-input"
              value={settings.name}
              placeholder={t("settings.namePlaceholder")}
              onChange={(e) => updateSettings({ name: e.target.value })}
            />
          </div>
        </div>

        {/* Tema */}
        <div className="panel section-card">
          <span className="eyebrow">{t("settings.theme")}</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginTop: 16 }}>
            {THEMES.map((th) => (
              <button
                key={th.id}
                onClick={() => updateSettings({ theme: th.id })}
                className="theme-swatch"
                style={{ borderColor: settings.theme === th.id ? "hsl(var(--primary))" : "hsl(var(--border) / 0.5)", background: settings.theme === th.id ? "hsl(var(--primary) / 0.08)" : "hsl(var(--surface-offset))" }}
              >
                <div style={{ width: "100%", height: 40, borderRadius: 8, background: th.bg, marginBottom: 10, display: "flex", alignItems: "center", padding: "0 10px", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: th.accent }} />
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: th.fg, opacity: 0.4 }} />
                </div>
                <strong style={{ fontSize: ".875rem", color: "hsl(var(--foreground))", display: "block" }}>{t(`settings.theme.${th.id}`)}</strong>
                <span style={{ fontSize: ".7rem", color: "hsl(var(--muted))" }}>{t(`settings.theme.${th.id}Desc`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Digitação: som + fonte */}
        <div className="panel section-card">
          <span className="eyebrow">{t("settings.typing")}</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {settings.sound ? <Volume2 size={18} style={{ color: "hsl(var(--primary))" }} /> : <VolumeX size={18} style={{ color: "hsl(var(--muted))" }} />}
              <div>
                <strong style={{ fontSize: ".875rem", color: "hsl(var(--foreground))", display: "block" }}>{t("settings.sound")}</strong>
                <span style={{ fontSize: ".8rem", color: "hsl(var(--muted))" }}>{t("settings.soundDesc")}</span>
              </div>
            </div>
            <button className="pill-toggle" data-on={settings.sound} onClick={() => updateSettings({ sound: !settings.sound })}>
              {settings.sound ? t("settings.on") : t("settings.off")}
            </button>
          </div>

          <div style={{ marginTop: 20 }}>
            <label className="field-label" style={{ display: "block", marginBottom: 10 }}>{t("settings.fontSize")}</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {FONT_SIZES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => updateSettings({ fontScale: f.value })}
                  className="chip"
                  data-on={Math.abs(settings.fontScale - f.value) < 0.01}
                  style={{ fontSize: `${f.value}rem` }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Meta diária */}
        <div className="panel section-card">
          <span className="eyebrow">{t("settings.goal")}</span>
          <p style={{ fontSize: ".875rem", color: "hsl(var(--muted))", marginTop: 6 }}>{t("settings.goalDesc")}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {GOALS.map((g) => (
              <button key={g} onClick={() => updateSettings({ dailyGoalMinutes: g })} className="chip" data-on={settings.dailyGoalMinutes === g}>
                {g}m
              </button>
            ))}
          </div>
        </div>

        {/* Idioma */}
        <div className="panel section-card">
          <span className="eyebrow">{t("settings.language")}</span>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {([{ id: "pt-BR", label: "Português" }, { id: "en", label: "English" }] as { id: UILanguage; label: string }[]).map((l) => (
              <button key={l.id} onClick={() => updateSettings({ uiLanguage: l.id })} className="chip" data-on={settings.uiLanguage === l.id}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meus dados */}
        <div className="panel section-card">
          <span className="eyebrow">{t("settings.data")}</span>
          <p style={{ fontSize: ".85rem", color: "hsl(var(--muted))", marginTop: 6, lineHeight: 1.5 }}>{t("settings.dataDesc")}</p>
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => downloadSave()}>
              <Download size={16} /> {t("settings.export")}
            </button>
            <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> {t("settings.import")}
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImport} style={{ display: "none" }} />
          </div>
        </div>

        {/* Zona de perigo */}
        <div className="panel section-card" style={{ borderColor: "hsl(var(--destructive) / 0.25)" }}>
          <span className="eyebrow" style={{ color: "hsl(var(--destructive))" }}>{t("settings.reset")}</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: ".8rem", color: "hsl(var(--muted))", maxWidth: "40ch" }}>{t("settings.resetDesc")}</p>
            <button onClick={handleReset} className="btn-danger">
              <Trash2 size={16} /> {t("settings.reset")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
