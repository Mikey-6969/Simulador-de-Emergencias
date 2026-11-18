# ASMS Fanalca — mapa autenticado

**Fecha:** 2026-11-18  
**Cuenta intentada:** `soporteticbogota2.cgs@ciudadlimpia.com.co`  
**Método:** Office 365 (botón inferior), tenant branding **Kumo 2.0** / ciudadlimpia

## Resultado

**Login fallido antes de MFA.**

Microsoft muestra:

> Your account or password is incorrect. If you don't remember your password, reset it now.

- El correo es reconocido (pasa a pantalla de password del tenant Kumo 2.0).
- La contraseña enviada se tipeó completa (17 caracteres) y fue rechazada.
- **No apareció el doble factor** porque la autenticación no llegó a esa etapa.

Capturas:

- `/opt/cursor/artifacts/asms-o365b-2-email.png`
- `/opt/cursor/artifacts/asms-o365b-5-after-submit.png`
- `/opt/cursor/artifacts/asms-o365-error.png`

## Intentos previos

- ARANDA local: `Authentication failed, verify the data`
- Office 365 (intento anterior): mismo error de password

## Pendiente para mapear (requiere login OK)

### Especialista
- Menú / bandeja / columnas / filtros / estados
- Detalle de caso (pestañas, historial, adjuntos, asignación, SLA)

### Cliente
- Home / crear caso / mis solicitudes / base de conocimiento

## Acción requerida

Confirmar o enviar **contraseña correcta** de Office 365 para esa cuenta (o reset). Cuando Microsoft acepte la clave, aparecerá MFA y se podrá completar el mapeo.
