import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Conquistas" };

const typeLabels: Record<string, string> = {
  progress: "Progresso",
  volume: "Volume de Digitação",
  consistency: "Consistência",
  attention: "Precisão",
  fun: "Diversão",
};

const typeOrder = ["progress", "consistency", "volume", "attention", "fun"];

export default async function RewardsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [allAchievements, userAchievements] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { type: "asc" } }),
    prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: { achievement: true },
    }),
  ]);

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
  const unlockedByCode = new Map(userAchievements.map((ua) => [ua.achievement.code, ua]));
  const unlocked = allAchievements.filter((a) => unlockedIds.has(a.id));

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Conquistas</h2>
          <p className="page-subtitle">
            {unlocked.length} de {allAchievements.length} desbloqueadas
          </p>
        </div>
      </div>

      {/* Resumo */}
      <div className="panel section-card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))" }}>Progresso geral</span>
          <span style={{ fontSize: ".75rem", fontWeight: 600, color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums" }}>
            {unlocked.length} / {allAchievements.length}
          </span>
        </div>
        <div className="meter">
          <div
            className="meter-fill"
            style={{ width: `${Math.round((unlocked.length / Math.max(allAchievements.length, 1)) * 100)}%` }}
          />
        </div>
      </div>

      {typeOrder.map((type) => {
        const inType = allAchievements.filter((a) => a.type === type);
        if (inType.length === 0) return null;
        const unlockedInType = inType.filter((a) => unlockedIds.has(a.id));

        return (
          <section key={type} className="panel section-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span className="eyebrow">{typeLabels[type] ?? type}</span>
              <span style={{ fontSize: ".7rem", color: "hsl(var(--muted))", fontVariantNumeric: "tabular-nums" }}>
                {unlockedInType.length}/{inType.length}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {inType.map((achievement) => {
                const ua = unlockedByCode.get(achievement.code);
                const isUnlocked = !!ua;

                return (
                  <div
                    key={achievement.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 14,
                      background: isUnlocked ? "hsl(var(--surface-offset))" : "hsl(var(--surface-2) / 0.4)",
                      border: isUnlocked
                        ? "1px solid hsl(var(--border) / 0.5)"
                        : "1px solid hsl(var(--border) / 0.2)",
                      opacity: isUnlocked ? 1 : 0.5,
                    }}
                  >
                    <span style={{ fontSize: "1.5rem", filter: isUnlocked ? "none" : "grayscale(1)" }}>
                      {achievement.iconName}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong
                        style={{
                          fontSize: ".8rem",
                          color: isUnlocked ? "hsl(var(--foreground))" : "hsl(var(--muted))",
                          display: "block",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {achievement.namePt}
                      </strong>
                      <span style={{ fontSize: ".68rem", color: "hsl(var(--muted))", lineHeight: 1.3, display: "block", marginTop: 1 }}>
                        {isUnlocked
                          ? new Date(ua.unlockedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })
                          : achievement.descriptionPt}
                      </span>
                    </div>
                    {isUnlocked && (
                      <span style={{ fontSize: ".65rem", color: "hsl(var(--primary))", fontWeight: 700, flexShrink: 0 }}>✓</span>
                    )}
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
