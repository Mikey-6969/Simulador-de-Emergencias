# Catálogo de usuarios MILA (sin secretos)

Contraseñas **nunca** van en el repo. En laboratorio/hosting usa el secret `MILA_DEMO_PASSWORD`.
En la app publicada: entra como ADMIN → `/especialista/usuarios` → “Cargar catálogo demo”.

## Roles esperados tras el seed

| Rol | Cantidad | Patrón de correo |
|-----|----------|------------------|
| ADMIN | 1 | `admin@mila.app` |
| COORDINADOR | 4 | `especialista.{norte\|sur\|oriente\|occidente}@mila.app` |
| TECNICO | 8 | `tecnico.{zona}{1\|2}@mila.app` |
| CLIENTE | 40 | `cliente.{zona}.{01–10}@mila.app` |

## Primer acceso en la app publicada (login roto → checklist)

El error *"Revisa la configuración del servidor"* casi siempre es **AUTH_SECRET faltante**.
Sin `MILA_DEMO_PASSWORD` la BD hospedada no tiene `cliente.*@mila.app`.

1. En Cursor → Secrets / Publish Settings agrega:
   - `AUTH_SECRET` (≥16 caracteres, obligatorio)
   - `MILA_DEMO_PASSWORD` (≥10) — misma contraseña para el catálogo demo
   - `MILA_ADMIN_EMAIL` + `MILA_ADMIN_PASSWORD` (≥10) — primer ADMIN
2. Confirma el **publish** pendiente (la app debe redeployar con secrets).
3. Abre `https://suport-mila.apps.grok.bot/api/health` — debe mostrar:
   - `authSecret: "configured"`
   - `demoSeedSecret: "configured"`
   - `database: "ok"`
4. Login (tras el primer intento, el server siembra el catálogo si hay `MILA_DEMO_PASSWORD`):
   - Demo: `cliente.oriente.01@mila.app` + el valor de `MILA_DEMO_PASSWORD`
   - Admin: el correo de `MILA_ADMIN_EMAIL` + `MILA_ADMIN_PASSWORD`
5. ADMIN → `/especialista/usuarios` para crear usuarios o resetear contraseñas.

## Nota sobre acceso SQL

La base Postgres de Cursor Apps **no** entrega `DATABASE_URL` al operador por chat ni panel de connection string. La validación práctica es la pantalla de usuarios / API admin.
