"use client";

import { useState } from "react";

export function EscalateButton({ ticketId }: { ticketId: string }) {
  const [reason, setReason] = useState(
    "Ya intenté las recomendaciones remotas y el problema continúa.",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function escalate() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/tickets/${ticketId}/escalate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "No se pudo escalar");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-2 rounded-2xl border border-[var(--line)] p-4">
      <p className="text-sm font-medium">¿No se resolvió en remoto?</p>
      <textarea
        className="mila-textarea"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      {error ? <p className="text-sm text-[#ffb4b4]">{error}</p> : null}
      <button className="mila-btn mila-btn-accent" onClick={escalate} disabled={loading}>
        {loading ? "Escalando…" : "Escalar a visita"}
      </button>
    </div>
  );
}
