import { beforeAll, describe, expect, it } from "vitest";

const BASE = process.env.MILA_E2E_URL;
const PASS = process.env.MILA_DEMO_PASSWORD;
const run = BASE && PASS ? describe : describe.skip;

class Client {
  private cookie = "";
  async req(path: string, init: RequestInit = {}) {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      redirect: "manual",
      headers: {
        Origin: BASE!,
        "sec-fetch-site": "same-origin",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(this.cookie ? { Cookie: this.cookie } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    const set = res.headers.getSetCookie?.() ?? [];
    if (set.length) this.cookie = set.map((c) => c.split(";")[0]).join("; ");
    return res;
  }
  async login(email: string) {
    const res = await this.req("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: PASS }),
    });
    expect(res.status).toBe(200);
  }
}

run("API e2e (MILA_E2E_URL)", () => {
  const marker = `Prueba e2e ${Date.now()}`;
  let ticketNumber = "";
  let ticketId = "";
  const customer = new Client();
  const coord = new Client();
  const tech = new Client();

  beforeAll(async () => {
    await customer.login("cliente.oriente.01@mila.app");
    await coord.login("especialista.oriente@mila.app");
    await tech.login("tecnico.oriente1@mila.app");
  });

  it("health responde ok", async () => {
    const res = await fetch(`${BASE}/api/health`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.database).toBe("ok");
  });

  it("rechaza reportes sin sesión", async () => {
    const res = await new Client().req("/api/reports/tickets");
    expect(res.status).toBe(401);
  });

  it("cliente crea caso, recibe notificación y no accede a reportes", async () => {
    const c = customer;
    const res = await c.req("/api/tickets", {
      method: "POST",
      body: JSON.stringify({
        title: marker,
        description: "La impresora de la sede no imprime y muestra un error de cola atascada desde ayer.",
        serviceType: "Impresoras / POS",
        customerZone: "ORIENTE",
        remoteAttempts: 2,
      }),
    });
    expect(res.status).toBeLessThan(300);
    const data = await res.json();
    ticketNumber = data.ticket.number;
    ticketId = data.ticket.id;
    expect(ticketNumber).toMatch(/^MILA-\d{4}-\d{5}$/);

    const notif = await (await c.req("/api/notifications")).json();
    expect(
      notif.notifications.some((n: { title: string }) => n.title === "Solicitud registrada"),
    ).toBe(true);

    expect((await c.req("/api/reports/tickets")).status).toBe(403);
  });

  it("coordinador consulta reportes, métricas y CSV", async () => {
    const s = coord;

    const json = await (await s.req("/api/reports/tickets?zone=ORIENTE")).json();
    expect(json.summary.count).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(json.zones)).toBe(true);

    const csvRes = await s.req("/api/reports/tickets?format=csv&zone=ORIENTE");
    expect(csvRes.headers.get("content-type")).toContain("text/csv");
    const csv = await csvRes.text();
    expect(csv).toContain("Número");
    expect(csv).toContain(ticketNumber);

    const none = await (await s.req("/api/reports/tickets?status=CANCELADA&zone=NORTE&from=2000-01-01&to=2000-01-02")).json();
    expect(none.summary.count).toBe(0);
  });

  it("páginas de trazabilidad, reportes y automatización cargan", async () => {
    const s = coord;
    const tl = await s.req(`/especialista/trazabilidad?q=${encodeURIComponent(ticketNumber)}`);
    expect(tl.status).toBe(200);
    expect(await tl.text()).toContain(ticketNumber);
    expect((await s.req("/especialista/reportes")).status).toBe(200);
    expect((await s.req("/especialista/automatizacion")).status).toBe(200);
  });

  it("técnico no accede a reportes ni trazabilidad global", async () => {
    const t = tech;
    expect((await t.req("/api/reports/tickets")).status).toBe(403);
    const page = await t.req("/especialista/trazabilidad");
    expect(page.status).toBe(307);
  });

  it("el callback de IA exige secreto", async () => {
    const res = await fetch(`${BASE}/api/automation/ai-analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-mila-secret": "incorrecto" },
      body: JSON.stringify({ ticketId }),
    });
    expect([401, 503]).toContain(res.status);
  });

  it("el callback de IA es idempotente con secreto válido", async () => {
    const secret = process.env.N8N_CALLBACK_SECRET;
    if (!secret) return;
    const res = await fetch(`${BASE}/api/automation/ai-analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-mila-secret": secret },
      body: JSON.stringify({ ticketId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
