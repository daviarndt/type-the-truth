import { prisma } from "./prisma";

interface AchievementCheck {
  code: string;
  check: (userId: string) => Promise<boolean>;
}

/** Capítulos completos de um livro (por osisId). */
async function bookComplete(userId: string, osisId: string): Promise<boolean> {
  const book = await prisma.book.findUnique({ where: { osisId } });
  if (!book) return false;
  const completed = await prisma.userProgress.count({
    where: { userId, bookId: book.id },
  });
  return completed >= book.totalChapters;
}

/** Todos os livros de um testamento completos. */
async function testamentComplete(userId: string, testament: "OT" | "NT"): Promise<boolean> {
  const books = await prisma.book.findMany({ where: { testament } });
  const totalChapters = books.reduce((s, b) => s + b.totalChapters, 0);
  const completed = await prisma.userProgress.count({
    where: { userId, bookId: { in: books.map((b) => b.id) } },
  });
  return completed >= totalChapters;
}

async function versesTyped(userId: string): Promise<number> {
  const result = await prisma.typingSession.aggregate({
    where: { userId, status: { in: ["in_progress", "completed"] } },
    _sum: { versesTyped: true },
  });
  return result._sum.versesTyped ?? 0;
}

const ACHIEVEMENT_CHECKS: AchievementCheck[] = [
  {
    code: "first_session",
    check: async (userId) =>
      (await prisma.typingSession.count({ where: { userId, status: "completed" } })) >= 1,
  },
  {
    code: "first_chapter",
    check: async (userId) => (await prisma.userProgress.count({ where: { userId } })) >= 1,
  },
  {
    code: "sharp_pen",
    check: async (userId) =>
      (await prisma.typingSession.count({
        where: { userId, status: "completed", accuracy: { gte: 99 } },
      })) >= 5,
  },
  // Volume de versículos
  ...[10, 50, 100, 500, 1000, 3000, 5000, 10000, 15000, 20000, 25000, 30000, 31102].map((n) => ({
    code: `verses_${n}`,
    check: async (userId: string) => (await versesTyped(userId)) >= n,
  })),
  // Sequências
  ...[7, 30, 100].map((n) => ({
    code: `streak_${n}`,
    check: async (userId: string) => {
      const streak = await prisma.streak.findUnique({ where: { userId } });
      return (streak?.bestStreak ?? 0) >= n;
    },
  })),
  // Progresso por livro/testamento
  { code: "book_john", check: (userId) => bookComplete(userId, "John") },
  {
    code: "gospel_finisher",
    check: async (userId) => {
      for (const osisId of ["Matt", "Mark", "Luke", "John"]) {
        if (!(await bookComplete(userId, osisId))) return false;
      }
      return true;
    },
  },
  { code: "new_testament", check: (userId) => testamentComplete(userId, "NT") },
  { code: "old_testament", check: (userId) => testamentComplete(userId, "OT") },
  {
    code: "whole_bible",
    check: async (userId) =>
      (await testamentComplete(userId, "OT")) && (await testamentComplete(userId, "NT")),
  },
];

export interface UnlockedAchievementInfo {
  code: string;
  namePt: string;
  nameEn: string;
  iconName: string;
}

/**
 * Verifica e concede conquistas recém-merecidas.
 * Retorna as conquistas desbloqueadas agora (para exibir na tela de conclusão).
 */
export async function checkAndAwardAchievements(
  userId: string
): Promise<UnlockedAchievementInfo[]> {
  const [alreadyUnlocked, allAchievements] = await Promise.all([
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
    prisma.achievement.findMany(),
  ]);
  const unlockedIds = new Set(alreadyUnlocked.map((a) => a.achievementId));
  const byCode = new Map(allAchievements.map((a) => [a.code, a]));

  const newlyUnlocked: UnlockedAchievementInfo[] = [];

  for (const { code, check } of ACHIEVEMENT_CHECKS) {
    const achievement = byCode.get(code);
    if (!achievement || unlockedIds.has(achievement.id)) continue;
    if (!(await check(userId))) continue;

    await prisma.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    });

    // Desbloqueia tema vinculado (unlockedThemes é JSON serializado no SQLite)
    if (achievement.unlockTheme) {
      const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
      if (prefs) {
        const themes: string[] = JSON.parse(prefs.unlockedThemes);
        if (!themes.includes(achievement.unlockTheme)) {
          themes.push(achievement.unlockTheme);
          await prisma.userPreferences.update({
            where: { userId },
            data: { unlockedThemes: JSON.stringify(themes) },
          });
        }
      }
    }

    newlyUnlocked.push({
      code,
      namePt: achievement.namePt,
      nameEn: achievement.nameEn,
      iconName: achievement.iconName,
    });
  }

  return newlyUnlocked;
}
