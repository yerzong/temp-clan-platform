"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  Shield,
  UserCog,
  Swords,
  Clapperboard,
  Info,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { addMember, type ActionResult } from "../actions";
import { useActionToast } from "@/lib/use-action-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

const ROLES: { value: string; label: string; hint: string; icon: LucideIcon }[] =
  [
    { value: "staff", label: "Staff", hint: "Opera la organización", icon: Shield },
    { value: "player", label: "Jugador", hint: "Compite en equipos", icon: Swords },
    {
      value: "creator",
      label: "Creador",
      hint: "Produce contenido",
      icon: Clapperboard,
    },
    { value: "admin", label: "Admin", hint: "Gestiona todo", icon: UserCog },
  ];

export function AddMemberForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(addMember, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  const [role, setRole] = useState("player");
  const [isPlayer, setIsPlayer] = useState(true);
  const [isCreator, setIsCreator] = useState(false);

  useActionToast(state, pending, "Miembro agregado");

  // Only react once a real submit has gone from pending -> done without error.
  // Guards against firing on the initial mount (where pending is already false).
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setRole("player");
      setIsPlayer(true);
      setIsCreator(false);
      onSuccess?.();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      {/* Context note: this creates a LOCAL roster entry, not a login. */}
      <div className="flex gap-2.5 rounded-md border border-tc-border bg-tc-surface-2 p-3 text-xs leading-relaxed text-tc-fg-tertiary">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--tc-accent-hover))]" />
        <p>
          Esto crea un registro <strong className="text-tc-fg-secondary">local</strong>{" "}
          en el roster, sin cuenta. Para que la persona entre con su propia
          cuenta de Discord, usa la pestaña{" "}
          <strong className="text-tc-fg-secondary">Invitaciones</strong>.
        </p>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Nombre del miembro</Label>
        <Input
          id="displayName"
          name="displayName"
          required
          placeholder="ej. .yerzong"
          autoComplete="off"
        />
      </div>

      {/* Role as selectable cards */}
      <div className="flex flex-col gap-2">
        <Label>Rol</Label>
        <input type="hidden" name="role" value={role} />
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const active = role === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-md border p-2.5 text-left transition-colors",
                  active
                    ? "border-tc-accent bg-[hsl(var(--tc-accent)/0.1)]"
                    : "border-tc-border bg-tc-surface-1 hover:border-tc-border-strong"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      active
                        ? "text-[hsl(var(--tc-accent-hover))]"
                        : "text-tc-fg-muted"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      active ? "text-tc-fg" : "text-tc-fg-secondary"
                    )}
                  >
                    {r.label}
                  </span>
                </span>
                <span className="text-[11px] text-tc-fg-muted">{r.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Attributes as toggle rows */}
      <div className="flex flex-col gap-2">
        <Label>Atributos</Label>
        <p className="-mt-1 text-[11px] text-tc-fg-muted">
          Independientes del rol: alguien puede ser staff y además jugar o crear.
        </p>
        <input
          type="checkbox"
          name="isPlayer"
          checked={isPlayer}
          onChange={(e) => setIsPlayer(e.target.checked)}
          className="hidden"
          readOnly
        />
        <input
          type="checkbox"
          name="isCreator"
          checked={isCreator}
          onChange={(e) => setIsCreator(e.target.checked)}
          className="hidden"
          readOnly
        />

        <AttributeToggle
          label="Compite"
          hint="Puede entrar a rosters de equipos"
          icon={Swords}
          active={isPlayer}
          onToggle={() => setIsPlayer((v) => !v)}
        />
        <AttributeToggle
          label="Crea contenido"
          hint="Aparece en el módulo de Contenido"
          icon={Clapperboard}
          active={isCreator}
          onToggle={() => setIsCreator((v) => !v)}
        />
      </div>

      {state.error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Agregando..." : "Agregar al roster"}
      </Button>
    </form>
  );
}

function AttributeToggle({
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
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-[hsl(var(--tc-accent-hover))]" : "text-tc-fg-muted"
        )}
      />
      <span className="flex flex-1 flex-col">
        <span
          className={cn(
            "text-sm font-medium",
            active ? "text-tc-fg" : "text-tc-fg-secondary"
          )}
        >
          {label}
        </span>
        <span className="text-[11px] text-tc-fg-muted">{hint}</span>
      </span>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
          active
            ? "border-tc-accent bg-[hsl(var(--tc-accent))] text-[hsl(var(--tc-accent-fg))]"
            : "border-tc-border-strong bg-transparent"
        )}
      >
        {active && <Check className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
