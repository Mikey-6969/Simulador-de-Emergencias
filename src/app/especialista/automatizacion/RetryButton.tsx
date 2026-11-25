"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RetryButton({ url, label }: { url: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(url, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "No se pudo reintentar");
      return;
    }
    router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" className="mila-btn mila-btn-ghost" disabled={busy} onClick={run}>
        {busy ? "Reintentando…" : label}
      </button>
      {msg ? <span className="text-xs text-[#ffb4b4]">{msg}</span> : null}
    </span>
  );
}
