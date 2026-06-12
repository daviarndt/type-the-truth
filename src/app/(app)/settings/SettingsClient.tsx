"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "./actions";
import { Check, Loader2, Lock } from "lucide-react";

interface Translation {
  id: string;
  name: string;
  language: string;
}

interface CurrentPrefs {
  preferredTranslationId: string;
  theme: string;
  dailyGoalMinutes: number;
}

interface Props {
  email: string;
  displayName: string;
  currentPrefs: CurrentPrefs;
  unlockedThemes: string[];
  translations: Translation[];
}

const THEMES = [
  { id: "dark", label: "Escuro", desc: "Dark mode clássico", bg: "#171614", fg: "#e5e2da", accent: "#4f98a3", unlockHint: null },
  { id: "light", label: "Claro", desc: "Fundo branco suave", bg: "#f7f6f2", fg: "#28251d", accent: "#01696f", unlockHint: null },
  { id: "parchment", label: "Pergaminho", desc: "Tons quentes de manuscrito", bg: "#ede8de", fg: "#25201a", accent: "#01696f", unlockHint: null },
];

const GOALS = [5, 10, 15, 20, 30, 45, 60];

export function SettingsClient({ email, displayName, currentPrefs, unlockedThemes, translations }: Props) {
  const [translation, setTranslation] = useState(currentPrefs.preferredTranslationId);
  const [theme, setTheme] = useState(currentPrefs.theme);
  const [goal, setGoal] = useState(currentPrefs.dailyGoalMinutes);
  const [name, setName] = useState(displayName);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    startTransition(async () => {
      await saveSettings({
        name,
        preferredTranslationId: translation,
        theme,
        dailyGoalMinutes: goal,
      });
      // Aplica o tema imediatamente (o servidor já persistiu)
      document.documentElement.setAttribute("data-theme", theme);
      router.refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Personalize sua experiência de digitação</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="btn-primary"
          style={{ minWidth: 120, justifyContent: "center" }}
        >
          {isPending ? (
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          ) : saved ? (
            <>
              <Check size={16} /> Salvo!
            </>
          ) : (
            "Salvar"
          )}
        </button>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {/* Conta */}
        <div className="panel section-card">
          <span className="eyebrow">Conta</span>
          <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
            <div className="field-group">
              <label className="field-label">E-mail</label>
              <div className="field-input" style={{ color: "hsl(var(--muted))", background: "hsl(var(--surface-offset))", cursor: "default" }}>
                {email}
              </div>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="display-name">Nome de exibição</label>
              <input
                id="display-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="field-input"
              />
            </div>
          </div>
        </div>

        {/* Tema */}
        <div className="panel section-card">
          <span className="eyebrow">Tema</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginTop: 16 }}>
            {THEMES.map((t) => {
              const isUnlocked = unlockedThemes.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => isUnlocked && setTheme(t.id)}
                  disabled={!isUnlocked}
                  title={!isUnlocked && t.unlockHint ? `Bloqueado — ${t.unlockHint}` : undefined}
                  style={{
                    padding: "14px",
                    borderRadius: 14,
                    border: `2px solid ${theme === t.id ? "hsl(var(--primary))" : "hsl(var(--border) / 0.5)"}`,
                    background: theme === t.id ? "hsl(var(--primary) / 0.08)" : "hsl(var(--surface-offset))",
                    cursor: isUnlocked ? "pointer" : "not-allowed",
                    opacity: isUnlocked ? 1 : 0.55,
                    textAlign: "left",
                    transition: "all 150ms",
                    fontFamily: "inherit",
                  }}
                >
                  <div style={{ width: "100%", height: 40, borderRadius: 8, background: t.bg, marginBottom: 10, display: "flex", alignItems: "center", padding: "0 10px", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.accent }} />
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: t.fg, opacity: 0.4 }} />
                    {!isUnlocked && <Lock size={12} style={{ color: t.fg, opacity: 0.6 }} />}
                  </div>
                  <strong style={{ fontSize: ".875rem", color: "hsl(var(--foreground))", display: "block" }}>{t.label}</strong>
                  <span style={{ fontSize: ".7rem", color: "hsl(var(--muted))" }}>
                    {isUnlocked ? t.desc : t.unlockHint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tradução */}
        <div className="panel section-card">
          <span className="eyebrow">Tradução da Bíblia</span>
          <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
            {translations.map((t) => (
              <button
                key={t.id}
                onClick={() => setTranslation(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: `1.5px solid ${translation === t.id ? "hsl(var(--primary))" : "hsl(var(--border) / 0.5)"}`,
                  background: translation === t.id ? "hsl(var(--primary) / 0.08)" : "hsl(var(--surface-offset))",
                  cursor: "pointer",
                  transition: "all 150ms",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <strong style={{ fontSize: ".9rem", color: "hsl(var(--foreground))", display: "block" }}>{t.id}</strong>
                  <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))" }}>{t.name}</span>
                </div>
                {translation === t.id && <Check size={16} style={{ color: "hsl(var(--primary))", flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Meta diária */}
        <div className="panel section-card">
          <span className="eyebrow">Meta diária</span>
          <p style={{ fontSize: ".875rem", color: "hsl(var(--muted))", marginTop: 6 }}>
            Quantos minutos por dia você quer dedicar às Escrituras?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: ".875rem",
                  border: `1.5px solid ${goal === g ? "hsl(var(--primary))" : "hsl(var(--border) / 0.5)"}`,
                  background: goal === g ? "hsl(var(--primary))" : "hsl(var(--surface-offset))",
                  color: goal === g ? "white" : "hsl(var(--muted))",
                  cursor: "pointer",
                  transition: "all 150ms",
                  fontFamily: "inherit",
                }}
              >
                {g}m
              </button>
            ))}
          </div>
        </div>

        {/* Sair */}
        <div className="panel section-card" style={{ borderColor: "hsl(var(--destructive) / 0.25)" }}>
          <span className="eyebrow" style={{ color: "hsl(var(--destructive))" }}>Sessão</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 12 }}>
            <div>
              <strong style={{ fontSize: ".875rem", color: "hsl(var(--foreground))" }}>Sair da conta</strong>
              <p style={{ fontSize: ".8rem", color: "hsl(var(--muted))", marginTop: 2 }}>Encerra sua sessão atual neste dispositivo</p>
            </div>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                style={{
                  padding: "8px 18px",
                  borderRadius: 10,
                  fontSize: ".875rem",
                  fontWeight: 700,
                  border: "1.5px solid hsl(var(--destructive) / 0.5)",
                  background: "hsl(var(--destructive) / 0.1)",
                  color: "hsl(var(--destructive))",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
