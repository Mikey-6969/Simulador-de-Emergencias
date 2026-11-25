import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { specialistNav } from "@/lib/nav";
import { PriorityChip, StatusChip } from "@/components/StatusChip";
import { zoneLabel } from "@/lib/labels";

export default async function EspecialistaPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "CLIENTE") redirect("/cliente");

  const { vista } = await searchParams;
  const mine = vista === "mios" || session.role === "TECNICO";

  const tickets = await prisma.ticket.findMany({
    where: mine ? { assigneeId: session.id } : {},
    orderBy: { updatedAt: "desc" },
    include: {
      customer: { select: { name: true } },
      assignee: { select: { name: true } },
    },
  });

  const open = tickets.filter((t) => !["CERRADA", "CANCELADA"].includes(t.status)).length;
  const escaladas = tickets.filter((t) => t.status === "ESCALADA").length;
  const asignadas = tickets.filter((t) => t.status === "ASIGNADA").length;

  return (
    <AppShell
      brand="Portal Especialista"
      subtitle="Bandeja y asignación"
      userName={session.name}
      nav={specialistNav(session.role)}
      actions={
        <>
          <Link href="/especialista/nuevo" className="mila-btn mila-btn-primary">
            + Crear caso
          </Link>
        </>
      }
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
            {mine ? "Asignados a mí" : "Bandeja de casos"}
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Vista tipo ASMS: estado, sede, responsable y prioridad.
          </p>
        </div>
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="mila-panel p-4">
          <div className="text-sm" style={{ color: "var(--muted)" }}>Abiertos</div>
          <div className="text-3xl font-semibold">{open}</div>
        </div>
        <div className="mila-panel p-4">
          <div className="text-sm" style={{ color: "var(--muted)" }}>Escalados</div>
          <div className="text-3xl font-semibold">{escaladas}</div>
        </div>
        <div className="mila-panel p-4">
          <div className="text-sm" style={{ color: "var(--muted)" }}>Asignados</div>
          <div className="text-3xl font-semibold">{asignadas}</div>
        </div>
      </section>

      <section className="mila-panel overflow-x-auto">
        <div className="min-w-[860px]">
          <div
            className="grid grid-cols-[1fr_1.4fr_1fr_1fr_0.9fr_0.8fr_0.8fr] gap-2 border-b border-[var(--line)] px-4 py-3 text-[11px] uppercase tracking-[0.12em]"
            style={{ color: "var(--muted)" }}
          >
            <span>Caso</span>
            <span>Asunto</span>
            <span>Cliente</span>
            <span>Sede / servicio</span>
            <span>Responsable</span>
            <span>Estado</span>
            <span>Prioridad</span>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {tickets.length === 0 ? (
              <p className="p-5" style={{ color: "var(--muted)" }}>
                No hay casos en esta vista.
              </p>
            ) : (
              tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/especialista/casos/${t.id}`}
                  className="grid grid-cols-[1fr_1.4fr_1fr_1fr_0.9fr_0.8fr_0.8fr] items-center gap-2 px-4 py-3 text-sm transition hover:bg-white/5"
                >
                  <strong>{t.number}</strong>
                  <span className="truncate">{t.title}</span>
                  <span style={{ color: "var(--muted)" }}>{t.customer.name}</span>
                  <span style={{ color: "var(--muted)" }}>
                    {zoneLabel[t.customerZone]} · {t.serviceType}
                  </span>
                  <span style={{ color: "var(--muted)" }}>{t.assignee?.name || "—"}</span>
                  <StatusChip status={t.status} />
                  <PriorityChip priority={t.priority} />
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
