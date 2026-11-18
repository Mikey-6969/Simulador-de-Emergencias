# Credenciales MILA (catálogo demo)

Contraseña común de todas las cuentas:

```
MilaZona2026*
```

## Admin

| Correo | Rol |
|--------|-----|
| admin@mila.app | ADMIN |

## Especialistas (1 por zona)

Escalan cuando el técnico de campo no puede resolver.

| Correo | Zona |
|--------|------|
| especialista.norte@mila.app | Norte |
| especialista.sur@mila.app | Sur |
| especialista.oriente@mila.app | Oriente |
| especialista.occidente@mila.app | Occidente |

## Técnicos (2 por zona)

| Correo | Zona |
|--------|------|
| tecnico.norte1@mila.app | Norte |
| tecnico.norte2@mila.app | Norte |
| tecnico.sur1@mila.app | Sur |
| tecnico.sur2@mila.app | Sur |
| tecnico.oriente1@mila.app | Oriente |
| tecnico.oriente2@mila.app | Oriente |
| tecnico.occidente1@mila.app | Occidente |
| tecnico.occidente2@mila.app | Occidente |

## Clientes (10 por zona)

Patrón: `cliente.<zona>.<01-10>@mila.app`

### Norte
cliente.norte.01@mila.app … cliente.norte.10@mila.app

### Sur
cliente.sur.01@mila.app … cliente.sur.10@mila.app

### Oriente
cliente.oriente.01@mila.app … cliente.oriente.10@mila.app

### Occidente
cliente.occidente.01@mila.app … cliente.occidente.10@mila.app

## Cargar / refrescar en base de datos

```bash
MILA_DEMO_PASSWORD='MilaZona2026*' npm run db:seed
```
