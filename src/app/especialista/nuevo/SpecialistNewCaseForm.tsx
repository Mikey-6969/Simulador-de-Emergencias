"use client";

import { FormEvent, useState } from "react";
import { serviceTypes } from "@/lib/labels";

export function SpecialistNewCaseForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    serviceType: serviceTypes[0],
    customerZone: "NORTE",
    priority: "MEDIA",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
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
      setError(data.error || "No se pudo guardar");
      return;
    }
    window.location.href = `/especialista/casos/${data.ticket.id}`;
  }

  return (
    <form onSubmit={onSubmit} className="mila-panel space-y-5 p-6">
      <section className="space-y-3">
        <h2 className="font-semibold">Categorización</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span>Servicio *</span>
            <select
              className="mila-select"
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
            >
              {serviceTypes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span>Sede / zona *</span>
            <select
              className="mila-select"
              value={form.customerZone}
              onChange={(e) => setForm({ ...form, customerZone: e.target.value })}
            >
              <option value="NORTE">Norte</option>
              <option value="SUR">Sur</option>
              <option value="ORIENTE">Oriente</option>
              <option value="OCCIDENTE">Occidente</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Detalles del caso</h2>
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
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Prioridad inicial</h2>
        <select
          className="mila-select max-w-xs"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        >
          <option value="BAJA">Baja</option>
          <option value="MEDIA">Media</option>
          <option value="ALTA">Alta</option>
          <option value="CRITICA">Crítica</option>
        </select>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          El agente IA puede ajustar la prioridad al analizar el caso.
        </p>
      </section>

      {error ? <p className="text-sm text-[#ffb4b4]">{error}</p> : null}
      <div className="flex gap-2">
        <button type="button" className="mila-btn mila-btn-ghost" onClick={() => history.back()}>
          Cancelar
        </button>
        <button className="mila-btn mila-btn-primary" disabled={loading}>
          {loading ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
