"use client";

import Link from "next/link";
import { BrandMark } from "@/components/layout/Brand";
import { useApp } from "@/components/AppProvider";

export default function LandingPage() {
  const { t } = useApp();

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="brand-row">
          <BrandMark size={36} />
          <span className="brand-name">Type the Truth</span>
        </div>
        <div className="nav-actions">
          <Link href="/dashboard" className="btn-primary">{t("landing.cta")}</Link>
        </div>
      </nav>

      <main className="hero">
        <div className="pill">{t("landing.pill")}</div>

        <h1 className="hero-title">
          {t("landing.title1")}
          <br />
          <span>{t("landing.title2")}</span>
        </h1>

        <p className="hero-desc">{t("landing.desc")}</p>

        <div className="cta-row">
          <Link href="/dashboard" className="btn-primary">{t("landing.cta")}</Link>
        </div>
        <p style={{ fontSize: ".8rem", color: "hsl(var(--muted-foreground))" }}>{t("landing.privacy")}</p>

        <div className="mockup">
          <div className="mockup-bar">
            <span className="mockup-dot" style={{ background: "#f87171" }} />
            <span className="mockup-dot" style={{ background: "#e0b657" }} />
            <span className="mockup-dot" style={{ background: "#4ade80" }} />
            <span className="mockup-title">Gênesis 1</span>
          </div>
          <div className="mockup-text">
            <span className="done">[1] No princípio Deus criou os céus e a terra.</span>
            <span className="caret" />
            {" [2] Era a terra sem forma e vazia..."}
          </div>
        </div>

        <div className="feature-pills">
          {[
            t("landing.feat.realtime"),
            t("landing.feat.progress"),
            t("landing.feat.resume"),
            t("landing.feat.streak"),
            t("landing.feat.plans"),
            t("landing.feat.offline"),
          ].map((f) => (
            <span key={f} className="feature-pill">{f}</span>
          ))}
        </div>
      </main>

      <footer className="landing-footer">
        © {new Date().getFullYear()} Type the Truth · {t("brand.tagline")}
      </footer>
    </div>
  );
}
