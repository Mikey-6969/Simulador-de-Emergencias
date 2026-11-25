import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { specialistNav } from "@/lib/nav";
import { addDays, startOfBogotaWeek } from "@/lib/time";

const DAY_FMT = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  timeZone: "America/Bogota",
});
const HOUR_FMT = new Intl.DateTimeFormat("es-CO", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

function parseWeek(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T12:00:00-05:00`);
    if (!Number.isNaN(d.getTime())) return startOfBogotaWeek(d);
  }
  return startOfBogotaWeek(new Date());
}

function isoDay(d: Date) {
  return new Date(d.getTime() - 5 * 3_600_000).toISOString().slice(0, 10);
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "CLIENTE") redirect("/cliente");

  const { semana } = await searchParams;
  const weekStart = parseWeek(semana);
  const weekEnd = addDays(weekStart, 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const isTech = session.role === "TECNICO";
  const profiles = await prisma.technicianProfile.findMany({
    where: isTech ? { userId: session.id } : {},
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });
  const visits = await prisma.visit.findMany({
    where: {
      technicianProfileId: { in: profiles.map((p) => p.id) },
      scheduledAt: { gte: weekStart, lt: weekEnd },
      status: { not: "CANCELADA" },
    },
    include: { ticket: { select: { id: true, number: true, title: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  const prev = isoDay(addDays(weekStart, -7));
  const next = isoDay(addDays(weekStart, 7));
  const total = visits.length;

  return (
    <AppShell
      brand="Portal Especialista"
      subtitle="Agenda de visitas"
      userName={session.name}
      nav={specialistNav(session.role)}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
            Agenda semanal
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {DAY_FMT.format(weekStart)} – {DAY_FMT.format(addDays(weekStart, 6))} · {total} visita(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/especialista/agenda?semana=${prev}`} className="mila-btn mila-btn-ghost">
            ← Anterior
          </Link>
          <Link href="/especialista/agenda" className="mila-btn mila-btn-ghost">
            Hoy
          </Link>
          <Link href={`/especialista/agenda?semana=${next}`} className="mila-btn mila-btn-ghost">
            Siguiente →
          </Link>
        </div>
      </div>

      <section className="mila-panel overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>
              <th className="px-4 py-3">Técnico</th>
              {days.map((d) => (
                <th key={d.toISOString()} className="px-3 py-3">
                  {DAY_FMT.format(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td className="p-5" colSpan={8} style={{ color: "var(--muted)" }}>
                  No hay técnicos registrados.
                </td>
              </tr>
            ) : (
              profiles.map((p) => (
                <tr key={p.id} className="border-b border-[var(--line)] align-top">
                  <td className="px-4 py-3 font-medium">
                    {p.user.name}
                    <div className="text-xs font-normal" style={{ color: "var(--muted)" }}>
                      Cap. {p.capacityPerDay}/día
                    </div>
                  </td>
                  {days.map((d) => {
                    const end = addDays(d, 1);
                    const cell = visits.filter(
                      (v) =>
                        v.technicianProfileId === p.id && v.scheduledAt >= d && v.scheduledAt < end,
                    );
                    return (
                      <td key={d.toISOString()} className="px-2 py-2">
                        <div className="space-y-1">
                          {cell.map((v) => (
                            <Link
                              key={v.id}
                              href={`/especialista/casos/${v.ticket.id}`}
                              className="block rounded-lg border border-[var(--line)] bg-black/20 px-2 py-1 text-xs hover:bg-white/5"
                            >
                              <strong>{HOUR_FMT.format(v.scheduledAt)}</strong> · {v.ticket.number}
                              <div style={{ color: "var(--muted)" }}>{v.status}</div>
                            </Link>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
