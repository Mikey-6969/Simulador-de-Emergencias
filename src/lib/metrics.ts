export type MetricEvent = { type: string; createdAt: Date };

export type TicketForMetrics = {
  createdAt: Date;
  closedAt: Date | null;
  events: MetricEvent[];
  firstAssignedAt: Date | null;
};

export type TicketMetrics = {
  firstAttentionMin: number | null;
  assignmentMin: number | null;
  resolutionMin: number | null;
};

const ATTENTION_TYPES = new Set([
  "STATUS",
  "ESCALATED",
  "ASSIGNED",
  "RECOMMENDATION",
  "VISIT_SCHEDULED",
  "ATTENTION_STARTED",
  "AI_REVIEW",
]);

function minutesBetween(from: Date, to: Date) {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000));
}

export function computeTicketMetrics(t: TicketForMetrics): TicketMetrics {
  const firstHuman = t.events
    .filter((e) => ATTENTION_TYPES.has(e.type) && e.createdAt >= t.createdAt)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  return {
    firstAttentionMin: firstHuman ? minutesBetween(t.createdAt, firstHuman.createdAt) : null,
    assignmentMin: t.firstAssignedAt ? minutesBetween(t.createdAt, t.firstAssignedAt) : null,
    resolutionMin: t.closedAt ? minutesBetween(t.createdAt, t.closedAt) : null,
  };
}

export type MetricsSummary = {
  count: number;
  avgFirstAttentionMin: number | null;
  avgAssignmentMin: number | null;
  avgResolutionMin: number | null;
  medianResolutionMin: number | null;
};

function avg(values: Array<number | null>) {
  const v = values.filter((x): x is number => x !== null);
  if (!v.length) return null;
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
}

function median(values: Array<number | null>) {
  const v = values.filter((x): x is number => x !== null).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : Math.round((v[mid - 1] + v[mid]) / 2);
}

export function summarizeMetrics(items: TicketMetrics[]): MetricsSummary {
  return {
    count: items.length,
    avgFirstAttentionMin: avg(items.map((i) => i.firstAttentionMin)),
    avgAssignmentMin: avg(items.map((i) => i.assignmentMin)),
    avgResolutionMin: avg(items.map((i) => i.resolutionMin)),
    medianResolutionMin: median(items.map((i) => i.resolutionMin)),
  };
}

export function formatMinutes(min: number | null) {
  if (min === null) return "—";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 48) return m ? `${h} h ${m} min` : `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} d ${h % 24} h`;
}
