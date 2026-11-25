"use client";

import { useMemo, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  zone: string | null;
  phone?: string | null;
  active: boolean;
};

const ROLES = ["CLIENTE", "TECNICO", "COORDINADOR", "ADMIN"] as const;
const ZONES = ["NORTE", "SUR", "ORIENTE", "OCCIDENTE"] as const;

export function UserAdminPanel({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("CLIENTE");
  const [zone, setZone] = useState<(typeof ZONES)[number]>("ORIENTE");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const needsZone = role !== "ADMIN";
  const sorted = useMemo(
    () =>
      [...users].sort((a, b) =>
        `${a.role}:${a.zone}:${a.email}`.localeCompare(`${b.role}:${b.zone}:${b.email}`),
      ),
    [users],
  );

  async function refresh() {
    const res = await fetch("/api/admin/users");
    if (!res.ok) return;
    const data = await res.json();
    setUsers(data.users || []);
  }

  async function createUser() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        role,
        zone: needsZone ? zone : null,
        password,
        phone: phone.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "No se pudo crear");
      return;
    }
    setMessage(`Usuario creado: ${data.user.email}`);
    setEmail("");
    setName("");
    setPassword("");
    setPhone("");
    await refresh();
  }

  async function resetUserPassword(userId: string) {
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/admin/users/${userId}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "No se pudo cambiar la contraseña");
      return;
    }
    setMessage(`Contraseña actualizada para ${data.email}`);
    setResetId(null);
    setResetPassword("");
  }

  return (
    <div className="space-y-6">
      <section className="mila-panel space-y-3 p-5">
        <h2 className="font-semibold">Crear usuario</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span>Correo</span>
            <input className="mila-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Nombre</span>
            <input className="mila-input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Rol</span>
            <select className="mila-select" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          {needsZone ? (
            <label className="block space-y-1 text-sm">
              <span>Zona</span>
              <select className="mila-select" value={zone} onChange={(e) => setZone(e.target.value as typeof zone)}>
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block space-y-1 text-sm">
            <span>Celular (WhatsApp)</span>
            <input
              className="mila-input"
              inputMode="tel"
              placeholder="3001234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block space-y-1 text-sm md:col-span-2">
            <span>Contraseña inicial (≥10)</span>
            <input
              className="mila-input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        </div>
        <button className="mila-btn mila-btn-primary" disabled={loading} onClick={createUser}>
          Crear usuario
        </button>
      </section>

      <section className="mila-panel overflow-x-auto">
        <div className="min-w-[860px]">
          <div
            className="grid grid-cols-[1.3fr_1.1fr_0.8fr_0.7fr_0.9fr_0.5fr_1.2fr] gap-2 border-b border-[var(--line)] px-4 py-3 text-[11px] uppercase tracking-[0.12em]"
            style={{ color: "var(--muted)" }}
          >
            <span>Correo</span>
            <span>Nombre</span>
            <span>Rol</span>
            <span>Zona</span>
            <span>Celular</span>
            <span>Activo</span>
            <span>Contraseña</span>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {sorted.length === 0 ? (
              <div className="px-4 py-8 text-sm" style={{ color: "var(--muted)" }}>
                No hay usuarios. Crea uno arriba o carga el catálogo demo.
              </div>
            ) : (
              sorted.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-[1.3fr_1.1fr_0.8fr_0.7fr_0.9fr_0.5fr_1.2fr] gap-2 px-4 py-3 text-sm"
                >
                  <span className="font-medium">{u.email}</span>
                  <span>{u.name}</span>
                  <span>{u.role}</span>
                  <span>{u.zone || "—"}</span>
                  <span>{u.phone || "—"}</span>
                  <span>{u.active ? "Sí" : "No"}</span>
                  <div className="space-y-2">
                    {resetId === u.id ? (
                      <>
                        <input
                          className="mila-input"
                          type="password"
                          placeholder="Nueva contraseña (≥10)"
                          autoComplete="new-password"
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="mila-btn mila-btn-primary"
                            disabled={loading}
                            onClick={() => resetUserPassword(u.id)}
                          >
                            Guardar
                          </button>
                          <button
                            className="mila-btn mila-btn-ghost"
                            disabled={loading}
                            onClick={() => {
                              setResetId(null);
                              setResetPassword("");
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        className="mila-btn mila-btn-ghost"
                        disabled={loading}
                        onClick={() => {
                          setResetId(u.id);
                          setResetPassword("");
                        }}
                      >
                        Cambiar / reset
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
