"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CLIENTE",
    zone: "NORTE",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "No se pudo registrar");
      return;
    }
    window.location.href = data.redirectTo;
  }

  return (
    <main className="mila-shell grid min-h-screen place-items-center py-10">
      <form onSubmit={onSubmit} className="mila-panel w-full max-w-lg space-y-4 p-8 fade-up">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
          Crear cuenta MILA
        </h1>
        <label className="block space-y-1 text-sm">
          <span>Nombre</span>
          <input
            className="mila-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Correo</span>
          <input
            type="email"
            className="mila-input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Contraseña</span>
          <input
            type="password"
            className="mila-input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span>Rol</span>
            <select
              className="mila-select"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="CLIENTE">Cliente</option>
              <option value="TECNICO">Técnico</option>
              <option value="COORDINADOR">Coordinador</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span>Zona</span>
            <select
              className="mila-select"
              value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
            >
              <option value="NORTE">Norte</option>
              <option value="SUR">Sur</option>
              <option value="ORIENTE">Oriente</option>
              <option value="OCCIDENTE">Occidente</option>
            </select>
          </label>
        </div>
        {error ? <p className="text-sm text-[#ffb4b4]">{error}</p> : null}
        <button className="mila-btn mila-btn-primary w-full" disabled={loading}>
          {loading ? "Creando…" : "Registrarme"}
        </button>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          ¿Ya tienes cuenta? <Link href="/login">Ingresar</Link>
        </p>
      </form>
    </main>
  );
}
