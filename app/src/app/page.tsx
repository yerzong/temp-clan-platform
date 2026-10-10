import Link from "next/link";
import { Users, Swords, Clapperboard, Trophy, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";

const CAPABILITIES = [
  {
    icon: Users,
    title: "Roster y staff",
    desc: "Un directorio para staff, jugadores y creadores — cada uno con su rol.",
  },
  {
    icon: Swords,
    title: "Equipos de esports",
    desc: "Arma squads para Versus 4v4 y Horde Siege, gestiona el roster.",
  },
  {
    icon: HeartPulse,
    title: "Sostenibilidad del jugador",
    desc: "Monitorea bienestar y señales de burnout — cuida a tus jugadores.",
  },
  {
    icon: Clapperboard,
    title: "Pipeline de contenido",
    desc: "De idea a publicado, con importación de VODs de Twitch y highlights.",
  },
  {
    icon: Trophy,
    title: "Temp League",
    desc: "Corre una liga con equipos externos, partidas y tabla en vivo.",
  },
];

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden px-6">
      {/* Tactical grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--tc-fg)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--tc-fg)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Hero */}
      <section className="relative flex max-w-3xl flex-col items-center gap-8 pt-28 text-center sm:pt-36">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-tc-accent shadow-[0_0_8px_hsl(var(--tc-accent))]" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-tc-fg-tertiary">
            Temp Platform
          </span>
        </div>

        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-tc-fg sm:text-6xl">
          El centro de comando para
          <br />
          organizaciones de gaming.
        </h1>

        <p className="max-w-xl text-lg leading-8 text-tc-fg-secondary">
          Gestiona tu staff, roster de esports, creadores y tu liga — en un solo
          lugar. Hecho para organizaciones de Gears E-Day como Temp Tactical.
        </p>

        <Button asChild size="lg">
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </section>

      {/* Capabilities */}
      <section className="relative mt-24 grid w-full max-w-5xl gap-3 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((c) => (
          <div
            key={c.title}
            className="flex flex-col gap-3 rounded-lg border border-tc-border bg-card p-5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-tc-border bg-tc-surface-2 text-[hsl(var(--tc-accent-hover))]">
              <c.icon className="h-4 w-4" />
            </div>
            <h3 className="font-medium text-tc-fg">{c.title}</h3>
            <p className="text-sm leading-relaxed text-tc-fg-tertiary">
              {c.desc}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
