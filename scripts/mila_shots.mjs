import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.MILA_BASE_URL || "http://127.0.0.1:3000";
const PASS = process.env.MILA_DEMO_PASSWORD?.trim();
if (!PASS || PASS.length < 10) {
  console.error("Set MILA_DEMO_PASSWORD in the environment before running screenshots.");
  process.exit(1);
}
const OUTS = [
  "/workspace/docs/entrega-sprint5/imagenes",
  "/opt/cursor/artifacts/entrega-sprint5",
];
for (const o of OUTS) fs.mkdirSync(o, { recursive: true });

async function shot(page, name) {
  await page.waitForTimeout(300);
  for (const o of OUTS) {
    await page.screenshot({ path: path.join(o, name), fullPage: false });
  }
  console.log("SHOT", name, page.url());
}

async function loginViaApi(context, email) {
  const res = await context.request.post(`${BASE}/api/auth/login`, {
    data: { email, password: PASS },
    headers: {
      Origin: BASE,
      Referer: `${BASE}/login`,
      "sec-fetch-site": "same-origin",
    },
  });
  const body = await res.json();
  console.log("LOGIN", email, res.status(), body.redirectTo || body.error);
  if (!res.ok) throw new Error(body.error || "login failed");
  return body.redirectTo;
}

async function logout(context) {
  await context.request
    .post(`${BASE}/api/auth/logout`, {
      headers: { Origin: BASE, "sec-fetch-site": "same-origin" },
    })
    .catch(() => {});
  await context.clearCookies();
}

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();
let caseNumber = "unknown";
let ticketId = null;

try {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await shot(page, "01_landing.png");

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.locator('input[autocomplete="username"]').fill("cliente.oriente.01@mila.app");
  await page.locator('input[autocomplete="current-password"]').fill(PASS);
  await shot(page, "02_login_cliente.png");

  await loginViaApi(context, "cliente.oriente.01@mila.app");
  await page.goto(`${BASE}/cliente`, { waitUntil: "networkidle" });
  await shot(page, "03_cliente_home.png");

  await page.goto(`${BASE}/cliente/registrar`, { waitUntil: "networkidle" });
  await shot(page, "04_registrar_paso_servicio.png");
  await page.getByRole("button", { name: /Hardware \/ Equipos/i }).click();
  await page.waitForTimeout(400);
  await shot(page, "05_registrar_paso_zona.png");
  await page.getByRole("button", { name: /Zona Oriente/i }).click();
  await page.waitForTimeout(400);

  await page.locator("input.mila-input").first().fill("Impresora no imprime en sede Oriente");
  await page
    .locator("textarea.mila-textarea")
    .fill(
      "La impresora de la sede Oriente no imprime desde hace dos horas. Aparece error de cola atascada. Ya reinicié el equipo y la impresora sin éxito.",
    );
  await page.locator("select.mila-select").selectOption("ALTA");
  await shot(page, "06_registrar_detalle.png");

  await page.getByRole("button", { name: /Ver recomendaciones/i }).click();
  await page.waitForTimeout(2500);
  await shot(page, "07_prediagnostico.png");

  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: /Lo intenté y no se resolvió/i }).click();
    await page.waitForTimeout(250);
  }
  await shot(page, "07b_prediagnostico_intentos.png");

  await page.getByRole("button", { name: /^Crear caso$/i }).click();
  await page.waitForTimeout(3000);
  // may redirect to mis-casos or stay
  await shot(page, "08_caso_creado.png");
  let body = await page.locator("body").innerText();
  let m = body.match(/MILA-\d{4}-\d+/i);
  if (!m) {
    await page.goto(`${BASE}/cliente/mis-casos`, { waitUntil: "networkidle" });
    await shot(page, "08b_mis_casos.png");
    body = await page.locator("body").innerText();
    m = body.match(/MILA-\d{4}-\d+/i);
  }
  caseNumber = m ? m[0] : caseNumber;
  console.log("CASE", caseNumber);

  // resolve ticket id
  const ticketsRes = await context.request.get(`${BASE}/api/tickets`);
  const ticketsJson = await ticketsRes.json();
  const tickets = ticketsJson.tickets || [];
  const ticket = tickets.find((t) => t.number === caseNumber) || tickets[0];
  ticketId = ticket?.id;
  caseNumber = ticket?.number || caseNumber;
  console.log("TICKET", ticketId, caseNumber);

  await logout(context);
  await loginViaApi(context, "especialista.oriente@mila.app");
  await page.goto(`${BASE}/especialista`, { waitUntil: "networkidle" });
  await shot(page, "10_bandeja_especialista.png");

  if (ticketId) {
    await page.goto(`${BASE}/especialista/casos/${ticketId}`, { waitUntil: "networkidle" });
    await shot(page, "11_detalle_caso.png");

    const techRes = await context.request.get(`${BASE}/api/technicians`);
    const techJson = await techRes.json();
    const techList = techJson.technicians || [];
    const orienteTech =
      techList.find((t) => t.user?.email === "tecnico.oriente1@mila.app") ||
      techList.find((t) => JSON.stringify(t.zones || []).includes("ORIENTE"));
    console.log("TECH", orienteTech?.id, orienteTech?.user?.email);

    if (orienteTech?.id) {
      const assignRes = await context.request.post(`${BASE}/api/tickets/${ticketId}/assign`, {
        data: { technicianProfileId: orienteTech.id },
        headers: { Origin: BASE, "sec-fetch-site": "same-origin" },
      });
      console.log("ASSIGN", assignRes.status(), await assignRes.text());
    }

    // UI recommend if present
    const rec = page.getByRole("button", { name: /Recomend/i });
    if (await rec.count()) {
      await rec.first().click().catch(() => {});
      await page.waitForTimeout(800);
      await shot(page, "11b_recomendacion.png");
    }

    await page.reload({ waitUntil: "networkidle" });
    await shot(page, "11c_despues_asignar.png");
  }

  await logout(context);
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.locator('input[autocomplete="username"]').fill("tecnico.oriente1@mila.app");
  await page.locator('input[autocomplete="current-password"]').fill(PASS);
  await shot(page, "12_login_tecnico.png");

  await loginViaApi(context, "tecnico.oriente1@mila.app");
  await page.goto(`${BASE}/especialista`, { waitUntil: "networkidle" });
  await shot(page, "13_bandeja_tecnico.png");
  const tbody = await page.locator("body").innerText();
  console.log("TECNICO_HAS_CASE", tbody.includes(caseNumber));
  console.log("TECNICO_SNIP", tbody.slice(0, 600));

  if (ticketId) {
    await page.goto(`${BASE}/especialista/casos/${ticketId}`, { waitUntil: "networkidle" });
    await shot(page, "14_tecnico_detalle_caso.png");
  }
} catch (e) {
  console.error("ERR", e);
  await shot(page, "error_state.png");
} finally {
  await browser.close();
}
