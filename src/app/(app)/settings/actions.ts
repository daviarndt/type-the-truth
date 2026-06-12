"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface SaveSettingsInput {
  name: string;
  preferredTranslationId: string;
  theme: string;
  dailyGoalMinutes: number;
}

export async function saveSettings(input: SaveSettingsInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Não autenticado" };

  const { name, preferredTranslationId, theme, dailyGoalMinutes } = input;

  // Só permite temas desbloqueados
  const prefs = await prisma.userPreferences.findUnique({ where: { userId: user.id } });
  const unlockedThemes: string[] = prefs
    ? JSON.parse(prefs.unlockedThemes)
    : ["dark", "light", "parchment"];
  const safeTheme = unlockedThemes.includes(theme) ? theme : prefs?.theme ?? "dark";

  await Promise.all([
    prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim() || null },
    }),
    prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: { preferredTranslationId, theme: safeTheme, dailyGoalMinutes },
      create: {
        userId: user.id,
        preferredTranslationId,
        theme: safeTheme,
        dailyGoalMinutes,
      },
    }),
  ]);

  revalidatePath("/", "layout");
  return { ok: true };
}
