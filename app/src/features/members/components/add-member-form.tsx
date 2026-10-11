"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { Shield, Swords, Clapperboard, UserCog, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { addMember, type ActionResult } from "../actions";
import { useActionToast } from "@/lib/use-action-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

const FUNCTIONS: {
  key: "staff" | "player" | "creator";
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  { key: "staff", label: "Staff", hint: "Opera la organización", icon: Shield },
  { key: "player", label: "Jugador", hint: "Compite en equipos", icon: Swords },
  { key: "creator", label: "Creador", hint: "Produce contenido", icon: Clapperboard },
];

export function AddMemberForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(addMember, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  const [fns, setFns] = useState({ staff: true, player: false, creator: false });
  const [isAdmin, setIsAdmin] = useState(false);

  useActionToast(state, pending, "Miembro agregado");

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setFns({ staff: true, player: false, creator: false });
      setIsAdmin(false);
      onSuccess?.();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="am-name">Nombre del miembro</Label>
        <Input id="am-name" name="displayName" required placeholder="ej. .yerzong" autoComplete="off" />
      </div>

      {/* Functions — multi-select */}
      <div className="flex flex-col gap-2">
        <Label>Funciones</Label>
        <p className="-mt-1 text-[11px] text-tc-fg-muted">
          Puede tener varias a la vez.
        </p>
        {/* hidden inputs the server action reads */}
        <input type="checkbox" name="isStaff" checked={fns.staff} readOnly className="hidden" />
        <input type="checkbox" name="isPlayer" checked={fns.player} readOnly className="hidden" />
        <input type="checkbox" name="isCreator" checked={fns.creator} readOnly className="hidden" />

        {FUNCTIONS.map((f) => {
          const active = fns[f.key];
          const Icon = f.icon;
          return (
            <FnToggle
              key={f.key}
              label={f.label}
              hint={f.hint}
              icon={Icon}
              active={active}
              onToggle={() => setFns((p) => ({ ...p, [f.key]: !p[f.key] }))}
            />
          );
        })}
      </div>

      {/* Admin — permission toggle */}
      <div className="flex flex-col gap-2 border-t border-tc-border-soft pt-5">
        <Label>Permiso</Label>
        <input type="checkbox" name="isAdmin" checked={isAdmin} readOnly className="hidden" />
        <FnToggle
          label="Administrador"
          hint="Puede gestionar la organización (además de sus funciones)"
          icon={UserCog}
          active={isAdmin}
          onToggle={() => setIsAdmin((v) => !v)}
        />
      </div>

      {state.error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Agregando..." : "Agregar al roster"}
      </Button>
    </form>
  );
}

export function FnToggle({
  label,
  hint,
  icon: Icon,
  active,
  onToggle,
}: {
  label: string;
  hint: string;
  icon: LucideIcon;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-3 rounded-md border p-2.5 text-left transition-colors",
        active
          ? "border-tc-accent bg-[hsl(var(--tc-accent)/0.08)]"
          : "border-tc-border bg-tc-surface-1 hover:border-tc-border-strong"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[hsl(var(--tc-accent-hover))]" : "text-tc-fg-muted")} />
      <span className="flex flex-1 flex-col">
        <span className={cn("text-sm font-medium", active ? "text-tc-fg" : "text-tc-fg-secondary")}>{label}</span>
        <span className="text-[11px] text-tc-fg-muted">{hint}</span>
      </span>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
          active ? "border-tc-accent bg-[hsl(var(--tc-accent))] text-[hsl(var(--tc-accent-fg))]" : "border-tc-border-strong"
        )}
      >
        {active && <Check className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
