import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { specialistNav } from "@/lib/nav";
import { SeedDemoButton } from "./SeedDemoButton";
import { UserAdminPanel } from "./UserAdminPanel";

export default async function UsuariosAdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/especialista");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { zone: "asc" }, { email: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      zone: true,
      phone: true,
      active: true,
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
      nav={specialistNav(session.role)}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
            Usuarios
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Crear cuentas y resetear contraseñas en la Postgres de la app (sin connection string).
            Total: {users.length}.
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

      <UserAdminPanel initialUsers={users} />
    </AppShell>
  );
}
