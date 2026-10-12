"use client";

import { useState, useTransition } from "react";
import {
  Pencil,
  Trash2,
  Clock,
  Swords,
  Gamepad2,
  Map as MapIcon,
  Users,
  Trophy,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import type {
  TeamEvent,
  TeamEventKind,
  AttendanceStatus,
  EventAttendee,
} from "@/lib/domain/types";
import { setAttendance, deleteEvent } from "../actions";
import { AttendanceDialog } from "./attendance-dialog";

const KIND_META: Record<TeamEventKind, { label: string; className: string; noun: string }> = {
  scrim: {
    label: "Scrim",
    noun: "scrim",
    className: "bg-[hsl(var(--tc-accent))]/15 text-[hsl(var(--tc-accent-hover))]",
  },
  official: {
    label: "Oficial",
    noun: "partido",
    className:
      "bg-[hsl(var(--tc-destructive))]/15 text-[hsl(var(--tc-destructive))]",
  },
  practice: {
    label: "Práctica",
    noun: "práctica",
    className: "bg-tc-surface-2 text-tc-fg-secondary",
  },
};

const STATUS_DOT: Record<AttendanceStatus, string> = {
  yes: "bg-emerald-500",
  maybe: "bg-[hsl(var(--tc-amber))]",
  no: "bg-[hsl(var(--tc-destructive))]",
  pending: "bg-tc-fg-muted",
};

const STATUS_RING: Record<AttendanceStatus, string> = {
  yes: "ring-emerald-500",
  maybe: "ring-[hsl(var(--tc-amber))]",
  no: "ring-[hsl(var(--tc-destructive))]",
  pending: "ring-transparent",
};

/** Big CTA button styles per status when active. */
const CTA_ACTIVE: Record<"yes" | "maybe" | "no", string> = {
  yes: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500",
  maybe:
    "bg-[hsl(var(--tc-amber))]/15 text-[hsl(var(--tc-amber))] ring-1 ring-[hsl(var(--tc-amber))]",
  no: "bg-[hsl(var(--tc-destructive))]/15 text-[hsl(var(--tc-destructive))] ring-1 ring-[hsl(var(--tc-destructive))]",
};

const CTA_LABEL: Record<"yes" | "maybe" | "no", string> = {
  yes: "✓ Voy",
  maybe: "Tal vez",
  no: "No puedo",
};

function calendarParts(iso: string): { weekday: string; day: string; month: string } {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString("es-MX", { weekday: "short" }).replace(".", ""),
    day: d.toLocaleDateString("es-MX", { day: "numeric" }),
    month: d.toLocaleDateString("es-MX", { month: "short" }).replace(".", ""),
  };
}

function timeStr(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Human relative time; null until the client clock is known. */
function relativeStr(iso: string, now: number | null): string | null {
  if (now === null) return null;
  const target = new Date(iso).getTime();
  const diff = target - now; // positive = future
  const past = diff < 0;
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);

  let label: string;
  if (mins < 60) label = `${mins} min`;
  else if (hours < 24) label = `${hours} h`;
  else if (days === 1) return past ? "ayer" : "mañana";
  else label = `${days} d`;

  return past ? `hace ${label}` : `en ${label}`;
}

export function EventCard({
  event,
  canManage,
  myMembershipId,
  teamId,
  onEdit,
  now,
  isPast = false,
}: {
  event: TeamEvent;
  canManage: boolean;
  myMembershipId: string | null;
  teamId: string;
  onEdit: (event: TeamEvent) => void;
  now: number | null;
  isPast?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<{
    membershipId: string;
    title: string;
    status: AttendanceStatus;
    reason: string | null;
  } | null>(null);
  const kind = KIND_META[event.kind];
  const cal = calendarParts(event.scheduledAt);
  const relative = relativeStr(event.scheduledAt, now);

  const rivalName = event.opponentName ?? event.opponent;
  const yesCount = event.attendees.filter((a) => a.status === "yes").length;
  const me = myMembershipId
    ? event.attendees.find((a) => a.membershipId === myMembershipId) ?? null
    : null;
  const hasParams =
    event.gameMode ||
    event.maps.length > 0 ||
    event.teamSize ||
    event.seriesFormat;
  const withReason = event.attendees.filter(
    (a) => a.reason && (a.status === "no" || a.status === "maybe")
  );

  function save(
    membershipId: string,
    status: AttendanceStatus,
    reason: string | null
  ) {
    startTransition(async () => {
      const res = await setAttendance({
        eventId: event.id,
        membershipId,
        status,
        reason,
        teamId,
      });
      if (res?.error) toast.error(res.error);
      else setDialog(null);
    });
  }

  function canEditAttendee(a: EventAttendee): boolean {
    return !isPast && (canManage || a.membershipId === myMembershipId);
  }

  /** Open the status dialog for an attendee (admin confirm / reason capture). */
  function openFor(a: EventAttendee, presetStatus?: AttendanceStatus) {
    const isSelf = a.membershipId === myMembershipId;
    setDialog({
      membershipId: a.membershipId,
      title: isSelf ? "Tu asistencia" : `Asistencia de ${a.displayName}`,
      status: presetStatus ?? a.status,
      reason: a.reason,
    });
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-tc-border bg-card p-4 ${
        isPast ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Calendar date tile */}
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg border border-tc-border bg-tc-surface-2 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-tc-fg-muted">
            {cal.weekday}
          </span>
          <span className="font-mono text-2xl font-bold leading-none text-tc-fg">
            {cal.day}
          </span>
          <span className="text-[10px] font-medium uppercase text-tc-fg-tertiary">
            {cal.month}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${kind.className}`}
            >
              {kind.label}
            </span>
            {relative && (
              <span className="text-[11px] font-medium text-tc-fg-tertiary">
                {relative}
              </span>
            )}
          </div>
          <p className="truncate text-sm font-semibold text-tc-fg">
            {event.title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-tc-fg-tertiary">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeStr(event.scheduledAt)}
              {event.durationMin ? ` · ${event.durationMin} min` : ""}
            </span>
            {rivalName && (
              <span className="inline-flex items-center gap-1">
                {event.opponentLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.opponentLogoUrl}
                    alt=""
                    className="h-4 w-4 rounded object-cover"
                  />
                ) : (
                  <Swords className="h-3 w-3" />
                )}
                {rivalName}
              </span>
            )}
          </div>
        </div>

        {canManage && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(event)}
              aria-label="Editar evento"
              className="rounded-md p-1.5 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-tc-fg"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <DeleteEventButton eventId={event.id} teamId={teamId} />
          </div>
        )}
      </div>

      {hasParams && (
        <div className="flex flex-col gap-2.5 rounded-lg border border-tc-border-soft bg-tc-surface-1 p-3">
          {(event.teamSize || event.gameMode || event.seriesFormat) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {event.teamSize && (
                <MetaChip icon={Users} label="Tamaño" value={event.teamSize} />
              )}
              {event.gameMode && (
                <MetaChip icon={Gamepad2} label="Modo" value={event.gameMode} accent />
              )}
              {event.seriesFormat && (
                <MetaChip icon={Trophy} label="Formato" value={event.seriesFormat} />
              )}
            </div>
          )}

          {event.maps.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex shrink-0 items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-tc-fg-muted">
                <MapIcon className="h-3.5 w-3.5" />
                {event.maps.length > 1 ? "Mapas" : "Mapa"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {event.maps.map((m, i) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 rounded-md border border-tc-border bg-tc-surface-2 px-2 py-0.5 text-xs font-medium text-tc-fg-secondary"
                  >
                    <span className="font-mono text-[10px] text-tc-fg-muted">{i + 1}</span>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {event.notes && (
        <p className="whitespace-pre-wrap rounded-md bg-tc-surface-1 px-3 py-2 text-xs text-tc-fg-secondary">
          {event.notes}
        </p>
      )}

      {/* Player CTA — the protagonist */}
      {me && !isPast && (
        <div className="rounded-lg border border-tc-border-soft bg-tc-surface-1 p-3">
          <p className="mb-2 text-xs font-semibold text-tc-fg-secondary">
            ¿Vas a {event.kind === "practice" ? "esta" : "este"} {kind.noun}?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(["yes", "maybe", "no"] as const).map((st) => {
              const active = me.status === st;
              return (
                <button
                  key={st}
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    st === "yes"
                      ? save(me.membershipId, "yes", null)
                      : openFor(me, st)
                  }
                  className={`rounded-md py-2 text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-60 ${
                    active
                      ? CTA_ACTIVE[st]
                      : "border border-tc-border text-tc-fg-tertiary hover:bg-tc-surface-2 hover:text-tc-fg-secondary"
                  }`}
                >
                  {CTA_LABEL[st]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Roster attendance */}
      {event.attendees.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-tc-border-soft pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-tc-fg-tertiary">
              Roster
            </span>
            <span className="text-[11px] font-semibold text-tc-fg-secondary">
              {yesCount}/{event.attendees.length} confirmados
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {event.attendees.map((a) => {
              const editable = canEditAttendee(a);
              return (
                <button
                  key={a.membershipId}
                  type="button"
                  disabled={!editable || pending}
                  onClick={() => openFor(a)}
                  title={
                    a.reason
                      ? `${a.displayName}: ${a.reason}`
                      : editable
                        ? `${a.displayName} (clic para cambiar)`
                        : a.displayName
                  }
                  className={`relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-tc-surface-2 ring-2 ${
                    STATUS_RING[a.status]
                  } ${editable ? "cursor-pointer hover:opacity-80" : "cursor-default"} ${
                    a.membershipId === myMembershipId ? "outline outline-1 outline-tc-border-strong" : ""
                  }`}
                >
                  {a.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.avatarUrl}
                      alt={a.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-tc-fg-muted">
                      {a.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-card ${STATUS_DOT[a.status]}`}
                  />
                </button>
              );
            })}
          </div>

          {withReason.length > 0 && (
            <div className="flex flex-col gap-1 pt-0.5">
              {withReason.map((a) => (
                <p
                  key={a.membershipId}
                  className="flex items-start gap-1.5 text-[11px] text-tc-fg-tertiary"
                >
                  <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-tc-fg-muted" />
                  <span>
                    <span className="font-medium text-tc-fg-secondary">
                      {a.displayName}:
                    </span>{" "}
                    {a.reason}
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <AttendanceDialog
        open={dialog !== null}
        title={dialog?.title ?? ""}
        initialStatus={dialog?.status ?? "yes"}
        initialReason={dialog?.reason ?? null}
        pending={pending}
        onClose={() => setDialog(null)}
        onConfirm={(status, reason) =>
          dialog && save(dialog.membershipId, status, reason)
        }
      />
    </div>
  );
}

function MetaChip({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-tc-fg-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span
        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
          accent
            ? "bg-[hsl(var(--tc-accent))]/15 text-[hsl(var(--tc-accent-hover))] ring-1 ring-[hsl(var(--tc-accent))]/30"
            : "bg-tc-surface-2 text-tc-fg-secondary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function DeleteEventButton({
  eventId,
  teamId,
}: {
  eventId: string;
  teamId: string;
}) {
  const [pending, startTransition] = useTransition();

  function doDelete() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("eventId", eventId);
      fd.set("teamId", teamId);
      const res = await deleteEvent({}, fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Evento eliminado");
    });
  }

  return (
    <button
      type="button"
      onClick={doDelete}
      disabled={pending}
      aria-label="Eliminar evento"
      className="rounded-md p-1.5 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-[hsl(var(--tc-destructive))]"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
