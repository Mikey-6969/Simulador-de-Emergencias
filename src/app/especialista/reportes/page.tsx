import Link from "next/link";
import { redirect } from "next/navigation";
import { Priority, TicketStatus, Zone } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { PriorityChip, StatusChip } from "@/components/StatusChip";
import { specialistNav } from "@/lib/nav";
import { priorityLabel, serviceTypes, statusLabel, zoneLabel } from "@/lib/labels";
import { formatMinutes } from "@/lib/metrics";
import { loadReport } from "@/lib/report-data";
import { countBy, parseReportFilters } from "@/lib/reports";
import { formatDateTime } from "@/lib/time";

type Params = Record<string, string | undefined>;

export default async function ReportesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["COORDINADOR", "ADMIN"].includes(session.role)) redirect("/especialista");

  const params = await searchParams;
  const filters = parseReportFilters(params);
  const report = await loadReport(filters);
  const { rows, summary } = report;

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v);
  const csvHref = `/api/reports/tickets?${qs.toString()}${qs.size ? "&" : ""}format=csv`;

  const byStatus = countBy(rows, (r) => r.ticket.status);
  const byZone = countBy(rows, (r) => r.ticket.customerZone);

  return (
    <AppShell
      brand="Portal Especialista"
      subtitle="Reportes y métricas"
      userName={session.name}
      nav={specialistNav(session.role)}
      actions={
        <a href={csvHref} className="mila-btn mila-btn-primary">
          Exportar CSV
        </a>
      }
    >
      <h1 className="mb-1 text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
        Reportes
      </h1>
      <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>
        Solicitudes por periodo, estado y zona, con tiempos de atención (hora de Bogotá).
      </p>

      <form method="get" className="mila-panel mb-6 grid gap-3 p-4 md:grid-cols-3 lg:grid-cols-6">
        <label className="text-xs" style={{ color: "var(--muted)" }}>
          Desde
          <input type="date" name="from" defaultValue={filters.from} className="mila-input mt-1" />
        </label>
        <label className="text-xs" style={{ color: "var(--muted)" }}>
          Hasta
          <input type="date" name="to" defaultValue={filters.to} className="mila-input mt-1" />
        </label>
        <label className="text-xs" style={{ color: "var(--muted)" }}>
          Estado
          <select name="status" defaultValue={filters.status ?? ""} className="mila-select mt-1">
            <option value="">Todos</option>
            {Object.values(TicketStatus).map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs" style={{ color: "var(--muted)" }}>
          Zona
          <select name="zone" defaultValue={filters.zone ?? ""} className="mila-select mt-1">
            <option value="">Todas</option>
            {Object.values(Zone).map((z) => (
              <option key={z} value={z}>
                {zoneLabel[z]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs" style={{ color: "var(--muted)" }}>
          Prioridad
          <select name="priority" defaultValue={filters.priority ?? ""} className="mila-select mt-1">
            <option value="">Todas</option>
            {Object.values(Priority).map((p) => (
              <option key={p} value={p}>
                {priorityLabel[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs" style={{ color: "var(--muted)" }}>
          Servicio
          <select name="service" defaultValue={filters.service ?? ""} className="mila-select mt-1">
            <option value="">Todos</option>
            {serviceTypes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2 md:col-span-3 lg:col-span-6">
          <button type="submit" className="mila-btn mila-btn-accent">
            Aplicar filtros
          </button>
          <Link href="/especialista/reportes" className="mila-btn mila-btn-ghost">
            Limpiar
          </Link>
        </div>
      </form>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="metrics">
        <Kpi label="Solicitudes" value={String(summary.count)} />
        <Kpi label="Tiempo a primera atención (prom.)" value={formatMinutes(summary.avgFirstAttentionMin)} />
        <Kpi label="Tiempo a asignación (prom.)" value={formatMinutes(summary.avgAssignmentMin)} />
        <Kpi
          label="Tiempo de resolución (prom. / mediana)"
          value={`${formatMinutes(summary.avgResolutionMin)} / ${formatMinutes(summary.medianResolutionMin)}`}
        />
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="mila-panel p-4">
          <div className="mb-3 font-semibold">Por estado</div>
          <ul className="space-y-1 text-sm">
            {[...byStatus.entries()].map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{statusLabel[k as TicketStatus]}</span>
                <strong>{v}</strong>
              </li>
            ))}
            {byStatus.size === 0 ? <li style={{ color: "var(--muted)" }}>Sin datos</li> : null}
          </ul>
        </div>
        <div className="mila-panel overflow-x-auto p-4">
          <div className="mb-3 font-semibold">Por zona y tiempos</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>
                <th className="pb-2">Zona</th>
                <th className="pb-2">Casos</th>
                <th className="pb-2">1.ª atención</th>
                <th className="pb-2">Asignación</th>
                <th className="pb-2">Resolución</th>
              </tr>
            </thead>
            <tbody>
              {report.zoneSummary.map((z) => (
                <tr key={z.zone} className="border-t border-[var(--line)]">
                  <td className="py-2">{zoneLabel[z.zone as Zone]}</td>
                  <td>{byZone.get(z.zone) ?? 0}</td>
                  <td>{formatMinutes(z.avgFirstAttentionMin)}</td>
                  <td>{formatMinutes(z.avgAssignmentMin)}</td>
                  <td>{formatMinutes(z.avgResolutionMin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mila-panel overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>
              <th className="px-4 py-3">Caso</th>
              <th className="px-3 py-3">Zona</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Prioridad</th>
              <th className="px-3 py-3">Creado</th>
              <th className="px-3 py-3">1.ª atención</th>
              <th className="px-3 py-3">Resolución</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 200).map(({ ticket: t, metrics: m }) => (
              <tr key={t.id} className="border-b border-[var(--line)]">
                <td className="px-4 py-3">
                  <Link href={`/especialista/casos/${t.id}`} className="font-semibold underline-offset-2 hover:underline">
                    {t.number}
                  </Link>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {t.title}
                  </div>
                </td>
                <td className="px-3">{zoneLabel[t.customerZone]}</td>
                <td className="px-3">
                  <StatusChip status={t.status} />
                </td>
                <td className="px-3">
                  <PriorityChip priority={t.priority} />
                </td>
                <td className="px-3">{formatDateTime(t.createdAt)}</td>
                <td className="px-3">{formatMinutes(m.firstAttentionMin)}</td>
                <td className="px-3">{formatMinutes(m.resolutionMin)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-5" style={{ color: "var(--muted)" }}>
                  Sin solicitudes para los filtros elegidos.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {rows.length > 200 ? (
          <p className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
            Se muestran 200 de {rows.length}; el CSV incluye todas
            {report.truncated ? " (tope de 2000)" : ""}.
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="mila-panel p-4">
      <div className="text-sm" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
