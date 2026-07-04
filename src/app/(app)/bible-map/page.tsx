"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { BOOKS, TOTAL_VERSES, bookName, chapterKey, type BookMeta } from "@/lib/books";
import { getAllProgress, getAllResume, type ProgressMap, type ResumeState } from "@/lib/db";
import { totalVersesTyped } from "@/lib/stats";
import { percentOf, localeFor } from "@/lib/utils";
import { BookCard } from "./BookCard";

export default function BibleMapPage() {
  const { t, settings } = useApp();
  const [progress, setProgress] = useState<ProgressMap>({});
  const [resume, setResume] = useState<ResumeState[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([getAllProgress(), getAllResume()]).then(([p, r]) => {
      setProgress(p);
      setResume(r);
      setLoaded(true);
    });
  }, []);

  const lang = settings.uiLanguage;
  const locale = localeFor(lang);

  const stat = (book: BookMeta) => {
    const chapters = Array.from({ length: book.totalChapters }, (_, i) => {
      const key = chapterKey(book.osisId, i + 1);
      return { chapterNumber: i + 1, completed: Boolean(progress[key]) };
    });
    const completed = chapters.filter((c) => c.completed).length;
    let verses = 0;
    for (const p of Object.values(progress)) if (p.osisId === book.osisId) verses += p.versesTyped;
    for (const r of resume) if (r.chapterKey.startsWith(book.osisId + "_") && !progress[r.chapterKey]) verses += r.versesTyped;
    return { book, completed, verses, percent: percentOf(completed, book.totalChapters), chapters };
  };

  const otBooks = BOOKS.filter((b) => b.testament === "OT").map(stat);
  const ntBooks = BOOKS.filter((b) => b.testament === "NT").map(stat);

  const totalCompleted = Object.keys(progress).length;
  const totalChapters = BOOKS.reduce((s, b) => s + b.totalChapters, 0);
  const versesTyped = totalVersesTyped(progress, resume);

  if (!loaded) return <div className="page-content" aria-busy="true" />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("map.title")}</h2>
          <p className="page-subtitle">{t("map.subtitle")}</p>
        </div>
      </div>

      <div className="panel section-card">
        <div style={{ display: "grid", gap: 14 }}>
          <SummaryBar label={t("map.chaptersDone")} value={totalCompleted} total={totalChapters} locale={locale} />
          <SummaryBar label={t("dash.versesTyped")} value={versesTyped} total={TOTAL_VERSES} locale={locale} gold />
        </div>
      </div>

      <Section title={t("map.ot")} books={otBooks} lang={lang} locale={locale} t={t} />
      <Section title={t("map.nt")} books={ntBooks} lang={lang} locale={locale} t={t} />
    </div>
  );
}

function SummaryBar({ label, value, total, locale, gold }: { label: string; value: number; total: number; locale: string; gold?: boolean }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))" }}>{label}</span>
        <span style={{ fontSize: ".75rem", fontWeight: 600, color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums" }}>
          {value.toLocaleString(locale)} / {total.toLocaleString(locale)}
          <span style={{ color: "hsl(var(--muted))", fontWeight: 400 }}> — {percentOf(value, total)}%</span>
        </span>
      </div>
      <div className="meter">
        <div className="meter-fill" style={{ width: `${percentOf(value, total)}%`, ...(gold ? { background: "linear-gradient(90deg, hsl(var(--gold)), hsl(var(--primary)))" } : {}) }} />
      </div>
    </div>
  );
}

interface Stat {
  book: BookMeta;
  completed: number;
  verses: number;
  percent: number;
  chapters: { chapterNumber: number; completed: boolean }[];
}

function Section({ title, books, lang, locale, t }: { title: string; books: Stat[]; lang: "pt-BR" | "en"; locale: string; t: (k: string) => string }) {
  return (
    <section className="panel section-card">
      <span className="eyebrow">{title}</span>
      <div className="bible-map-grid" style={{ marginTop: 16 }}>
        {books.map(({ book, completed, verses, percent, chapters }) => (
          <BookCard
            key={book.osisId}
            bookOsisId={book.osisId}
            bookName={bookName(book, lang)}
            totalChapters={book.totalChapters}
            completed={completed}
            versesTyped={verses}
            percent={percent}
            chapters={chapters}
            locale={locale}
            chaptersLabel={t("map.chaptersShort")}
            versesLabel={t("map.versesShort")}
          />
        ))}
      </div>
    </section>
  );
}
