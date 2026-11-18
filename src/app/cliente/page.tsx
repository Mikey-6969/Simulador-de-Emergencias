import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LogoutButton } from "@/components/LogoutButton";
import { PriorityChip, StatusChip } from "@/components/StatusChip";
import { zoneLabel } from "@/lib/labels";
import { NewTicketForm } from "./NewTicketForm";

export default async function ClientePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CLIENTE" && session.role !== "ADMIN") redirect("/especialista");

  const tickets = await prisma.ticket.findMany({
    where: session.role === "ADMIN" ? {} : { customerId: session.id },
    orderBy: { createdAt: "desc" },
    include: { aiAnalyses: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return (
    <main className="mila-shell py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em]" style={{ color: "var(--brand)" }}>
            Consola cliente
          </p>
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
            Hola, {session.name}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="mila-btn mila-btn-ghost">
            Inicio
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="mila-panel p-6">
          <h2 className="mb-4 text-xl font-semibold">Nueva solicitud</h2>
          <NewTicketForm defaultZone={(session.zone as "NORTE" | "SUR" | "ORIENTE" | "OCCIDENTE") || "NORTE"} />
        </section>

        <section className="mila-panel p-6">
          <h2 className="mb-4 text-xl font-semibold">Mis casos</h2>
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>Aún no tienes solicitudes.</p>
            ) : (
              tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/cliente/casos/${t.id}`}
                  className="block rounded-2xl border border-[var(--line)] p-4 transition hover:border-[rgba(47,211,193,0.45)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{t.number}</strong>
                    <div className="flex gap-2">
                      <StatusChip status={t.status} />
                      <PriorityChip priority={t.priority} />
                    </div>
                  </div>
                  <p className="mt-2">{t.title}</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                    {zoneLabel[t.customerZone]} · {t.serviceType}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
