import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/components/AppProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";
import "./app.css";

export const metadata: Metadata = {
  title: {
    default: "Type the Truth",
    template: "%s · Type the Truth",
  },
  description:
    "Digite sua jornada pelas Escrituras. Uma experiência de digitação focada e minimalista, capítulo a capítulo pela Bíblia inteira.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Type the Truth", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#171614",
  width: "device-width",
  initialScale: 1,
};

// Aplica tema + escala de fonte antes da primeira pintura (evita flash).
const noFlash = `(function(){try{var t=localStorage.getItem('ttt_theme')||'dark';document.documentElement.setAttribute('data-theme',t);var f=localStorage.getItem('ttt_fontScale');if(f)document.documentElement.style.setProperty('--font-scale',f);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
