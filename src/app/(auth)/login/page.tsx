import Link from "next/link";
import { BrandMark } from "@/components/layout/Brand";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="auth-card">
      <div className="auth-brand">
        <BrandMark size={32} />
        <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-.02em", color: "hsl(var(--foreground))" }}>
          Type the Truth
        </span>
      </div>

      <div className="auth-header">
        <h1 className="auth-title">Bem-vindo de volta</h1>
        <p className="auth-sub">Continue sua jornada pelas Escrituras</p>
      </div>

      <LoginForm />

      <p className="auth-footer">
        Não tem uma conta?{" "}
        <Link href="/signup" style={{ color: "hsl(var(--primary))", fontWeight: 600 }}>
          Criar conta
        </Link>
      </p>
    </div>
  );
}
