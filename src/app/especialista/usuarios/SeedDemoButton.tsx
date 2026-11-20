"use client";

import { useState } from "react";

export function SeedDemoButton() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/seed-demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "No se pudo cargar el catálogo");
      return;
    }
    setMessage(`Catálogo listo: ${data.total} usuarios. Recargando…`);
    window.setTimeout(() => window.location.reload(), 700);
  }

  return (
    <div className="space-y-2">
      <button className="mila-btn mila-btn-primary" disabled={loading} onClick={run}>
        {loading ? "Cargando…" : "Cargar / actualizar catálogo demo"}
      </button>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Usa el secret del servidor <code>MILA_DEMO_PASSWORD</code>. No pide ni muestra la contraseña.
      </p>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
