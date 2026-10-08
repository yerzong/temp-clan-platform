import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
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

      <div className="relative flex max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-tc-accent shadow-[0_0_8px_hsl(var(--tc-accent))]" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-tc-fg-tertiary">
            Temp Platform
          </span>
        </div>

        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-tc-fg sm:text-5xl">
          Command your organization,
          <br />
          your content, and your league.
        </h1>

        <p className="max-w-lg text-lg leading-8 text-tc-fg-secondary">
          The operating system for modern gaming organizations. Manage your
          staff, esports roster, creators, and Temp League — one command center.
        </p>

        <Button asChild size="lg">
          <Link href="/login">Sign in to deploy</Link>
        </Button>
      </div>
    </main>
  );
}
