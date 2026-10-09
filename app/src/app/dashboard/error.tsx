"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Catches runtime errors in dashboard pages and offers a retry. */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to the console for debugging.
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-tc-border bg-tc-surface-2 text-[hsl(var(--tc-warning))]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold text-tc-fg">
              Something went wrong
            </h2>
            <p className="text-sm text-tc-fg-tertiary">
              This section hit an error while loading. You can try again.
            </p>
          </div>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
