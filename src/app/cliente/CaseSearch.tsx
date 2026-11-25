"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CaseSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = q.trim();
    router.push(value ? `/cliente?q=${encodeURIComponent(value)}` : "/cliente");
  }

  return (
    <form onSubmit={onSubmit} className="mila-panel flex flex-col gap-3 p-4 md:flex-row md:items-center">
      <label className="flex-1 text-sm">
        <span className="mb-1 block" style={{ color: "var(--muted)" }}>
          ¿Quieres saber el estado de tu caso? Digita número o asunto
        </span>
        <input
          className="mila-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="MILA-2026-00001 o internet intermitente"
        />
      </label>
      <button className="mila-btn mila-btn-primary md:mt-6" type="submit">
        Buscar
      </button>
    </form>
  );
}
