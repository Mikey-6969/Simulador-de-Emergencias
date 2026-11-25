import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.MILA_BASE_URL || "http://127.0.0.1:3100";
const PASS = process.env.MILA_DEMO_PASSWORD?.trim();
if (!PASS || PASS.length < 10) {
  console.error("Set MILA_DEMO_PASSWORD before running screenshots.");
  process.exit(1);
}
const OUTS = ["/workspace/docs/entrega-sprint6/imagenes", "/opt/cursor/artifacts/entrega-sprint6"];
for (const o of OUTS) fs.mkdirSync(o, { recursive: true });
const EVID = ["/tmp/ev/evidencia_equipo.png", "/tmp/ev/evidencia_instalacion.png"];

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const context = await browser.newContext({
  viewport: { width: 1400, height: 1000 },
  timezoneId: "America/Bogota",
  locale: "es-CO",
});
const page = await context.newPage();

async function shot(name, locator) {
  await page.waitForTimeout(400);
  for (const o of OUTS) {
    if (locator) await locator.screenshot({ path: path.join(o, name) });
    else await page.screenshot({ path: path.join(o, name) });
  }
  console.log("SHOT", name);
}
async function login(email) {
  await context.clearCookies();
  const res = await context.request.post(`${BASE}/api/auth/login`, {
    data: { email, password: PASS },
    headers: { Origin: BASE, Referer: `${BASE}/login`, "sec-fetch-site": "same-origin" },
  });
  if (!res.ok()) throw new Error(`login ${email} ${res.status()}`);
}
async function api(method, url, data) {
  const res = await context.request.fetch(`${BASE}${url}`, {
    method,
    data,
    headers: { Origin: BASE, "sec-fetch-site": "same-origin", "Content-Type": "application/json" },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok()) throw new Error(`${method} ${url} ${res.status()} ${JSON.stringify(body)}`);
  return body;
}
function nextWeekdayLocal(daysAhead, hour) {
  const d = new Date(Date.now() + daysAhead * 86400000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:00`;
}

const CUSTOMER = "cliente.oriente.01@mila.app";
const COORD = "especialista.oriente@mila.app";
const caso = (title, description) => ({
  title,
  description,
  serviceType: "Hardware / Equipos",
  customerZone: "ORIENTE",
  remoteAttempts: 2,
});

try {
  // --- Datos previos: caso histórico cerrado del mismo cliente
  await login(CUSTOMER);
  const hist = (await api("POST", "/api/tickets", caso("Monitor sin señal en recepción", "El monitor de recepción no muestra imagen desde la mañana."))).ticket;
  await login(COORD);
  await api("POST", `/api/tickets/${hist.id}/escalate`, { reason: "Requiere revisión en sitio" });
  const histRec = (await api("POST", `/api/tickets/${hist.id}/recommend`, {})).recommendations[0];
  await api("POST", `/api/tickets/${hist.id}/assign`, { technicianProfileId: histRec.technicianProfileId });
  await login(histRec.technician.user.email);
  await api("POST", `/api/tickets/${hist.id}/attention`, {});
  await api("POST", `/api/tickets/${hist.id}/close`, {
    outcome: "RESUELTO",
    activities: "Revisión de cableado HDMI y fuente de poder.",
    diagnosis: "Cable HDMI deteriorado.",
    solution: "Se reemplazó el cable HDMI y se verificó la señal.",
  });

  // --- Caso principal de Sprint 6
  await login(CUSTOMER);
  const main = (await api("POST", "/api/tickets", caso("Impresora no imprime en sede Oriente", "La impresora de la sede Oriente no imprime desde hace dos horas y muestra error de cola atascada."))).ticket;
  const second = (await api("POST", "/api/tickets", caso("Equipo de caja no enciende", "El equipo de caja no enciende después de un corte de energía."))).ticket;
  await login(COORD);
  for (const t of [main, second]) await api("POST", `/api/tickets/${t.id}/escalate`, { reason: "Requiere visita presencial" });
  const rec = (await api("POST", `/api/tickets/${main.id}/recommend`, {})).recommendations[0];
  const techEmail = rec.technician.user.email;
  await api("POST", `/api/tickets/${main.id}/assign`, { technicianProfileId: rec.technicianProfileId });
  await api("POST", `/api/tickets/${second.id}/recommend`, {});
  await api("POST", `/api/tickets/${second.id}/assign`, { technicianProfileId: rec.technicianProfileId });

  // 01 detalle especialista con formulario de visita
  const slot = nextWeekdayLocal(2, 10);
  await page.goto(`${BASE}/especialista/casos/${main.id}`, { waitUntil: "networkidle" });
  await shot("01_especialista_programar_visita.png");

  // 02 programar visita (UI)
  await page.locator('input[type="datetime-local"]').first().fill(slot);
  await page.locator('input[placeholder^="Dirección"]').fill("Sede Oriente — Calle 80 # 20-15");
  await page.locator('textarea[placeholder="Notas para el técnico"]').fill("Llevar cable de poder y kit de limpieza de cabezales.");
  await page.getByRole("button", { name: "Confirmar visita" }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/especialista/casos/${main.id}`, { waitUntil: "networkidle" });
  await shot("02_visita_programada_reprogramar_cancelar.png");

  // 03 conflicto de agenda
  await page.goto(`${BASE}/especialista/casos/${second.id}`, { waitUntil: "networkidle" });
  await page.locator('input[type="datetime-local"]').first().fill(nextWeekdayLocal(2, 10));
  await page.getByRole("button", { name: "Confirmar visita" }).click();
  await page.waitForTimeout(1200);
  await shot("03_conflicto_agenda.png");

  // 04 agenda semanal (coordinador)
  const monday = (() => {
    const d = new Date(Date.now() + 2 * 86400000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  await page.goto(`${BASE}/especialista/agenda?semana=${monday}`, { waitUntil: "networkidle" });
  await shot("04_agenda_semanal_coordinador.png");

  // Técnico
  await login(techEmail);
  await page.goto(`${BASE}/especialista?vista=mios`, { waitUntil: "networkidle" });
  await shot("05_tecnico_bandeja.png");
  await page.goto(`${BASE}/especialista/casos/${main.id}`, { waitUntil: "networkidle" });
  const hist1 = page.getByText("Antecedentes del cliente");
  await hist1.scrollIntoViewIfNeeded();
  await shot("06_tecnico_detalle_antecedentes.png");

  await page.getByRole("button", { name: "Iniciar atención" }).click();
  await page.waitForTimeout(1200);
  await page.goto(`${BASE}/especialista/casos/${main.id}`, { waitUntil: "networkidle" });
  await page.locator("select.mila-select").first().selectOption("RESUELTO");
  await page.locator('textarea[placeholder="Actividades realizadas"]').fill("Se revisó la cola de impresión, se limpió el cabezal y se probó impresión desde dos equipos.");
  await page.locator('textarea[placeholder="Diagnóstico en campo"]').fill("Controlador de impresión corrupto y rodillo de arrastre con residuos de papel.");
  await page.locator('textarea[placeholder="Solución aplicada"]').fill("Reinstalación del controlador, limpieza del rodillo y prueba de impresión satisfactoria.");
  await page.locator('input[placeholder^="Tiempo empleado"]').fill("45");
  await page.locator('input[placeholder^="Recibido por"]').fill("Ana Gómez (recepción)");
  await page.locator('textarea[placeholder^="Repuestos"]').fill("Kit de limpieza de rodillos.");
  await page.locator('textarea[placeholder^="Recomendaciones"]').fill("Programar mantenimiento preventivo trimestral.");
  await page.getByLabel("El cliente confirma conformidad con el servicio").check();
  await page.locator('input[type="file"]').setInputFiles(EVID);
  await page.waitForTimeout(600);
  const closeBlock = page.locator("div.rounded-2xl", { hasText: "Atención en campo" }).first();
  await closeBlock.scrollIntoViewIfNeeded();
  await shot("07_tecnico_cierre_extendido_evidencias.png");

  await page.getByRole("button", { name: "Registrar cierre" }).click();
  await page.waitForTimeout(1500);
  await page.goto(`${BASE}/especialista/casos/${main.id}`, { waitUntil: "networkidle" });
  const ultimo = page.getByText("Último cierre");
  await ultimo.scrollIntoViewIfNeeded();
  await shot("08_cierre_registrado_con_evidencias.png");

  // Formato de cierre
  await login(COORD);
  await page.goto(`${BASE}/especialista/casos/${main.id}/cierre`, { waitUntil: "networkidle" });
  await shot("09_formato_cierre_imprimible.png");

  // Cliente: notificaciones y caso
  await login(CUSTOMER);
  await page.goto(`${BASE}/cliente/casos/${main.id}`, { waitUntil: "networkidle" });
  await page.locator("header button, button").filter({ hasText: /🔔|Notif|Avisos|\d+/ }).first().click().catch(() => {});
  await page.waitForTimeout(600);
  await shot("10_cliente_caso_cerrado_notificaciones.png");

  console.log("MAIN", main.number, "HIST", hist.number, "TECH", techEmail);
} finally {
  await browser.close();
}
