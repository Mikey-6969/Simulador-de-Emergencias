"use client";

import { FormEvent, useState } from "react";
import { serviceTypes } from "@/lib/labels";

const zones = [
  { id: "NORTE" as const, title: "Zona Norte", desc: "Sedes y operación norte de Bogotá" },
  { id: "SUR" as const, title: "Zona Sur", desc: "Sedes y operación sur de Bogotá" },
  { id: "ORIENTE" as const, title: "Zona Oriente", desc: "Sedes y operación oriente" },
  { id: "OCCIDENTE" as const, title: "Zona Occidente", desc: "Sedes y operación occidente" },
];

type ImageItem = { fileName: string; dataUrl: string };

export function RegisterWizard({
  defaultZone,
}: {
  defaultZone: "NORTE" | "SUR" | "ORIENTE" | "OCCIDENTE";
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resolved, setResolved] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [steps, setSteps] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [form, setForm] = useState({
    serviceType: "",
    customerZone: defaultZone,
    title: "",
    description: "",
    priority: "MEDIA" as "BAJA" | "MEDIA" | "ALTA" | "CRITICA",
  });

  async function loadDiagnosis() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/tickets/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        serviceType: form.serviceType,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "No se pudo generar el diagnóstico");
      return false;
    }
    setSteps(data.steps || []);
    setSummary(data.problemSummary || "");
    if (data.suggestedPriority) {
      setForm((prev) => ({ ...prev, priority: data.suggestedPriority }));
    }
    setAttempts(0);
    setResolved(false);
    return true;
  }

  async function onDetailContinue(e: FormEvent) {
    e.preventDefault();
    const ok = await loadDiagnosis();
    if (ok) setStep(4);
  }

  async function createCase() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        remoteAttempts: attempts,
        diagnosisSteps: steps,
        images,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "No se pudo crear el caso");
      return;
    }
    window.location.href = `/cliente/casos/${data.ticket.id}`;
  }

  async function onPickImages(files: FileList | null) {
    if (!files?.length) return;
    const next = [...images];
    for (const file of Array.from(files).slice(0, 4 - next.length)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 2_000_000) continue;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      next.push({ fileName: file.name, dataUrl });
    }
    setImages(next.slice(0, 4));
  }

  const stepLabels = ["Servicio", "Sede", "Detalle", "Diagnóstico"];

  if (resolved) {
    return (
      <div className="mila-panel space-y-4 p-6">
        <h2 className="text-xl font-semibold">¡Buenas noticias!</h2>
        <p style={{ color: "var(--muted)" }}>
          Resolviste el inconveniente con el diagnóstico remoto. No fue necesario crear un caso.
        </p>
        <a href="/cliente" className="mila-btn mila-btn-primary inline-flex">
          Volver al inicio
        </a>
      </div>
    );
  }

  return (
    <div className="mila-panel p-6">
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        {stepLabels.map((label, idx) => {
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
        <form onSubmit={onDetailContinue} className="space-y-3">
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
            <span>Prioridad *</span>
            <select
              className="mila-select"
              value={form.priority}
              onChange={(e) =>
                setForm({
                  ...form,
                  priority: e.target.value as "BAJA" | "MEDIA" | "ALTA" | "CRITICA",
                })
              }
            >
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="CRITICA">Crítica</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span>Imágenes de evidencia (máx. 4)</span>
            <input
              className="mila-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onPickImages(e.target.files)}
            />
          </label>
          {images.length ? (
            <div className="flex flex-wrap gap-2">
              {images.map((img) => (
                <div key={img.fileName + img.dataUrl.slice(0, 32)} className="relative h-20 w-20 overflow-hidden rounded-xl border border-[var(--line)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.dataUrl} alt={img.fileName} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
          {error ? <p className="text-sm text-[#ffb4b4]">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="mila-btn mila-btn-ghost" onClick={() => setStep(2)}>
              ← Sede
            </button>
            <button className="mila-btn mila-btn-primary" disabled={loading}>
              {loading ? "Analizando…" : "Ver recomendaciones"}
            </button>
          </div>
        </form>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Diagnóstico remoto</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {summary || "Prueba estas acciones antes de abrir un caso."}
            </p>
            <p className="mt-2 text-sm">
              Intentos fallidos: <strong>{attempts}/4</strong>
            </p>
          </div>
          <ol className="space-y-3">
            {steps.map((item, idx) => (
              <li
                key={item}
                className={`rounded-2xl border p-4 ${
                  idx < attempts
                    ? "border-[rgba(255,107,107,0.35)] opacity-70"
                    : idx === attempts
                      ? "border-[rgba(47,211,193,0.7)] bg-white/5"
                      : "border-[var(--line)]"
                }`}
              >
                <div className="text-xs uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                  Intento {idx + 1}
                </div>
                <div className="mt-1">{item}</div>
              </li>
            ))}
          </ol>
          {error ? <p className="text-sm text-[#ffb4b4]">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="mila-btn mila-btn-ghost" onClick={() => setStep(3)}>
              ← Detalle
            </button>
            <button
              type="button"
              className="mila-btn mila-btn-accent"
              onClick={() => setResolved(true)}
            >
              Se resolvió
            </button>
            {attempts < 4 ? (
              <button
                type="button"
                className="mila-btn mila-btn-primary"
                onClick={() => setAttempts((n) => Math.min(4, n + 1))}
              >
                Lo intenté y no se resolvió
              </button>
            ) : (
              <button
                type="button"
                className="mila-btn mila-btn-primary"
                disabled={loading}
                onClick={createCase}
              >
                {loading ? "Creando caso…" : "Crear caso"}
              </button>
            )}
          </div>
          {attempts >= 4 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Completaste los 4 intentos remotos. Ahora puedes registrar el caso con la evidencia.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
