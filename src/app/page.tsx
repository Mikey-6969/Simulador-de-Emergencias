import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="hero-glow" />
      <header className="mila-shell flex items-center justify-between py-6">
        <div className="text-2xl font-semibold tracking-[0.18em]">MILA</div>
        <Link href="/login" className="mila-btn mila-btn-primary">
          Ingresar
        </Link>
      </header>

      <section className="mila-shell relative grid min-h-[78vh] items-center gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="fade-up">
          <p
            className="mb-4 text-sm uppercase tracking-[0.28em]"
            style={{ color: "var(--brand)" }}
          >
            Mesa de ayuda inteligente
          </p>
          <h1
            className="max-w-xl text-5xl leading-[1.05] md:text-6xl"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            MILA
          </h1>
          <p className="mt-5 max-w-xl text-lg" style={{ color: "var(--muted)" }}>
            Diagnóstico remoto con IA, especialistas por zona y técnicos de campo en Bogotá —
            Norte, Sur, Oriente y Occidente — con automatización n8n.
          </p>
          <div className="mt-8">
            <Link href="/login" className="mila-btn mila-btn-primary">
              Ingresar a MILA
            </Link>
          </div>
        </div>

        <div className="mila-panel fade-up-delay relative overflow-hidden p-6 md:p-8">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "linear-gradient(135deg, rgba(47,211,193,0.15), transparent 40%), radial-gradient(circle at 80% 20%, rgba(240,163,94,0.25), transparent 45%)",
            }}
          />
          <div className="relative space-y-4">
            <h2 className="text-xl font-semibold">Cómo funciona</h2>
            <ol className="space-y-3 text-sm" style={{ color: "var(--muted)" }}>
              <li>1. El cliente reporta el caso desde su zona.</li>
              <li>2. El agente IA orienta el diagnóstico remoto.</li>
              <li>3. Si no se resuelve, el especialista de la zona escala.</li>
              <li>4. MILA recomienda técnico por sede y capacidad.</li>
              <li>5. Se asigna, atiende y notifica con n8n.</li>
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
