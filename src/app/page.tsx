import Link from "next/link";
import { BrandMark } from "@/components/layout/Brand";

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="brand-row">
          <BrandMark size={36} />
          <span className="brand-name">Type the Truth</span>
        </div>
        <div className="nav-actions">
          <Link href="/login" className="btn-ghost">Entrar</Link>
          <Link href="/signup" className="btn-primary">Começar grátis</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="hero">
        <div className="pill">Bíblia completa · 31.105 versículos</div>

        <h1 className="hero-title">
          Digite sua jornada
          <br />
          <span>pelas Escrituras</span>
        </h1>

        <p className="hero-desc">
          Uma experiência de digitação focada, minimalista e reverente.
          Avance capítulo a capítulo pela Bíblia inteira — no seu ritmo, um dia de cada vez.
        </p>

        <div className="cta-row">
          <Link href="/signup" className="btn-primary">Começar minha jornada →</Link>
          <Link href="/login" className="btn-outline">Já tenho uma conta</Link>
        </div>

        {/* Preview */}
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
            "Feedback em tempo real",
            "Progresso capítulo a capítulo",
            "Retome de onde parou",
            "Sequências e conquistas",
            "Planos de leitura",
            "Funciona offline-first",
          ].map((f) => (
            <span key={f} className="feature-pill">{f}</span>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        © {new Date().getFullYear()} Type the Truth · Sua jornada pelas Escrituras
      </footer>
    </div>
  );
}
