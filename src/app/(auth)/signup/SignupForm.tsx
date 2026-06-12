"use client";

import { useState } from "react";
import { signupAction } from "./actions";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signupAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="auth-form">
      {error && <div className="auth-error">{error}</div>}

      <div className="field-group">
        <label className="field-label" htmlFor="name">Nome</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Seu nome"
          className="field-input"
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          className="field-input"
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          className="field-input"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: "center" }}>
        {loading ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
