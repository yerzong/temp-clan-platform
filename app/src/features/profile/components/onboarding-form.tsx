"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { MemberProfile } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUploader } from "./avatar-uploader";
import { completeOnboarding, type ActionResult } from "../actions";
import { COUNTRIES } from "../countries";

const initialState: ActionResult = {};

/**
 * Post-Discord onboarding: prefilled from Discord, lets the user complete their
 * profile and accept the privacy notice before entering the platform. On
 * success, redirects to the dashboard.
 */
export function OnboardingForm({ profile }: { profile: MemberProfile }) {
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);
  const [dial, setDial] = useState("+52");
  const wasPending = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (state.error) toast.error(state.error);
      else {
        toast.success("¡Perfil completo! Bienvenido.");
        router.push("/dashboard");
        router.refresh();
      }
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="border-b border-tc-border-soft pb-5">
        <AvatarUploader initialUrl={profile.avatarUrl} displayName={profile.displayName} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="o-display">Nombre</Label>
          <Input id="o-display" name="displayName" defaultValue={profile.displayName} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="o-username">Nombre de usuario</Label>
          <Input id="o-username" name="username" defaultValue={profile.username ?? ""} placeholder="ej. .yerzong" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="o-birth">Fecha de nacimiento</Label>
          <Input id="o-birth" name="birthDate" type="date" defaultValue={profile.birthDate ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="o-nat">Nacionalidad</Label>
          <select
            id="o-nat"
            name="nationality"
            defaultValue={profile.nationality ?? ""}
            className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
          >
            <option value="">Sin especificar</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="o-phone">Teléfono</Label>
          <div className="flex gap-2">
            <select
              value={dial}
              onChange={(e) => setDial(e.target.value)}
              aria-label="Código de país"
              className="h-10 w-28 shrink-0 rounded-md border border-tc-border bg-input px-2 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.dial}>{c.code} {c.dial}</option>
              ))}
            </select>
            <Input id="o-phone" name="phoneNumber" type="tel" placeholder="55 1234 5678" />
            <input type="hidden" name="phoneDial" value={dial} />
          </div>
        </div>
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border border-tc-border bg-tc-surface-1 p-3 text-sm text-tc-fg-secondary">
        <input type="checkbox" name="privacy" required className="mt-0.5 h-4 w-4 accent-[hsl(var(--tc-accent))]" />
        <span>
          Acepto el <span className="text-tc-fg">aviso de privacidad</span> y los
          términos de uso de la plataforma.
        </span>
      </label>

      {state.error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Guardando..." : "Entrar a la plataforma"}
      </Button>
    </form>
  );
}
