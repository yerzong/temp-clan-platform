"use client";

import { Toaster as SonnerToaster } from "sonner";

/** Client-side toast host for the app, styled for the tactical theme. */
export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: "hsl(24 6% 13%)",
          border: "1px solid hsl(30 6% 20%)",
          color: "hsl(40 12% 92%)",
          fontFamily: "var(--font-geist-sans)",
        },
      }}
    />
  );
}
