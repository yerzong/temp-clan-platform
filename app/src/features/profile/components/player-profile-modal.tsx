"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  AtSign,
  Phone,
  Cake,
  Globe,
  BadgeCheck,
  ExternalLink,
  Loader2,
} from "lucide-react";
import type { MemberProfile } from "@/lib/domain/types";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTransition } from "react";
import { BrandIcon } from "../brand-icon";
import { fetchPlayerProfile, setAccountVerified } from "../actions";
import { platformOption, platformLabel, accountLink } from "../platforms";

function initials(name: string): string {
  const cleaned = name.replace(/^[.@]+/, "");
  const parts = cleaned.split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function age(birth: string | null): number | null {
  if (!birth) return null;
  const d = new Date(birth);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

/**
 * Right-side drawer that shows a player's full profile. Loads lazily by
 * membershipId when opened so the card itself stays lightweight.
 */
export function PlayerProfileModal({
  membershipId,
  name,
  open,
  onClose,
  canVerify = false,
}: {
  membershipId: string;
  name: string;
  open: boolean;
  onClose: () => void;
  canVerify?: boolean;
}) {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(false);

  function reload() {
    fetchPlayerProfile(membershipId).then((res) => {
      if (res.ok) setProfile(res.profile);
    });
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setProfile(null);
    fetchPlayerProfile(membershipId).then((res) => {
      if (cancelled) return;
      if (res.ok) setProfile(res.profile);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, membershipId]);

  const socials = profile?.accounts.filter((a) => a.kind === "social") ?? [];
  const games = profile?.accounts.filter((a) => a.kind === "game") ?? [];
  const years = age(profile?.birthDate ?? null);

  return (
    <Sheet open={open} onClose={onClose} title="Perfil del jugador" description={name}>
      {loading ? (
        <div className="flex items-center justify-center py-16 text-tc-fg-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !profile ? (
        <p className="py-10 text-center text-sm text-tc-fg-muted">
          No se pudo cargar el perfil.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-tc-border bg-tc-surface-2">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-mono text-xl font-bold text-tc-fg-tertiary">
                  {initials(profile.displayName)}
                </span>
              )}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-lg font-semibold text-tc-fg">
                {profile.displayName}
              </span>
              {profile.username && (
                <span className="flex items-center gap-1 font-mono text-xs text-tc-fg-tertiary">
                  <AtSign className="h-3 w-3" />
                  {profile.username}
                </span>
              )}
            </div>
          </div>

          {/* Facts */}
          <div className="flex flex-col gap-2.5">
            {profile.email && <Fact icon={<Mail className="h-4 w-4" />} value={profile.email} />}
            {profile.phone && <Fact icon={<Phone className="h-4 w-4" />} value={profile.phone} />}
            {years != null && (
              <Fact icon={<Cake className="h-4 w-4" />} value={`${years} años`} />
            )}
            {profile.nationality && (
              <Fact icon={<Globe className="h-4 w-4" />} value={profile.nationality} />
            )}
          </div>

          {/* Game accounts */}
          {games.length > 0 && (
            <Section title="Cuentas de juego">
              {games.map((a) => (
                <AccountLine
                  key={a.id}
                  account={a}
                  canVerify={canVerify}
                  onChanged={reload}
                />
              ))}
            </Section>
          )}

          {/* Socials */}
          {socials.length > 0 && (
            <Section title="Redes sociales">
              {socials.map((a) => (
                <AccountLine key={a.id} account={a} />
              ))}
            </Section>
          )}

          {games.length === 0 && socials.length === 0 && (
            <p className="text-sm text-tc-fg-muted">
              Este jugador aún no vinculó cuentas.
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}

function Fact({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-tc-fg-secondary">
      <span className="text-tc-fg-muted">{icon}</span>
      {value}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-tc-border-soft pt-5">
      <span className="font-mono text-[11px] uppercase tracking-wider text-tc-fg-tertiary">
        {title}
      </span>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function AccountLine({
  account,
  canVerify = false,
  onChanged,
}: {
  account: MemberProfile["accounts"][number];
  canVerify?: boolean;
  onChanged?: () => void;
}) {
  const opt = platformOption(account.platform);
  const link = accountLink(account.platform, account.handle, account.url);
  const [pending, start] = useTransition();

  function toggleVerify() {
    start(async () => {
      const res = await setAccountVerified(account.id, !account.verified);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(account.verified ? "Verificación quitada" : "Cuenta verificada");
        onChanged?.();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-tc-border bg-card p-2.5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-tc-border bg-tc-surface-2"
          style={{ color: opt?.color ? `hsl(${opt.color})` : "hsl(var(--tc-fg-tertiary))" }}
        >
          <BrandIcon platform={opt?.icon ?? account.platform} className="h-4 w-4" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1.5 text-sm text-tc-fg">
            {platformLabel(account.platform)}
            {account.verified && (
              <BadgeCheck className="h-3.5 w-3.5 text-[hsl(var(--tc-success))]" />
            )}
          </span>
          <span className="truncate font-mono text-[11px] text-tc-fg-muted">
            {account.handle}
          </span>
        </div>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir"
            className="rounded-md p-1 text-tc-fg-muted transition-colors hover:text-tc-fg"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {canVerify && (
        <Button
          type="button"
          variant={account.verified ? "ghost" : "outline"}
          size="sm"
          onClick={toggleVerify}
          disabled={pending}
          className="w-full gap-1.5"
        >
          <BadgeCheck className="h-3.5 w-3.5" />
          {account.verified ? "Quitar verificación" : "Verificar cuenta"}
        </Button>
      )}
    </div>
  );
}
