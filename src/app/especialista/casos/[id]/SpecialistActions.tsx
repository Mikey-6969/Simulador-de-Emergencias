"use client";

import { useMemo, useState } from "react";
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

type Visit = {
  id: string;
  scheduledAt: string;
  status: string;
  address: string | null;
  notes: string | null;
  technicianName: string;
};

type AiAnalysis = {
  id: string;
  decision: string;
  suggestedPriority: string | null;
  confidence: number;
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

function defaultVisitLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SpecialistActions({
  ticketId,
  status,
  role,
  assignments,
  technicians,
  visits,
  assignedProfileId,
  latestAi,
}: {
  ticketId: string;
  status: TicketStatus;
  role: Role;
  assignments: Assignment[];
  technicians: Tech[];
  visits: Visit[];
  assignedProfileId: string | null;
  latestAi: AiAnalysis | null;
}) {
  const canManage = role === "COORDINADOR" || role === "ADMIN";
  const isTech = role === "TECNICO" || role === "ADMIN";
  const [reason, setReason] = useState(
    "Diagnóstico remoto agotado; se requiere visita presencial.",
  );
  const [selectedTech, setSelectedTech] = useState(technicians[0]?.id || "");
  const [visitTech, setVisitTech] = useState(assignedProfileId || technicians[0]?.id || "");
  const [visitAt, setVisitAt] = useState(defaultVisitLocal());
  const [visitAddress, setVisitAddress] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [aiNotes, setAiNotes] = useState("");
  const [outcome, setOutcome] = useState("RESUELTO");
  const [activities, setActivities] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [solution, setSolution] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const assignedRec = useMemo(
    () => assignments.find((a) => a.status === "ASIGNADA") || null,
    [assignments],
  );

  async function run(path: string, body?: object) {
    setLoading(true);
    setMessage("");
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
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

          {latestAi ? (
            <div className="space-y-2 rounded-2xl border border-[var(--line)] p-3">
              <p className="text-sm font-medium">Revisión del análisis IA</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Decisión actual: {latestAi.decision} · confianza{" "}
                {(latestAi.confidence * 100).toFixed(0)}%
                {latestAi.suggestedPriority
                  ? ` · prioridad sugerida ${latestAi.suggestedPriority}`
                  : ""}
              </p>
              <textarea
                className="mila-textarea"
                placeholder="Notas del revisor (opcional)"
                value={aiNotes}
                onChange={(e) => setAiNotes(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  className="mila-btn mila-btn-primary"
                  disabled={loading}
                  onClick={() =>
                    run(`/api/ai/${latestAi.id}/review`, {
                      decision: "ACEPTADO",
                      notes: aiNotes || undefined,
                      applyPriority: true,
                    })
                  }
                >
                  Aceptar
                </button>
                <button
                  className="mila-btn mila-btn-ghost"
                  disabled={loading}
                  onClick={() =>
                    run(`/api/ai/${latestAi.id}/review`, {
                      decision: "MODIFICADO",
                      notes: aiNotes || "Ajuste manual del coordinador",
                    })
                  }
                >
                  Modificar
                </button>
                <button
                  className="mila-btn mila-btn-accent"
                  disabled={loading}
                  onClick={() =>
                    run(`/api/ai/${latestAi.id}/review`, {
                      decision: "RECHAZADO",
                      notes: aiNotes || "Análisis rechazado",
                    })
                  }
                >
                  Rechazar
                </button>
              </div>
            </div>
          ) : null}

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

          <div className="space-y-2 rounded-2xl border border-[var(--line)] p-3">
            <p className="text-sm font-medium">Programar visita (PB-017)</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Evita solapes y respeta capacidad diaria del técnico asignado.
              {assignedRec ? ` Asignado: ${assignedRec.technicianName}.` : " Primero asigna un técnico."}
            </p>
            <label className="block space-y-1 text-sm">
              <span>Fecha y hora</span>
              <input
                type="datetime-local"
                className="mila-input"
                value={visitAt}
                onChange={(e) => setVisitAt(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Técnico</span>
              <select
                className="mila-select"
                value={visitTech}
                onChange={(e) => setVisitTech(e.target.value)}
              >
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <input
              className="mila-input"
              placeholder="Dirección / sede (opcional)"
              value={visitAddress}
              onChange={(e) => setVisitAddress(e.target.value)}
            />
            <textarea
              className="mila-textarea"
              placeholder="Notas para el técnico"
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
            />
            <button
              className="mila-btn mila-btn-primary"
              disabled={loading || !visitTech || !visitAt}
              onClick={() =>
                run(`/api/tickets/${ticketId}/visits`, {
                  technicianProfileId: visitTech,
                  scheduledAt: new Date(visitAt).toISOString(),
                  address: visitAddress || undefined,
                  notes: visitNotes || undefined,
                })
              }
            >
              Confirmar visita
            </button>
          </div>
        </>
      ) : null}

      {isTech && !canManage ? (
        <div className="space-y-3 rounded-2xl border border-[var(--line)] p-3">
          <p className="text-sm font-medium">Atención en campo</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Consulta antecedentes arriba, inicia atención y registra el cierre (PB-018…020).
          </p>
          {["ASIGNADA", "VISITA_PROGRAMADA"].includes(status) ? (
            <button
              className="mila-btn mila-btn-primary"
              disabled={loading}
              onClick={() => run(`/api/tickets/${ticketId}/attention`)}
            >
              Iniciar atención
            </button>
          ) : null}

          {["ASIGNADA", "VISITA_PROGRAMADA", "EN_ATENCION"].includes(status) ? (
            <div className="space-y-2">
              <label className="block space-y-1 text-sm">
                <span>Resultado</span>
                <select
                  className="mila-select"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                >
                  <option value="RESUELTO">Resuelto</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="NUEVA_VISITA">Requiere nueva visita</option>
                  <option value="ESCALADO">Requiere escalamiento</option>
                </select>
              </label>
              <textarea
                className="mila-textarea"
                placeholder="Actividades realizadas"
                value={activities}
                onChange={(e) => setActivities(e.target.value)}
              />
              <textarea
                className="mila-textarea"
                placeholder="Diagnóstico en campo"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
              <textarea
                className="mila-textarea"
                placeholder="Solución aplicada"
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
              />
              <button
                className="mila-btn mila-btn-accent"
                disabled={loading}
                onClick={() =>
                  run(`/api/tickets/${ticketId}/close`, {
                    outcome,
                    activities,
                    diagnosis,
                    solution,
                  })
                }
              >
                Registrar cierre
              </button>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Este caso ya no admite acciones de campo ({status}).
            </p>
          )}
        </div>
      ) : null}

      {visits.length ? (
        <div className="space-y-2 rounded-2xl border border-[var(--line)] p-3">
          <p className="text-sm font-medium">Visitas</p>
          <ul className="space-y-2 text-sm">
            {visits.map((v) => (
              <li key={v.id} className="rounded-xl bg-black/20 px-3 py-2">
                <div className="font-medium">
                  {new Date(v.scheduledAt).toLocaleString("es-CO")} · {v.status}
                </div>
                <div style={{ color: "var(--muted)" }}>
                  {v.technicianName}
                  {v.address ? ` · ${v.address}` : ""}
                  {v.notes ? ` · ${v.notes}` : ""}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {message ? <p className="text-sm text-[#ffb4b4]">{message}</p> : null}
    </div>
  );
}
