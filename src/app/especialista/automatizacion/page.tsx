import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { specialistNav } from "@/lib/nav";
import { formatDateTime } from "@/lib/time";

export default async function AutomatizacionPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["COORDINADOR", "ADMIN"].includes(session.role)) redirect("/especialista");

  const logs = await prisma.automationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const webhookConfigured = Boolean(process.env.N8N_WEBHOOK_URL?.trim());
  const aiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

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
        n8n e IA
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
        Eventos emitidos al crear, analizar, escalar y asignar casos.
      </p>

      <section className="mb-6 grid gap-3 md:grid-cols-2">
        <div className="mila-panel p-4">
          <div className="text-sm" style={{ color: "var(--muted)" }}>N8N_WEBHOOK_URL</div>
          <div className="mt-1 font-semibold">
            {webhookConfigured ? "Conectado" : "No configurado (log local)"}
          </div>
        </div>
        <div className="mila-panel p-4">
          <div className="text-sm" style={{ color: "var(--muted)" }}>OPENAI_API_KEY</div>
          <div className="mt-1 font-semibold">
            {aiConfigured ? "OpenAI activo" : "Motor IA local activo"}
          </div>
        </div>
      </section>

      <section className="mila-panel overflow-hidden">
        <div className="border-b border-[var(--line)] px-5 py-4 font-semibold">
          AutomationLog (últimos 50)
        </div>
        <div className="divide-y divide-[var(--line)]">
          {logs.length === 0 ? (
            <p className="p-5" style={{ color: "var(--muted)" }}>
              Aún no hay eventos. Crea un caso para generar `ticket.created` y `ticket.ai_analyzed`.
            </p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="px-5 py-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{log.flow}</strong>
                  <span className={`mila-chip ${log.success ? "" : "border-[rgba(255,107,107,0.5)]"}`}>
                    {log.success ? "OK" : "ERROR"}
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
    </AppShell>
  );
}
