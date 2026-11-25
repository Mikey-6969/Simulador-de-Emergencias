/* Demo-only: spreads the timestamps of freshly created demo tickets so time metrics look realistic. */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "asc" },
    include: { timeline: true, assignments: true },
  });
  let i = 0;
  for (const t of tickets) {
    i += 1;
    const shiftMs = (i % 6 + 1) * 86_400_000 + i * 3_600_000;
    const stretch = 90 + i * 70;
    const base = t.createdAt.getTime();
    const map = (d: Date) => new Date(base - shiftMs + (d.getTime() - base) * stretch);
    await prisma.ticket.update({
      where: { id: t.id },
      data: { createdAt: map(t.createdAt), closedAt: t.closedAt ? map(t.closedAt) : null },
    });
    for (const e of t.timeline) {
      await prisma.timelineEvent.update({ where: { id: e.id }, data: { createdAt: map(e.createdAt) } });
    }
    for (const a of t.assignments) {
      await prisma.assignment.update({
        where: { id: a.id },
        data: { assignedAt: a.assignedAt ? map(a.assignedAt) : null },
      });
    }
  }
  console.log("backdated", tickets.length);
}

main().finally(() => prisma.$disconnect());
