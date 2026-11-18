"use client";

import { FormEvent, useState } from "react";
import { serviceTypes } from "@/lib/labels";

const zones = [
  { id: "NORTE" as const, title: "Zona Norte", desc: "Sedes y operación norte de Bogotá" },
  { id: "SUR" as const, title: "Zona Sur", desc: "Sedes y operación sur de Bogotá" },
  { id: "ORIENTE" as const, title: "Zona Oriente", desc: "Sedes y operación oriente" },
  { id: "OCCIDENTE" as const, title: "Zona Occidente", desc: "Sedes y operación occidente" },
];

export function RegisterWizard({
  defaultZone,
}: {
  defaultZone: "NORTE" | "SUR" | "ORIENTE" | "OCCIDENTE";
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    serviceType: "",
    customerZone: defaultZone,
    title: "",
    description: "",
    address: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "No se pudo crear el caso");
      return;
    }
    window.location.href = `/cliente/casos/${data.ticket.id}`;
  }

  return (
    <form onSubmit={onSubmit} className="mila-panel p-6">
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        {["Servicio", "Sede", "Detalle"].map((label, idx) => {
          const n = idx + 1;
          const active = step === n;
          return (
            <span
              key={label}
              className={`mila-chip ${active ? "border-[rgba(47,211,193,0.7)]" : ""}`}
            >
              {n}. {label}
            </span>
          );
        })}
      </div>

      {step === 1 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {serviceTypes.map((s) => (
            <button
              key={s}
              type="button"
              className={`rounded-2xl border p-4 text-left transition ${
                form.serviceType === s
                  ? "border-[rgba(47,211,193,0.7)] bg-white/5"
                  : "border-[var(--line)]"
              }`}
              onClick={() => {
                setForm({ ...form, serviceType: s });
                setStep(2);
              }}
            >
              <div className="font-semibold">{s}</div>
              <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Continuar a selección de sede
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {zones.map((z) => (
            <button
              key={z.id}
              type="button"
              className={`rounded-2xl border p-4 text-left transition ${
                form.customerZone === z.id
                  ? "border-[rgba(47,211,193,0.7)] bg-white/5"
                  : "border-[var(--line)]"
              }`}
              onClick={() => {
                setForm({ ...form, customerZone: z.id });
                setStep(3);
              }}
            >
              <div className="font-semibold">{z.title}</div>
              <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {z.desc}
              </div>
            </button>
          ))}
          <button type="button" className="mila-btn mila-btn-ghost md:col-span-2" onClick={() => setStep(1)}>
            ← Cambiar servicio
          </button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Servicio: <strong className="text-[var(--text)]">{form.serviceType}</strong> · Sede:{" "}
            <strong className="text-[var(--text)]">{form.customerZone}</strong>
          </p>
          <label className="block space-y-1 text-sm">
            <span>Asunto *</span>
            <input
              className="mila-input"
              required
              minLength={5}
              maxLength={256}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Descripción *</span>
            <textarea
              className="mila-textarea"
              required
              minLength={10}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Dirección / punto de atención</span>
            <input
              className="mila-input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
          {error ? <p className="text-sm text-[#ffb4b4]">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="mila-btn mila-btn-ghost" onClick={() => setStep(2)}>
              ← Sede
            </button>
            <button className="mila-btn mila-btn-primary" disabled={loading || !form.serviceType}>
              {loading ? "Creando y analizando con IA…" : "Guardar caso"}
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
