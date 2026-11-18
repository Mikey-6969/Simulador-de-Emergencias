# Cuentas MILA (catálogo)

Las contraseñas y el listado operativo de cuentas **no** se publican en el repositorio.

Para entornos de laboratorio:

```bash
export MILA_DEMO_PASSWORD='…tu contraseña fuerte…'
export AUTH_SECRET='…secreto largo…'
npm run db:seed
```

El seed crea el catálogo (admin, especialistas, técnicos y clientes por zona). Las credenciales concretas se entregan por un canal privado al operador (archivo local fuera de git / secretos de Cursor), nunca en documentación pública.

En la app publicada configura solo secrets (`AUTH_SECRET`, y opcionalmente `MILA_DEMO_PASSWORD`, `OPENAI_API_KEY`, `N8N_WEBHOOK_URL`). El seed **no** corre en el build de producción.
