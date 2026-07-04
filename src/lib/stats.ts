// Agregados derivados do estado local (progresso, sessões, capítulos em andamento).

import { ALL_CHAPTERS, chapterKey, getBook } from "./books";
import type { ProgressMap, ResumeState, SessionRecord } from "./db";

export interface NextChapter {
  osisId: string;
  chapterNumber: number;
  bookNamePt: string;
  bookNameEn: string;
  /** true = retomar um capítulo já começado; false = novo capítulo. */
  resuming: boolean;
}

/** Total de versículos digitados (completos + parciais em andamento). */
export function totalVersesTyped(progress: ProgressMap, resume: ResumeState[]): number {
  let total = 0;
  for (const p of Object.values(progress)) total += p.versesTyped;
  for (const r of resume) {
    // Evita dupla contagem se, por algum motivo, houver progresso completo do mesmo capítulo
    if (!progress[r.chapterKey]) total += r.versesTyped;
  }
  return total;
}

/**
 * Próximo capítulo a digitar. Retoma o último capítulo aberto se ele estiver
 * incompleto; senão segue a ordem canônica a partir dele; senão, Gênesis 1.
 */
export function computeNextChapter(
  progress: ProgressMap,
  lastChapterKey: string | null
): NextChapter | null {
  const isDone = (osisId: string, ch: number) => Boolean(progress[chapterKey(osisId, ch)]);

  const make = (osisId: string, ch: number, resuming: boolean): NextChapter | null => {
    const book = getBook(osisId);
    if (!book) return null;
    return { osisId, chapterNumber: ch, bookNamePt: book.namePt, bookNameEn: book.nameEn, resuming };
  };

  let startIdx = 0;
  if (lastChapterKey) {
    const idx = ALL_CHAPTERS.findIndex((c) => chapterKey(c.osisId, c.chapterNumber) === lastChapterKey);
    if (idx !== -1) {
      const c = ALL_CHAPTERS[idx];
      if (!isDone(c.osisId, c.chapterNumber)) return make(c.osisId, c.chapterNumber, true);
      startIdx = idx + 1;
    }
  }
  for (let i = startIdx; i < ALL_CHAPTERS.length; i++) {
    const c = ALL_CHAPTERS[i];
    if (!isDone(c.osisId, c.chapterNumber)) return make(c.osisId, c.chapterNumber, false);
  }
  for (let i = 0; i < startIdx; i++) {
    const c = ALL_CHAPTERS[i];
    if (!isDone(c.osisId, c.chapterNumber)) return make(c.osisId, c.chapterNumber, false);
  }
  return null;
}

export interface SessionStats {
  totalMinutes: number;
  avgWpm: number;
  bestWpm: number;
  avgAccuracy: number;
}

export function sessionStats(sessions: SessionRecord[]): SessionStats {
  const totalMinutes = Math.round(sessions.reduce((s, x) => s + x.durationSeconds, 0) / 60);
  const wpms = sessions.filter((s) => s.wpm > 0).map((s) => s.wpm);
  const accs = sessions.map((s) => s.accuracy);
  return {
    totalMinutes,
    avgWpm: wpms.length ? Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length) : 0,
    bestWpm: wpms.length ? Math.round(Math.max(...wpms)) : 0,
    avgAccuracy: accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : 0,
  };
}
