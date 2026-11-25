import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { PriorityChip, StatusChip } from "@/components/StatusChip";
import { zoneLabel } from "@/lib/labels";

export default async function MisCasosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CLIENTE" && session.role !== "ADMIN") redirect("/especialista");

  const tickets = await prisma.ticket.findMany({
    where: session.role === "ADMIN" ? {} : { customerId: session.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell
      brand="Portal Cliente"
      subtitle="Mis casos"
      userName={session.name}
      nav={[
        { href: "/cliente", label: "Inicio" },
        { href: "/cliente/registrar", label: "Registrar caso", section: "Servicio" },
        { href: "/cliente/mis-casos", label: "Mis casos" },
        { href: "/cliente/articulos", label: "Artículos / ayuda" },
      ]}
      actions={
        <Link href="/cliente/registrar" className="mila-btn mila-btn-primary">
          + Registrar caso
        </Link>
      }
    >
      <h1 className="mb-6 text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
        Mis casos
      </h1>
      <section className="mila-panel overflow-hidden">
        <div className="hidden grid-cols-[1.1fr_1.4fr_1fr_0.8fr_0.8fr] gap-3 border-b border-[var(--line)] px-5 py-3 text-xs uppercase tracking-[0.14em] md:grid" style={{ color: "var(--muted)" }}>
          <span>Caso</span>
          <span>Asunto</span>
          <span>Servicio / sede</span>
          <span>Estado</span>
          <span>Prioridad</span>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {tickets.length === 0 ? (
            <p className="p-5" style={{ color: "var(--muted)" }}>Sin casos registrados.</p>
          ) : (
            tickets.map((t) => (
              <Link
                key={t.id}
                href={`/cliente/casos/${t.id}`}
                className="grid gap-2 px-5 py-4 transition hover:bg-white/5 md:grid-cols-[1.1fr_1.4fr_1fr_0.8fr_0.8fr] md:items-center"
              >
                <strong>{t.number}</strong>
                <span>{t.title}</span>
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  {t.serviceType} · {zoneLabel[t.customerZone]}
                </span>
                <StatusChip status={t.status} />
                <PriorityChip priority={t.priority} />
              </Link>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
