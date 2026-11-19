import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { zoneLabel } from "@/lib/labels";
import { SeedDemoButton } from "./SeedDemoButton";

export default async function UsuariosAdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/especialista");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { zone: "asc" }, { email: "asc" }],
    select: {
      email: true,
      name: true,
      role: true,
      zone: true,
      active: true,
      createdAt: true,
    },
  });

  const counts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell
      brand="Administración"
      subtitle="Usuarios en esta base"
      userName={session.name}
      nav={[
        { href: "/especialista", label: "Bandeja", section: "Casos" },
        { href: "/especialista/usuarios", label: "Usuarios", section: "Admin" },
        { href: "/especialista/tecnicos", label: "Técnicos / zonas" },
        { href: "/especialista/automatizacion", label: "Logs n8n / IA" },
      ]}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
            Usuarios
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Validación en la base de la app (sin contraseñas ni hashes). Total: {users.length}.
          </p>
        </div>
        <SeedDemoButton />
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-4">
        {(["ADMIN", "COORDINADOR", "TECNICO", "CLIENTE"] as const).map((role) => (
          <div key={role} className="mila-panel p-4">
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              {role}
            </div>
            <div className="text-3xl font-semibold">{counts[role] || 0}</div>
          </div>
        ))}
      </section>

      <section className="mila-panel overflow-x-auto">
        <div className="min-w-[720px]">
          <div
            className="grid grid-cols-[1.4fr_1.2fr_0.9fr_0.8fr_0.6fr] gap-2 border-b border-[var(--line)] px-4 py-3 text-[11px] uppercase tracking-[0.12em]"
            style={{ color: "var(--muted)" }}
          >
            <span>Correo</span>
            <span>Nombre</span>
            <span>Rol</span>
            <span>Zona</span>
            <span>Activo</span>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {users.length === 0 ? (
              <div className="px-4 py-8 text-sm" style={{ color: "var(--muted)" }}>
                No hay usuarios aún. Configura secrets de admin +{" "}
                <code>MILA_DEMO_PASSWORD</code> y usa el botón de catálogo demo.
              </div>
            ) : (
              users.map((u) => (
                <div
                  key={u.email}
                  className="grid grid-cols-[1.4fr_1.2fr_0.9fr_0.8fr_0.6fr] gap-2 px-4 py-3 text-sm"
                >
                  <span className="font-medium">{u.email}</span>
                  <span>{u.name}</span>
                  <span>{u.role}</span>
                  <span>{u.zone ? zoneLabel[u.zone] : "—"}</span>
                  <span>{u.active ? "Sí" : "No"}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <p className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
        La Postgres de Cursor Apps no expone connection string externo. Valida usuarios aquí o vía{" "}
        <Link href="/api/admin/users" className="underline">
          /api/admin/users
        </Link>{" "}
        (sesión ADMIN).
      </p>
    </AppShell>
  );
}
