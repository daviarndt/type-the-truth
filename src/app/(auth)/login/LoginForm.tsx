"use client";

import { useState } from "react";
import { loginAction } from "./actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="auth-form">
      {error && <div className="auth-error">{error}</div>}

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
          autoComplete="current-password"
          placeholder="••••••••"
          className="field-input"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: "center" }}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
