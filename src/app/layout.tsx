import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
