"use client";

import { useState } from "react";
import { Role, TicketStatus } from "@prisma/client";

type Assignment = {
  id: string;
  status: string;
  score: number | null;
  rationale: string | null;
  technicianProfileId: string;
  technicianName: string;
};

type Tech = {
  id: string;
  name: string;
  zones: string[];
  skills: string[];
};

const statuses: TicketStatus[] = [
  "DIAGNOSTICO_REMOTO",
  "PENDIENTE_ESCALAMIENTO",
  "ESCALADA",
  "ASIGNADA",
  "VISITA_PROGRAMADA",
  "EN_ATENCION",
  "CERRADA",
  "CANCELADA",
];

export function SpecialistActions({
  ticketId,
  status,
  role,
  assignments,
  technicians,
}: {
  ticketId: string;
  status: TicketStatus;
  role: Role;
  assignments: Assignment[];
  technicians: Tech[];
}) {
  const canManage = role === "COORDINADOR" || role === "ADMIN";
  const [reason, setReason] = useState("Diagnóstico remoto agotado; se requiere visita presencial.");
  const [selectedTech, setSelectedTech] = useState(technicians[0]?.id || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(path: string, body?: object) {
    setLoading(true);
    setMessage("");
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Error");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="mila-panel space-y-4 p-6">
      <h3 className="font-semibold">Acciones del caso</h3>

      {canManage ? (
        <>
          <label className="block space-y-1 text-sm">
            <span>Cambiar estado</span>
            <select
              className="mila-select"
              defaultValue={status}
              onChange={(e) =>
                run(`/api/tickets/${ticketId}/status`, { status: e.target.value })
              }
              disabled={loading}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2 rounded-2xl border border-[var(--line)] p-3">
            <p className="text-sm font-medium">Escalar</p>
            <textarea
              className="mila-textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <button
              className="mila-btn mila-btn-accent"
              disabled={loading}
              onClick={() => run(`/api/tickets/${ticketId}/escalate`, { reason })}
            >
              Escalar caso
            </button>
          </div>

          <div className="space-y-2 rounded-2xl border border-[var(--line)] p-3">
            <p className="text-sm font-medium">Recomendación y asignación</p>
            <button
              className="mila-btn mila-btn-ghost"
              disabled={loading}
              onClick={() => run(`/api/tickets/${ticketId}/recommend`)}
            >
              Generar recomendaciones
            </button>

            <ul className="space-y-2 text-sm">
              {assignments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-black/20 px-3 py-2"
                >
                  <div>
                    <div className="font-medium">
                      {a.technicianName} · {a.status}
                    </div>
                    <div style={{ color: "var(--muted)" }}>
                      Score {a.score ?? "-"} · {a.rationale}
                    </div>
                  </div>
                  {a.status !== "ASIGNADA" ? (
                    <button
                      className="mila-btn mila-btn-primary"
                      disabled={loading}
                      onClick={() =>
                        run(`/api/tickets/${ticketId}/assign`, {
                          technicianProfileId: a.technicianProfileId,
                        })
                      }
                    >
                      Asignar
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>

            <label className="block space-y-1 text-sm">
              <span>Asignar manualmente</span>
              <select
                className="mila-select"
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
              >
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.zones.join(", ")}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="mila-btn mila-btn-primary"
              disabled={loading || !selectedTech}
              onClick={() =>
                run(`/api/tickets/${ticketId}/assign`, {
                  technicianProfileId: selectedTech,
                })
              }
            >
              Confirmar asignación
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Vista técnico: consulta el caso asignado y su historial.
        </p>
      )}

      {message ? <p className="text-sm text-[#ffb4b4]">{message}</p> : null}
    </div>
  );
}
