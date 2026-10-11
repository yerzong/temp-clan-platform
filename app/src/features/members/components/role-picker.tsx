"use client";

import { Shield, Swords, Clapperboard, UserCog, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RoleSelection {
  staff: boolean;
  player: boolean;
  creator: boolean;
  admin: boolean;
}

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

/**
 * Selectable role cards. Functions (Staff/Jugador/Creador) are multi-select.
 * Admin is exclusive: picking it clears the functions (admin already covers
 * everything); picking a function clears admin. Hidden inputs feed the form.
 */
export function RolePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: RoleSelection;
  onChange: (next: RoleSelection) => void;
  disabled?: boolean;
}) {
  function toggleFn(key: "staff" | "player" | "creator") {
    if (disabled) return;
    // Selecting a function turns admin off.
    onChange({ ...value, admin: false, [key]: !value[key] });
  }

  function toggleAdmin() {
    if (disabled) return;
    const next = !value.admin;
    // Admin on → clear all functions.
    onChange(
      next
        ? { staff: false, player: false, creator: false, admin: true }
        : { ...value, admin: false }
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* hidden inputs for the server action */}
      <input type="checkbox" name="isStaff" checked={value.staff} readOnly className="hidden" />
      <input type="checkbox" name="isPlayer" checked={value.player} readOnly className="hidden" />
      <input type="checkbox" name="isCreator" checked={value.creator} readOnly className="hidden" />
      <input type="checkbox" name="isAdmin" checked={value.admin} readOnly className="hidden" />

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-tc-fg-tertiary">
          Funciones
        </span>
        <div className="grid grid-cols-2 gap-2">
          {FUNCTIONS.map((f) => (
            <RoleCard
              key={f.key}
              label={f.label}
              hint={f.hint}
              icon={f.icon}
              active={value[f.key]}
              dimmed={value.admin}
              onClick={() => toggleFn(f.key)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-tc-fg-tertiary">
          Permiso
        </span>
        <RoleCard
          label="Administrador"
          hint="Acceso total — reemplaza las funciones"
          icon={UserCog}
          active={value.admin}
          onClick={toggleAdmin}
          wide
        />
      </div>
    </div>
  );
}

function RoleCard({
  label,
  hint,
  icon: Icon,
  active,
  dimmed = false,
  wide = false,
  onClick,
}: {
  label: string;
  hint: string;
  icon: LucideIcon;
  active: boolean;
  dimmed?: boolean;
  wide?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
        wide && "flex-row items-center gap-3",
        active
          ? "border-tc-accent bg-[hsl(var(--tc-accent)/0.1)]"
          : "border-tc-border bg-tc-surface-1 hover:border-tc-border-strong",
        dimmed && !active && "opacity-40"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-[hsl(var(--tc-accent-hover))]" : "text-tc-fg-muted"
        )}
      />
      <span className={cn("flex flex-col", wide && "flex-1")}>
        <span className={cn("text-sm font-medium", active ? "text-tc-fg" : "text-tc-fg-secondary")}>
          {label}
        </span>
        <span className="text-[11px] text-tc-fg-muted">{hint}</span>
      </span>
      {active && (
        <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--tc-accent))] text-[hsl(var(--tc-accent-fg))]">
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}
