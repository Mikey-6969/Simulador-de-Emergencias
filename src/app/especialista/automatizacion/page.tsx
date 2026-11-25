import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { specialistNav } from "@/lib/nav";
import { formatDateTime } from "@/lib/time";
import { aiViaN8nEnabled } from "@/lib/n8n";
import { externalNotificationsEnabled } from "@/lib/notify";
import { RetryButton } from "./RetryButton";

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3_600_000);
}

type Params = Record<string, string | undefined>;

export default async function AutomatizacionPage({ searchParams }: { searchParams: Promise<Params> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["COORDINADOR", "ADMIN"].includes(session.role)) redirect("/especialista");

  const p = await searchParams;
  const flowFilter = p.flow?.trim().slice(0, 60) || undefined;
  const onlyErrors = p.estado === "error";
  const where = {
    ...(flowFilter ? { flow: flowFilter } : {}),
    ...(onlyErrors ? { success: false } : {}),
  };

  const since = hoursAgo(24);
  const [logs, flows, okCount, errCount, errLast24, pendingAi, analyses, extPending] = await Promise.all([
    prisma.automationLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.automationLog.groupBy({ by: ["flow"], _count: { _all: true } }),
    prisma.automationLog.count({ where: { success: true } }),
    prisma.automationLog.count({ where: { success: false } }),
    prisma.automationLog.count({ where: { success: false, createdAt: { gte: since } } }),
    prisma.ticket.findMany({
      where: { status: "EN_ANALISIS_IA", aiAnalyses: { none: {} } },
      select: { id: true, number: true, title: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
    prisma.aiAnalysis.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { ticket: { select: { number: true } } },
    }),
    prisma.notification.groupBy({
      by: ["externalStatus"],
      where: { externalStatus: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const webhookConfigured = Boolean(process.env.N8N_WEBHOOK_URL?.trim());
  const aiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const ext = Object.fromEntries(extPending.map((e) => [e.externalStatus ?? "", e._count._all]));

  return (
    <AppShell
      brand="Portal Especialista"
      subtitle="Automatización"
      userName={session.name}
      nav={specialistNav(session.role)}
      actions={
        <Link href="/especialista" className="mila-btn mila-btn-ghost">
          Bandeja
        </Link>
      }
    >
      <h1 className="mb-2 text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
        n8n, IA y notificaciones
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
        Eventos emitidos, errores de automatización y estado de los canales externos.
      </p>

      <section className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card label="N8N_WEBHOOK_URL" value={webhookConfigured ? "Conectado" : "No configurado (log local)"} />
        <Card
          label="Análisis IA"
          value={
            aiViaN8nEnabled()
              ? "Orquestado por n8n"
              : aiConfigured
                ? "OpenAI activo (en app)"
                : "Motor local (en app)"
          }
        />
        <Card
          label="Notificaciones externas"
          value={
            externalNotificationsEnabled()
              ? `Webhook activo · ${ext.ENVIADO ?? 0} enviadas · ${ext.ERROR ?? 0} con error`
              : "Solo in-app (NOTIFY_WEBHOOK_URL sin configurar)"
          }
        />
        <Card
          label="Eventos (OK / error / error 24 h)"
          value={`${okCount} / ${errCount} / ${errLast24}`}
        />
      </section>

      {pendingAi.length > 0 ? (
        <section className="mila-panel mb-6 overflow-hidden" data-testid="pending-ai">
          <div className="border-b border-[var(--line)] px-5 py-4 font-semibold">
            Casos esperando análisis IA ({pendingAi.length})
          </div>
          <div className="divide-y divide-[var(--line)]">
            {pendingAi.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <span>
                  <Link href={`/especialista/casos/${t.id}`} className="font-semibold hover:underline">
                    {t.number}
                  </Link>{" "}
                  · {t.title} · {formatDateTime(t.createdAt)}
                </span>
                <RetryButton url={`/api/tickets/${t.id}/reanalyze`} label="Analizar ahora" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <form method="get" className="mila-panel mb-4 flex flex-wrap items-end gap-3 p-4">
        <label className="text-xs" style={{ color: "var(--muted)" }}>
          Flujo
          <select name="flow" defaultValue={flowFilter ?? ""} className="mila-select mt-1">
            <option value="">Todos</option>
            {flows.map((f) => (
              <option key={f.flow} value={f.flow}>
                {f.flow} ({f._count._all})
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs" style={{ color: "var(--muted)" }}>
          Estado
          <select name="estado" defaultValue={onlyErrors ? "error" : ""} className="mila-select mt-1">
            <option value="">Todos</option>
            <option value="error">Solo errores</option>
          </select>
        </label>
        <button type="submit" className="mila-btn mila-btn-accent">
          Filtrar
        </button>
        <Link href="/especialista/automatizacion" className="mila-btn mila-btn-ghost">
          Limpiar
        </Link>
      </form>

      <section className="mila-panel mb-6 overflow-hidden">
        <div className="border-b border-[var(--line)] px-5 py-4 font-semibold">
          AutomationLog (últimos 50{flowFilter || onlyErrors ? ", filtrado" : ""})
        </div>
        <div className="divide-y divide-[var(--line)]">
          {logs.length === 0 ? (
            <p className="p-5" style={{ color: "var(--muted)" }}>
              Sin eventos para el filtro. Crea un caso para generar `ticket.created` y `ticket.ai_analyzed`.
            </p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="px-5 py-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{log.flow}</strong>
                  <span className="flex items-center gap-2">
                    {!log.success ? (
                      <RetryButton url={`/api/automation/logs/${log.id}/retry`} label="Reintentar" />
                    ) : null}
                    <span className={`mila-chip ${log.success ? "" : "border-[rgba(255,107,107,0.5)]"}`}>
                      {log.success ? "OK" : "ERROR"}
                    </span>
                  </span>
                </div>
                <div className="mt-1" style={{ color: "var(--muted)" }}>
                  {formatDateTime(log.createdAt)}
                </div>
                {log.error ? <p className="mt-2 text-[#ffb4b4]">{log.error}</p> : null}
                {log.response ? (
                  <pre className="mt-2 max-h-28 overflow-auto rounded-xl bg-black/25 p-3 text-xs">
                    {log.response}
                  </pre>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mila-panel overflow-hidden">
        <div className="border-b border-[var(--line)] px-5 py-4 font-semibold">
          Últimos análisis IA
        </div>
        <div className="divide-y divide-[var(--line)]">
          {analyses.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
              <span>
                <strong>{a.ticket.number}</strong> · confianza {(a.confidence * 100).toFixed(0)}% · prioridad
                sugerida {a.suggestedPriority ?? "—"}
              </span>
              <span className="mila-chip">{a.decision}</span>
            </div>
          ))}
          {analyses.length === 0 ? (
            <p className="p-5" style={{ color: "var(--muted)" }}>Aún no hay análisis.</p>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="mila-panel p-4">
      <div className="text-sm" style={{ color: "var(--muted)" }}>{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
