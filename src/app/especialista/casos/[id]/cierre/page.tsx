import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessTicket } from "@/lib/tickets";
import { formatDateTime } from "@/lib/time";
import { PrintButton } from "./PrintButton";

type Props = { params: Promise<{ id: string }> };

export default async function FormatoCierrePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "CLIENTE") redirect("/cliente");

  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      customer: true,
      assignee: true,
      closures: { orderBy: { createdAt: "desc" }, take: 1, include: { creator: true } },
      visits: { orderBy: { scheduledAt: "asc" } },
      attachments: {
        where: { closureId: { not: null } },
        select: { id: true, fileName: true, closureId: true },
      },
    },
  });
  if (!ticket) notFound();
  if (!canAccessTicket(session.role, session.id, ticket)) redirect("/especialista");
  const closure = ticket.closures[0];
  if (!closure) redirect(`/especialista/casos/${ticket.id}`);

  const rows: Array<[string, string]> = [
    ["Caso", ticket.number],
    ["Cliente", `${ticket.customer.name} (${ticket.customer.email})`],
    ["Servicio / zona", `${ticket.serviceType} · ${ticket.customerZone}`],
    ["Técnico", closure.creator.name],
    ["Resultado", closure.outcome],
    ["Fecha de cierre", formatDateTime(closure.createdAt)],
    ["Tiempo empleado", closure.timeSpentMinutes ? `${closure.timeSpentMinutes} min` : "—"],
    ["Recibido por", closure.receivedBy ? `${closure.receivedBy}${closure.customerConfirmed ? " (conforme)" : ""}` : "—"],
  ];

  return (
    <main className="mila-shell py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/especialista/casos/${ticket.id}`} className="text-sm" style={{ color: "var(--muted)" }}>
          ← Volver al caso
        </Link>
        <PrintButton />
      </div>
      <article className="mila-panel space-y-4 p-8 print:border-0 print:p-0 print:text-black">
        <header>
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--brand)" }}>
            MILA · Formato de cierre de servicio
          </p>
          <h1 className="text-2xl font-semibold">{ticket.title}</h1>
        </header>
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b border-[var(--line)]">
                <th className="w-44 py-2 text-left font-medium">{k}</th>
                <td className="py-2">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {[
          ["Actividades realizadas", closure.activities],
          ["Diagnóstico en campo", closure.diagnosis],
          ["Solución aplicada", closure.solution],
          ["Repuestos / materiales", closure.partsUsed],
          ["Recomendaciones de seguimiento", closure.recommendations],
        ].map(([title, body]) =>
          body ? (
            <section key={title}>
              <h2 className="text-sm font-semibold">{title}</h2>
              <p className="whitespace-pre-wrap text-sm">{body}</p>
            </section>
          ) : null,
        )}
        <section>
          <h2 className="text-sm font-semibold">Visitas</h2>
          <ul className="text-sm">
            {ticket.visits.length ? (
              ticket.visits.map((v) => (
                <li key={v.id}>
                  {formatDateTime(v.scheduledAt)} · {v.status}
                </li>
              ))
            ) : (
              <li>Sin visitas registradas.</li>
            )}
          </ul>
        </section>
        {ticket.attachments.length ? (
          <section>
            <h2 className="text-sm font-semibold">Evidencias fotográficas</h2>
            <div className="mt-2 flex flex-wrap gap-3">
              {ticket.attachments.map((a) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={a.id}
                  src={`/api/attachments/${a.id}`}
                  alt={a.fileName}
                  className="h-32 rounded-lg border border-[var(--line)] object-cover"
                />
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}
