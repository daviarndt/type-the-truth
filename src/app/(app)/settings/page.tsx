"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Upload, Trash2, Volume2, Cloud, RefreshCw, LogOut } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { downloadSave, importSaveFromFile } from "@/lib/save";
import { wipeAll, type ThemeId, type UILanguage, type KeySoundId } from "@/lib/db";
import { KEY_SOUNDS, playKeySound } from "@/lib/keysound";

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
  const { t, settings, updateSettings, cloudEnabled, user, syncState, lastSyncAt, signIn, signOut, syncManually } = useApp();
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

          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Volume2 size={18} style={{ color: settings.keySound === "off" ? "hsl(var(--muted))" : "hsl(var(--primary))" }} />
              <div>
                <strong style={{ fontSize: ".875rem", color: "hsl(var(--foreground))", display: "block" }}>{t("settings.sound")}</strong>
                <span style={{ fontSize: ".8rem", color: "hsl(var(--muted))" }}>{t("settings.soundDesc")}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {KEY_SOUNDS.map((id: KeySoundId) => (
                <button
                  key={id}
                  className="chip"
                  data-on={settings.keySound === id}
                  onClick={() => {
                    updateSettings({ keySound: id });
                    playKeySound(id); // prévia imediata
                  }}
                >
                  {t(`sound.${id}`)}
                </button>
              ))}
            </div>
            {settings.keySound !== "off" && (
              <p style={{ fontSize: ".75rem", color: "hsl(var(--muted-foreground))", marginTop: 8 }}>
                {t("settings.soundPreviewHint")}
              </p>
            )}
          </div>

          <div style={{ marginTop: 24 }}>
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

        {/* Conta e sincronização (só quando a nuvem está configurada) */}
        {cloudEnabled && (
          <div className="panel section-card">
            <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Cloud size={13} /> {t("cloud.title")}
            </span>

            {!user ? (
              <>
                <p style={{ fontSize: ".85rem", color: "hsl(var(--muted))", marginTop: 6, lineHeight: 1.5 }}>{t("cloud.benefit")}</p>
                <button className="btn-primary" style={{ marginTop: 14 }} onClick={() => signIn()}>
                  <GoogleGlyph /> {t("cloud.signIn")}
                </button>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                  {user.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photo} alt="" width={40} height={40} style={{ borderRadius: "50%" }} referrerPolicy="no-referrer" />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "hsl(var(--surface-offset))", display: "grid", placeItems: "center" }}>
                      <Cloud size={18} style={{ color: "hsl(var(--primary))" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: ".7rem", color: "hsl(var(--muted))", textTransform: "uppercase", letterSpacing: ".06em" }}>{t("cloud.signedInAs")}</span>
                    <strong style={{ fontSize: ".9rem", color: "hsl(var(--foreground))", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.name ?? user.email}
                    </strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
                  <button className="btn-primary" onClick={() => syncManually()} disabled={syncState === "syncing"}>
                    <RefreshCw size={16} style={syncState === "syncing" ? { animation: "spin 1s linear infinite" } : undefined} />
                    {syncState === "syncing" ? t("cloud.syncing") : t("cloud.syncNow")}
                  </button>
                  <button className="btn-secondary" onClick={() => signOut()}>
                    <LogOut size={16} /> {t("cloud.signOut")}
                  </button>
                  <span style={{ fontSize: ".75rem", color: syncState === "error" ? "hsl(var(--destructive))" : "hsl(var(--muted))" }}>
                    {syncState === "error"
                      ? t("cloud.syncError")
                      : lastSyncAt
                      ? `${t("cloud.lastSync")}: ${new Date(lastSyncAt).toLocaleTimeString()}`
                      : ""}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

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

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
