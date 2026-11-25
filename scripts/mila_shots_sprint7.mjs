import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const BASE = process.env.MILA_BASE_URL || "http://127.0.0.1:3100";
const PASS = process.env.MILA_DEMO_PASSWORD?.trim();
if (!PASS || PASS.length < 10) {
  console.error("Set MILA_DEMO_PASSWORD");
  process.exit(1);
}
const STUB = "/tmp/notify_stub.mjs";
const OUTS = ["/workspace/docs/entrega-sprint7/imagenes", "/opt/cursor/artifacts/entrega-sprint7"];
for (const o of OUTS) fs.mkdirSync(o, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const context = await browser.newContext({
  viewport: { width: 1400, height: 1000 },
  timezoneId: "America/Bogota",
  locale: "es-CO",
  acceptDownloads: true,
});
const page = await context.newPage();

async function shot(name, locator, fullPage = false) {
  await page.waitForTimeout(500);
  for (const o of OUTS) {
    if (locator) await locator.screenshot({ path: path.join(o, name) });
    else await page.screenshot({ path: path.join(o, name), fullPage });
  }
  console.log("SHOT", name);
}
let current = null;
async function login(email) {
  if (current === email) return;
  current = email;
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

const COORD = "especialista.oriente@mila.app";
const mk = (zone, serviceType, title, description, priority) => ({
  title,
  description,
  serviceType,
  customerZone: zone,
  priority,
  remoteAttempts: 2,
});
const CASES = [
  ["oriente", mk("ORIENTE", "Hardware / Equipos", "Impresora no imprime en sede Oriente", "La impresora de la sede Oriente no imprime desde hace dos horas y muestra error de cola atascada.", "ALTA"), "close"],
  ["oriente", mk("ORIENTE", "Impresoras / POS", "Equipo de caja no enciende", "El equipo de caja no enciende después de un corte de energía y bloquea la atención.", "CRITICA"), "assign"],
  ["norte", mk("NORTE", "Redes / Internet", "Sin internet en la sucursal Norte", "Desde esta mañana no hay conexión a internet en toda la sucursal; el router muestra luz roja.", "ALTA"), "close"],
  ["norte", mk("NORTE", "Software / Aplicaciones", "Aplicación contable se cierra sola", "La aplicación contable se cierra al generar reportes mensuales y muestra un mensaje de error.", "MEDIA"), "none"],
  ["sur", mk("SUR", "Correo / Cuentas", "Cuenta de correo bloqueada", "La cuenta de correo del gerente aparece bloqueada desde ayer y no puede iniciar sesión.", "MEDIA"), "close"],
  ["sur", mk("SUR", "Redes / Internet", "Wi-Fi intermitente en bodega", "El Wi-Fi de la bodega se cae a veces durante el día y afecta los lectores de código.", "BAJA"), "escalate"],
];

try {
  // Con el receptor de notificaciones apagado, los envíos externos fallan (evidencia de PB-026).
  spawnSync("pkill", ["-f", "notify_stub"]);
  const created = [];
  for (const [zona, body, plan] of CASES) {
    await login(`cliente.${zona}.01@mila.app`);
    const t = (await api("POST", "/api/tickets", body)).ticket;
    created.push({ t, plan });
  }
  await new Promise((r) => setTimeout(r, 4000));

  await login(COORD);
  for (const { t, plan } of created) {
    if (plan === "none") continue;
    await api("POST", `/api/tickets/${t.id}/escalate`, { reason: "Requiere visita presencial" });
    if (plan === "escalate") continue;
    const rec = (await api("POST", `/api/tickets/${t.id}/recommend`, {})).recommendations[0];
    await api("POST", `/api/tickets/${t.id}/assign`, { technicianProfileId: rec.technicianProfileId });
    t.techEmail = rec.technician.user.email;
  }
  for (const { t, plan } of created) {
    if (plan !== "close") continue;
    await login(t.techEmail);
    await api("POST", `/api/tickets/${t.id}/attention`, {});
    await api("POST", `/api/tickets/${t.id}/close`, {
      outcome: "RESUELTO",
      activities: "Diagnóstico en sitio y pruebas de funcionamiento del equipo afectado.",
      diagnosis: "Falla identificada en el componente principal del servicio.",
      solution: "Se reemplazó o reconfiguró el componente y se verificó el servicio con el cliente.",
    });
  }
  spawnSync("npx", ["tsx", "scripts/demo_backdate.ts"], { stdio: "inherit", cwd: "/workspace" });

  // PB-022 línea de tiempo global
  await login(COORD);
  await page.goto(`${BASE}/especialista/trazabilidad`, { waitUntil: "networkidle" });
  await shot("01_linea_tiempo_global.png");
  await page.goto(`${BASE}/especialista/trazabilidad?type=ESCALATED&zone=SUR`, { waitUntil: "networkidle" });
  await shot("02_linea_tiempo_filtrada.png");

  // PB-023/024 flujo n8n + IA delegada
  const main = created[0].t;
  await page.goto(`${BASE}/especialista/casos/${main.id}`, { waitUntil: "networkidle" });
  const tl = page.getByRole("heading", { name: "Timeline" }).locator("..");
  await tl.scrollIntoViewIfNeeded();
  await shot("03_caso_timeline_ia_delegada_n8n.png", tl);

  // PB-026 logs + errores + reintento
  await page.goto(`${BASE}/especialista/automatizacion`, { waitUntil: "networkidle" });
  await shot("04_logs_automatizacion.png");
  await page.goto(`${BASE}/especialista/automatizacion?flow=notification.external&estado=error`, { waitUntil: "networkidle" });
  await shot("05_logs_errores_notificacion_externa.png");

  // PB-025 notificación externa: se enciende el receptor y se reintenta desde la UI
  spawnSync("sh", ["-c", `rm -f /tmp/notify.log; nohup node ${STUB} >/dev/null 2>&1 &`]);
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Reintentar" }).first().click();
  await page.waitForTimeout(2500);
  await page.goto(`${BASE}/especialista/automatizacion?flow=notification.external`, { waitUntil: "networkidle" });
  await shot("06_reintento_notificacion_externa.png");

  // PB-027/028 reportes y métricas
  await page.goto(`${BASE}/especialista/reportes`, { waitUntil: "networkidle" });
  await shot("07_reportes_metricas.png", null, true);
  await page.goto(`${BASE}/especialista/reportes?zone=NORTE&status=CERRADA`, { waitUntil: "networkidle" });
  await shot("08_reportes_filtrados_zona_estado.png", null, true);

  const csvRes = await context.request.get(`${BASE}/api/reports/tickets?format=csv`, { headers: { Origin: BASE } });
  const csv = (await csvRes.text()).replace(/^\uFEFF/, "").split("\r\n").slice(0, 8).join("\n");
  await page.setContent(`<body style="margin:0;background:#0b1620;color:#d7e3ee;font:13px/1.5 ui-monospace,monospace;padding:28px;width:1340px"><div style="color:#2dd4bf;margin-bottom:10px">GET /api/reports/tickets?format=csv &rarr; mila-reporte.csv (primeras filas)</div><pre style="white-space:pre-wrap;word-break:break-all">${csv.replace(/</g, "&lt;")}</pre></body>`);
  await shot("09_exportacion_csv.png");

  console.log("OK", created.map((c) => c.t.number).join(","));
} finally {
  await browser.close();
}
