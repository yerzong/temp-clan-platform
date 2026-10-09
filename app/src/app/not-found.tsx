import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/brand-mark";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <BrandMark />
      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-5xl font-semibold tracking-tight text-tc-fg-muted">
          404
        </span>
        <h1 className="text-xl font-semibold text-tc-fg">Page not found</h1>
        <p className="max-w-xs text-sm text-tc-fg-tertiary">
          This position is off the map. Let&apos;s get you back to base.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </main>
  );
}
