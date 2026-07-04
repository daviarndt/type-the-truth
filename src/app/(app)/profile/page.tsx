"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, BookOpen, BookMarked, Trophy, Clock, Target, TrendingUp, Hash } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Heatmap } from "@/components/Heatmap";
import { TOTAL_VERSES, TOTAL_CHAPTERS, bookName, getBook } from "@/lib/books";
import { ACHIEVEMENTS, getAchievement } from "@/lib/achievements";
import {
  getAllProgress, getAllSessions, getAllResume, getStreak, getUnlockedAchievements,
  type ProgressMap, type SessionRecord, type ResumeState, type StreakState,
} from "@/lib/db";
import { sessionStats, totalVersesTyped } from "@/lib/stats";
import { percentOf, localeFor } from "@/lib/utils";

export default function ProfilePage() {
  const { t, settings } = useApp();
  const [progress, setProgress] = useState<ProgressMap>({});
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [resume, setResume] = useState<ResumeState[]>([]);
  const [streak, setStreak] = useState<StreakState>({ currentStreak: 0, bestStreak: 0, lastActivityDate: null });
  const [unlocked, setUnlocked] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([getAllProgress(), getAllSessions(), getAllResume(), getStreak(), getUnlockedAchievements()]).then(
      ([p, s, r, st, u]) => {
        setProgress(p); setSessions(s); setResume(r); setStreak(st); setUnlocked(u);
        setLoaded(true);
      }
    );
  }, []);

  const lang = settings.uiLanguage;
  const locale = localeFor(lang);
  const completedChapters = Object.keys(progress).length;
  const versesTyped = totalVersesTyped(progress, resume);
  const { totalMinutes, avgWpm, bestWpm, avgAccuracy } = sessionStats(sessions);
  const unlockedCount = Object.keys(unlocked).length;

  const displayName = settings.name.trim() || t("profile.member");
  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const recentProgress = Object.values(progress).sort((a, b) => b.completedAt - a.completedAt).slice(0, 8);
  const unlockedList = Object.entries(unlocked).sort((a, b) => b[1] - a[1]);

  if (!loaded) return <div className="page-content" aria-busy="true" />;

  return (
    <div className="page-content">
      <div className="panel" style={{ padding: "2rem", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))", display: "grid", placeItems: "center", fontSize: "1.5rem", fontWeight: 700, color: "white" }}>
          {initials || "👤"}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-.03em", color: "hsl(var(--foreground))" }}>{displayName}</h1>
          <p style={{ fontSize: ".8rem", color: "hsl(var(--muted))", marginTop: 4 }}>{t("landing.privacy")}</p>
        </div>
        <Link href="/settings" className="btn-secondary" style={{ flexShrink: 0 }}>{t("profile.editProfile")}</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { icon: <Flame size={18} style={{ color: "hsl(var(--gold))" }} />, value: streak.currentStreak, label: t("profile.streakDays") },
          { icon: <BookOpen size={18} style={{ color: "hsl(var(--primary))" }} />, value: completedChapters, label: t("common.chapters") },
          { icon: <BookMarked size={18} style={{ color: "hsl(var(--primary))" }} />, value: versesTyped.toLocaleString(locale), label: t("common.verses") },
          { icon: <Clock size={18} style={{ color: "hsl(var(--muted))" }} />, value: totalMinutes < 60 ? `${totalMinutes}m` : `${Math.floor(totalMinutes / 60)}h`, label: t("profile.totalTime") },
          { icon: <TrendingUp size={18} style={{ color: "hsl(var(--primary))" }} />, value: avgWpm, label: t("profile.avgWpm") },
          { icon: <Target size={18} style={{ color: "hsl(var(--primary))" }} />, value: bestWpm, label: t("profile.bestWpm") },
          { icon: <Hash size={18} style={{ color: "hsl(var(--primary))" }} />, value: `${avgAccuracy}%`, label: t("profile.avgAcc") },
          { icon: <Trophy size={18} style={{ color: "hsl(var(--gold))" }} />, value: unlockedCount, label: t("profile.achievements") },
        ].map(({ icon, value, label }) => (
          <div key={label} className="panel" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: 6 }}>
            {icon}
            <strong style={{ fontSize: "1.25rem", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "hsl(var(--foreground))", lineHeight: 1.2 }}>{value}</strong>
            <span style={{ fontSize: ".7rem", color: "hsl(var(--muted))", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="panel section-card">
        <div className="section-header">
          <span className="eyebrow">{t("profile.activity")}</span>
          <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))" }}>{t("profile.activitySub")}</span>
        </div>
        <div style={{ marginTop: 16 }}>
          {sessions.length > 0 ? (
            <Heatmap timestamps={sessions.map((s) => s.completedAt)} locale={locale} />
          ) : (
            <p style={{ fontSize: ".85rem", color: "hsl(var(--muted))" }}>{t("profile.noActivity")}</p>
          )}
        </div>
      </div>

      {/* Progresso na Bíblia */}
      <div className="panel section-card">
        <div className="section-header">
          <span className="eyebrow">{t("dash.bibleProgress")}</span>
          <span style={{ fontSize: ".8rem", color: "hsl(var(--muted))", fontVariantNumeric: "tabular-nums" }}>
            {percentOf(completedChapters, TOTAL_CHAPTERS)}%
          </span>
        </div>
        <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
          <Bar label={t("common.chapters")} value={completedChapters} total={TOTAL_CHAPTERS} locale={locale} />
          <Bar label={t("common.verses")} value={versesTyped} total={TOTAL_VERSES} locale={locale} gold />
        </div>
      </div>

      {/* Conquistas */}
      {unlockedList.length > 0 && (
        <div className="panel section-card">
          <span className="eyebrow">{t("profile.unlocked")}</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginTop: 14 }}>
            {unlockedList.map(([code, at]) => {
              const a = getAchievement(code);
              if (!a) return null;
              return (
                <div key={code} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: "hsl(var(--surface-offset))", border: "1px solid hsl(var(--border) / 0.5)" }}>
                  <span style={{ fontSize: "1.5rem" }}>{a.iconName}</span>
                  <div>
                    <strong style={{ fontSize: ".875rem", color: "hsl(var(--foreground))", display: "block" }}>{lang === "en" ? a.nameEn : a.namePt}</strong>
                    <span style={{ fontSize: ".7rem", color: "hsl(var(--muted))" }}>{new Date(at).toLocaleDateString(locale, { day: "numeric", month: "short" })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Últimas sessões */}
      {recentProgress.length > 0 && (
        <div className="panel section-card">
          <span className="eyebrow">{t("profile.lastSessions")}</span>
          <div className="recent-list" style={{ marginTop: 12 }}>
            {recentProgress.map((p) => {
              const book = getBook(p.osisId);
              return (
                <div key={`${p.osisId}_${p.chapterNumber}`} className="recent-item">
                  <div>
                    <strong style={{ fontSize: ".875rem", color: "hsl(var(--foreground))" }}>{book ? bookName(book, lang) : p.osisId} {p.chapterNumber}</strong>
                    <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))", display: "block", marginTop: 2 }}>{new Date(p.completedAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: ".8rem", color: "hsl(var(--muted))", fontVariantNumeric: "tabular-nums" }}>
                    {p.bestWpm > 0 && <span>{Math.round(p.bestWpm)} {t("typing.wpm")}</span>}
                    {p.bestAccuracy > 0 && <span>{Math.round(p.bestAccuracy)}%</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Bar({ label, value, total, locale, gold }: { label: string; value: number; total: number; locale: string; gold?: boolean }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))" }}>{label}</span>
        <span style={{ fontSize: ".75rem", color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
          {value.toLocaleString(locale)} / {total.toLocaleString(locale)}
        </span>
      </div>
      <div className="meter">
        <div className="meter-fill" style={{ width: `${percentOf(value, total)}%`, ...(gold ? { background: "linear-gradient(90deg, hsl(var(--gold)), hsl(var(--primary)))" } : {}) }} />
      </div>
    </div>
  );
}
