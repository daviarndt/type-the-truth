"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BOOKS, bookName } from "@/lib/books";
import { useApp } from "@/components/AppProvider";

/** Modal para pular direto para qualquer livro/capítulo. */
export function ChapterPicker({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { t, settings } = useApp();
  const [osisId, setOsisId] = useState("Gen");
  const [chapter, setChapter] = useState(1);

  const book = BOOKS.find((b) => b.osisId === osisId)!;

  function go() {
    onClose();
    router.push(`/type/${osisId}/${chapter}`);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "hsl(0 0% 0% / 0.5)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{ padding: "1.5rem", width: "100%", maxWidth: 420, display: "grid", gap: 16 }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>
          {t("picker.title")}
        </h2>

        <div className="field-group">
          <label className="field-label">{t("picker.book")}</label>
          <select
            className="field-input"
            value={osisId}
            onChange={(e) => {
              setOsisId(e.target.value);
              setChapter(1);
            }}
          >
            {BOOKS.map((b) => (
              <option key={b.osisId} value={b.osisId}>
                {bookName(b, settings.uiLanguage)}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">
            {t("picker.chapter")} (1–{book.totalChapters})
          </label>
          <select
            className="field-input"
            value={chapter}
            onChange={(e) => setChapter(Number(e.target.value))}
          >
            {Array.from({ length: book.totalChapters }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn-secondary" onClick={onClose}>
            {t("common.back")}
          </button>
          <button className="btn-primary" onClick={go}>
            {t("picker.go")} →
          </button>
        </div>
      </div>
    </div>
  );
}
