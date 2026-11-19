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

## Primer acceso en la app publicada

1. En Cursor Secrets / Publish Settings define:
   - `AUTH_SECRET` (≥16 chars)
   - `MILA_ADMIN_EMAIL` + `MILA_ADMIN_PASSWORD` (≥10) — crea el primer ADMIN al login
   - `MILA_DEMO_PASSWORD` (≥10) — para el catálogo demo
2. Confirma el publish pendiente para que la app tome el código nuevo.
3. Inicia sesión con el correo admin del secret.
4. Abre `/especialista/usuarios`:
   - **Cargar catálogo demo** (opcional)
   - **Crear usuario** (email, nombre, rol, zona, contraseña)
   - **Cambiar / reset** en cada fila para actualizar contraseña

## Nota sobre acceso SQL

La base Postgres de Cursor Apps **no** entrega `DATABASE_URL` al operador por chat ni panel de connection string. La validación práctica es la pantalla de usuarios / API admin.
