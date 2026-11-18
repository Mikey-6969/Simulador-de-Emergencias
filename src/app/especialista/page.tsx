import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LogoutButton } from "@/components/LogoutButton";
import { PriorityChip, StatusChip } from "@/components/StatusChip";
import { zoneLabel } from "@/lib/labels";

export default async function EspecialistaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "CLIENTE") redirect("/cliente");

  const where =
    session.role === "TECNICO"
      ? { assigneeId: session.id }
      : {};

  const tickets = await prisma.ticket.findMany({
    where,
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
    <main className="mila-shell py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em]" style={{ color: "var(--brand)" }}>
            Consola especialista
          </p>
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
            Bandeja · {session.name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {["COORDINADOR", "ADMIN"].includes(session.role) ? (
            <Link href="/especialista/tecnicos" className="mila-btn mila-btn-ghost">
              Técnicos
            </Link>
          ) : null}
          <LogoutButton />
        </div>
      </header>

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

      <section className="mila-panel overflow-hidden">
        <div className="border-b border-[var(--line)] px-5 py-4 font-semibold">Casos</div>
        <div className="divide-y divide-[var(--line)]">
          {tickets.length === 0 ? (
            <p className="p-5" style={{ color: "var(--muted)" }}>
              No hay casos en la bandeja.
            </p>
          ) : (
            tickets.map((t) => (
              <Link
                key={t.id}
                href={`/especialista/casos/${t.id}`}
                className="flex flex-col gap-2 px-5 py-4 transition hover:bg-white/5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-medium">
                    {t.number} · {t.title}
                  </div>
                  <div className="text-sm" style={{ color: "var(--muted)" }}>
                    {t.customer.name} · {zoneLabel[t.customerZone]}
                    {t.assignee ? ` · ${t.assignee.name}` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <StatusChip status={t.status} />
                  <PriorityChip priority={t.priority} />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
