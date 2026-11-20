"use client";

import { FormEvent, useState } from "react";
import { serviceTypes } from "@/lib/labels";

export function NewTicketForm({
  defaultZone,
}: {
  defaultZone: "NORTE" | "SUR" | "ORIENTE" | "OCCIDENTE";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    serviceType: serviceTypes[0],
    customerZone: defaultZone,
    address: "",
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
      setError(data.error || "No se pudo crear");
      return;
    }
    window.location.href = `/cliente/casos/${data.ticket.id}`;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block space-y-1 text-sm">
        <span>Título</span>
        <input
          className="mila-input"
          required
          minLength={5}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Descripción</span>
        <textarea
          className="mila-textarea"
          required
          minLength={10}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>Servicio</span>
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
          <span>Zona</span>
          <select
            className="mila-select"
            value={form.customerZone}
            onChange={(e) =>
              setForm({
                ...form,
                customerZone: e.target.value as typeof form.customerZone,
              })
            }
          >
            <option value="NORTE">Norte</option>
            <option value="SUR">Sur</option>
            <option value="ORIENTE">Oriente</option>
            <option value="OCCIDENTE">Occidente</option>
          </select>
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span>Dirección (opcional)</span>
        <input
          className="mila-input"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </label>
      {error ? <p className="text-sm text-[#ffb4b4]">{error}</p> : null}
      <button className="mila-btn mila-btn-primary" disabled={loading}>
        {loading ? "Analizando con IA…" : "Crear solicitud"}
      </button>
    </form>
  );
}
