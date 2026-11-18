# MILA — Mesa de ayuda inteligente

Plataforma universitaria de soporte técnico con:

- Consola **cliente** y consola **especialista**
- Agente de **IA** para diagnóstico remoto
- Escalamiento, técnicos por zona y asignación
- Automatización con **n8n**
- Base de datos **MySQL**

## Stack

Next.js (App Router) · TypeScript · Prisma · MySQL · Tailwind · n8n webhooks

## Inicio rápido

```bash
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Cuentas demo

- `cliente@mila.app` / `Mila123*`
- `coord@mila.app` / `Mila123*`
- `tecnico.norte@mila.app` / `Mila123*`
- `admin@mila.app` / `Mila123*`

## Documentación

- `docs/REQUISITOS_LIMPIO.md` — requisitos consolidados
- `docs/ARQUITECTURA_MILA.md` — arquitectura
- `docs/SPRINT5_ENTREGA.md` — alcance y demo Sprint 5
- `docs/sql/mila.sql` — DDL MySQL
- `docs/n8n/mila-sprint5-workflow.json` — flujo n8n

## Variables

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | MySQL connection string |
| `AUTH_SECRET` | Firma de sesión JWT |
| `N8N_WEBHOOK_URL` | Webhook de eventos (opcional) |
| `OPENAI_API_KEY` | IA externa (opcional; hay fallback local) |
