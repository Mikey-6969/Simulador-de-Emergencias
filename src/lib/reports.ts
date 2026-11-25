import { Priority, Prisma, TicketStatus, Zone } from "@prisma/client";
import { addDays } from "./time";

export type ReportFilters = {
  from?: string;
  to?: string;
  status?: TicketStatus;
  zone?: Zone;
  priority?: Priority;
  service?: string;
};

const STATUSES = Object.values(TicketStatus);
const ZONES = Object.values(Zone);
const PRIORITIES = Object.values(Priority);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function pick<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function validDay(value: string | undefined) {
  if (!value || !DAY.test(value)) return undefined;
  return Number.isNaN(new Date(`${value}T00:00:00-05:00`).getTime()) ? undefined : value;
}

export function parseReportFilters(params: Record<string, string | undefined>): ReportFilters {
  return {
    from: validDay(params.from),
    to: validDay(params.to),
    status: pick(params.status, STATUSES),
    zone: pick(params.zone, ZONES),
    priority: pick(params.priority, PRIORITIES),
    service: params.service?.trim().slice(0, 80) || undefined,
  };
}

export function buildTicketWhere(f: ReportFilters): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {};
  if (f.from || f.to) {
    where.createdAt = {};
    if (f.from) where.createdAt.gte = new Date(`${f.from}T00:00:00-05:00`);
    if (f.to) where.createdAt.lt = addDays(new Date(`${f.to}T00:00:00-05:00`), 1);
  }
  if (f.status) where.status = f.status;
  if (f.zone) where.customerZone = f.zone;
  if (f.priority) where.priority = f.priority;
  if (f.service) where.serviceType = f.service;
  return where;
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r;]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export function toCsv(headers: string[], rows: unknown[][]) {
  return `\uFEFF${[headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

export function countBy<T>(items: T[], key: (item: T) => string) {
  const out = new Map<string, number>();
  for (const item of items) out.set(key(item), (out.get(key(item)) ?? 0) + 1);
  return out;
}
