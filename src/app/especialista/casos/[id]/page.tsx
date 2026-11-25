import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessTicket } from "@/lib/tickets";
import { LogoutButton } from "@/components/LogoutButton";
import { PriorityChip, StatusChip } from "@/components/StatusChip";
import { zoneLabel } from "@/lib/labels";
import { SpecialistActions } from "./SpecialistActions";

type Props = { params: Promise<{ id: string }> };

export default async function EspecialistaCasoPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "CLIENTE") redirect("/cliente");

  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      customer: true,
      assignee: true,
      aiAnalyses: { orderBy: { createdAt: "desc" } },
      escalations: { include: { creator: true }, orderBy: { createdAt: "desc" } },
      assignments: {
        include: { technician: { include: { user: true } } },
        orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      },
      visits: {
        include: { technician: { include: { user: true } } },
        orderBy: { scheduledAt: "asc" },
      },
      closures: { orderBy: { createdAt: "desc" }, take: 3 },
      attachments: {
        where: { closureId: { not: null } },
        select: { id: true, fileName: true, closureId: true },
        orderBy: { createdAt: "asc" },
      },
      timeline: { include: { actor: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) notFound();
  if (!canAccessTicket(session.role, session.id, ticket)) redirect("/especialista");

  const technicians = await prisma.technicianProfile.findMany({
    where: { available: true },
    include: { user: true },
  });
  const assignedProfile =
    technicians.find((t) => t.userId === ticket.assigneeId) ||
    ticket.assignments.find((a) => a.status === "ASIGNADA")?.technician ||
    null;
  const latestAi = ticket.aiAnalyses[0] || null;

  return (
    <main className="mila-shell py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/especialista" className="text-sm" style={{ color: "var(--muted)" }}>
            ← Bandeja
          </Link>
          <h1 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
            {ticket.number}
          </h1>
        </div>
        <LogoutButton />
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="mila-panel space-y-4 p-6">
          <div className="flex flex-wrap gap-2">
            <StatusChip status={ticket.status} />
            <PriorityChip priority={ticket.priority} />
            <span className="mila-chip">{zoneLabel[ticket.customerZone]}</span>
          </div>
          <h2 className="text-2xl font-semibold">{ticket.title}</h2>
          <p style={{ color: "var(--muted)" }}>{ticket.description}</p>
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p>Cliente: {ticket.customer.name}</p>
            <p>Servicio: {ticket.serviceType}</p>
            <p>Correo: {ticket.customer.email}</p>
            <p>Técnico: {ticket.assignee?.name || "Sin asignar"}</p>
          </div>

          {latestAi ? (
            <div className="rounded-2xl border border-[var(--line)] p-4 text-sm">
              <h3 className="mb-2 font-semibold">Último análisis IA</h3>
              <p className="mb-1 text-xs" style={{ color: "var(--muted)" }}>
                Decisión: {latestAi.decision}
                {latestAi.reviewerNotes ? ` · ${latestAi.reviewerNotes}` : ""}
              </p>
              <p>{latestAi.problemSummary}</p>
              <pre className="mt-2 whitespace-pre-wrap opacity-90">
                {latestAi.recommendations}
              </pre>
            </div>
          ) : null}

          {ticket.escalations[0] ? (
            <div className="rounded-2xl border border-[rgba(240,163,94,0.35)] p-4 text-sm">
              <h3 className="mb-2 font-semibold">Escalamiento</h3>
              <p>{ticket.escalations[0].reason}</p>
              <p style={{ color: "var(--muted)" }}>
                Por {ticket.escalations[0].creator.name}
              </p>
            </div>
          ) : null}

          {ticket.closures[0] ? (
            <div className="rounded-2xl border border-[var(--line)] p-4 text-sm">
              <h3 className="mb-2 font-semibold">Último cierre</h3>
              <p>Resultado: {ticket.closures[0].outcome}</p>
              <p className="mt-2" style={{ color: "var(--muted)" }}>
                {ticket.closures[0].diagnosis}
              </p>
              <p className="mt-1">{ticket.closures[0].solution}</p>
              {ticket.attachments.filter((a) => a.closureId === ticket.closures[0].id).length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {ticket.attachments
                    .filter((a) => a.closureId === ticket.closures[0].id)
                    .map((a) => (
                      <a
                        key={a.id}
                        href={`/api/attachments/${a.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mila-chip"
                      >
                        Evidencia: {a.fileName}
                      </a>
                    ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="space-y-6">
          <SpecialistActions
            ticketId={ticket.id}
            status={ticket.status}
            role={session.role}
            assignments={ticket.assignments.map((a) => ({
              id: a.id,
              status: a.status,
              score: a.score,
              rationale: a.rationale,
              technicianProfileId: a.technicianProfileId,
              technicianName: a.technician.user.name,
            }))}
            technicians={technicians.map((t) => ({
              id: t.id,
              name: t.user.name,
              zones: t.zones as string[],
              skills: t.skills as string[],
            }))}
            visits={ticket.visits.map((v) => ({
              id: v.id,
              scheduledAt: v.scheduledAt.toISOString(),
              status: v.status,
              address: v.address,
              notes: v.notes,
              technicianName: v.technician.user.name,
            }))}
            assignedProfileId={assignedProfile?.id || null}
            latestAi={
              latestAi
                ? {
                    id: latestAi.id,
                    decision: latestAi.decision,
                    suggestedPriority: latestAi.suggestedPriority,
                    confidence: latestAi.confidence,
                  }
                : null
            }
          />

          <div className="mila-panel p-6">
            <h3 className="mb-3 font-semibold">Timeline</h3>
            <ul className="space-y-3 text-sm">
              {ticket.timeline.map((ev) => (
                <li key={ev.id} className="border-l border-[var(--line)] pl-3">
                  <div className="font-medium">
                    {ev.type}
                    {ev.actor ? ` · ${ev.actor.name}` : ""}
                  </div>
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
