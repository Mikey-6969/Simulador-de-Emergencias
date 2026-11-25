import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { specialistNav } from "@/lib/nav";
import { NewTechnicianForm } from "./NewTechnicianForm";

export default async function TecnicosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["COORDINADOR", "ADMIN"].includes(session.role)) redirect("/especialista");

  const technicians = await prisma.technicianProfile.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell
      brand="Portal Especialista"
      subtitle="Técnicos y zonas"
      userName={session.name}
      nav={specialistNav(session.role)}
      actions={
        <Link href="/especialista" className="mila-btn mila-btn-ghost">
          Bandeja
        </Link>
      }
    >
      <h1 className="mb-6 text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
        Técnicos y sedes
      </h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="mila-panel p-6">
          <h2 className="mb-4 text-xl font-semibold">Registrar técnico</h2>
          <NewTechnicianForm />
        </section>
        <section className="mila-panel p-6">
          <h2 className="mb-4 text-xl font-semibold">Catálogo</h2>
          <div className="space-y-3">
            {technicians.map((t) => (
              <div key={t.id} className="rounded-2xl border border-[var(--line)] p-4">
                <div className="font-semibold">{t.user.name}</div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {t.user.email}
                </div>
                <div className="mt-2 text-sm">Zonas: {(t.zones as string[]).join(", ")}</div>
                <div className="text-sm">Skills: {(t.skills as string[]).join(", ")}</div>
                <div className="text-sm">
                  Capacidad/día: {t.capacityPerDay} · {t.available ? "Disponible" : "No disponible"}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
