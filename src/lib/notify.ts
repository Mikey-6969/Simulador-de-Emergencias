import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { signBody } from "./n8n";

export type NotifyInput = {
  userId: string;
  ticketId?: string | null;
  title: string;
  body: string;
};

export function buildExternalPayload(input: {
  notificationId: string;
  recipient: { email: string; name: string };
  title: string;
  body: string;
  ticketNumber?: string | null;
}) {
  return {
    channel: "email",
    notificationId: input.notificationId,
    to: input.recipient.email,
    toName: input.recipient.name,
    subject: `[MILA] ${input.title}`,
    title: input.title,
    body: input.body,
    ticketNumber: input.ticketNumber ?? null,
    sentAt: new Date().toISOString(),
  };
}

export function externalNotificationsEnabled() {
  return Boolean(process.env.NOTIFY_WEBHOOK_URL?.trim());
}

async function logExternal(
  success: boolean,
  notificationId: string,
  title: string,
  detail: { response?: string; error?: string },
) {
  await prisma.automationLog.create({
    data: {
      flow: "notification.external",
      success,
      payload: { notificationId, title: title.slice(0, 120), channel: "email" } as Prisma.InputJsonValue,
      response: detail.response?.slice(0, 1000),
      error: detail.error,
    },
  });
}

export async function dispatchExternal(notificationId: string) {
  const notification = await prisma.notification.findUniqueOrThrow({
    where: { id: notificationId },
    include: {
      user: { select: { email: true, name: true } },
      ticket: { select: { number: true } },
    },
  });
  const url = process.env.NOTIFY_WEBHOOK_URL?.trim();
  if (!url) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { externalStatus: "OMITIDO" },
    });
    return { ok: true, skipped: true };
  }

  const body = JSON.stringify(
    buildExternalPayload({
      notificationId,
      recipient: notification.user,
      title: notification.title,
      body: notification.body,
      ticketNumber: notification.ticket?.number,
    }),
  );
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = process.env.N8N_WEBHOOK_SECRET?.trim();
  if (secret) headers["x-mila-signature"] = signBody(body, secret);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(6000),
    });
    const text = await res.text();
    await prisma.notification.update({
      where: { id: notificationId },
      data: { externalStatus: res.ok ? "ENVIADO" : "ERROR" },
    });
    await logExternal(res.ok, notificationId, notification.title, {
      response: text,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    });
    return { ok: res.ok, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de red";
    await prisma.notification.update({
      where: { id: notificationId },
      data: { externalStatus: "ERROR" },
    });
    await logExternal(false, notificationId, notification.title, { error: message });
    return { ok: false, skipped: false, error: message };
  }
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
