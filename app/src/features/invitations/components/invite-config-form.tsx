"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Swords, Clapperboard, Shield, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Invitation } from "@/lib/domain/types";
import { useActionToast } from "@/lib/use-action-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createInvitation,
  updateInvitation,
  type ActionResult,
} from "../actions";

const initialState: ActionResult = {};

const ROLES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "player", label: "Jugador", icon: Swords },
  { value: "creator", label: "Creador", icon: Clapperboard },
  { value: "staff", label: "Staff", icon: Shield },
];

const EXPIRY: { value: string; label: string }[] = [
  { value: "24h", label: "24 horas" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "never", label: "Sin expiración" },
];

/**
 * Create/edit form for a configurable invitation link: role, single vs multi
 * use (with optional cap), and expiry. When `invite` is passed it edits that
 * invitation; otherwise it creates a new one. Calls onSuccess when the action
 * settles without error.
 */
export function InviteConfigForm({
  invite,
  onSuccess,
}: {
  invite?: Invitation;
  onSuccess?: () => void;
}) {
  const editing = Boolean(invite);
  const action = editing ? updateInvitation : createInvitation;
  const [state, formAction, pending] = useActionState(action, initialState);
  const wasPending = useRef(false);

  const [role, setRole] = useState<string>(invite?.role ?? "player");
  const [useMode, setUseMode] = useState<"single" | "multi">(
    invite ? (invite.maxUses === 1 ? "single" : "multi") : "single"
  );
  const [maxUses, setMaxUses] = useState<string>(
    invite && invite.maxUses && invite.maxUses !== 1
      ? String(invite.maxUses)
      : ""
  );
  const [expiry, setExpiry] = useState<string>("24h");

  useActionToast(
    state,
    pending,
    editing ? "Invitación actualizada" : "Enlace de invitación generado"
  );

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      onSuccess?.();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {editing && (
        <input type="hidden" name="invitationId" value={invite!.id} />
      )}

      {/* Role */}
      <div className="flex flex-col gap-2">
        <Label>Rol que otorga el enlace</Label>
        <input type="hidden" name="role" value={role} />
        <div className="grid grid-cols-3 gap-2">
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
                  "flex flex-col items-center gap-1.5 rounded-md border p-3 transition-colors",
                  active
                    ? "border-tc-accent bg-[hsl(var(--tc-accent)/0.1)]"
                    : "border-tc-border bg-tc-surface-1 hover:border-tc-border-strong"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    active
                      ? "text-[hsl(var(--tc-accent-hover))]"
                      : "text-tc-fg-muted"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium",
                    active ? "text-tc-fg" : "text-tc-fg-secondary"
                  )}
                >
                  {r.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-tc-fg-muted">
          Admin y Owner se asignan a mano, nunca por enlace.
        </p>
      </div>

      {/* Use mode */}
      <div className="flex flex-col gap-2">
        <Label>Usos del enlace</Label>
        <input type="hidden" name="useMode" value={useMode} />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setUseMode("single")}
            aria-pressed={useMode === "single"}
            className={cn(
              "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors",
              useMode === "single"
                ? "border-tc-accent bg-[hsl(var(--tc-accent)/0.1)]"
                : "border-tc-border bg-tc-surface-1 hover:border-tc-border-strong"
            )}
          >
            <span className="text-sm font-medium text-tc-fg">Un solo uso</span>
            <span className="text-[11px] text-tc-fg-muted">
              Una persona y se cierra
            </span>
          </button>
          <button
            type="button"
            onClick={() => setUseMode("multi")}
            aria-pressed={useMode === "multi"}
            className={cn(
              "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors",
              useMode === "multi"
                ? "border-tc-accent bg-[hsl(var(--tc-accent)/0.1)]"
                : "border-tc-border bg-tc-surface-1 hover:border-tc-border-strong"
            )}
          >
            <span className="text-sm font-medium text-tc-fg">Usos múltiples</span>
            <span className="text-[11px] text-tc-fg-muted">
              Varias personas
            </span>
          </button>
        </div>

        {useMode === "multi" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maxUses">Límite de usos (opcional)</Label>
            <Input
              id="maxUses"
              name="maxUses"
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Vacío = ilimitado (ej. 100)"
            />
          </div>
        )}
      </div>

      {/* Expiry */}
      <div className="flex flex-col gap-2">
        <Label>Expiración</Label>
        <input type="hidden" name="expiry" value={expiry} />
        <div className="grid grid-cols-2 gap-2">
          {EXPIRY.map((e) => {
            const active = expiry === e.value;
            return (
              <button
                key={e.value}
                type="button"
                onClick={() => setExpiry(e.value)}
                aria-pressed={active}
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-tc-accent bg-[hsl(var(--tc-accent)/0.1)]"
                    : "border-tc-border bg-tc-surface-1 hover:border-tc-border-strong"
                )}
              >
                <span
                  className={cn(
                    "text-sm",
                    active ? "text-tc-fg" : "text-tc-fg-secondary"
                  )}
                >
                  {e.label}
                </span>
                {active && (
                  <Check className="h-4 w-4 text-[hsl(var(--tc-accent-hover))]" />
                )}
              </button>
            );
          })}
        </div>
        {editing && (
          <p className="text-[11px] text-tc-fg-muted">
            Al guardar, la expiración se recalcula desde ahora.
          </p>
        )}
      </div>

      {state.error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? editing
            ? "Guardando..."
            : "Generando..."
          : editing
            ? "Guardar cambios"
            : "Generar enlace"}
      </Button>
    </form>
  );
}
