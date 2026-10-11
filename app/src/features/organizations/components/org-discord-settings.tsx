"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setOrgDiscordWebhook, type ActionResult } from "@/features/esports/actions";
import { setDiscordNotify } from "../actions";

const initialState: ActionResult = {};

/** Org Discord settings: the webhook + the "announce by default" toggle. */
export function OrgDiscordSettings({
  connected,
  notifyDefault,
}: {
  connected: boolean;
  notifyDefault: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    setOrgDiscordWebhook,
    initialState
  );
  useActionToast(state, pending, "Discord actualizado");
  const wasPending = useRef(false);
  useEffect(() => {
    wasPending.current = pending;
  }, [pending]);

  const [notify, setNotify] = useState(notifyDefault);
  const [savingToggle, startToggle] = useTransition();

  function toggle(next: boolean) {
    setNotify(next);
    startToggle(async () => {
      const res = await setDiscordNotify(next);
      if (!res.ok) {
        toast.error(res.error);
        setNotify(!next);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-2">
        <Label htmlFor="org-dc">Webhook de Discord de la organización</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="org-dc"
            name="webhookUrl"
            type="url"
            defaultValue=""
            placeholder="https://discord.com/api/webhooks/…"
            className="flex-1"
          />
          <Button type="submit" disabled={pending} className="shrink-0">
            {pending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
        <p className="text-[11px] text-tc-fg-muted">
          En Discord: Ajustes del canal → Integraciones → Webhooks → Nuevo
          webhook → Copiar URL. Déjalo vacío para desconectar.
        </p>
        {connected && (
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Canal conectado. Escribe uno nuevo para reemplazarlo.
          </p>
        )}
        {state.error && (
          <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
            {state.error}
          </p>
        )}
      </form>

      <label className="flex items-center justify-between gap-3 rounded-lg border border-tc-border bg-tc-surface-1 px-3 py-2.5">
        <span className="text-sm text-tc-fg-secondary">
          Avisar en Discord al crear una convocatoria
          <span className="block text-[11px] text-tc-fg-muted">
            Valor por defecto; se puede cambiar en cada convocatoria.
          </span>
        </span>
        <Switch
          checked={notify}
          disabled={savingToggle}
          onChange={(e) => toggle(e.target.checked)}
          aria-label="Avisar en Discord por defecto"
        />
      </label>
    </div>
  );
}
