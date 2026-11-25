import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

const articles = [
  {
    title: "Reinicio y verificación básica de red",
    body: "Antes de escalar: reinicia el modem/router, prueba otro dispositivo y anota el mensaje de error.",
  },
  {
    title: "Correo sospechoso o phishing",
    body: "No abras enlaces. Reporta el correo y adjunta captura en tu caso MILA.",
  },
  {
    title: "Impresora / POS sin respuesta",
    body: "Verifica cableado, cola de impresión y que el servicio no esté pausado.",
  },
  {
    title: "¿Cuándo pedir visita presencial?",
    body: "Si tras las recomendaciones IA el problema continúa, usa Escalar a visita en el detalle del caso.",
  },
];

export default async function ArticulosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CLIENTE" && session.role !== "ADMIN") redirect("/especialista");

  return (
    <AppShell
      brand="Portal Cliente"
      subtitle="Artículos / ayuda"
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
      <h1 className="mb-2 text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
        Artículos
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
        Base de ayuda para diagnóstico remoto (equivalente KB del portal ASMS).
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((a) => (
          <article key={a.title} className="mila-panel p-5">
            <h2 className="text-lg font-semibold">{a.title}</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              {a.body}
            </p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
