// Regras de sequência diária — client-side, baseadas em datas locais.

import type { StreakState } from "./db";

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const da = Date.UTC(ay, am - 1, ad);
  const db = Date.UTC(by, bm - 1, bd);
  return Math.round((db - da) / 86400000);
}

/**
 * Atualiza a sequência após uma sessão concluída hoje.
 * - Mesmo dia: nada muda.
 * - Dia seguinte: +1.
 * - Pulou dias: reseta para 1.
 * A melhor sequência é sempre preservada.
 */
export function bumpStreak(prev: StreakState): StreakState {
  const today = todayKey();
  if (prev.lastActivityDate === today) return prev;

  let currentStreak: number;
  if (prev.lastActivityDate && daysBetween(prev.lastActivityDate, today) === 1) {
    currentStreak = prev.currentStreak + 1;
  } else {
    currentStreak = 1;
  }

  return {
    currentStreak,
    bestStreak: Math.max(currentStreak, prev.bestStreak),
    lastActivityDate: today,
  };
}

/** Zera a sequência atual se o último dia de atividade não foi hoje nem ontem. */
export function reconcileStreak(prev: StreakState): StreakState {
  if (!prev.lastActivityDate || prev.currentStreak === 0) return prev;
  const gap = daysBetween(prev.lastActivityDate, todayKey());
  if (gap <= 1) return prev;
  return { ...prev, currentStreak: 0 };
}
