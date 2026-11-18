# MILA — Arquitectura (entrega Sprint 5)

**MILA** = Mesa Inteligente de Logística y Atención (plataforma de mesa de ayuda).

## Stack elegido

| Capa | Tecnología | Motivo |
|------|------------|--------|
| Frontend + API | **Next.js (App Router) + TypeScript** | Una sola app desplegable, consolas cliente/especialista |
| UI | **Tailwind CSS** (diseño propio, sin Bootstrap) | Rápido, responsive, marca MILA |
| Datos | **MySQL / MariaDB + Prisma** | Pedido del proyecto + ORM tipado |
| Auth | Sesión JWT en cookie httpOnly (`jose` + `bcryptjs`) | Roles: cliente, técnico, coordinador, admin |
| Automatización | **n8n** vía webhooks | Nueva solicitud, escalamiento, asignación, cierre |
| Agente IA | API interna + hook n8n (o fallback local) | Diagnóstico remoto antes de visita |

## Consolas

1. **`/cliente`** — crear y consultar solicitudes (equivalente ASMS Customer).
2. **`/especialista`** — bandeja, estados, IA, escalar, técnicos, asignar (equivalente ASMS Specialist).

## Alcance Sprint 5 (Must)

- Auth + roles
- Solicitudes (alta, listado, detalle, estados)
- Análisis IA (automático al crear)
- Escalamiento con motivo
- Catálogo de técnicos (zona, capacidad, disponibilidad)
- Recomendación y asignación de técnico
- Webhooks n8n documentados + export de flujo
- Script MySQL (`prisma/schema` + `docs/sql/mila.sql`)

## Despliegue

1. Base MySQL con `DATABASE_URL`
2. `npx prisma db push` (o importar `docs/sql/mila.sql`)
3. `npm run build && npm start`
4. Variables: `DATABASE_URL`, `AUTH_SECRET`, `N8N_WEBHOOK_URL` (opcional), `OPENAI_API_KEY` (opcional)

## Nota ASMS Fanalca

Login de exploración falló (`Authentication failed` en ARANDA y error en Office 365). MILA se construye con el planteamiento universitario + patrón de dos consolas. Si luego hay usuario/contraseña válidos o capturas internas, se afinan pantallas.
