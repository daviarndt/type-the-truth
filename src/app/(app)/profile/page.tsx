import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { percentOf, TOTAL_BIBLE_VERSES, TOTAL_BIBLE_CHAPTERS } from "@/lib/utils";
import { Flame, BookOpen, BookMarked, Trophy, Clock, Target, TrendingUp, Hash } from "lucide-react";

export const metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [streak, progress, achievements, sessions] = await Promise.all([
    prisma.streak.findUnique({ where: { userId: user.id } }),
    prisma.userProgress.findMany({
      where: { userId: user.id },
      include: { book: true, chapter: true },
      orderBy: { completedAt: "desc" },
    }),
    prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
    }),
    // Inclui sessões em andamento — versículos parciais contam nas estatísticas
    prisma.typingSession.findMany({
      where: { userId: user.id, status: { in: ["in_progress", "completed"] } },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const completedChapters = progress.length;
  const totalVersesTyped = sessions.reduce((sum, s) => sum + (s.versesTyped ?? 0), 0);
  const totalMinutes = Math.round(sessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0) / 60);

  const wpmSessions = sessions.filter((s) => s.wpm && s.wpm > 0);
  const avgWpm =
    wpmSessions.length > 0
      ? Math.round(wpmSessions.reduce((sum, s) => sum + (s.wpm ?? 0), 0) / wpmSessions.length)
      : 0;
  const bestWpm =
    wpmSessions.length > 0 ? Math.round(Math.max(...wpmSessions.map((s) => s.wpm ?? 0))) : 0;

  const accSessions = sessions.filter((s) => s.accuracy);
  const avgAccuracy =
    accSessions.length > 0
      ? Math.round(accSessions.reduce((sum, s) => sum + (s.accuracy ?? 0), 0) / accSessions.length)
      : 0;

  const memberSince = new Date(user.createdAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const displayName = user.name ?? user.email.split("@")[0];
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="page-content">
      {/* Header */}
      <div className="panel" style={{ padding: "2rem", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            flexShrink: 0,
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))",
            display: "grid",
            placeItems: "center",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "white",
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-.03em", color: "hsl(var(--foreground))" }}>
            {displayName}
          </h1>
          <p style={{ fontSize: ".875rem", color: "hsl(var(--muted))", marginTop: 2 }}>{user.email}</p>
          <p style={{ fontSize: ".75rem", color: "hsl(var(--muted-foreground))", marginTop: 4 }}>
            Membro desde {memberSince}
          </p>
        </div>
        <Link href="/settings" className="btn-secondary" style={{ flexShrink: 0 }}>
          Editar perfil
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { icon: <Flame size={18} style={{ color: "hsl(var(--gold))" }} />, value: streak?.currentStreak ?? 0, label: "Dias seguidos" },
          { icon: <BookOpen size={18} style={{ color: "hsl(var(--primary))" }} />, value: completedChapters, label: "Capítulos" },
          { icon: <BookMarked size={18} style={{ color: "hsl(var(--primary))" }} />, value: totalVersesTyped.toLocaleString("pt-BR"), label: "Versículos" },
          { icon: <Clock size={18} style={{ color: "hsl(var(--muted))" }} />, value: totalMinutes < 60 ? `${totalMinutes}m` : `${Math.floor(totalMinutes / 60)}h`, label: "Tempo total" },
          { icon: <TrendingUp size={18} style={{ color: "hsl(var(--primary))" }} />, value: avgWpm, label: "PPM médio" },
          { icon: <Target size={18} style={{ color: "hsl(var(--primary))" }} />, value: bestWpm, label: "Melhor PPM" },
          { icon: <Hash size={18} style={{ color: "hsl(var(--primary))" }} />, value: `${avgAccuracy}%`, label: "Precisão média" },
          { icon: <Trophy size={18} style={{ color: "hsl(var(--gold))" }} />, value: achievements.length, label: "Conquistas" },
        ].map(({ icon, value, label }) => (
          <div key={label} className="panel" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: 6 }}>
            {icon}
            <strong style={{ fontSize: "1.25rem", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "hsl(var(--foreground))", lineHeight: 1.2 }}>
              {value}
            </strong>
            <span style={{ fontSize: ".7rem", color: "hsl(var(--muted))", textTransform: "uppercase", letterSpacing: ".06em" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Progresso na Bíblia */}
      <div className="panel section-card">
        <div className="section-header">
          <span className="eyebrow">Progresso na Bíblia</span>
          <span style={{ fontSize: ".8rem", color: "hsl(var(--muted))", fontVariantNumeric: "tabular-nums" }}>
            {percentOf(completedChapters, TOTAL_BIBLE_CHAPTERS)}% concluído
          </span>
        </div>
        <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))" }}>Capítulos</span>
              <span style={{ fontSize: ".75rem", color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                {completedChapters.toLocaleString("pt-BR")} / {TOTAL_BIBLE_CHAPTERS.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="meter">
              <div className="meter-fill" style={{ width: `${percentOf(completedChapters, TOTAL_BIBLE_CHAPTERS)}%` }} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))" }}>Versículos</span>
              <span style={{ fontSize: ".75rem", color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                {totalVersesTyped.toLocaleString("pt-BR")} / {TOTAL_BIBLE_VERSES.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="meter">
              <div
                className="meter-fill"
                style={{ width: `${percentOf(totalVersesTyped, TOTAL_BIBLE_VERSES)}%`, background: "linear-gradient(90deg, hsl(var(--gold)), hsl(var(--primary)))" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conquistas */}
      {achievements.length > 0 && (
        <div className="panel section-card">
          <span className="eyebrow">Conquistas desbloqueadas</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginTop: 14 }}>
            {achievements.map((ua) => (
              <div
                key={ua.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "hsl(var(--surface-offset))",
                  border: "1px solid hsl(var(--border) / 0.5)",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>{ua.achievement.iconName}</span>
                <div>
                  <strong style={{ fontSize: ".875rem", color: "hsl(var(--foreground))", display: "block" }}>
                    {ua.achievement.namePt}
                  </strong>
                  <span style={{ fontSize: ".7rem", color: "hsl(var(--muted))" }}>
                    {new Date(ua.unlockedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimas sessões */}
      {progress.length > 0 && (
        <div className="panel section-card">
          <span className="eyebrow">Últimas sessões</span>
          <div className="recent-list" style={{ marginTop: 12 }}>
            {progress.slice(0, 8).map((p) => (
              <div key={p.id} className="recent-item">
                <div>
                  <strong style={{ fontSize: ".875rem", color: "hsl(var(--foreground))" }}>
                    {p.book.namePt} {p.chapter.chapterNumber}
                  </strong>
                  <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))", display: "block", marginTop: 2 }}>
                    {new Date(p.completedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: ".8rem", color: "hsl(var(--muted))", fontVariantNumeric: "tabular-nums" }}>
                  {p.bestWpm && <span>{Math.round(p.bestWpm)} PPM</span>}
                  {p.bestAccuracy && <span>{Math.round(p.bestAccuracy)}%</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
