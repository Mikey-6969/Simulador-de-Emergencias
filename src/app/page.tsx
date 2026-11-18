import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="hero-glow" />
      <header className="mila-shell flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <Image
            src="/mila-logo.jpg"
            alt="Logo MILA"
            width={40}
            height={40}
            className="rounded-xl"
            priority
          />
          <div className="text-2xl font-semibold tracking-[0.18em]">MILA</div>
        </div>
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

        <div className="fade-up-delay flex items-center justify-center">
          <Image
            src="/mila-logo.jpg"
            alt="Logo MILA — Mesa de ayuda inteligente"
            width={420}
            height={420}
            className="h-auto w-full max-w-[420px] rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
            priority
          />
        </div>
      </section>
    </main>
  );
}
