"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, ShieldCheck, UserRound, Sparkles } from "lucide-react";
import type { MemberProfile } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUploader } from "./avatar-uploader";
import { Combobox, type ComboOption } from "@/components/ui/combobox";
import { completeOnboarding, type ActionResult } from "../actions";
import { COUNTRIES, DIAL_CODES, flagEmoji } from "../countries";

const initialState: ActionResult = {};

const STEPS = [
  { key: "photo", label: "Foto", icon: UserRound },
  { key: "details", label: "Datos", icon: Sparkles },
  { key: "privacy", label: "Privacidad", icon: ShieldCheck },
] as const;

const NATIONALITY_OPTIONS: ComboOption[] = COUNTRIES.map((c) => ({
  value: c.name,
  label: c.name,
  prefix: flagEmoji(c.code),
  keywords: c.code,
}));

// Several countries share a dial code (+1 → US, CA, DO, PR), so the option
// value must be the unique ISO code, not the dial. We derive the dial on submit.
const DIAL_OPTIONS: ComboOption[] = DIAL_CODES.map((c) => ({
  value: c.code,
  label: `${c.name}`,
  prefix: flagEmoji(c.code),
  hint: c.dial,
  keywords: `${c.code} ${c.dial} ${c.name}`,
}));

const DIAL_BY_CODE = new Map(DIAL_CODES.map((c) => [c.code, c.dial]));

/**
 * Post-Discord onboarding, as an interactive 3-step wizard: (1) photo + name,
 * (2) personal details, (3) privacy acceptance. Prefilled from Discord. Every
 * field is controlled state and mirrored into hidden inputs, so the visible
 * step can re-mount (for the slide-in animation) without losing data. On
 * success → dashboard.
 */
export function OnboardingForm({ profile }: { profile: MemberProfile }) {
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);
  const [step, setStep] = useState(0);

  // All fields as controlled state.
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [name, setName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username ?? "");
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? "");
  const [nationality, setNationality] = useState(profile.nationality ?? "");
  const [dialCode, setDialCode] = useState("MX"); // ISO code; dial derived below
  const [phoneNumber, setPhoneNumber] = useState("");
  const dial = DIAL_BY_CODE.get(dialCode) ?? "+52";
  const [privacy, setPrivacy] = useState(false);

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

  const isLast = step === STEPS.length - 1;

  function next() {
    if (step === 0 && name.trim().length === 0) {
      toast.error("Escribe tu nombre para continuar.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stepper */}
      <ol className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.key} className="flex flex-1 items-center gap-2 last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    active && "border-tc-accent bg-[hsl(var(--tc-accent))] text-[hsl(var(--tc-accent-fg))]",
                    done && "border-tc-accent bg-[hsl(var(--tc-accent)/0.15)] text-[hsl(var(--tc-accent-hover))]",
                    !active && !done && "border-tc-border bg-tc-surface-1 text-tc-fg-muted"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block",
                    active ? "text-tc-fg" : "text-tc-fg-muted"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "h-px flex-1 transition-colors",
                    i < step ? "bg-[hsl(var(--tc-accent))]" : "bg-tc-border"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      <form action={formAction} className="flex flex-col gap-6">
        {/* Hidden inputs carry the controlled state into the server action */}
        <input type="hidden" name="displayName" value={name} />
        <input type="hidden" name="username" value={username} />
        <input type="hidden" name="birthDate" value={birthDate} />
        <input type="hidden" name="nationality" value={nationality} />
        <input type="hidden" name="phoneDial" value={dial} />
        <input type="hidden" name="phoneNumber" value={phoneNumber} />
        <input type="hidden" name="privacy" value={privacy ? "on" : ""} />
        {/* AvatarUploader writes its own hidden name="avatarUrl" */}
        <input type="hidden" name="avatarUrl" value={avatarUrl ?? ""} />

        {/* Visible step — re-mounts on change to replay the slide-in animation */}
        <div key={step} className="tc-animate-in">
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-4 rounded-lg border border-tc-border-soft bg-tc-surface-1 p-6 text-center">
                <AvatarUploader
                  initialUrl={avatarUrl}
                  displayName={name || profile.displayName}
                  onUploaded={setAvatarUrl}
                  noHiddenInput
                />
                <p className="text-xs text-tc-fg-muted">
                  Esta foto te representa en toda la plataforma. Puedes cambiarla después.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="o-display">¿Cómo quieres que te llamen?</Label>
                <Input
                  id="o-display"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre o gamertag"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <p className="rounded-md border border-tc-border-soft bg-tc-surface-1 px-3 py-2 text-xs text-tc-fg-tertiary">
                Todos estos datos son <span className="text-tc-fg-secondary">opcionales</span>.
                Puedes completarlos ahora o más tarde desde tu perfil.
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="o-username">Nombre de usuario</Label>
                  <Input
                    id="o-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ej. .yerzong"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="o-birth">Fecha de nacimiento</Label>
                  <Input
                    id="o-birth"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Nacionalidad</Label>
                  <Combobox
                    options={NATIONALITY_OPTIONS}
                    value={nationality}
                    onChange={setNationality}
                    placeholder="Selecciona tu país"
                    searchPlaceholder="Buscar país…"
                    emptyText="Sin países."
                    aria-label="Nacionalidad"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="o-phone">Teléfono</Label>
                  <div className="flex gap-2">
                    <div className="w-32 shrink-0">
                      <Combobox
                        options={DIAL_OPTIONS}
                        value={dialCode}
                        onChange={setDialCode}
                        searchPlaceholder="País o lada…"
                        aria-label="Código de país"
                        renderValue={(opt) => (
                          <span className="flex items-center gap-1.5">
                            <span>{opt.prefix}</span>
                            <span className="text-tc-fg">{opt.hint}</span>
                          </span>
                        )}
                      />
                    </div>
                    <Input
                      id="o-phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="55 1234 5678"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-3 rounded-lg border border-tc-border-soft bg-tc-surface-1 p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--tc-accent)/0.12)] text-[hsl(var(--tc-accent-hover))]">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <h3 className="text-base font-semibold text-tc-fg">
                  Casi listo, {name.trim() || "jugador"}
                </h3>
                <p className="max-w-sm text-sm leading-relaxed text-tc-fg-tertiary">
                  Protegemos tus datos y solo los usamos para operar tu organización.
                  Acepta el aviso para desplegarte en la plataforma.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPrivacy((p) => !p)}
                aria-pressed={privacy}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3.5 text-left text-sm transition-colors",
                  privacy
                    ? "border-tc-accent bg-[hsl(var(--tc-accent)/0.08)] text-tc-fg"
                    : "border-tc-border bg-tc-surface-1 text-tc-fg-secondary hover:border-tc-border-strong"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors",
                    privacy
                      ? "border-tc-accent bg-[hsl(var(--tc-accent))] text-[hsl(var(--tc-accent-fg))]"
                      : "border-tc-border-strong bg-transparent"
                  )}
                >
                  {privacy && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <span>
                  Acepto el <span className="text-tc-fg">aviso de privacidad</span> y los
                  términos de uso de la plataforma.
                </span>
              </button>
            </div>
          )}
        </div>

        {state.error && (
          <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">{state.error}</p>
        )}

        {/* Nav */}
        <div className="flex items-center gap-3">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={back} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
          )}
          {!isLast ? (
            <Button type="button" onClick={next} className="ml-auto gap-1.5">
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={pending || !privacy} className="ml-auto gap-1.5">
              {pending ? "Guardando..." : "Entrar a la plataforma"}
              {!pending && <ArrowRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
