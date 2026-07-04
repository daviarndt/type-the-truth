// Definições de conquistas + avaliação 100% client-side.

import { BOOKS, getBook } from "./books";
import type { ProgressMap, SessionRecord, StreakState } from "./db";

export type AchievementType = "progress" | "consistency" | "attention" | "volume";

export interface AchievementDef {
  code: string;
  nameEn: string;
  namePt: string;
  descriptionEn: string;
  descriptionPt: string;
  iconName: string;
  type: AchievementType;
  /** Tema desbloqueado ao ganhar (opcional). */
  unlockTheme?: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { code: "first_session", nameEn: "First Words", namePt: "Primeiras Palavras", descriptionEn: "Complete your very first typing session.", descriptionPt: "Complete sua primeira sessão de digitação.", iconName: "✒️", type: "progress" },
  { code: "first_chapter", nameEn: "Chapter One", namePt: "Primeiro Capítulo", descriptionEn: "Complete your first full chapter.", descriptionPt: "Complete seu primeiro capítulo inteiro.", iconName: "📖", type: "progress" },
  { code: "book_john", nameEn: "Book of John", namePt: "Livro de João", descriptionEn: "Complete all 21 chapters of the Gospel of John.", descriptionPt: "Complete todos os 21 capítulos do Evangelho de João.", iconName: "📜", type: "progress" },
  { code: "gospel_finisher", nameEn: "Gospel Finisher", namePt: "Evangelhos Completos", descriptionEn: "Complete all four Gospels.", descriptionPt: "Complete os quatro Evangelhos: Mateus, Marcos, Lucas e João.", iconName: "✝️", type: "progress" },
  { code: "old_testament", nameEn: "Old Testament", namePt: "Antigo Testamento", descriptionEn: "Complete every book in the Old Testament.", descriptionPt: "Complete todos os livros do Antigo Testamento.", iconName: "📘", type: "progress" },
  { code: "new_testament", nameEn: "New Testament", namePt: "Novo Testamento", descriptionEn: "Complete every book in the New Testament.", descriptionPt: "Complete todos os livros do Novo Testamento.", iconName: "📕", type: "progress" },
  { code: "whole_bible", nameEn: "The Full Journey", namePt: "A Jornada Completa", descriptionEn: "Type through the entire Bible — all 66 books.", descriptionPt: "Digite pela Bíblia inteira — todos os 66 livros.", iconName: "👑", type: "progress" },

  { code: "streak_7", nameEn: "7-Day Rhythm", namePt: "Ritmo de 7 Dias", descriptionEn: "Reach a 7-day streak.", descriptionPt: "Alcance uma sequência de 7 dias.", iconName: "🔥", type: "consistency" },
  { code: "streak_30", nameEn: "30-Day Faithful", namePt: "Fiel por 30 Dias", descriptionEn: "Reach a 30-day streak.", descriptionPt: "Alcance uma sequência de 30 dias.", iconName: "🕯️", type: "consistency" },
  { code: "streak_100", nameEn: "100-Day Devotion", namePt: "Devoção de 100 Dias", descriptionEn: "Reach a 100-day streak.", descriptionPt: "Alcance uma sequência de 100 dias.", iconName: "⭐", type: "consistency" },

  { code: "sharp_pen", nameEn: "Sharp Pen", namePt: "Pena Afiada", descriptionEn: "Complete 5 sessions with 99%+ accuracy.", descriptionPt: "Complete 5 sessões com 99%+ de precisão.", iconName: "🎯", type: "attention" },
  { code: "flawless", nameEn: "Flawless", namePt: "Impecável", descriptionEn: "Complete a chapter with 100% accuracy.", descriptionPt: "Complete um capítulo com 100% de precisão.", iconName: "💎", type: "attention" },

  { code: "verses_10", nameEn: "First Steps", namePt: "Primeiros Passos", descriptionEn: "Type 10 verses.", descriptionPt: "Digite 10 versículos.", iconName: "🌱", type: "volume" },
  { code: "verses_50", nameEn: "Taking Root", namePt: "Lançando Raízes", descriptionEn: "Type 50 verses.", descriptionPt: "Digite 50 versículos.", iconName: "🌿", type: "volume" },
  { code: "verses_100", nameEn: "Apprentice", namePt: "Aprendiz", descriptionEn: "Type 100 verses.", descriptionPt: "Digite 100 versículos.", iconName: "✍️", type: "volume" },
  { code: "verses_500", nameEn: "Dedicated Scribe", namePt: "Escriba Dedicado", descriptionEn: "Type 500 verses.", descriptionPt: "Digite 500 versículos.", iconName: "📜", type: "volume" },
  { code: "verses_1000", nameEn: "Scribe", namePt: "Escriba", descriptionEn: "Type 1,000 verses.", descriptionPt: "Digite 1.000 versículos.", iconName: "🖋️", type: "volume" },
  { code: "verses_3000", nameEn: "Journeyman", namePt: "Escriba de Ofício", descriptionEn: "Type 3,000 verses.", descriptionPt: "Digite 3.000 versículos.", iconName: "📖", type: "volume" },
  { code: "verses_5000", nameEn: "Faithful Scribe", namePt: "Escriba Fiel", descriptionEn: "Type 5,000 verses.", descriptionPt: "Digite 5.000 versículos.", iconName: "🕯️", type: "volume" },
  { code: "verses_10000", nameEn: "Chronicler", namePt: "Cronista", descriptionEn: "Type 10,000 verses.", descriptionPt: "Digite 10.000 versículos.", iconName: "📚", type: "volume" },
  { code: "verses_20000", nameEn: "Sage", namePt: "Sábio", descriptionEn: "Type 20,000 verses.", descriptionPt: "Digite 20.000 versículos.", iconName: "🌟", type: "volume" },
  { code: "verses_31105", nameEn: "The Full Bible", namePt: "A Bíblia Completa", descriptionEn: "Type all 31,105 verses of the Bible.", descriptionPt: "Digite todos os 31.105 versículos da Bíblia.", iconName: "👑", type: "volume" },
];

const byCode = new Map(ACHIEVEMENTS.map((a) => [a.code, a]));
export function getAchievement(code: string): AchievementDef | undefined {
  return byCode.get(code);
}

// ── Avaliação ──────────────────────────────────────

export interface EvalInput {
  progress: ProgressMap;
  sessions: SessionRecord[];
  streak: StreakState;
  totalVersesTyped: number;
}

function completedChaptersOf(progress: ProgressMap, osisId: string): number {
  let n = 0;
  for (const key of Object.keys(progress)) {
    if (key.startsWith(osisId + "_")) n++;
  }
  return n;
}

function bookComplete(progress: ProgressMap, osisId: string): boolean {
  const book = getBook(osisId);
  return book ? completedChaptersOf(progress, osisId) >= book.totalChapters : false;
}

function testamentComplete(progress: ProgressMap, testament: "OT" | "NT"): boolean {
  return BOOKS.filter((b) => b.testament === testament).every((b) => bookComplete(progress, b.osisId));
}

/** Retorna os códigos de conquistas que o estado atual satisfaz. */
export function evaluateAchievements(input: EvalInput): string[] {
  const { progress, sessions, streak, totalVersesTyped } = input;
  const completedChapters = Object.keys(progress).length;
  const satisfied: string[] = [];
  const add = (code: string, cond: boolean) => {
    if (cond) satisfied.push(code);
  };

  add("first_session", sessions.length >= 1);
  add("first_chapter", completedChapters >= 1);
  add("book_john", bookComplete(progress, "John"));
  add("gospel_finisher", ["Matt", "Mark", "Luke", "John"].every((o) => bookComplete(progress, o)));
  add("old_testament", testamentComplete(progress, "OT"));
  add("new_testament", testamentComplete(progress, "NT"));
  add("whole_bible", testamentComplete(progress, "OT") && testamentComplete(progress, "NT"));

  add("streak_7", streak.bestStreak >= 7);
  add("streak_30", streak.bestStreak >= 30);
  add("streak_100", streak.bestStreak >= 100);

  add("sharp_pen", sessions.filter((s) => (s.accuracy ?? 0) >= 99).length >= 5);
  add("flawless", sessions.some((s) => (s.accuracy ?? 0) >= 100));

  for (const n of [10, 50, 100, 500, 1000, 3000, 5000, 10000, 20000, 31105]) {
    add(`verses_${n}`, totalVersesTyped >= n);
  }

  return satisfied;
}
