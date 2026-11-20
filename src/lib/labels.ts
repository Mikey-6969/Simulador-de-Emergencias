import { Priority, Role, TicketStatus, Zone } from "@prisma/client";

export const roleLabel: Record<Role, string> = {
  CLIENTE: "Cliente",
  TECNICO: "Técnico",
  COORDINADOR: "Coordinador",
  ADMIN: "Administrador",
};

export const statusLabel: Record<TicketStatus, string> = {
  NUEVA: "Nueva",
  EN_ANALISIS_IA: "En análisis IA",
  DIAGNOSTICO_REMOTO: "Diagnóstico remoto",
  PENDIENTE_ESCALAMIENTO: "Pendiente escalamiento",
  ESCALADA: "Escalada",
  ASIGNADA: "Asignada",
  VISITA_PROGRAMADA: "Visita programada",
  EN_ATENCION: "En atención",
  CERRADA: "Cerrada",
  CANCELADA: "Cancelada",
};

export const priorityLabel: Record<Priority, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

export const zoneLabel: Record<Zone, string> = {
  NORTE: "Zona Norte",
  SUR: "Zona Sur",
  ORIENTE: "Zona Oriente",
  OCCIDENTE: "Zona Occidente",
};

export const serviceTypes = [
  "Redes / Internet",
  "Hardware / Equipos",
  "Software / Aplicaciones",
  "Impresoras / POS",
  "Correo / Cuentas",
  "Otro",
];
