"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Shield, Swords, Clapperboard, UserCog } from "lucide-react";
import type { Member } from "@/lib/domain/types";
import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMember, updateMemberProfile, type ActionResult } from "../actions";
import { FnToggle } from "./add-member-form";
import { COUNTRIES } from "@/features/profile/countries";

const initialState: ActionResult = {};

function splitPhone(phone: string | null): { dial: string; number: string } {
  if (!phone) return { dial: "+52", number: "" };
  const match = COUNTRIES.map((c) => c.dial)
    .sort((a, b) => b.length - a.length)
    .find((d) => phone.startsWith(d));
  if (match) return { dial: match, number: phone.slice(match.length).trim() };
  return { dial: "+52", number: phone };
}

/**
 * Admin edit for a member: name + functions (multi) + admin permission, plus a
 * full profile section (contact + identity). Owner's admin permission is locked.
 */
export function EditMemberForm({
  member,
  onSuccess,
}: {
  member: Member;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateMember, initialState);
  const [profState, profAction, profPending] = useActionState(
    updateMemberProfile,
    initialState
  );
  const wasPending = useRef(false);

  const [fns, setFns] = useState({
    staff: member.isStaff,
    player: member.isPlayer,
    creator: member.isCreator,
  });
  const [isAdmin, setIsAdmin] = useState(member.isAdmin);
  const initialPhone = splitPhone(member.phone ?? null);
  const [dial, setDial] = useState(initialPhone.dial);

  useActionToast(state, pending, "Miembro actualizado");
  useActionToast(profState, profPending, "Perfil actualizado");

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) onSuccess?.();
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <div className="flex flex-col gap-8">
      {/* Role + functions */}
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="membershipId" value={member.membershipId} />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="em-name">Nombre</Label>
          <Input id="em-name" name="displayName" defaultValue={member.displayName} required />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Funciones</Label>
          <p className="-mt-1 text-[11px] text-tc-fg-muted">Puede tener varias a la vez.</p>
          <input type="checkbox" name="isStaff" checked={fns.staff} readOnly className="hidden" />
          <input type="checkbox" name="isPlayer" checked={fns.player} readOnly className="hidden" />
          <input type="checkbox" name="isCreator" checked={fns.creator} readOnly className="hidden" />

          <FnToggle label="Staff" hint="Opera la organización" icon={Shield} active={fns.staff} onToggle={() => setFns((p) => ({ ...p, staff: !p.staff }))} />
          <FnToggle label="Jugador" hint="Compite en equipos" icon={Swords} active={fns.player} onToggle={() => setFns((p) => ({ ...p, player: !p.player }))} />
          <FnToggle label="Creador" hint="Produce contenido" icon={Clapperboard} active={fns.creator} onToggle={() => setFns((p) => ({ ...p, creator: !p.creator }))} />
        </div>

        <div className="flex flex-col gap-2 border-t border-tc-border-soft pt-5">
          <Label>Permiso</Label>
          <input type="checkbox" name="isAdmin" checked={isAdmin} readOnly className="hidden" />
          {member.isOwner ? (
            <p className="rounded-md border border-tc-border bg-tc-surface-2 p-3 text-xs text-tc-fg-tertiary">
              Este miembro es el <strong className="text-tc-fg-secondary">dueño</strong>. Su permiso no se puede cambiar.
            </p>
          ) : (
            <FnToggle
              label="Administrador"
              hint="Puede gestionar la organización"
              icon={UserCog}
              active={isAdmin}
              onToggle={() => setIsAdmin((v) => !v)}
            />
          )}
        </div>

        {state.error && (
          <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">{state.error}</p>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Guardando..." : "Guardar rol y funciones"}
        </Button>
      </form>

      {/* Full profile (admin editing) — only for linked members with a profile */}
      <form action={profAction} className="flex flex-col gap-5 border-t border-tc-border pt-6">
        <input type="hidden" name="membershipId" value={member.membershipId} />
        <span className="font-mono text-[11px] uppercase tracking-wider text-tc-fg-tertiary">
          Información de contacto
        </span>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="em-user">Usuario</Label>
            <Input id="em-user" name="username" defaultValue={member.username ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="em-email">Correo</Label>
            <Input id="em-email" name="email" type="email" defaultValue={member.email ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="em-birth">Fecha de nacimiento</Label>
            <Input id="em-birth" name="birthDate" type="date" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="em-nat">Nacionalidad</Label>
            <select id="em-nat" name="nationality" defaultValue="" className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent">
              <option value="">Sin especificar</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="em-phone">Teléfono</Label>
            <div className="flex gap-2">
              <select value={dial} onChange={(e) => setDial(e.target.value)} aria-label="Código de país" className="h-10 w-28 shrink-0 rounded-md border border-tc-border bg-input px-2 text-sm text-tc-fg outline-none focus-visible:border-tc-accent">
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.dial}>{c.code} {c.dial}</option>
                ))}
              </select>
              <Input id="em-phone" name="phoneNumber" type="tel" defaultValue={initialPhone.number} placeholder="55 1234 5678" />
              <input type="hidden" name="phoneDial" value={dial} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="em-avatar">Foto (URL)</Label>
            <Input id="em-avatar" name="avatarUrl" defaultValue={member.avatarUrl ?? ""} placeholder="https://…" />
          </div>
        </div>

        {profState.error && (
          <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">{profState.error}</p>
        )}
        <Button type="submit" variant="outline" disabled={profPending} className="w-full">
          {profPending ? "Guardando..." : "Guardar información de contacto"}
        </Button>
      </form>
    </div>
  );
}
