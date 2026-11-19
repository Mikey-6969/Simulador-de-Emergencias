import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { NotificationBell } from "@/components/NotificationBell";

type NavItem = { href: string; label: string; section?: string };

export function AppShell({
  brand,
  subtitle,
  userName,
  nav,
  actions,
  children,
}: {
  brand: string;
  subtitle: string;
  userName: string;
  nav: NavItem[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-[var(--line)] bg-black/20 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="px-5 py-5">
          <div className="text-xs uppercase tracking-[0.22em]" style={{ color: "var(--brand)" }}>
            MILA
          </div>
          <div className="mt-1 text-lg font-semibold">{brand}</div>
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            {subtitle}
          </div>
        </div>
        <nav className="space-y-1 px-3 pb-6">
          {nav.map((item) => (
            <div key={item.href + item.label}>
              {item.section ? (
                <div className="px-3 pb-1 pt-4 text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                  {item.section}
                </div>
              ) : null}
              <Link
                href={item.href}
                className="block rounded-xl px-3 py-2 text-sm transition hover:bg-white/5"
              >
                {item.label}
              </Link>
            </div>
          ))}
        </nav>
      </aside>

      <div>
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            Sesión: <span className="text-[var(--text)]">{userName}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <NotificationBell />
            {actions}
            <LogoutButton />
          </div>
        </header>
        <div className="px-5 py-6">{children}</div>
      </div>
    </div>
  );
}
