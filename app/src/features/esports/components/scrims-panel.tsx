"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CalendarPlus, Plug } from "lucide-react";
import type { TeamEvent, Opponent } from "@/lib/domain/types";
import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { EventCard } from "./event-card";
import { OpponentCombobox } from "./opponent-combobox";
import { MatchParamsFields } from "./match-params-fields";
import {
  createEvent,
  updateEvent,
  setDiscordWebhook,
  type ActionResult,
} from "../actions";

interface ScheduleOptions {
  opponents: Opponent[];
  mapOptions: string[];
  modeOptions: string[];
  discordNotifyDefault: boolean;
  discordConnected: boolean;
}

const initialState: ActionResult = {};

const KINDS = [
  { value: "scrim", label: "Scrim" },
  { value: "official", label: "Partido oficial" },
  { value: "practice", label: "Práctica" },
];

const inputClass =
  "h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent";

/** ISO -> value for <input type="datetime-local"> (local time). */
function toInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function ScrimsPanel({
  team,
  events,
  canManage,
  myMembershipId,
  orgHasDiscord = false,
  options,
}: {
  team: { id: string; name: string; hasDiscordWebhook: boolean };
  events: TeamEvent[];
  canManage: boolean;
  myMembershipId: string | null;
  orgHasDiscord?: boolean;
  options: ScheduleOptions;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<TeamEvent | null>(null);
  const [discordOpen, setDiscordOpen] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => setNow(Date.now()), []);

  // Split into upcoming / past once we know the client clock; before that, show
  // everything as a single ascending list to avoid a hydration mismatch.
  const upcoming: TeamEvent[] = [];
  const past: TeamEvent[] = [];
  if (now === null) {
    upcoming.push(...events);
  } else {
    for (const e of events) {
      (new Date(e.scheduledAt).getTime() >= now ? upcoming : past).push(e);
    }
    past.reverse(); // most recent first
  }

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
          Convocatorias y scrims
        </h2>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDiscordOpen(true)}
              className="gap-1.5"
            >
              <Plug className="h-4 w-4" />
              Discord
              {(team.hasDiscordWebhook || orgHasDiscord) && (
                <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="gap-1.5"
            >
              <CalendarPlus className="h-4 w-4" />
              Agendar
            </Button>
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-tc-border bg-card/50 p-8 text-center">
          <p className="text-sm font-medium text-tc-fg-secondary">
            Sin convocatorias todavía
          </p>
          <p className="mt-1 text-xs text-tc-fg-tertiary">
            {canManage
              ? "Agenda un scrim o partido y el roster podrá confirmar su asistencia."
              : "Cuando el mánager agende un scrim o partido, aparecerá aquí."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-tc-fg-muted">
              Próximos · {upcoming.length}
            </p>
            {upcoming.length === 0 ? (
              <p className="text-xs text-tc-fg-tertiary">
                No hay nada agendado próximamente.
              </p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {upcoming.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    canManage={canManage}
                    myMembershipId={myMembershipId}
                    teamId={team.id}
                    onEdit={setEditing}
                    now={now}
                  />
                ))}
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-tc-fg-muted">
                Pasados · {past.length}
              </p>
              <div className="grid gap-3 lg:grid-cols-2">
                {past.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    canManage={canManage}
                    myMembershipId={myMembershipId}
                    teamId={team.id}
                    onEdit={setEditing}
                    now={now}
                    isPast
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {canManage && (
        <>
          <EventFormSheet
            key={createOpen ? "create-open" : "create-closed"}
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            team={team}
            options={options}
          />
          <EventFormSheet
            key={editing?.id ?? "edit-closed"}
            open={editing !== null}
            onClose={() => setEditing(null)}
            team={team}
            event={editing ?? undefined}
            options={options}
          />
          <DiscordSheet
            open={discordOpen}
            onClose={() => setDiscordOpen(false)}
            team={team}
            orgHasDiscord={orgHasDiscord}
          />
        </>
      )}
    </section>
  );
}

function EventFormSheet({
  open,
  onClose,
  team,
  event,
  options,
}: {
  open: boolean;
  onClose: () => void;
  team: { id: string; name: string };
  event?: TeamEvent;
  options: ScheduleOptions;
}) {
  const isEdit = Boolean(event);
  const [state, formAction, pending] = useActionState(
    isEdit ? updateEvent : createEvent,
    initialState
  );
  const wasPending = useRef(false);
  useActionToast(
    state,
    pending,
    isEdit ? "Evento actualizado" : "Convocatoria creada"
  );

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) onClose();
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const initialRival = event
    ? event.opponentId
      ? { id: event.opponentId, name: event.opponentName ?? "Rival" }
      : event.opponent
        ? { id: null, name: event.opponent }
        : null
    : null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar convocatoria" : "Nueva convocatoria"}
      description="Agenda un scrim, partido o práctica para el equipo."
    >
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="teamId" value={team.id} />
        <input type="hidden" name="teamName" value={team.name} />
        {isEdit && <input type="hidden" name="eventId" value={event!.id} />}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-kind">Tipo</Label>
          <select
            id="ev-kind"
            name="kind"
            defaultValue={event?.kind ?? "scrim"}
            className={inputClass}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-title">Título</Label>
          <Input
            id="ev-title"
            name="title"
            defaultValue={event?.title ?? ""}
            placeholder="Ej. Scrim vs TSM"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Rival (opcional)</Label>
          <OpponentCombobox
            opponents={options.opponents}
            initial={initialRival}
          />
          <p className="text-[11px] text-tc-fg-muted">
            Escribe para buscar o registrar un rival oficial; o úsalo solo esta
            vez.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-when">Fecha y hora</Label>
          <input
            id="ev-when"
            type="datetime-local"
            name="scheduledAt"
            defaultValue={event ? toInputValue(event.scheduledAt) : ""}
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-duration">Duración en minutos (opcional)</Label>
          <Input
            id="ev-duration"
            name="durationMin"
            type="number"
            min={1}
            max={600}
            defaultValue={event?.durationMin ?? ""}
            placeholder="Ej. 90"
          />
        </div>

        <MatchParamsFields
          customModes={options.modeOptions}
          customMaps={options.mapOptions}
          initialMode={event?.gameMode ?? null}
          initialMaps={event?.maps ?? []}
          initialTeamSize={event?.teamSize ?? null}
          initialSeriesFormat={event?.seriesFormat ?? null}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-notes">Notas (opcional)</Label>
          <textarea
            id="ev-notes"
            name="notes"
            defaultValue={event?.notes ?? ""}
            rows={3}
            placeholder="Comp, link del lobby, instrucciones…"
            className="w-full resize-y rounded-md border border-tc-border bg-input px-3 py-2 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
          />
        </div>

        {!isEdit && (options.discordConnected ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-tc-border bg-tc-surface-1 px-3 py-2.5 text-xs text-tc-fg-secondary">
            <span>Avisar en Discord al crear la convocatoria</span>
            <Switch
              name="notifyDiscord"
              defaultChecked={options.discordNotifyDefault}
              aria-label="Avisar en Discord"
            />
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-tc-border px-3 py-2 text-[11px] text-tc-fg-muted">
            Conecta Discord (en Ajustes o en este equipo) para avisar
            automáticamente.
          </p>
        ))}

        {state.error && (
          <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending
            ? "Guardando..."
            : isEdit
              ? "Guardar cambios"
              : "Agendar convocatoria"}
        </Button>
      </form>
    </Sheet>
  );
}

function DiscordSheet({
  open,
  onClose,
  team,
  orgHasDiscord,
}: {
  open: boolean;
  onClose: () => void;
  team: { id: string; hasDiscordWebhook: boolean };
  orgHasDiscord: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    setDiscordWebhook,
    initialState
  );
  const wasPending = useRef(false);
  useActionToast(state, pending, "Webhook de Discord actualizado");

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) onClose();
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Discord de este equipo"
      description="Opcional: publica las convocatorias de este equipo en un canal propio."
    >
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="teamId" value={team.id} />

        {orgHasDiscord && !team.hasDiscordWebhook && (
          <p className="rounded-md border border-tc-border bg-tc-surface-1 px-3 py-2 text-[11px] text-tc-fg-tertiary">
            Este equipo usa el Discord de la organización por defecto. Define un
            webhook aquí solo si quieres que publique en otro canal.
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dc-url">URL del webhook de Discord</Label>
          <Input
            id="dc-url"
            name="webhookUrl"
            type="url"
            defaultValue=""
            placeholder="https://discord.com/api/webhooks/…"
          />
          <p className="text-[11px] text-tc-fg-muted">
            En Discord: Ajustes del canal → Integraciones → Webhooks → Nuevo
            webhook → Copiar URL. Déjalo vacío para volver a usar el de la
            organización.
          </p>
          {team.hasDiscordWebhook && (
            <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Este equipo tiene su propio canal. Escribe uno nuevo para
              reemplazarlo o déjalo vacío para heredar el de la organización.
            </p>
          )}
        </div>

        {state.error && (
          <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Guardando..." : "Guardar"}
        </Button>
      </form>
    </Sheet>
  );
}
