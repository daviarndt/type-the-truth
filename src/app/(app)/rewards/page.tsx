"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { getUnlockedAchievements } from "@/lib/db";
import { localeFor } from "@/lib/utils";

const typeOrder = ["progress", "consistency", "volume", "attention"] as const;

export default function RewardsPage() {
  const { t, settings } = useApp();
  const [unlocked, setUnlocked] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getUnlockedAchievements().then((u) => {
      setUnlocked(u);
      setLoaded(true);
    });
  }, []);

  const lang = settings.uiLanguage;
  const locale = localeFor(lang);
  const unlockedCount = Object.keys(unlocked).length;

  if (!loaded) return <div className="page-content" aria-busy="true" />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("rewards.title")}</h2>
          <p className="page-subtitle">{t("rewards.subtitle", { n: unlockedCount, total: ACHIEVEMENTS.length })}</p>
        </div>
      </div>

      <div className="panel section-card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))" }}>{t("rewards.overall")}</span>
          <span style={{ fontSize: ".75rem", fontWeight: 600, color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums" }}>
            {unlockedCount} / {ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="meter">
          <div className="meter-fill" style={{ width: `${Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%` }} />
        </div>
      </div>

      {typeOrder.map((type) => {
        const inType = ACHIEVEMENTS.filter((a) => a.type === type);
        if (inType.length === 0) return null;
        const unlockedInType = inType.filter((a) => unlocked[a.code]).length;

        return (
          <section key={type} className="panel section-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span className="eyebrow">{t(`type.${type}`)}</span>
              <span style={{ fontSize: ".7rem", color: "hsl(var(--muted))", fontVariantNumeric: "tabular-nums" }}>
                {unlockedInType}/{inType.length}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {inType.map((a) => {
                const at = unlocked[a.code];
                const isUnlocked = Boolean(at);
                return (
                  <div
                    key={a.code}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14,
                      background: isUnlocked ? "hsl(var(--surface-offset))" : "hsl(var(--surface-2) / 0.4)",
                      border: isUnlocked ? "1px solid hsl(var(--border) / 0.5)" : "1px solid hsl(var(--border) / 0.2)",
                      opacity: isUnlocked ? 1 : 0.5,
                    }}
                  >
                    <span style={{ fontSize: "1.5rem", filter: isUnlocked ? "none" : "grayscale(1)" }}>{a.iconName}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: ".8rem", color: isUnlocked ? "hsl(var(--foreground))" : "hsl(var(--muted))", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {lang === "en" ? a.nameEn : a.namePt}
                      </strong>
                      <span style={{ fontSize: ".68rem", color: "hsl(var(--muted))", lineHeight: 1.3, display: "block", marginTop: 1 }}>
                        {isUnlocked
                          ? new Date(at).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
                          : lang === "en" ? a.descriptionEn : a.descriptionPt}
                      </span>
                    </div>
                    {isUnlocked && <span style={{ fontSize: ".65rem", color: "hsl(var(--primary))", fontWeight: 700, flexShrink: 0 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
