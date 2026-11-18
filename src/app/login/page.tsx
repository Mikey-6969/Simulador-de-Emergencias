"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("coord@mila.app");
  const [password, setPassword] = useState("Mila123*");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "No se pudo iniciar sesión");
      return;
    }
    window.location.href = data.redirectTo;
  }

  return (
    <main className="mila-shell grid min-h-screen place-items-center py-10">
      <form onSubmit={onSubmit} className="mila-panel w-full max-w-md space-y-4 p-8 fade-up">
        <div>
          <p className="text-xs uppercase tracking-[0.25em]" style={{ color: "var(--brand)" }}>
            MILA
          </p>
          <h1 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
            Ingresar
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Usa las cuentas demo o tu registro.
          </p>
        </div>

        <label className="block space-y-1 text-sm">
          <span>Correo</span>
          <input className="mila-input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Contraseña</span>
          <input
            type="password"
            className="mila-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error ? <p className="text-sm text-[#ffb4b4]">{error}</p> : null}

        <button className="mila-btn mila-btn-primary w-full" disabled={loading}>
          {loading ? "Validando…" : "Entrar"}
        </button>

        <p className="text-sm" style={{ color: "var(--muted)" }}>
          ¿Nuevo? <Link href="/registro">Crear cuenta</Link>
        </p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Demo: cliente@mila.app · coord@mila.app · tecnico.norte@mila.app · admin@mila.app /
          Mila123*
        </p>
      </form>
    </main>
  );
}
