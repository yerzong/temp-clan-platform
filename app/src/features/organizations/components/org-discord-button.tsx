"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plug } from "lucide-react";
import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { setOrgDiscordWebhook, type ActionResult } from "@/features/esports/actions";

const initialState: ActionResult = {};

/**
 * Owner/admin control on the Overview to connect the organization's Discord
 * once. Every team announces its events to this channel by default (a team can
 * still override with its own webhook on its page).
 */
export function OrgDiscordButton({ connected }: { connected: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    setOrgDiscordWebhook,
    initialState
  );
  const wasPending = useRef(false);
  useActionToast(state, pending, "Discord de la organización actualizado");

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) setOpen(false);
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Plug className="h-4 w-4" />
        Discord
        {connected && (
          <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
        )}
      </Button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Discord de la organización"
        description="Conecta tu servidor una vez: todos los equipos anunciarán aquí sus convocatorias por defecto."
      >
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="org-dc-url">URL del webhook de Discord</Label>
            <Input
              id="org-dc-url"
              name="webhookUrl"
              type="url"
              defaultValue=""
              placeholder="https://discord.com/api/webhooks/…"
            />
            <p className="text-[11px] text-tc-fg-muted">
              En Discord: Ajustes del canal → Integraciones → Webhooks → Nuevo
              webhook → Copiar URL. Déjalo vacío para desconectar.
            </p>
            {connected && (
              <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Hay un canal conectado. Escribe uno nuevo para reemplazarlo.
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
    </>
  );
}
