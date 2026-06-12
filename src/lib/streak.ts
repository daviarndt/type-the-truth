import { prisma } from "./prisma";
import { isToday, isYesterday } from "./utils";

/**
 * Atualiza a sequência diária após uma sessão concluída.
 * Regras (doc de produto):
 *  - 1+ sessão por dia mantém a sequência
 *  - Pular um dia zera, MAS quem tem 7+ dias ganha 1 dia de graça
 *    (usado silenciosamente, 1x a cada 30 dias)
 *  - A melhor sequência é sempre preservada
 */
export async function updateStreak(userId: string) {
  const existing = await prisma.streak.findUnique({ where: { userId } });
  const now = new Date();

  if (!existing) {
    return prisma.streak.create({
      data: { userId, currentStreak: 1, bestStreak: 1, lastActivityDate: now },
    });
  }

  const last = existing.lastActivityDate;

  // Já digitou hoje — nada muda
  if (last && isToday(last)) return existing;

  // Digitou ontem — estende a sequência
  if (last && isYesterday(last)) {
    const newStreak = existing.currentStreak + 1;
    return prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        bestStreak: Math.max(newStreak, existing.bestStreak),
        lastActivityDate: now,
      },
    });
  }

  // Perdeu um ou mais dias — verifica o dia de graça
  const graceAvailable =
    !existing.graceUsed ||
    (existing.graceResetAt !== null && existing.graceResetAt < now);

  if (graceAvailable && existing.currentStreak >= 7 && last) {
    const dayBeforeYesterday = new Date();
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    const missedOnlyOneDay =
      last.getFullYear() === dayBeforeYesterday.getFullYear() &&
      last.getMonth() === dayBeforeYesterday.getMonth() &&
      last.getDate() === dayBeforeYesterday.getDate();

    if (missedOnlyOneDay) {
      const newStreak = existing.currentStreak + 1;
      return prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          bestStreak: Math.max(newStreak, existing.bestStreak),
          lastActivityDate: now,
          graceUsed: true,
          graceResetAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // Recomeça em 1 (a melhor sequência fica registrada)
  return prisma.streak.update({
    where: { userId },
    data: { currentStreak: 1, lastActivityDate: now },
  });
}
