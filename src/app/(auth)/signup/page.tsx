import Link from "next/link";
import { BrandMark } from "@/components/layout/Brand";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <div className="auth-card">
      <div className="auth-brand">
        <BrandMark size={32} />
        <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-.02em", color: "hsl(var(--foreground))" }}>
          Type the Truth
        </span>
      </div>

      <div className="auth-header">
        <h1 className="auth-title">Comece sua jornada</h1>
        <p className="auth-sub">Digite sua jornada pela Bíblia inteira</p>
      </div>

      <SignupForm />

      <p className="auth-footer">
        Já tem uma conta?{" "}
        <Link href="/login" style={{ color: "hsl(var(--primary))", fontWeight: 600 }}>
          Entrar
        </Link>
      </p>
    </div>
  );
}
