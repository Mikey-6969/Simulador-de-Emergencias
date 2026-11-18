import {
  AssignmentStatus,
  Priority,
  Prisma,
  Role,
  TicketStatus,
  Zone,
} from "@prisma/client";
import { prisma } from "./db";
import { analyzeTicket } from "./ai";
import { emitN8nEvent } from "./n8n";

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

export async function recommendTechnicians(ticketId: string) {
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
  const technicians = await prisma.technicianProfile.findMany({
    where: { available: true },
    include: { user: true },
  });

  const scored = technicians
    .map((tech) => {
      const openAssignments = 0;
      const zoneScore = zoneMatchScore(tech.zones, ticket.customerZone);
      const skillScore = skillMatchScore(tech.skills, ticket.serviceType);
      const capacityScore = Math.max(0, 25 - openAssignments * 5);
      const score = zoneScore + skillScore + capacityScore;
      const rationale = `Zona ${zoneScore}/40, skills ${skillScore}/35, capacidad ${capacityScore}/25.`;
      return { tech, score, rationale };
    })
    .sort((a, b) => b.score - a.score);

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
