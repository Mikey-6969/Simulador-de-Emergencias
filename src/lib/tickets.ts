import {
  AiDecision,
  AssignmentStatus,
  ClosureOutcome,
  Priority,
  Prisma,
  Role,
  TicketStatus,
  Zone,
} from "@prisma/client";
import { prisma } from "./db";
import { analyzeTicket } from "./ai";
import { emitN8nEvent } from "./n8n";
import { addDays, formatDateTime, startOfBogotaDay } from "./time";

async function nextTicketNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.ticket.count();
  return `MILA-${year}-${String(count + 1).padStart(5, "0")}`;
}

export async function addTimeline(
  ticketId: string,
  type: string,
  message: string,
  actorId?: string | null,
  meta?: Record<string, unknown>,
) {
  await prisma.timelineEvent.create({
    data: {
      ticketId,
      type,
      message,
      actorId: actorId || null,
      meta: meta ? (meta as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function createTicket(input: {
  customerId: string;
  title: string;
  description: string;
  serviceType: string;
  customerZone: Zone;
  priority?: Priority;
  remoteAttempts?: number;
  diagnosisSteps?: string[];
  images?: Array<{ fileName: string; dataUrl: string }>;
}) {
  const number = await nextTicketNumber();
  const ticket = await prisma.ticket.create({
    data: {
      number,
      title: input.title,
      description: input.description,
      serviceType: input.serviceType,
      customerZone: input.customerZone,
      priority: input.priority ?? "MEDIA",
      customerId: input.customerId,
      status: "EN_ANALISIS_IA",
    },
  });

  const attempts = input.remoteAttempts ?? 0;
  await addTimeline(
    ticket.id,
    "CREATED",
    `Solicitud ${number} creada tras ${attempts} intento(s) de diagnóstico remoto.`,
    input.customerId,
    { remoteAttempts: attempts },
  );
  await emitN8nEvent("ticket.created", {
    ticketId: ticket.id,
    number: ticket.number,
    customerId: input.customerId,
    remoteAttempts: attempts,
  });

  if (input.images?.length) {
    const { saveTicketImages } = await import("./uploads");
    const saved = await saveTicketImages(ticket.id, input.customerId, input.images);
    if (saved.length) {
      await addTimeline(
        ticket.id,
        "ATTACHMENT",
        `Se adjuntaron ${saved.length} imagen(es) de evidencia.`,
        input.customerId,
      );
    }
  }

  const ai = await analyzeTicket({
    title: input.title,
    description: input.description,
    serviceType: input.serviceType,
  });

  const recommendations =
    input.diagnosisSteps?.length
      ? input.diagnosisSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : ai.recommendations;

  await prisma.aiAnalysis.create({
    data: {
      ticketId: ticket.id,
      problemSummary: ai.problemSummary,
      ambiguities: ai.ambiguities,
      recommendations,
      suggestedPriority: ai.suggestedPriority,
      confidence: ai.confidence,
      rawResponse: ai.rawResponse,
    },
  });

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "DIAGNOSTICO_REMOTO",
      // Keep the priority chosen by the user; AI suggestion stays in analysis.
      priority: input.priority ?? ai.suggestedPriority,
    },
  });

  await addTimeline(
    ticket.id,
    "AI_ANALYSIS",
    `Agente IA generó diagnóstico (confianza ${(ai.confidence * 100).toFixed(0)}%).`,
    null,
    { suggestedPriority: ai.suggestedPriority, remoteAttempts: attempts },
  );

  await emitN8nEvent("ticket.ai_analyzed", {
    ticketId: ticket.id,
    number: ticket.number,
    suggestedPriority: ai.suggestedPriority,
    confidence: ai.confidence,
  });

  return updated;
}

export async function changeTicketStatus(
  ticketId: string,
  status: TicketStatus,
  actorId: string,
) {
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      closedAt: status === "CERRADA" ? new Date() : undefined,
    },
  });
  await addTimeline(ticketId, "STATUS", `Estado actualizado a ${status}.`, actorId);
  await emitN8nEvent("ticket.status_changed", { ticketId, status });
  return ticket;
}

export async function escalateTicket(ticketId: string, reason: string, actorId: string) {
  await prisma.escalation.create({
    data: { ticketId, reason, createdBy: actorId },
  });
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "ESCALADA" },
  });
  await addTimeline(ticketId, "ESCALATED", `Caso escalado: ${reason}`, actorId);
  await emitN8nEvent("ticket.escalated", { ticketId, reason });
  return ticket;
}

function zoneMatchScore(zones: unknown, customerZone: Zone) {
  const list = Array.isArray(zones) ? zones.map(String) : [];
  return list.includes(customerZone) ? 40 : 0;
}

function skillMatchScore(skills: unknown, serviceType: string) {
  const list = Array.isArray(skills) ? skills.map((s) => String(s).toLowerCase()) : [];
  const needle = serviceType.toLowerCase();
  if (list.some((s) => needle.includes(s) || s.includes(needle))) return 35;
  if (list.includes("general")) return 15;
  return 5;
}

async function openLoadForTechnician(technicianProfileId: string) {
  const openAssignments = await prisma.assignment.count({
    where: {
      technicianProfileId,
      status: "ASIGNADA",
      ticket: { status: { notIn: ["CERRADA", "CANCELADA"] } },
    },
  });
  const upcomingVisits = await prisma.visit.count({
    where: {
      technicianProfileId,
      status: { in: ["PROGRAMADA", "EN_CURSO"] },
      scheduledAt: { gte: new Date() },
    },
  });
  return openAssignments + upcomingVisits;
}

export async function recommendTechnicians(ticketId: string) {
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
  const technicians = await prisma.technicianProfile.findMany({
    where: { available: true },
    include: { user: true },
  });

  const scored = [];
  for (const tech of technicians) {
    const openLoad = await openLoadForTechnician(tech.id);
    const zoneScore = zoneMatchScore(tech.zones, ticket.customerZone);
    const skillScore = skillMatchScore(tech.skills, ticket.serviceType);
    const remaining = Math.max(0, tech.capacityPerDay - openLoad);
    const capacityScore = Math.min(25, remaining * 5);
    const score = zoneScore + skillScore + capacityScore;
    const rationale = `Zona ${zoneScore}/40, skills ${skillScore}/35, capacidad ${capacityScore}/25 (carga abierta ${openLoad}/${tech.capacityPerDay}).`;
    scored.push({ tech, score, rationale });
  }
  scored.sort((a, b) => b.score - a.score);

  await prisma.assignment.deleteMany({
    where: { ticketId, status: "RECOMENDADA" },
  });

  const created = [];
  for (const item of scored.slice(0, 3)) {
    created.push(
      await prisma.assignment.create({
        data: {
          ticketId,
          technicianProfileId: item.tech.id,
          status: "RECOMENDADA",
          score: item.score,
          rationale: item.rationale,
        },
        include: { technician: { include: { user: true } } },
      }),
    );
  }

  await addTimeline(
    ticketId,
    "RECOMMENDATION",
    `Se generaron ${created.length} recomendaciones de técnico.`,
  );
  return created;
}

export async function assignTechnician(
  ticketId: string,
  technicianProfileId: string,
  actorId: string,
) {
  const profile = await prisma.technicianProfile.findUniqueOrThrow({
    where: { id: technicianProfileId },
    include: { user: true },
  });

  await prisma.assignment.updateMany({
    where: { ticketId, status: "ASIGNADA" },
    data: { status: "RECHAZADA" },
  });

  let assignment = await prisma.assignment.findFirst({
    where: { ticketId, technicianProfileId },
  });

  if (assignment) {
    assignment = await prisma.assignment.update({
      where: { id: assignment.id },
      data: { status: "ASIGNADA", assignedAt: new Date() },
    });
  } else {
    assignment = await prisma.assignment.create({
      data: {
        ticketId,
        technicianProfileId,
        status: "ASIGNADA" as AssignmentStatus,
        assignedAt: new Date(),
        rationale: "Asignación manual del coordinador",
        score: 100,
      },
    });
  }

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: "ASIGNADA",
      assigneeId: profile.userId,
    },
  });

  await addTimeline(
    ticketId,
    "ASSIGNED",
    `Técnico asignado: ${profile.user.name}`,
    actorId,
  );
  await emitN8nEvent("ticket.assigned", {
    ticketId,
    technicianId: profile.userId,
    technicianName: profile.user.name,
  });

  await prisma.notification.create({
    data: {
      userId: profile.userId,
      ticketId,
      title: "Nueva asignación MILA",
      body: `Se te asignó el caso ${ticket.number}.`,
    },
  });

  return ticket;
}

export function canAccessTicket(
  role: Role,
  userId: string,
  ticket: { customerId: string; assigneeId: string | null },
) {
  if (role === "ADMIN" || role === "COORDINADOR") return true;
  if (role === "CLIENTE") return ticket.customerId === userId;
  if (role === "TECNICO") return ticket.assigneeId === userId;
  return false;
}

function windowsOverlap(
  aStart: Date,
  aMinutes: number,
  bStart: Date,
  bMinutes: number,
) {
  const aEnd = aStart.getTime() + aMinutes * 60_000;
  const bEnd = bStart.getTime() + bMinutes * 60_000;
  return aStart.getTime() < bEnd && bStart.getTime() < aEnd;
}

async function assertVisitSlot(
  profile: { id: string; capacityPerDay: number },
  scheduledAt: Date,
  windowMinutes: number,
  excludeVisitId?: string,
) {
  if (scheduledAt.getTime() < Date.now() - 60_000) {
    throw new Error("No se puede programar una visita en el pasado.");
  }
  const dayStart = startOfBogotaDay(scheduledAt);
  const dayEnd = addDays(dayStart, 1);

  const dayVisits = await prisma.visit.findMany({
    where: {
      technicianProfileId: profile.id,
      status: { in: ["PROGRAMADA", "EN_CURSO"] },
      scheduledAt: { gte: dayStart, lt: dayEnd },
      ...(excludeVisitId ? { id: { not: excludeVisitId } } : {}),
    },
  });

  if (dayVisits.length >= profile.capacityPerDay) {
    throw new Error(
      `El técnico ya tiene ${dayVisits.length}/${profile.capacityPerDay} visitas ese día.`,
    );
  }

  const conflict = dayVisits.find((v) =>
    windowsOverlap(v.scheduledAt, v.windowMinutes, scheduledAt, windowMinutes),
  );
  if (conflict) {
    throw new Error(
      `Conflicto de agenda: ya hay visita a las ${formatDateTime(conflict.scheduledAt)}.`,
    );
  }
}

export async function scheduleVisit(input: {
  ticketId: string;
  technicianProfileId: string;
  scheduledAt: Date;
  windowMinutes?: number;
  address?: string;
  notes?: string;
  actorId: string;
}) {
  const ticket = await prisma.ticket.findUniqueOrThrow({
    where: { id: input.ticketId },
    include: { assignee: true },
  });
  if (!ticket.assigneeId) {
    throw new Error("Asigna un técnico antes de programar la visita.");
  }

  const profile = await prisma.technicianProfile.findUniqueOrThrow({
    where: { id: input.technicianProfileId },
    include: { user: true },
  });
  if (profile.userId !== ticket.assigneeId) {
    throw new Error("La visita debe programarse con el técnico asignado al caso.");
  }

  const windowMinutes = input.windowMinutes ?? 120;
  await assertVisitSlot(profile, input.scheduledAt, windowMinutes);

  const visit = await prisma.visit.create({
    data: {
      ticketId: ticket.id,
      technicianProfileId: profile.id,
      scheduledAt: input.scheduledAt,
      windowMinutes,
      address: input.address || ticket.address || null,
      notes: input.notes || null,
      createdBy: input.actorId,
      status: "PROGRAMADA",
    },
  });

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: "VISITA_PROGRAMADA" },
  });

  await addTimeline(
    ticket.id,
    "VISIT_SCHEDULED",
    `Visita programada para ${formatDateTime(input.scheduledAt)} · ${profile.user.name}`,
    input.actorId,
    { visitId: visit.id, scheduledAt: input.scheduledAt.toISOString() },
  );

  await emitN8nEvent("ticket.visit_scheduled", {
    ticketId: ticket.id,
    number: ticket.number,
    visitId: visit.id,
    technicianId: profile.userId,
    technicianName: profile.user.name,
    scheduledAt: input.scheduledAt.toISOString(),
    status: "VISITA_PROGRAMADA",
  });

  await prisma.notification.create({
    data: {
      userId: profile.userId,
      ticketId: ticket.id,
      title: "Visita programada",
      body: `Tienes visita para el caso ${ticket.number} el ${formatDateTime(input.scheduledAt)}.`,
    },
  });

  if (ticket.customerId) {
    await prisma.notification.create({
      data: {
        userId: ticket.customerId,
        ticketId: ticket.id,
        title: "Visita confirmada",
        body: `Se programó visita presencial para tu caso ${ticket.number}.`,
      },
    });
  }

  return visit;
}

export async function updateVisit(input: {
  visitId: string;
  actorId: string;
  action: "cancel" | "reschedule";
  scheduledAt?: Date;
  windowMinutes?: number;
  reason?: string;
}) {
  const visit = await prisma.visit.findUniqueOrThrow({
    where: { id: input.visitId },
    include: { ticket: true, technician: { include: { user: true } } },
  });
  if (!["PROGRAMADA", "EN_CURSO"].includes(visit.status)) {
    throw new Error("Solo se pueden modificar visitas programadas o en curso.");
  }

  if (input.action === "cancel") {
    await prisma.visit.update({ where: { id: visit.id }, data: { status: "CANCELADA" } });
    const remaining = await prisma.visit.count({
      where: { ticketId: visit.ticketId, status: { in: ["PROGRAMADA", "EN_CURSO"] }, id: { not: visit.id } },
    });
    if (!remaining && visit.ticket.status === "VISITA_PROGRAMADA") {
      await prisma.ticket.update({ where: { id: visit.ticketId }, data: { status: "ASIGNADA" } });
    }
    await addTimeline(
      visit.ticketId,
      "VISIT_CANCELLED",
      `Visita del ${formatDateTime(visit.scheduledAt)} cancelada${input.reason ? `: ${input.reason}` : ""}.`,
      input.actorId,
      { visitId: visit.id },
    );
    await emitN8nEvent("ticket.visit_cancelled", {
      ticketId: visit.ticketId,
      number: visit.ticket.number,
      visitId: visit.id,
    });
    await prisma.notification.create({
      data: {
        userId: visit.technician.userId,
        ticketId: visit.ticketId,
        title: "Visita cancelada",
        body: `Se canceló la visita del caso ${visit.ticket.number} (${formatDateTime(visit.scheduledAt)}).`,
      },
    });
    return { visitId: visit.id, status: "CANCELADA" as const };
  }

  if (!input.scheduledAt) throw new Error("Indica la nueva fecha y hora.");
  const windowMinutes = input.windowMinutes ?? visit.windowMinutes;
  await assertVisitSlot(visit.technician, input.scheduledAt, windowMinutes, visit.id);
  const updated = await prisma.visit.update({
    where: { id: visit.id },
    data: { scheduledAt: input.scheduledAt, windowMinutes },
  });
  await addTimeline(
    visit.ticketId,
    "VISIT_RESCHEDULED",
    `Visita reprogramada: ${formatDateTime(visit.scheduledAt)} → ${formatDateTime(input.scheduledAt)}.`,
    input.actorId,
    { visitId: visit.id },
  );
  await emitN8nEvent("ticket.visit_rescheduled", {
    ticketId: visit.ticketId,
    number: visit.ticket.number,
    visitId: visit.id,
    scheduledAt: input.scheduledAt.toISOString(),
  });
  await prisma.notification.create({
    data: {
      userId: visit.technician.userId,
      ticketId: visit.ticketId,
      title: "Visita reprogramada",
      body: `Caso ${visit.ticket.number}: nueva fecha ${formatDateTime(input.scheduledAt)}.`,
    },
  });
  return { visitId: updated.id, status: updated.status };
}

export async function startAttention(ticketId: string, actorId: string) {
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
  if (ticket.assigneeId !== actorId) {
    throw new Error("Solo el técnico asignado puede iniciar la atención.");
  }
  if (!["ASIGNADA", "VISITA_PROGRAMADA", "EN_ATENCION"].includes(ticket.status)) {
    throw new Error("El caso no está listo para atención en campo.");
  }

  await prisma.visit.updateMany({
    where: { ticketId, status: "PROGRAMADA" },
    data: { status: "EN_CURSO" },
  });

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "EN_ATENCION" },
  });

  await addTimeline(ticketId, "ATTENTION_STARTED", "Técnico inició atención en campo.", actorId);
  await emitN8nEvent("ticket.status_changed", {
    ticketId,
    number: ticket.number,
    status: "EN_ATENCION",
  });
  return updated;
}

export async function closeTicket(input: {
  ticketId: string;
  actorId: string;
  outcome: ClosureOutcome;
  activities: string;
  diagnosis: string;
  solution: string;
  timeSpentMinutes?: number;
  partsUsed?: string;
  recommendations?: string;
  receivedBy?: string;
  customerConfirmed?: boolean;
  images?: Array<{ fileName: string; dataUrl: string }>;
}) {
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: input.ticketId } });
  if (ticket.assigneeId !== input.actorId) {
    throw new Error("Solo el técnico asignado puede cerrar el caso.");
  }
  if (!["ASIGNADA", "VISITA_PROGRAMADA", "EN_ATENCION"].includes(ticket.status)) {
    throw new Error("El caso no admite cierre en este estado.");
  }

  const closure = await prisma.closure.create({
    data: {
      ticketId: input.ticketId,
      createdBy: input.actorId,
      outcome: input.outcome,
      activities: input.activities,
      diagnosis: input.diagnosis,
      solution: input.solution,
      timeSpentMinutes: input.timeSpentMinutes,
      partsUsed: input.partsUsed || null,
      recommendations: input.recommendations || null,
      receivedBy: input.receivedBy || null,
      customerConfirmed: Boolean(input.customerConfirmed),
    },
  });

  let evidenceCount = 0;
  if (input.images?.length) {
    const { saveTicketImages } = await import("./uploads");
    const saved = await saveTicketImages(input.ticketId, input.actorId, input.images, {
      closureId: closure.id,
    });
    evidenceCount = saved.length;
  }

  const nextStatus: TicketStatus =
    input.outcome === "RESUELTO"
      ? "CERRADA"
      : input.outcome === "NUEVA_VISITA"
        ? "ASIGNADA"
        : input.outcome === "ESCALADO"
          ? "ESCALADA"
          : "EN_ATENCION";

  await prisma.ticket.update({
    where: { id: input.ticketId },
    data: {
      status: nextStatus,
      closedAt: nextStatus === "CERRADA" ? new Date() : undefined,
    },
  });

  if (nextStatus === "CERRADA") {
    await prisma.visit.updateMany({
      where: { ticketId: input.ticketId, status: { in: ["PROGRAMADA", "EN_CURSO"] } },
      data: { status: "COMPLETADA" },
    });
    await prisma.assignment.updateMany({
      where: { ticketId: input.ticketId, status: "ASIGNADA" },
      data: { status: "COMPLETADA" },
    });
  }

  await addTimeline(
    input.ticketId,
    "CLOSED",
    `Cierre registrado (${input.outcome}): ${input.solution.slice(0, 120)}${evidenceCount ? ` · ${evidenceCount} evidencia(s) fotográfica(s)` : ""}`,
    input.actorId,
    { outcome: input.outcome, closureId: closure.id, evidenceCount },
  );

  await emitN8nEvent("ticket.closed", {
    ticketId: input.ticketId,
    number: ticket.number,
    outcome: input.outcome,
    status: nextStatus,
  });

  await prisma.notification.create({
    data: {
      userId: ticket.customerId,
      ticketId: ticket.id,
      title: nextStatus === "CERRADA" ? "Caso cerrado" : "Actualización de cierre",
      body: `Tu caso ${ticket.number} quedó en ${nextStatus} (${input.outcome}).`,
    },
  });

  return closure;
}

export async function reviewAiAnalysis(input: {
  analysisId: string;
  actorId: string;
  decision: AiDecision;
  notes?: string;
  applyPriority?: boolean;
}) {
  if (input.decision === "PENDIENTE") {
    throw new Error("Selecciona aceptar, modificar o rechazar.");
  }

  const analysis = await prisma.aiAnalysis.findUniqueOrThrow({
    where: { id: input.analysisId },
    include: { ticket: true },
  });

  const updated = await prisma.aiAnalysis.update({
    where: { id: analysis.id },
    data: {
      decision: input.decision,
      reviewerId: input.actorId,
      reviewerNotes: input.notes || null,
    },
  });

  if (input.applyPriority && analysis.suggestedPriority && input.decision === "ACEPTADO") {
    await prisma.ticket.update({
      where: { id: analysis.ticketId },
      data: { priority: analysis.suggestedPriority },
    });
  }

  await addTimeline(
    analysis.ticketId,
    "AI_REVIEW",
    `Revisión IA: ${input.decision}${input.notes ? ` — ${input.notes}` : ""}`,
    input.actorId,
  );

  await emitN8nEvent("ticket.ai_reviewed", {
    ticketId: analysis.ticketId,
    number: analysis.ticket.number,
    decision: input.decision,
  });

  return updated;
}
