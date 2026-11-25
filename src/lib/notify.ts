import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { signBody } from "./n8n";
import {
  normalizePhone,
  renderEmail,
  renderWhatsApp,
  sendSmtp,
  sendWhatsAppCloud,
  smtpConfigured,
  whatsappConfigured,
  type CaseInfo,
} from "./channels";
import { formatDateTime } from "./time";

export type NotifyInput = {
  userId: string;
  ticketId?: string | null;
  title: string;
  body: string;
};

export type ExternalChannel = "email" | "whatsapp";

export function buildExternalPayload(input: {
  notificationId: string;
  recipient: { email: string; name: string; phone?: string | null };
  title: string;
  body: string;
  ticketNumber?: string | null;
  channel?: ExternalChannel;
  caso?: CaseInfo | null;
}) {
  const channel = input.channel ?? "email";
  const message = {
    recipientName: input.recipient.name,
    title: input.title,
    body: input.body,
    caso: input.caso ?? null,
  };
  return {
    channel,
    notificationId: input.notificationId,
    to: channel === "whatsapp" ? normalizePhone(input.recipient.phone) : input.recipient.email,
    toName: input.recipient.name,
    subject: `[MILA] ${input.title}`,
    title: input.title,
    body: input.body,
    text: channel === "whatsapp" ? renderWhatsApp(message) : renderEmail(message).text,
    html: channel === "email" ? renderEmail(message).html : undefined,
    ticketNumber: input.ticketNumber ?? null,
    caso: input.caso ?? null,
    sentAt: new Date().toISOString(),
  };
}

export function webhookConfigured() {
  return Boolean(process.env.NOTIFY_WEBHOOK_URL?.trim());
}

export function externalNotificationsEnabled() {
  return webhookConfigured() || smtpConfigured() || whatsappConfigured();
}

async function logExternal(
  success: boolean,
  notificationId: string,
  title: string,
  channel: ExternalChannel,
  detail: { response?: string; error?: string },
) {
  await prisma.automationLog.create({
    data: {
      flow: "notification.external",
      success,
      payload: { notificationId, title: title.slice(0, 120), channel } as Prisma.InputJsonValue,
      response: detail.response?.slice(0, 1000),
      error: detail.error,
    },
  });
}

async function loadCaseInfo(ticketId: string | null | undefined): Promise<CaseInfo | null> {
  if (!ticketId) return null;
  const t = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      customer: { select: { name: true } },
      assignee: { select: { name: true, phone: true } },
      aiAnalyses: { orderBy: { createdAt: "desc" }, take: 1 },
      visits: {
        where: { status: "PROGRAMADA", scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        take: 1,
      },
      closures: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!t) return null;
  const ai = t.aiAnalyses[0];
  const closure = t.closures[0];
  return {
    number: t.number,
    title: t.title,
    status: t.status,
    priority: t.priority,
    serviceType: t.serviceType,
    zone: t.customerZone,
    customerName: t.customer.name,
    assigneeName: t.assignee?.name ?? null,
    assigneePhone: t.assignee?.phone ?? null,
    recommendation: ai ? ai.recommendations.slice(0, 400) : null,
    nextVisit: t.visits[0] ? formatDateTime(t.visits[0].scheduledAt) : null,
    closureSummary: closure ? closure.solution.slice(0, 400) : null,
  };
}

async function postWebhook(url: string, payload: unknown) {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = process.env.N8N_WEBHOOK_SECRET?.trim();
  if (secret) headers["x-mila-signature"] = signBody(body, secret);
  const res = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(6000) });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  return text;
}

export async function dispatchExternal(notificationId: string, only?: ExternalChannel) {
  const notification = await prisma.notification.findUniqueOrThrow({
    where: { id: notificationId },
    include: {
      user: { select: { email: true, name: true, phone: true } },
      ticket: { select: { number: true } },
    },
  });
  const caso = await loadCaseInfo(notification.ticketId);
  const recipient = notification.user;
  const phone = normalizePhone(recipient.phone);
  const webhookUrl = process.env.NOTIFY_WEBHOOK_URL?.trim();
  const message = {
    recipientName: recipient.name,
    title: notification.title,
    body: notification.body,
    caso,
  };

  const attempts: { channel: ExternalChannel; run: () => Promise<string> }[] = [];
  if (recipient.email && (!only || only === "email")) {
    if (smtpConfigured()) {
      attempts.push({
        channel: "email",
        run: () => sendSmtp(recipient.email, renderEmail(message)),
      });
    } else if (webhookUrl) {
      attempts.push({
        channel: "email",
        run: () =>
          postWebhook(
            webhookUrl,
            buildExternalPayload({
              notificationId,
              recipient,
              title: notification.title,
              body: notification.body,
              ticketNumber: notification.ticket?.number,
              channel: "email",
              caso,
            }),
          ),
      });
    }
  }
  if (phone && (!only || only === "whatsapp")) {
    if (whatsappConfigured()) {
      attempts.push({
        channel: "whatsapp",
        run: () => sendWhatsAppCloud(phone, renderWhatsApp(message)),
      });
    } else if (webhookUrl) {
      attempts.push({
        channel: "whatsapp",
        run: () =>
          postWebhook(
            webhookUrl,
            buildExternalPayload({
              notificationId,
              recipient,
              title: notification.title,
              body: notification.body,
              ticketNumber: notification.ticket?.number,
              channel: "whatsapp",
              caso,
            }),
          ),
      });
    }
  }

  if (attempts.length === 0) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { externalStatus: "OMITIDO" },
    });
    return { ok: true, skipped: true };
  }

  let allOk = true;
  let lastError: string | undefined;
  for (const attempt of attempts) {
    try {
      const response = await attempt.run();
      await logExternal(true, notificationId, notification.title, attempt.channel, { response });
    } catch (error) {
      allOk = false;
      lastError = error instanceof Error ? error.message : "Error de red";
      await logExternal(false, notificationId, notification.title, attempt.channel, {
        error: lastError,
      });
    }
  }
  await prisma.notification.update({
    where: { id: notificationId },
    data: { externalStatus: allOk ? "ENVIADO" : "ERROR" },
  });
  return { ok: allOk, skipped: false, error: lastError };
}

export async function notifyUser(input: NotifyInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      ticketId: input.ticketId ?? null,
      title: input.title,
      body: input.body,
      externalStatus: externalNotificationsEnabled() ? "PENDIENTE" : null,
    },
  });
  if (externalNotificationsEnabled()) {
    await dispatchExternal(notification.id).catch(() => undefined);
  }
  return notification;
}
