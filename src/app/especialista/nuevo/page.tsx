import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { SpecialistNewCaseForm } from "./SpecialistNewCaseForm";

export default async function EspecialistaNuevoPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "CLIENTE") redirect("/cliente");

  const canManage = ["COORDINADOR", "ADMIN"].includes(session.role);

  return (
    <AppShell
      brand="Portal Especialista"
      subtitle="Crear caso"
      userName={session.name}
      nav={[
        { href: "/especialista", label: "Casos abiertos", section: "Casos" },
        { href: "/especialista?vista=mios", label: "Asignados a mí" },
        { href: "/especialista/nuevo", label: "Crear caso" },
        ...(canManage
          ? [
              { href: "/especialista/tecnicos", label: "Técnicos / zonas", section: "Operación" },
              { href: "/especialista/automatizacion", label: "Logs n8n / IA" },
            ]
          : []),
      ]}
      actions={
        <Link href="/especialista" className="mila-btn mila-btn-ghost">
          Ir al listado
        </Link>
      }
    >
      <h1 className="mb-2 text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
        Crear caso
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
        Formulario inspirado en ASMS: categorización, sede, detalle y prioridad. Al guardar se
        ejecuta IA + webhook n8n.
      </p>
      <SpecialistNewCaseForm />
    </AppShell>
  );
}
