import { TicketStatus, Priority } from "@prisma/client";
import { priorityLabel, statusLabel } from "@/lib/labels";

export function StatusChip({ status }: { status: TicketStatus }) {
  return <span className="mila-chip">{statusLabel[status]}</span>;
}

export function PriorityChip({ priority }: { priority: Priority }) {
  const tone =
    priority === "CRITICA"
      ? "border-[rgba(255,107,107,0.45)] text-[#ffb4b4]"
      : priority === "ALTA"
        ? "border-[rgba(240,163,94,0.45)] text-[#ffd2a8]"
        : "";
  return <span className={`mila-chip ${tone}`}>{priorityLabel[priority]}</span>;
}
