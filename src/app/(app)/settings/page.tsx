import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [prefs, translations] = await Promise.all([
    prisma.userPreferences.findUnique({ where: { userId: user.id } }),
    prisma.translation.findMany({ orderBy: { name: "asc" } }),
  ]);

  const unlockedThemes: string[] = prefs ? JSON.parse(prefs.unlockedThemes) : ["dark", "light"];

  return (
    <SettingsClient
      email={user.email}
      displayName={user.name ?? ""}
      currentPrefs={{
        preferredTranslationId: prefs?.preferredTranslationId ?? "NVI",
        theme: prefs?.theme ?? "dark",
        dailyGoalMinutes: prefs?.dailyGoalMinutes ?? 10,
      }}
      unlockedThemes={unlockedThemes}
      translations={translations.map((t) => ({ id: t.id, name: t.name, language: t.language }))}
    />
  );
}
