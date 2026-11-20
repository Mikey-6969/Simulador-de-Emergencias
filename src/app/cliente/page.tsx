import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { PriorityChip, StatusChip } from "@/components/StatusChip";
import { zoneLabel } from "@/lib/labels";
import { CaseSearch } from "./CaseSearch";

export default async function ClientePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CLIENTE" && session.role !== "ADMIN") redirect("/especialista");

  const { q } = await searchParams;
  const query = q?.trim();

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(session.role === "ADMIN" ? {} : { customerId: session.id }),
      ...(query
        ? {
            OR: [
              { number: { contains: query } },
              { title: { contains: query } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const open = tickets.filter((t) => !["CERRADA", "CANCELADA"].includes(t.status)).length;

  return (
    <AppShell
      brand="Portal Cliente"
      subtitle="Registrar y seguir tus casos"
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
      <section className="mb-6">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
          Hola, {session.name}
        </h1>
        <p className="mt-2 max-w-2xl" style={{ color: "var(--muted)" }}>
          Transformamos la experiencia del soporte: registra tu caso, recibe diagnóstico IA y
          sigue la trazabilidad por zona (Norte, Sur, Oriente, Occidente).
        </p>
      </section>

      <CaseSearch initialQuery={query || ""} />

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Link href="/cliente/articulos" className="mila-panel block p-5 transition hover:border-[rgba(47,211,193,0.45)]">
          <div className="text-sm uppercase tracking-[0.16em]" style={{ color: "#f0a35e" }}>
            Artículos
          </div>
          <h2 className="mt-2 text-xl font-semibold">Ayuda remota</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Consulta guías antes de escalar a visita presencial.
          </p>
        </Link>
        <Link href="/cliente/registrar" className="mila-panel block p-5 transition hover:border-[rgba(47,211,193,0.45)]">
          <div className="text-sm uppercase tracking-[0.16em]" style={{ color: "var(--brand)" }}>
            Servicios
          </div>
          <h2 className="mt-2 text-xl font-semibold">Registrar caso</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Wizard por servicio y sede. El agente IA analiza al crear.
          </p>
        </Link>
        <Link href="/cliente/mis-casos" className="mila-panel block p-5 transition hover:border-[rgba(47,211,193,0.45)]">
          <div className="text-sm uppercase tracking-[0.16em]" style={{ color: "#62d28a" }}>
            Mis casos
          </div>
          <h2 className="mt-2 text-xl font-semibold">{open} abiertos</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Sigue estado, recomendaciones IA y escalamiento.
          </p>
        </Link>
      </section>

      <section className="mila-panel mt-6 overflow-hidden">
        <div className="border-b border-[var(--line)] px-5 py-4 font-semibold">Últimos casos</div>
        <div className="divide-y divide-[var(--line)]">
          {tickets.length === 0 ? (
            <p className="p-5" style={{ color: "var(--muted)" }}>
              No hay casos{query ? " para esa búsqueda" : ""}.
            </p>
          ) : (
            tickets.map((t) => (
              <Link
                key={t.id}
                href={`/cliente/casos/${t.id}`}
                className="flex flex-col gap-2 px-5 py-4 transition hover:bg-white/5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-medium">
                    {t.number} · {t.title}
                  </div>
                  <div className="text-sm" style={{ color: "var(--muted)" }}>
                    {zoneLabel[t.customerZone]} · {t.serviceType}
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
    </AppShell>
  );
}
