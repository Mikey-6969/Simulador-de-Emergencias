import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessTicket } from "@/lib/tickets";
import { LogoutButton } from "@/components/LogoutButton";
import { PriorityChip, StatusChip } from "@/components/StatusChip";
import { zoneLabel } from "@/lib/labels";
import { EscalateButton } from "./EscalateButton";

type Props = { params: Promise<{ id: string }> };

export default async function ClienteCasoPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      aiAnalyses: { orderBy: { createdAt: "desc" }, take: 1 },
      timeline: { orderBy: { createdAt: "asc" } },
      assignee: { select: { name: true } },
    },
  });
  if (!ticket) notFound();
  if (!canAccessTicket(session.role, session.id, ticket)) redirect("/cliente");

  const ai = ticket.aiAnalyses[0];

  return (
    <main className="mila-shell py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/cliente" className="text-sm" style={{ color: "var(--muted)" }}>
            ← Volver
          </Link>
          <h1 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
            {ticket.number}
          </h1>
        </div>
        <LogoutButton />
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="mila-panel space-y-4 p-6">
          <div className="flex flex-wrap gap-2">
            <StatusChip status={ticket.status} />
            <PriorityChip priority={ticket.priority} />
            <span className="mila-chip">{zoneLabel[ticket.customerZone]}</span>
          </div>
          <h2 className="text-2xl font-semibold">{ticket.title}</h2>
          <p style={{ color: "var(--muted)" }}>{ticket.description}</p>
          <p className="text-sm">Servicio: {ticket.serviceType}</p>
          {ticket.assignee ? <p className="text-sm">Técnico: {ticket.assignee.name}</p> : null}
          {["DIAGNOSTICO_REMOTO", "PENDIENTE_ESCALAMIENTO"].includes(ticket.status) ? (
            <EscalateButton ticketId={ticket.id} />
          ) : null}
        </section>

        <section className="space-y-6">
          <div className="mila-panel p-6">
            <h3 className="mb-3 text-lg font-semibold">Agente IA</h3>
            {ai ? (
              <div className="space-y-2 text-sm" style={{ color: "var(--muted)" }}>
                <p>
                  <strong className="text-[var(--text)]">Resumen:</strong> {ai.problemSummary}
                </p>
                <p>
                  <strong className="text-[var(--text)]">Ambigüedades:</strong> {ai.ambiguities}
                </p>
                <pre className="whitespace-pre-wrap rounded-xl bg-black/20 p-3 text-[var(--text)]">
                  {ai.recommendations}
                </pre>
                <p>Confianza: {(ai.confidence * 100).toFixed(0)}%</p>
              </div>
            ) : (
              <p style={{ color: "var(--muted)" }}>Sin análisis aún.</p>
            )}
          </div>

          <div className="mila-panel p-6">
            <h3 className="mb-3 text-lg font-semibold">Línea de tiempo</h3>
            <ul className="space-y-3 text-sm">
              {ticket.timeline.map((ev) => (
                <li key={ev.id} className="border-l border-[var(--line)] pl-3">
                  <div className="font-medium">{ev.type}</div>
                  <div style={{ color: "var(--muted)" }}>{ev.message}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
