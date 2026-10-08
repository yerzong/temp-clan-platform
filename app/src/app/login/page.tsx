"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrandMark } from "@/components/layout/brand-mark";

function LoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  async function signInWithDiscord() {
    const supabase = createClient();
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", next);
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: callback.toString() },
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <BrandMark />

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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
