"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión");
        return;
      }
      window.location.href = data.redirectTo;
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mila-shell grid min-h-screen place-items-center py-10">
      <form onSubmit={onSubmit} className="mila-panel w-full max-w-md space-y-4 p-8 fade-up">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em]" style={{ color: "var(--brand)" }}>
              MILA
            </p>
            <h1 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
              Ingresar
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              Acceso con las cuentas provisionadas por zona.
            </p>
          </div>
          <Link href="/" className="mila-btn mila-btn-ghost shrink-0">
            ← Inicio
          </Link>
        </div>

        <label className="block space-y-1 text-sm">
          <span>Correo</span>
          <input
            className="mila-input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Contraseña</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="mila-input pr-12"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 opacity-80 transition hover:opacity-100"
              style={{ color: "var(--muted)" }}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        {error ? <p className="text-sm text-[#ffb4b4]">{error}</p> : null}

        <button className="mila-btn mila-btn-primary w-full" disabled={loading}>
          {loading ? "Validando…" : "Entrar"}
        </button>

        <Link href="/" className="mila-btn mila-btn-ghost w-full text-center">
          Volver a la pantalla principal
        </Link>
      </form>
    </main>
  );
}
