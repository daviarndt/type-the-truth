"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, BookOpen, Hash, Compass } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { ChapterPicker } from "@/components/ChapterPicker";
import { BOOKS, TOTAL_CHAPTERS, TOTAL_VERSES, bookName, getBook } from "@/lib/books";
import { getAllProgress, getAllSessions, getAllResume, getStreak, type ProgressMap, type SessionRecord, type ResumeState, type StreakState } from "@/lib/db";
import { computeNextChapter, totalVersesTyped } from "@/lib/stats";
import { percentOf, localeFor } from "@/lib/utils";

export default function DashboardPage() {
  const { t, settings } = useApp();
  const [progress, setProgress] = useState<ProgressMap>({});
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [resume, setResume] = useState<ResumeState[]>([]);
  const [streak, setStreak] = useState<StreakState>({ currentStreak: 0, bestStreak: 0, lastActivityDate: null });
  const [loaded, setLoaded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    Promise.all([getAllProgress(), getAllSessions(), getAllResume(), getStreak()]).then(
      ([p, s, r, st]) => {
        setProgress(p);
        setSessions(s);
        setResume(r);
        setStreak(st);
        setLoaded(true);
      }
    );
  }, []);

  const lang = settings.uiLanguage;
  const locale = localeFor(lang);
  const next = computeNextChapter(progress, settings.lastChapterKey);
  const completedChapters = Object.keys(progress).length;
  const versesTyped = totalVersesTyped(progress, resume);

  const recent = Object.values(progress)
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 5);

  const booksInProgress = BOOKS.filter((b) =>
    Object.values(progress).some((p) => p.osisId === b.osisId)
  ).slice(0, 4);

  const nextName = next ? (lang === "en" ? next.bookNameEn : next.bookNamePt) : "";
  const firstName = settings.name.trim().split(" ")[0];

  if (!loaded) return <div className="page-content" aria-busy="true" />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            {next
              ? firstName
                ? t("dash.continueJourneyName", { name: firstName })
                : t("dash.continueJourney")
              : t("dash.bibleDone")}
          </h2>
          <p className="page-subtitle">
            {next
              ? `${next.resuming ? t("dash.inProgress") : t("dash.next")}: ${nextName} ${next.chapterNumber}`
              : t("dash.bibleDoneSub")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn-secondary" onClick={() => setPickerOpen(true)}>
            <Compass size={16} /> {t("dash.pickChapter")}
          </button>
          {next && (
            <Link href={`/type/${next.osisId}/${next.chapterNumber}`} className="btn-primary">
              {next.resuming ? t("dash.resumeBtn") : t("dash.continueTyping")}
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>

      <div className="dashboard-hero">
        {next && (
          <div className="panel typing-card">
            <span className="eyebrow">{t("dash.todaySession")}</span>
            <h3 className="panel-title">{nextName} {next.chapterNumber}</h3>
            <p style={{ color: "hsl(var(--muted))", fontSize: ".875rem", marginTop: 4, marginBottom: 20, lineHeight: 1.5 }}>
              {next.resuming ? t("dash.sessionHintResume") : t("dash.sessionHint")}
            </p>
            <Link href={`/type/${next.osisId}/${next.chapterNumber}`} className="btn-primary">
              {next.resuming ? t("dash.resumeChapter") : t("dash.startNow")}
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        <div className="panel stats-card">
          <span className="eyebrow">{t("nav.streak")}</span>
          <div className="dashboard-streak">
            <div className="streak-ring-sm">
              <div
                className="streak-ring-track"
                style={{ background: `conic-gradient(hsl(var(--gold)) 0 ${Math.min(streak.currentStreak / 30, 1) * 360}deg, hsl(var(--surface-2)) ${Math.min(streak.currentStreak / 30, 1) * 360}deg 360deg)` }}
              >
                <div className="streak-ring-center">
                  <Flame size={14} style={{ color: "hsl(var(--gold))" }} />
                  <strong style={{ fontVariantNumeric: "tabular-nums", fontSize: "1.2rem", lineHeight: 1.2, color: "hsl(var(--foreground))" }}>
                    {streak.currentStreak}
                  </strong>
                  <span style={{ fontSize: ".65rem", color: "hsl(var(--muted))" }}>{t("common.days")}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="kpi-grid">
            <div className="kpi">
              <BookOpen size={14} style={{ color: "hsl(var(--primary))" }} />
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>{completedChapters}</strong>
              <span>{t("common.chapters")}</span>
            </div>
            <div className="kpi">
              <Hash size={14} style={{ color: "hsl(var(--primary))" }} />
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>{versesTyped.toLocaleString(locale)}</strong>
              <span>{t("common.verses")}</span>
            </div>
            <div className="kpi">
              <Flame size={14} style={{ color: "hsl(var(--gold))" }} />
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>{streak.bestStreak}</strong>
              <span>{t("dash.bestStreak")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel section-card">
        <div className="section-header">
          <span className="eyebrow">{t("dash.bibleProgress")}</span>
          <Link href="/bible-map" style={{ fontSize: ".8rem", color: "hsl(var(--primary))", fontWeight: 600 }}>
            {t("dash.viewMap")}
          </Link>
        </div>

        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          <ProgressBar
            icon={<BookOpen size={12} style={{ color: "hsl(var(--primary))" }} />}
            label={t("common.chapters")}
            value={completedChapters}
            total={TOTAL_CHAPTERS}
            locale={locale}
          />
          <ProgressBar
            icon={<Hash size={12} style={{ color: "hsl(var(--gold))" }} />}
            label={t("dash.versesTyped")}
            value={versesTyped}
            total={TOTAL_VERSES}
            locale={locale}
            gold
          />
        </div>

        {booksInProgress.length > 0 && (
          <div className="book-progress-list" style={{ marginTop: 20 }}>
            {booksInProgress.map((book) => {
              const done = Object.values(progress).filter((p) => p.osisId === book.osisId).length;
              return (
                <div key={book.osisId} className="book-row">
                  <div className="book-row-info">
                    <strong style={{ fontSize: ".875rem", color: "hsl(var(--foreground))" }}>{bookName(book, lang)}</strong>
                    <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))", fontVariantNumeric: "tabular-nums" }}>
                      {done}/{book.totalChapters} {t("map.chaptersShort")}
                    </span>
                  </div>
                  <div className="meter">
                    <div className="meter-fill" style={{ width: `${percentOf(done, book.totalChapters)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {recent.length > 0 && (
        <div className="panel section-card">
          <span className="eyebrow">{t("dash.recent")}</span>
          <div className="recent-list" style={{ marginTop: 12 }}>
            {recent.map((p) => {
              const book = getBook(p.osisId);
              return (
                <div key={`${p.osisId}_${p.chapterNumber}`} className="recent-item">
                  <div>
                    <strong style={{ fontSize: ".875rem", color: "hsl(var(--foreground))" }}>
                      {book ? bookName(book, lang) : p.osisId} {p.chapterNumber}
                    </strong>
                    <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))", display: "block", marginTop: 2 }}>
                      {new Date(p.completedAt).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: ".8rem", color: "hsl(var(--muted))", fontVariantNumeric: "tabular-nums" }}>
                    {p.bestWpm > 0 && <span>{Math.round(p.bestWpm)} {t("typing.wpm")}</span>}
                    {p.bestAccuracy > 0 && <span>{Math.round(p.bestAccuracy)}%</span>}
                    <Link href={`/type/${p.osisId}/${p.chapterNumber}`} style={{ color: "hsl(var(--primary))", fontSize: ".75rem" }}>
                      {t("dash.retype")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pickerOpen && <ChapterPicker onClose={() => setPickerOpen(false)} />}
    </div>
  );
}

function ProgressBar({
  icon, label, value, total, locale, gold,
}: {
  icon: React.ReactNode; label: string; value: number; total: number; locale: string; gold?: boolean;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))", display: "flex", alignItems: "center", gap: 6 }}>
          {icon} {label}
        </span>
        <span style={{ fontSize: ".75rem", color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
          {value.toLocaleString(locale)} / {total.toLocaleString(locale)}
          <span style={{ color: "hsl(var(--muted))", fontWeight: 400 }}> ({percentOf(value, total)}%)</span>
        </span>
      </div>
      <div className="meter">
        <div
          className="meter-fill"
          style={{ width: `${percentOf(value, total)}%`, ...(gold ? { background: "linear-gradient(90deg, hsl(var(--gold)), hsl(var(--primary)))" } : {}) }}
        />
      </div>
    </div>
  );
}
