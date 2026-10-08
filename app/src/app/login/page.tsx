"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  async function signInWithDiscord() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-tc-accent shadow-[0_0_8px_hsl(var(--tc-accent))]" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-tc-fg-tertiary">
            Temp Platform
          </span>
        </div>

        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-6 p-7">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <h1 className="text-xl font-semibold tracking-tight text-tc-fg">
                Access command center
              </h1>
              <p className="text-sm text-tc-fg-tertiary">
                Authenticate to continue
              </p>
            </div>

            <Button onClick={signInWithDiscord} className="w-full" size="lg">
              Continue with Discord
            </Button>

            <p className="text-center font-mono text-[11px] uppercase tracking-wider text-tc-fg-muted">
              More sign-in methods coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
