import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import "./globals.css";
import "./app.css";

export const metadata: Metadata = {
  title: {
    default: "Type the Truth",
    template: "%s · Type the Truth",
  },
  description:
    "Digite sua jornada pelas Escrituras. Uma experiência de digitação focada e minimalista, capítulo a capítulo pela Bíblia inteira.",
  openGraph: {
    title: "Type the Truth",
    description: "Sua jornada pelas Escrituras — um capítulo de cada vez.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // O tema do usuário é aplicado no <html> — única fonte de verdade.
  // (Os valores "light" vivem no :root; os demais temas em [data-theme="..."].)
  let theme = "dark";
  const user = await getCurrentUser();
  if (user) {
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
      select: { theme: true },
    });
    if (prefs) theme = prefs.theme;
  }

  return (
    <html lang="pt-BR" data-theme={theme}>
      <body>{children}</body>
    </html>
  );
}
