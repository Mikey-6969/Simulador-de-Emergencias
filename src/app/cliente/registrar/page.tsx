import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { RegisterWizard } from "./RegisterWizard";

export default async function RegistrarPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CLIENTE" && session.role !== "ADMIN") redirect("/especialista");

  return (
    <AppShell
      brand="Portal Cliente"
      subtitle="Wizard de registro"
      userName={session.name}
      nav={[
        { href: "/cliente", label: "Inicio" },
        { href: "/cliente/registrar", label: "Registrar caso", section: "Servicio" },
        { href: "/cliente/mis-casos", label: "Mis casos" },
        { href: "/cliente/articulos", label: "Artículos / ayuda" },
      ]}
      actions={
        <Link href="/cliente" className="mila-btn mila-btn-ghost">
          Volver
        </Link>
      }
    >
      <h1 className="mb-2 text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
        Registrar caso
      </h1>
      <p className="mb-6 max-w-2xl text-sm" style={{ color: "var(--muted)" }}>
        Flujo: servicio → sede → detalle → hasta 4 intentos de diagnóstico remoto. Solo si no se
        resuelve se crea el caso, con prioridad e imágenes de evidencia.
      </p>
      <RegisterWizard
        defaultZone={(session.zone as "NORTE" | "SUR" | "ORIENTE" | "OCCIDENTE") || "NORTE"}
      />
    </AppShell>
  );
}
