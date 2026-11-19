"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  title: string;
  body: string;
  ticketId: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.notifications || []);
    setUnread(data.unread || 0);
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 45_000);
    return () => window.clearInterval(id);
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    await load();
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="mila-btn mila-btn-ghost relative"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
      >
        Avisos
        {unread > 0 ? (
          <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 text-[11px] font-semibold text-black">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Notificaciones</span>
            <button type="button" className="text-xs" style={{ color: "var(--muted)" }} onClick={markAll}>
              Marcar leídas
            </button>
          </div>
          <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
            {items.length === 0 ? (
              <li style={{ color: "var(--muted)" }}>Sin avisos todavía.</li>
            ) : (
              items.map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl px-2 py-2"
                  style={{ background: n.readAt ? "transparent" : "rgba(255,255,255,0.04)" }}
                >
                  <div className="font-medium">{n.title}</div>
                  <div style={{ color: "var(--muted)" }}>{n.body}</div>
                  {n.ticketId ? (
                    <Link
                      href={`/especialista/casos/${n.ticketId}`}
                      className="mt-1 inline-block text-xs"
                      style={{ color: "var(--brand)" }}
                      onClick={() => setOpen(false)}
                    >
                      Ver caso
                    </Link>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
