"use client";

export function LogoutButton() {
  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button type="button" className="mila-btn mila-btn-ghost" onClick={onLogout}>
      Salir
    </button>
  );
}
