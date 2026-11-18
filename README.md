# MILA — Mesa de ayuda inteligente

Plataforma universitaria de soporte técnico con:

- Consola **cliente** y consola **especialista**
- Agente de **IA** para diagnóstico remoto
- Escalamiento, técnicos por zona y asignación
- Automatización con **n8n**
- Persistencia con **PostgreSQL** (runtime / Cursor Apps)
- DDL **MySQL** de entrega académica en `docs/sql/mila.sql`

## Stack

Next.js (App Router) · TypeScript · Prisma · PostgreSQL · Tailwind · n8n webhooks

## Inicio rápido

```bash
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Cuentas

Sin registro público. Catálogo y contraseñas en `docs/CREDENCIALES_DEMO.md`.

```bash
MILA_DEMO_PASSWORD='MilaZona2026*' npm run db:seed
```

## Documentación

- `docs/REQUISITOS_LIMPIO.md` — requisitos consolidados
- `docs/ARQUITECTURA_MILA.md` — arquitectura
- `docs/SPRINT5_ENTREGA.md` — alcance y demo Sprint 5
- `docs/N8N_CONEXION.md` — conectar webhook n8n + OpenAI
- `docs/sql/mila.sql` — DDL MySQL (entrega docente)
- `docs/n8n/mila-sprint5-workflow.json` — flujo n8n
- `docs/extracted/asms_authenticated_map.md` — referencia ASMS Fanalca

## Portales (patrón ASMS)

- Cliente: `/cliente` (tiles, búsqueda, wizard servicio→sede→detalle)
- Especialista: `/especialista` (sidebar, bandeja, crear caso, técnicos, logs n8n)

## n8n local

```bash
npm run n8n
# UI http://127.0.0.1:5678 — importar docs/n8n/mila-sprint5-workflow.json
```

## Docker opcional

```bash
docker compose up -d   # PostgreSQL + n8n
```

## Variables

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | PostgreSQL (Cursor Apps lo inyecta al publicar) |
| `AUTH_SECRET` | Firma de sesión JWT |
| `N8N_WEBHOOK_URL` | Webhook de eventos (opcional) |
| `OPENAI_API_KEY` | IA externa (opcional; hay fallback local) |
