// Sincronização opcional na nuvem: Firebase Auth (Google) + Firestore.
// O Firebase é carregado por import dinâmico → só baixa quando o usuário
// realmente usa a nuvem. Se as chaves não estiverem configuradas, tudo aqui
// vira no-op e o app segue 100% local (degradação graciosa).

import { exportAll, importAll, type SaveFile, type ChapterProgress, type SessionRecord, type ResumeState } from "./db";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isCloudConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId
);

export interface CloudUser {
  uid: string;
  name: string | null;
  email: string | null;
  photo: string | null;
}

// ── Inicialização preguiçosa do Firebase ─────────────

interface FB {
  auth: import("firebase/auth").Auth;
  db: import("firebase/firestore").Firestore;
}
let fb: FB | null = null;

async function init(): Promise<FB | null> {
  if (!isCloudConfigured || typeof window === "undefined") return null;
  if (fb) return fb;
  const [{ initializeApp, getApps }, { getAuth }, { getFirestore }] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
  ]);
  const app = getApps()[0] ?? initializeApp(config as Record<string, string>);
  fb = { auth: getAuth(app), db: getFirestore(app) };
  return fb;
}

// ── Auth ─────────────────────────────────────────────

export async function subscribeUser(cb: (u: CloudUser | null) => void): Promise<() => void> {
  const f = await init();
  if (!f) {
    cb(null);
    return () => {};
  }
  const { onAuthStateChanged } = await import("firebase/auth");
  return onAuthStateChanged(f.auth, (u) =>
    cb(u ? { uid: u.uid, name: u.displayName, email: u.email, photo: u.photoURL } : null)
  );
}

export async function signInWithGoogle(): Promise<void> {
  const f = await init();
  if (!f) return;
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  await signInWithPopup(f.auth, new GoogleAuthProvider());
}

export async function signOutCloud(): Promise<void> {
  const f = await init();
  if (!f) return;
  const { signOut } = await import("firebase/auth");
  await signOut(f.auth);
}

// ── Firestore: um documento por usuário (saves/{uid}) ──
// O save vai serializado como string única — evita os limites de
// contagem de campos do Firestore e simplifica leitura/escrita.

export async function pullSave(uid: string): Promise<SaveFile | null> {
  const f = await init();
  if (!f) return null;
  const { doc, getDoc } = await import("firebase/firestore");
  const snap = await getDoc(doc(f.db, "saves", uid));
  if (!snap.exists()) return null;
  try {
    return JSON.parse(snap.data().data as string) as SaveFile;
  } catch {
    return null;
  }
}

export async function pushSave(uid: string, save: SaveFile): Promise<void> {
  const f = await init();
  if (!f) return;
  const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
  await setDoc(doc(f.db, "saves", uid), {
    data: JSON.stringify(save),
    updatedAt: serverTimestamp(),
  });
}

// ── Merge (nunca perde progresso) ────────────────────

function keyOf(osisId: string, ch: number) {
  return `${osisId}_${ch}`;
}

export function mergeSaves(local: SaveFile, remote: SaveFile): SaveFile {
  const newer = remote.exportedAt > local.exportedAt ? remote : local;

  // progress: união por capítulo, mantendo os melhores valores
  const progress = new Map<string, ChapterProgress>();
  for (const p of [...local.progress, ...remote.progress]) {
    const k = keyOf(p.osisId, p.chapterNumber);
    const cur = progress.get(k);
    progress.set(k, cur
      ? {
          ...p,
          bestWpm: Math.max(cur.bestWpm, p.bestWpm),
          bestAccuracy: Math.max(cur.bestAccuracy, p.bestAccuracy),
          versesTyped: Math.max(cur.versesTyped, p.versesTyped),
          completedAt: Math.max(cur.completedAt, p.completedAt),
        }
      : p);
  }

  // sessions: histórico completo dos dois, sem duplicar
  const sessions = new Map<string, SessionRecord>();
  for (const s of [...local.sessions, ...remote.sessions]) {
    sessions.set(`${s.osisId}_${s.chapterNumber}_${s.completedAt}`, { ...s, id: undefined });
  }

  // achievements: união, mantendo o desbloqueio mais antigo
  const achievements = new Map<string, { code: string; unlockedAt: number }>();
  for (const a of [...local.achievements, ...remote.achievements]) {
    const cur = achievements.get(a.code);
    achievements.set(a.code, cur ? { ...a, unlockedAt: Math.min(cur.unlockedAt, a.unlockedAt) } : a);
  }

  // resume: por capítulo, mantém o mais recente
  const resume = new Map<string, ResumeState>();
  for (const r of [...local.resume, ...remote.resume]) {
    const cur = resume.get(r.chapterKey);
    if (!cur || r.updatedAt > cur.updatedAt) resume.set(r.chapterKey, r);
  }

  // streak: melhor sempre preservado; atual = o da atividade mais recente
  const streak = {
    bestStreak: Math.max(local.streak.bestStreak, remote.streak.bestStreak),
    ...((remote.streak.lastActivityDate ?? "") > (local.streak.lastActivityDate ?? "")
      ? { currentStreak: remote.streak.currentStreak, lastActivityDate: remote.streak.lastActivityDate }
      : { currentStreak: local.streak.currentStreak, lastActivityDate: local.streak.lastActivityDate }),
  };

  return {
    app: "type-the-truth",
    version: newer.version,
    exportedAt: Math.max(local.exportedAt, remote.exportedAt),
    settings: newer.settings,
    progress: Array.from(progress.values()),
    sessions: Array.from(sessions.values()),
    achievements: Array.from(achievements.values()),
    resume: Array.from(resume.values()),
    streak,
  };
}

/** Compara ignorando o carimbo volátil `exportedAt`. */
function sameData(a: SaveFile, b: SaveFile): boolean {
  const strip = (s: SaveFile) => JSON.stringify({ ...s, exportedAt: 0 });
  return strip(a) === strip(b);
}

/**
 * Sincroniza local ↔ nuvem: baixa, mescla, grava local e sobe o resultado.
 * Retorna se o estado local mudou (para o app recarregar).
 */
export async function syncNow(uid: string): Promise<{ changed: boolean }> {
  const [remote, local] = await Promise.all([pullSave(uid), exportAll()]);
  const merged = remote ? mergeSaves(local, remote) : local;
  const changed = !sameData(merged, local);
  if (changed) await importAll(merged);
  await pushSave(uid, merged);
  return { changed };
}

/** Sobe o estado local atual (chamado após concluir um capítulo). */
export async function pushCurrent(uid: string): Promise<void> {
  await pushSave(uid, await exportAll());
}
