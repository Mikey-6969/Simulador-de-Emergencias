"use client";

import { FormEvent, useState } from "react";

export function NewTechnicianForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    zones: ["NORTE"],
    skills: "general, redes",
    capacityPerDay: 4,
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/technicians", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Error al crear");
      return;
    }
    window.location.reload();
  }

  function toggleZone(zone: string) {
    setForm((prev) => ({
      ...prev,
      zones: prev.zones.includes(zone)
        ? prev.zones.filter((z) => z !== zone)
        : [...prev.zones, zone],
    }));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        className="mila-input"
        placeholder="Nombre"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        className="mila-input"
        placeholder="Correo"
        type="email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        className="mila-input"
        placeholder="Contraseña temporal (mín. 10)"
        type="password"
        required
        minLength={10}
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <div className="flex flex-wrap gap-2 text-sm">
        {["NORTE", "SUR", "ORIENTE", "OCCIDENTE"].map((z) => (
          <button
            key={z}
            type="button"
            className={`mila-chip ${form.zones.includes(z) ? "border-[rgba(47,211,193,0.6)]" : ""}`}
            onClick={() => toggleZone(z)}
          >
            {z}
          </button>
        ))}
      </div>
      <input
        className="mila-input"
        placeholder="Skills separadas por coma"
        value={form.skills}
        onChange={(e) => setForm({ ...form, skills: e.target.value })}
      />
      <input
        className="mila-input"
        type="number"
        min={1}
        max={12}
        value={form.capacityPerDay}
        onChange={(e) => setForm({ ...form, capacityPerDay: Number(e.target.value) })}
      />
      {error ? <p className="text-sm text-[#ffb4b4]">{error}</p> : null}
      <button className="mila-btn mila-btn-primary" disabled={loading}>
        {loading ? "Guardando…" : "Registrar técnico"}
      </button>
    </form>
  );
}
