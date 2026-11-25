import { prisma } from "./db";
import { computeTicketMetrics, summarizeMetrics, type TicketMetrics } from "./metrics";
import { buildTicketWhere, type ReportFilters } from "./reports";

export const REPORT_LIMIT = 2000;

export async function loadReport(filters: ReportFilters) {
  const tickets = await prisma.ticket.findMany({
    where: buildTicketWhere(filters),
    orderBy: { createdAt: "desc" },
    take: REPORT_LIMIT,
    include: {
      customer: { select: { name: true } },
      assignee: { select: { name: true } },
      timeline: { select: { type: true, createdAt: true } },
      assignments: {
        where: { assignedAt: { not: null } },
        select: { assignedAt: true },
        orderBy: { assignedAt: "asc" },
        take: 1,
      },
    },
  });

  const rows = tickets.map((t) => {
    const metrics = computeTicketMetrics({
      createdAt: t.createdAt,
      closedAt: t.closedAt,
      events: t.timeline,
      firstAssignedAt: t.assignments[0]?.assignedAt ?? null,
    });
    return { ticket: t, metrics };
  });

  const byZone = new Map<string, TicketMetrics[]>();
  for (const r of rows) {
    const list = byZone.get(r.ticket.customerZone) ?? [];
    list.push(r.metrics);
    byZone.set(r.ticket.customerZone, list);
  }

  return {
    rows,
    truncated: tickets.length >= REPORT_LIMIT,
    summary: summarizeMetrics(rows.map((r) => r.metrics)),
    zoneSummary: [...byZone.entries()].map(([zone, items]) => ({
      zone,
      ...summarizeMetrics(items),
    })),
  };
}
