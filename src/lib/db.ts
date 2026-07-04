// Camada de persistência 100% client-side via IndexedDB (lib `idb`).
// Todo o estado do usuário vive aqui — sem servidor, sem conta, sem senha.

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

// ── Tipos ────────────────────────────────────────────

export type ThemeId = "dark" | "light" | "parchment";
export type UILanguage = "pt-BR" | "en";
export type KeySoundId = "off" | "soft" | "mechanical" | "clicky" | "typewriter" | "pop";

export interface Settings {
  name: string;
  theme: ThemeId;
  uiLanguage: UILanguage;
  dailyGoalMinutes: number;
  /** Som de teclado ao digitar ("off" = sem som). */
  keySound: KeySoundId;
  /** Escala da fonte do texto bíblico (1 = padrão). */
  fontScale: number;
  /** Última leitura aberta (para "continuar de onde parei"). */
  lastChapterKey: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  name: "",
  theme: "dark",
  uiLanguage: "pt-BR",
  dailyGoalMinutes: 10,
  keySound: "off",
  fontScale: 1,
  lastChapterKey: null,
};

export interface ChapterProgress {
  osisId: string;
  chapterNumber: number;
  completedAt: number; // epoch ms
  bestWpm: number;
  bestAccuracy: number;
  versesTyped: number;
}

export type ProgressMap = Record<string, ChapterProgress>;

export interface SessionRecord {
  id?: number;
  osisId: string;
  chapterNumber: number;
  wpm: number;
  accuracy: number;
  durationSeconds: number;
  versesTyped: number;
  completedAt: number; // epoch ms
}

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  lastActivityDate: string | null; // "YYYY-MM-DD"
}

export const DEFAULT_STREAK: StreakState = {
  currentStreak: 0,
  bestStreak: 0,
  lastActivityDate: null,
};

/** Estado parcial de um capítulo em andamento (retomar). */
export interface ResumeState {
  chapterKey: string;
  cursor: number;
  states: string; // 1 char por letra: p/c/i
  errors: number;
  totalTyped: number;
  elapsedSeconds: number;
  versesTyped: number;
  updatedAt: number;
}

interface TTTSchema extends DBSchema {
  kv: { key: string; value: unknown };
  progress: { key: string; value: ChapterProgress };
  sessions: { key: number; value: SessionRecord };
  achievements: { key: string; value: { code: string; unlockedAt: number } };
  resume: { key: string; value: ResumeState };
}

const DB_NAME = "type-the-truth";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TTTSchema>> | null = null;

function getDB() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB indisponível (ambiente sem navegador).");
  }
  if (!dbPromise) {
    dbPromise = openDB<TTTSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("kv");
        db.createObjectStore("progress");
        db.createObjectStore("sessions", { keyPath: "id", autoIncrement: true });
        db.createObjectStore("achievements", { keyPath: "code" });
        db.createObjectStore("resume");
      },
    });
  }
  return dbPromise;
}

// ── Settings ─────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
  const db = await getDB();
  const raw = (await db.get("kv", "settings")) as (Partial<Settings> & { sound?: boolean }) | undefined;
  const merged: Settings = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  // Migração: campo booleano `sound` antigo → seletor `keySound`.
  if (raw && raw.keySound === undefined && typeof raw.sound === "boolean") {
    merged.keySound = raw.sound ? "soft" : "off";
  }
  delete (merged as Partial<Settings> & { sound?: boolean }).sound;
  return merged;
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const db = await getDB();
  const current = await getSettings();
  const next = { ...current, ...patch };
  await db.put("kv", next, "settings");
  return next;
}

// ── Progress ─────────────────────────────────────────

export async function getAllProgress(): Promise<ProgressMap> {
  const db = await getDB();
  const keys = await db.getAllKeys("progress");
  const vals = await db.getAll("progress");
  const map: ProgressMap = {};
  keys.forEach((k, i) => (map[k as string] = vals[i]));
  return map;
}

export async function upsertProgress(p: ChapterProgress): Promise<void> {
  const db = await getDB();
  const key = `${p.osisId}_${p.chapterNumber}`;
  const existing = await db.get("progress", key);
  const merged: ChapterProgress = existing
    ? {
        ...p,
        bestWpm: Math.max(existing.bestWpm, p.bestWpm),
        bestAccuracy: Math.max(existing.bestAccuracy, p.bestAccuracy),
        versesTyped: Math.max(existing.versesTyped, p.versesTyped),
      }
    : p;
  await db.put("progress", merged, key);
}

// ── Sessions ─────────────────────────────────────────

export async function addSession(rec: SessionRecord): Promise<void> {
  const db = await getDB();
  await db.add("sessions", rec);
}

export async function getAllSessions(): Promise<SessionRecord[]> {
  const db = await getDB();
  return db.getAll("sessions");
}

// ── Streak ───────────────────────────────────────────

export async function getStreak(): Promise<StreakState> {
  const db = await getDB();
  const saved = (await db.get("kv", "streak")) as StreakState | undefined;
  return saved ?? { ...DEFAULT_STREAK };
}

export async function saveStreak(s: StreakState): Promise<void> {
  const db = await getDB();
  await db.put("kv", s, "streak");
}

// ── Achievements ─────────────────────────────────────

export async function getUnlockedAchievements(): Promise<Record<string, number>> {
  const db = await getDB();
  const all = await db.getAll("achievements");
  const map: Record<string, number> = {};
  for (const a of all) map[a.code] = a.unlockedAt;
  return map;
}

export async function unlockAchievement(code: string, unlockedAt: number): Promise<void> {
  const db = await getDB();
  await db.put("achievements", { code, unlockedAt });
}

// ── Resume (capítulo em andamento) ───────────────────

export async function getResume(chapterKey: string): Promise<ResumeState | undefined> {
  const db = await getDB();
  return db.get("resume", chapterKey);
}

export async function getAllResume(): Promise<ResumeState[]> {
  const db = await getDB();
  return db.getAll("resume");
}

export async function setResume(state: ResumeState): Promise<void> {
  const db = await getDB();
  await db.put("resume", state, state.chapterKey);
}

export async function clearResume(chapterKey: string): Promise<void> {
  const db = await getDB();
  await db.delete("resume", chapterKey);
}

// ── Export / Import (arquivo de save) ────────────────

export interface SaveFile {
  app: "type-the-truth";
  version: number;
  exportedAt: number;
  settings: Settings;
  progress: ChapterProgress[];
  sessions: SessionRecord[];
  streak: StreakState;
  achievements: { code: string; unlockedAt: number }[];
  resume: ResumeState[];
}

export async function exportAll(): Promise<SaveFile> {
  const db = await getDB();
  const [settings, progress, sessions, streak, achievements, resume] = await Promise.all([
    getSettings(),
    db.getAll("progress"),
    db.getAll("sessions"),
    getStreak(),
    db.getAll("achievements"),
    db.getAll("resume"),
  ]);
  return {
    app: "type-the-truth",
    version: DB_VERSION,
    exportedAt: Date.now(),
    settings,
    progress,
    sessions,
    streak,
    achievements,
    resume,
  };
}

export async function importAll(save: SaveFile): Promise<void> {
  if (save.app !== "type-the-truth") {
    throw new Error("Arquivo inválido: não é um save do Type the Truth.");
  }
  const db = await getDB();
  const tx = db.transaction(["kv", "progress", "sessions", "achievements", "resume"], "readwrite");

  await Promise.all([
    tx.objectStore("kv").clear(),
    tx.objectStore("progress").clear(),
    tx.objectStore("sessions").clear(),
    tx.objectStore("achievements").clear(),
    tx.objectStore("resume").clear(),
  ]);

  const kv = tx.objectStore("kv");
  await kv.put({ ...DEFAULT_SETTINGS, ...save.settings }, "settings");
  await kv.put(save.streak ?? DEFAULT_STREAK, "streak");

  const prog = tx.objectStore("progress");
  for (const p of save.progress ?? []) await prog.put(p, `${p.osisId}_${p.chapterNumber}`);

  const sess = tx.objectStore("sessions");
  for (const s of save.sessions ?? []) {
    const { id, ...rest } = s;
    await sess.add(rest as SessionRecord);
  }

  const ach = tx.objectStore("achievements");
  for (const a of save.achievements ?? []) await ach.put(a);

  const res = tx.objectStore("resume");
  for (const r of save.resume ?? []) await res.put(r, r.chapterKey);

  await tx.done;
}

/** Apaga tudo (reset total). */
export async function wipeAll(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["kv", "progress", "sessions", "achievements", "resume"], "readwrite");
  await Promise.all([
    tx.objectStore("kv").clear(),
    tx.objectStore("progress").clear(),
    tx.objectStore("sessions").clear(),
    tx.objectStore("achievements").clear(),
    tx.objectStore("resume").clear(),
  ]);
  await tx.done;
}
