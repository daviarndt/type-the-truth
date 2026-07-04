"use client";

import { useState } from "react";
import Link from "next/link";

interface ChapterInfo {
  chapterNumber: number;
  completed: boolean;
}

interface BookCardProps {
  bookOsisId: string;
  bookName: string;
  totalChapters: number;
  completed: number;
  versesTyped: number;
  percent: number;
  chapters: ChapterInfo[];
  locale: string;
  chaptersLabel: string;
  versesLabel: string;
}

export function BookCard({
  bookOsisId, bookName, totalChapters, completed, versesTyped, percent, chapters, locale, chaptersLabel, versesLabel,
}: BookCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bible-map-book${percent === 100 ? " bible-map-book--done" : ""}`} style={{ cursor: "pointer" }}>
      <div onClick={() => setExpanded((v) => !v)}>
        <div className="book-card-top">
          <strong className="book-card-name">{bookName}</strong>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {percent > 0 && <span className="book-card-percent" style={{ fontVariantNumeric: "tabular-nums" }}>{percent}%</span>}
            <span style={{ fontSize: ".65rem", color: "hsl(var(--muted))", transition: "transform 0.15s", display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
          </div>
        </div>
        <div className="meter" style={{ marginTop: 8 }}>
          <div className="meter-fill" style={{ width: `${percent}%` }} />
        </div>
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
          <span className="book-card-chapters">{completed}/{totalChapters} {chaptersLabel}</span>
          {versesTyped > 0 && (
            <span style={{ fontSize: ".6rem", color: "hsl(var(--gold))", opacity: 0.85 }}>
              {versesTyped.toLocaleString(locale)} {versesLabel}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(32px, 1fr))", gap: 4, borderTop: "1px solid hsl(var(--border) / 0.4)", paddingTop: 10 }}>
          {chapters.map((ch) => (
            <Link
              key={ch.chapterNumber}
              href={`/type/${bookOsisId}/${ch.chapterNumber}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "grid", placeItems: "center", height: 28, borderRadius: 6,
                fontSize: ".7rem", fontWeight: 600, fontVariantNumeric: "tabular-nums",
                background: ch.completed ? "hsl(var(--primary) / 0.25)" : "hsl(var(--surface-2))",
                color: ch.completed ? "hsl(var(--primary))" : "hsl(var(--muted))",
                border: ch.completed ? "1px solid hsl(var(--primary) / 0.5)" : "1px solid hsl(var(--border) / 0.3)",
                textDecoration: "none",
              }}
            >
              {ch.chapterNumber}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
