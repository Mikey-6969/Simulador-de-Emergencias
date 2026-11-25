// Flujo de prueba: crea cliente y técnico reales, genera un caso y lo avanza hasta el cierre.
// Uso: MILA_URL=http://localhost:3100 ADMIN_EMAIL=... ADMIN_PASS=... USER_PASS=... node scripts/demo_notificaciones_canales.mjs
import pg from "pg";

const BASE = process.env.MILA_URL ?? "http://localhost:3100";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASS = process.env.ADMIN_PASS;
const USER_PASS = process.env.USER_PASS;
const SCHEMA = process.env.PG_SCHEMA;
const CLIENT = { email: "maperdomom@itc.edu.co", name: "Michael Perdomo", phone: "3212777107", role: "CLIENTE", zone: "ORIENTE" };
const TECH = { email: "lvzambranoc@itc.edu.co", name: "Laura Valentina Zambrano", phone: "3206990305", role: "TECNICO", zone: "ORIENTE" };

class C {
  cookie = "";
  async req(path, init = {}) {
    const res = await fetch(BASE + path, {
      ...init,
      redirect: "manual",
      headers: {
        Origin: BASE,
        "sec-fetch-site": "same-origin",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(this.cookie ? { Cookie: this.cookie } : {}),
      },
    });
    const set = res.headers.getSetCookie?.() ?? [];
    if (set.length) this.cookie = set.map((c) => c.split(";")[0]).join("; ");
    return res;
  }
  async login(email, password) {
    const r = await this.req("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    if (r.status !== 200) throw new Error(`login ${email} ${r.status}`);
  }
  async json(path, body) {
    const r = await this.req(path, { method: "POST", body: JSON.stringify(body) });
    const t = await r.text();
    if (r.status >= 300) throw new Error(`${path} ${r.status} ${t.slice(0, 200)}`);
    return JSON.parse(t);
  }
}

const admin = new C();
await admin.login(ADMIN_EMAIL, ADMIN_PASS);
for (const u of [CLIENT, TECH]) {
  const r = await admin.req("/api/admin/users", { method: "POST", body: JSON.stringify({ ...u, password: USER_PASS }) });
  console.log("crear", u.email, r.status);
}

const customer = new C();
await customer.login(CLIENT.email, USER_PASS);
const created = await customer.json("/api/tickets", {
  title: "Prueba de notificaciones MILA",
  description: "La impresora de caja no imprime facturas y muestra error de cola atascada desde esta mañana.",
  serviceType: "Impresoras / POS",
  customerZone: "ORIENTE",
  remoteAttempts: 2,
});
const ticket = created.ticket;
console.log("caso", ticket.number);

const coord = new C();
await coord.login("especialista.oriente@mila.app", process.env.COORD_PASS ?? USER_PASS);
await coord.json(`/api/tickets/${ticket.id}/escalate`, { reason: "Requiere visita presencial al punto de venta." });

const db = new pg.Client({ connectionString: process.env.PG_URL });
await db.connect();
if (SCHEMA) await db.query(`set search_path to ${SCHEMA}`);
const prof = await db.query(`select tp.id from "TechnicianProfile" tp join "User" u on u.id=tp."userId" where u.email=$1`, [TECH.email]);
await db.end();
await coord.json(`/api/tickets/${ticket.id}/assign`, { technicianProfileId: prof.rows[0].id });

const tech = new C();
await tech.login(TECH.email, USER_PASS);
await tech.json(`/api/tickets/${ticket.id}/close`, {
  outcome: "RESUELTO",
  activities: "Revisión de la impresora, limpieza de la cola de impresión y reinstalación del controlador.",
  diagnosis: "Cola de impresión atascada por controlador corrupto.",
  solution: "Se reinstaló el controlador y se verificó la impresión de facturas.",
  timeSpentMinutes: 45,
  customerConfirmed: true,
});
console.log("flujo completo", ticket.number);
