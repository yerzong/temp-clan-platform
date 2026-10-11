"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Plus, Trash2, BadgeCheck, Gamepad2, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { MemberProfile, LinkedAccount } from "@/lib/domain/types";
import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import {
  updateMyProfile,
  upsertMyAccount,
  deleteMyAccount,
  type ActionResult,
} from "../actions";
import {
  SOCIAL_PLATFORMS,
  GAME_PLATFORMS,
  platformLabel,
} from "../platforms";

const initialState: ActionResult = {};

/** Self-service profile editor: identity fields + linked accounts manager. */
export function ProfileEditor({ profile }: { profile: MemberProfile }) {
  const [state, formAction, pending] = useActionState(
    updateMyProfile,
    initialState
  );
  const [addOpen, setAddOpen] = useState(false);

  useActionToast(state, pending, "Perfil actualizado");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Identity form */}
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-display">Nombre</Label>
            <Input
              id="p-display"
              name="displayName"
              defaultValue={profile.displayName}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-username">Nombre de usuario</Label>
            <Input
              id="p-username"
              name="username"
              defaultValue={profile.username ?? ""}
              placeholder="ej. .yerzong"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-birth">Fecha de nacimiento</Label>
            <Input
              id="p-birth"
              name="birthDate"
              type="date"
              defaultValue={profile.birthDate ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-nat">Nacionalidad</Label>
            <Input
              id="p-nat"
              name="nationality"
              defaultValue={profile.nationality ?? ""}
              placeholder="ej. México"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-phone">Teléfono</Label>
            <Input
              id="p-phone"
              name="phone"
              type="tel"
              defaultValue={profile.phone ?? ""}
              placeholder="+52…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-avatar">Foto (URL)</Label>
            <Input
              id="p-avatar"
              name="avatarUrl"
              defaultValue={profile.avatarUrl ?? ""}
              placeholder="https://…"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-tc-fg-secondary">
          <input
            type="checkbox"
            name="privacy"
            defaultChecked={profile.privacyAccepted}
            className="h-4 w-4 accent-[hsl(var(--tc-accent))]"
          />
          Acepto el aviso de privacidad
        </label>

        {state.error && (
          <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Guardando..." : "Guardar perfil"}
        </Button>
      </form>

      {/* Linked accounts */}
      <aside className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
            Cuentas vinculadas
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Vincular
          </Button>
        </div>

        {profile.accounts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-tc-border p-4 text-sm text-tc-fg-muted">
            Vincula tus redes sociales o cuentas de juego (Xbox, Riot, Steam…).
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {profile.accounts.map((a) => (
              <AccountRow key={a.id} account={a} />
            ))}
          </div>
        )}
      </aside>

      <AddAccountSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function AccountRow({ account }: { account: LinkedAccount }) {
  const [pending, start] = useTransition();

  function remove() {
    start(async () => {
      const res = await deleteMyAccount(account.id);
      if (res?.error) toast.error(res.error);
      else toast.success("Cuenta desvinculada");
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-tc-border bg-card p-3">
      {account.kind === "game" ? (
        <Gamepad2 className="h-4 w-4 shrink-0 text-tc-fg-tertiary" />
      ) : (
        <Share2 className="h-4 w-4 shrink-0 text-tc-fg-tertiary" />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1.5 text-sm font-medium text-tc-fg">
          {platformLabel(account.platform)}
          {account.verified && (
            <BadgeCheck className="h-3.5 w-3.5 text-[hsl(var(--tc-success))]" />
          )}
        </span>
        <span className="truncate font-mono text-[11px] text-tc-fg-muted">
          {account.handle}
        </span>
      </div>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label="Desvincular"
        className="rounded-md p-1.5 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-[hsl(var(--tc-destructive))]"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function AddAccountSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    upsertMyAccount,
    initialState
  );
  const [platform, setPlatform] = useState(SOCIAL_PLATFORMS[0].value);
  const wasPending = useRef(false);

  useActionToast(state, pending, "Cuenta vinculada");

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) onClose();
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const kind = GAME_PLATFORMS.some((p) => p.value === platform)
    ? "game"
    : "social";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Vincular cuenta"
      description="Agrega una red social o una cuenta de juego a tu perfil."
    >
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="kind" value={kind} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="acc-platform">Plataforma</Label>
          <select
            id="acc-platform"
            name="platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
          >
            <optgroup label="Redes sociales">
              {SOCIAL_PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Cuentas de juego">
              {GAME_PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="acc-handle">Usuario / ID</Label>
          <Input
            id="acc-handle"
            name="handle"
            required
            placeholder="ej. yerzong#1234"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="acc-url">Enlace (opcional)</Label>
          <Input id="acc-url" name="url" placeholder="https://…" />
        </div>

        {state.error && (
          <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Vinculando..." : "Vincular cuenta"}
        </Button>
      </form>
    </Sheet>
  );
}
