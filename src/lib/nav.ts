import type { Role } from "@prisma/client";

export type NavItem = { href: string; label: string; section?: string };

export function specialistNav(role: Role): NavItem[] {
  const manage = role === "COORDINADOR" || role === "ADMIN";
  const items: NavItem[] = [
    { href: "/especialista", label: "Casos abiertos", section: "Casos" },
    { href: "/especialista?vista=mios", label: "Asignados a mí" },
    ...(role !== "TECNICO" ? [{ href: "/especialista/nuevo", label: "Crear caso" }] : []),
    { href: "/especialista/agenda", label: "Agenda semanal", section: "Visitas" },
  ];
  if (manage) {
    items.push(
      { href: "/especialista/tecnicos", label: "Técnicos / zonas", section: "Operación" },
      { href: "/especialista/automatizacion", label: "Logs n8n / IA" },
    );
  }
  if (role === "ADMIN") {
    items.push({ href: "/especialista/usuarios", label: "Usuarios (BD)", section: "Admin" });
  }
  return items;
}
