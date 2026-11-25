import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { formatMinutes } from "@/lib/metrics";
import { loadReport } from "@/lib/report-data";
import { parseReportFilters, toCsv } from "@/lib/reports";
import { priorityLabel, statusLabel, zoneLabel } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!["COORDINADOR", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const url = new URL(req.url);
  const filters = parseReportFilters(Object.fromEntries(url.searchParams.entries()));
  const report = await loadReport(filters);

  if (url.searchParams.get("format") !== "csv") {
    return NextResponse.json({
      filters,
      summary: report.summary,
      zones: report.zoneSummary,
      truncated: report.truncated,
      total: report.rows.length,
    });
  }

  const csv = toCsv(
    [
      "Número",
      "Título",
      "Servicio",
      "Zona",
      "Estado",
      "Prioridad",
      "Cliente",
      "Técnico",
      "Creado",
      "Cerrado",
      "Primera atención",
      "Asignación",
      "Resolución",
    ],
    report.rows.map(({ ticket: t, metrics: m }) => [
      t.number,
      t.title,
      t.serviceType,
      zoneLabel[t.customerZone],
      statusLabel[t.status],
      priorityLabel[t.priority],
      t.customer.name,
      t.assignee?.name ?? "",
      formatDateTime(t.createdAt),
      t.closedAt ? formatDateTime(t.closedAt) : "",
      formatMinutes(m.firstAttentionMin),
      formatMinutes(m.assignmentMin),
      formatMinutes(m.resolutionMin),
    ]),
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mila-reporte-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
