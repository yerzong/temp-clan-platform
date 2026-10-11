"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Plus, Trash2, Pencil, BadgeCheck, ExternalLink, AtSign, Mail } from "lucide-react";
import { toast } from "sonner";
import type { MemberProfile, LinkedAccount } from "@/lib/domain/types";
import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AvatarUploader } from "./avatar-uploader";
import { BrandIcon } from "../brand-icon";
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
  platformOption,
  accountLink,
  type PlatformOption,
} from "../platforms";
import { COUNTRIES } from "../countries";

const initialState: ActionResult = {};

function splitPhone(phone: string | null): { dial: string; number: string } {
  if (!phone) return { dial: "+52", number: "" };
  const match = COUNTRIES.map((c) => c.dial)
    .sort((a, b) => b.length - a.length)
    .find((d) => phone.startsWith(d));
  if (match) return { dial: match, number: phone.slice(match.length).trim() };
  return { dial: "+52", number: phone };
}

type SheetState =
  | { mode: "closed" }
  | { mode: "add"; kind: "social" | "game" }
  | { mode: "edit"; account: LinkedAccount };

export function ProfileEditor({ profile }: { profile: MemberProfile }) {
  const [state, formAction, pending] = useActionState(updateMyProfile, initialState);
  const [sheet, setSheet] = useState<SheetState>({ mode: "closed" });
  const initialPhone = splitPhone(profile.phone);
  const [dial, setDial] = useState(initialPhone.dial);

  useActionToast(state, pending, "Perfil actualizado");

  const socials = profile.accounts.filter((a) => a.kind === "social");
  const games = profile.accounts.filter((a) => a.kind === "game");

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-6 rounded-xl border border-tc-border bg-card p-6">
        <div className="flex flex-col gap-5 border-b border-tc-border-soft pb-6">
          <AvatarUploader initialUrl={profile.avatarUrl} displayName={profile.displayName} />
          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
            {profile.email && (
              <span className="flex items-center gap-1.5 text-xs text-tc-fg-tertiary">
                <Mail className="h-3.5 w-3.5" />
                {profile.email}
              </span>
            )}
            {profile.username && (
              <span className="flex items-center gap-1.5 font-mono text-xs text-tc-fg-tertiary">
                <AtSign className="h-3.5 w-3.5" />
                {profile.username}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="p-display">
            <Input id="p-display" name="displayName" defaultValue={profile.displayName} required />
          </Field>
          <Field label="Nombre de usuario" htmlFor="p-username">
            <Input id="p-username" name="username" defaultValue={profile.username ?? ""} placeholder="ej. .yerzong" />
          </Field>
          <Field label="Fecha de nacimiento" htmlFor="p-birth">
            <Input id="p-birth" name="birthDate" type="date" defaultValue={profile.birthDate ?? ""} />
          </Field>
          <Field label="Nacionalidad" htmlFor="p-nat">
            <select id="p-nat" name="nationality" defaultValue={profile.nationality ?? ""} className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent">
              <option value="">Sin especificar</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Teléfono" htmlFor="p-phone">
            <div className="flex gap-2">
              <select value={dial} onChange={(e) => setDial(e.target.value)} aria-label="Código de país" className="h-10 w-28 shrink-0 rounded-md border border-tc-border bg-input px-2 text-sm text-tc-fg outline-none focus-visible:border-tc-accent">
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.dial}>{c.code} {c.dial}</option>
                ))}
              </select>
              <Input id="p-phone" name="phoneNumber" type="tel" defaultValue={initialPhone.number} placeholder="55 1234 5678" />
              <input type="hidden" name="phoneDial" value={dial} />
            </div>
          </Field>
        </div>

        <input type="hidden" name="privacy" value={profile.privacyAccepted ? "on" : "off"} />

        {state.error && (
          <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>

      <AccountSection
        title="Redes sociales"
        emptyHint="Agrega tus redes sociales y de streaming para que te encuentren."
        accounts={socials}
        onAdd={() => setSheet({ mode: "add", kind: "social" })}
        onEdit={(a) => setSheet({ mode: "edit", account: a })}
      />

      <AccountSection
        title="Cuentas de juego"
        emptyHint="Vincula tus cuentas de juego (Xbox, Riot, Steam…). Un admin puede verificarlas."
        accounts={games}
        onAdd={() => setSheet({ mode: "add", kind: "game" })}
        onEdit={(a) => setSheet({ mode: "edit", account: a })}
      />

      <AccountSheet sheet={sheet} onClose={() => setSheet({ mode: "closed" })} />
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function AccountSection({
  title,
  emptyHint,
  accounts,
  onAdd,
  onEdit,
}: {
  title: string;
  emptyHint: string;
  accounts: LinkedAccount[];
  onAdd: () => void;
  onEdit: (a: LinkedAccount) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">{title}</h2>
        <Button type="button" variant="outline" size="sm" onClick={onAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>

      {accounts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-tc-border p-4 text-sm text-tc-fg-muted">{emptyHint}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {accounts.map((a) => (
            <AccountRow key={a.id} account={a} onEdit={() => onEdit(a)} />
          ))}
        </div>
      )}
    </section>
  );
}

function AccountRow({ account, onEdit }: { account: LinkedAccount; onEdit: () => void }) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const link = accountLink(account.platform, account.handle, account.url);
  const opt = platformOption(account.platform);

  function remove() {
    start(async () => {
      const res = await deleteMyAccount(account.id);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Cuenta desvinculada");
        setConfirm(false);
      }
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-tc-border bg-card p-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-tc-border bg-tc-surface-2"
        style={{ color: opt?.color ? `hsl(${opt.color})` : "hsl(var(--tc-fg-tertiary))" }}
      >
        <BrandIcon platform={opt?.icon ?? account.platform} className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1.5 text-sm font-medium text-tc-fg">
          {platformLabel(account.platform)}
          {account.verified && <BadgeCheck className="h-3.5 w-3.5 text-[hsl(var(--tc-success))]" />}
        </span>
        <span className="truncate font-mono text-[11px] text-tc-fg-muted">{account.handle}</span>
      </div>
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" aria-label={`Ir a ${platformLabel(account.platform)}`} className="rounded-md p-1.5 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-tc-fg">
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
      <button type="button" onClick={onEdit} aria-label="Editar" className="rounded-md p-1.5 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-tc-fg">
        <Pencil className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => setConfirm(true)} aria-label="Desvincular" className="rounded-md p-1.5 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-[hsl(var(--tc-destructive))]">
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        title="Desvincular cuenta"
        description={
          <>
            Se quitará <span className="font-medium text-tc-fg">{platformLabel(account.platform)}</span> de tu perfil.
          </>
        }
        confirmLabel="Desvincular"
        destructive
        pending={pending}
      />
    </div>
  );
}

function AccountSheet({ sheet, onClose }: { sheet: SheetState; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(upsertMyAccount, initialState);
  const [selected, setSelected] = useState<PlatformOption | null>(null);
  const wasPending = useRef(false);

  const editing = sheet.mode === "edit";
  const kind = sheet.mode === "add" ? sheet.kind : sheet.mode === "edit" ? sheet.account.kind : "social";
  const options = kind === "game" ? GAME_PLATFORMS : SOCIAL_PLATFORMS;

  useActionToast(state, pending, editing ? "Cuenta actualizada" : "Cuenta vinculada");

  // Preselect the platform when editing; reset when (re)opening to add.
  useEffect(() => {
    if (sheet.mode === "edit") {
      setSelected(platformOption(sheet.account.platform) ?? null);
    } else {
      setSelected(null);
    }
  }, [sheet]);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) onClose();
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const editAccount = sheet.mode === "edit" ? sheet.account : null;

  return (
    <Sheet
      open={sheet.mode !== "closed"}
      onClose={onClose}
      title={
        editing
          ? "Editar cuenta"
          : kind === "game"
            ? "Vincular cuenta de juego"
            : "Agregar red social"
      }
      description={
        editing
          ? "Actualiza tu usuario o enlace."
          : kind === "game"
            ? "Elige la plataforma y pon tu usuario/ID."
            : "Elige la red y pon tu usuario o enlace."
      }
    >
      {!selected ? (
        <div className="grid grid-cols-2 gap-2.5">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt)}
              className="flex items-center gap-2.5 rounded-lg border border-tc-border bg-tc-surface-1 p-3 text-left transition-colors hover:border-tc-accent hover:bg-tc-surface-2"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center"
                style={{ color: opt.color ? `hsl(${opt.color})` : "hsl(var(--tc-accent))" }}
              >
                <BrandIcon platform={opt.icon} className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-tc-fg">{opt.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="platform" value={selected.value} />
          <input type="hidden" name="kind" value={selected.kind} />

          {!editing && (
            <button type="button" onClick={() => setSelected(null)} className="w-fit text-[11px] text-tc-fg-muted hover:text-tc-fg">
              ← Cambiar plataforma
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center" style={{ color: selected.color ? `hsl(${selected.color})` : "hsl(var(--tc-accent))" }}>
              <BrandIcon platform={selected.icon} className="h-6 w-6" />
            </span>
            <span className="text-sm font-medium text-tc-fg">{selected.label}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="acc-handle">{selected.kind === "game" ? "Usuario / ID" : "Usuario (@)"}</Label>
            <Input id="acc-handle" name="handle" required defaultValue={editAccount?.handle ?? ""} placeholder="ej. yerzong" autoComplete="off" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="acc-url">Enlace (opcional)</Label>
            <Input id="acc-url" name="url" defaultValue={editAccount?.url ?? ""} placeholder="https://…" />
            <p className="text-[11px] text-tc-fg-muted">Si lo dejas vacío, generamos el enlace desde tu usuario cuando sea posible.</p>
          </div>

          {state.error && (
            <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando..." : editing ? "Guardar cambios" : "Vincular"}
          </Button>
        </form>
      )}
    </Sheet>
  );
}
