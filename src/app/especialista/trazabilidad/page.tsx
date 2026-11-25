import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma, Zone } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { specialistNav } from "@/lib/nav";
import { zoneLabel } from "@/lib/labels";
import { addDays, formatDateTime } from "@/lib/time";

const PAGE_SIZE = 40;

const TIMELINE_TYPES: Record<string, string> = {
  CREATED: "Creación",
  ATTACHMENT: "Adjuntos",
  AI_PENDING: "IA delegada a n8n",
  AI_FALLBACK: "IA local (fallback)",
  AI_ANALYSIS: "Análisis IA",
  AI_REVIEW: "Revisión IA",
  STATUS: "Cambio de estado",
  ESCALATED: "Escalamiento",
  RECOMMENDATION: "Recomendación de técnicos",
  ASSIGNED: "Asignación",
  VISIT_SCHEDULED: "Visita programada",
  VISIT_RESCHEDULED: "Visita reprogramada",
  VISIT_CANCELLED: "Visita cancelada",
  ATTENTION_STARTED: "Atención iniciada",
  CLOSED: "Cierre",
};

type Params = Record<string, string | undefined>;

export default async function TrazabilidadPage({ searchParams }: { searchParams: Promise<Params> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["COORDINADOR", "ADMIN"].includes(session.role)) redirect("/especialista");

  const p = await searchParams;
  const page = Math.max(1, Number.parseInt(p.page ?? "1", 10) || 1);
  const type = p.type && p.type in TIMELINE_TYPES ? p.type : undefined;
  const zone = p.zone && (Object.values(Zone) as string[]).includes(p.zone) ? (p.zone as Zone) : undefined;
  const q = p.q?.trim().slice(0, 40) || undefined;
  const day = /^\d{4}-\d{2}-\d{2}$/;
  const from = p.from && day.test(p.from) ? p.from : undefined;
  const to = p.to && day.test(p.to) ? p.to : undefined;

  const where: Prisma.TimelineEventWhereInput = {};
  if (type) where.type = type;
  if (zone || q) {
    where.ticket = {
      ...(zone ? { customerZone: zone } : {}),
      ...(q ? { number: { contains: q, mode: "insensitive" } } : {}),
    };
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00-05:00`);
    if (to) where.createdAt.lt = addDays(new Date(`${to}T00:00:00-05:00`), 1);
  }

  const [total, events] = await Promise.all([
    prisma.timelineEvent.count({ where }),
    prisma.timelineEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        actor: { select: { name: true, role: true } },
        ticket: { select: { id: true, number: true, title: true, customerZone: true } },
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const link = (n: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries({ type, zone, q, from, to })) if (v) qs.set(k, v);
    qs.set("page", String(n));
    return `/especialista/trazabilidad?${qs.toString()}`;
  };

  return (
    <AppShell
      brand="Portal Especialista"
      subtitle="Trazabilidad global"
      userName={session.name}
      nav={specialistNav(session.role)}
    >
      <h1 className="mb-1 text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
        Línea de tiempo global
      </h1>
      <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>
        Todos los eventos de todos los casos, con filtros por tipo, zona, caso y fecha.
      </p>

      <form method="get" className="mila-panel mb-6 grid gap-3 p-4 md:grid-cols-3 lg:grid-cols-5">
        <label className="text-xs" style={{ color: "var(--muted)" }}>
          Caso (número)
          <input name="q" defaultValue={q} placeholder="MILA-2026-00002" className="mila-input mt-1" />
        </label>
        <label className="text-xs" style={{ color: "var(--muted)" }}>
          Tipo de evento
          <select name="type" defaultValue={type ?? ""} className="mila-select mt-1">
            <option value="">Todos</option>
            {Object.entries(TIMELINE_TYPES).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs" style={{ color: "var(--muted)" }}>
          Zona
          <select name="zone" defaultValue={zone ?? ""} className="mila-select mt-1">
            <option value="">Todas</option>
            {Object.values(Zone).map((z) => (
              <option key={z} value={z}>
                {zoneLabel[z]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs" style={{ color: "var(--muted)" }}>
          Desde
          <input type="date" name="from" defaultValue={from} className="mila-input mt-1" />
        </label>
        <label className="text-xs" style={{ color: "var(--muted)" }}>
          Hasta
          <input type="date" name="to" defaultValue={to} className="mila-input mt-1" />
        </label>
        <div className="flex gap-2 md:col-span-3 lg:col-span-5">
          <button type="submit" className="mila-btn mila-btn-accent">
            Filtrar
          </button>
          <Link href="/especialista/trazabilidad" className="mila-btn mila-btn-ghost">
            Limpiar
          </Link>
        </div>
      </form>

      <section className="mila-panel">
        <div className="border-b border-[var(--line)] px-5 py-3 text-sm" style={{ color: "var(--muted)" }}>
          {total} evento(s) · página {page} de {pages}
        </div>
        <ol className="divide-y divide-[var(--line)]">
          {events.map((e) => (
            <li key={e.id} className="px-5 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mila-chip">{TIMELINE_TYPES[e.type] ?? e.type}</span>
                  <Link
                    href={`/especialista/casos/${e.ticket.id}`}
                    className="font-semibold underline-offset-2 hover:underline"
                  >
                    {e.ticket.number}
                  </Link>
                  <span style={{ color: "var(--muted)" }}>{zoneLabel[e.ticket.customerZone]}</span>
                </div>
                <time style={{ color: "var(--muted)" }}>{formatDateTime(e.createdAt)}</time>
              </div>
              <p className="mt-1">{e.message}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {e.actor ? `${e.actor.name} (${e.actor.role})` : "Sistema / automatización"}
              </p>
            </li>
          ))}
          {events.length === 0 ? (
            <li className="p-5" style={{ color: "var(--muted)" }}>
              No hay eventos para los filtros elegidos.
            </li>
          ) : null}
        </ol>
        <div className="flex justify-between border-t border-[var(--line)] px-5 py-3">
          {page > 1 ? (
            <Link href={link(page - 1)} className="mila-btn mila-btn-ghost">
              ← Anteriores
            </Link>
          ) : (
            <span />
          )}
          {page < pages ? (
            <Link href={link(page + 1)} className="mila-btn mila-btn-ghost">
              Siguientes →
            </Link>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
