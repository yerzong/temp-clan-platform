"use client";

import { useState, useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { updateLeague, deleteLeague, type ActionResult } from "../actions";
import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: ActionResult = {};

const FORMATS = [
  { value: "versus-4v4", label: "Versus 4v4" },
  { value: "horde-siege", label: "Horde Siege" },
];

export function LeagueSettings({
  leagueId,
  name,
  format,
}: {
  leagueId: string;
  name: string;
  format: string;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [updateState, updateAction, updating] = useActionState(
    updateLeague,
    initialState
  );
  const [deleting, startDelete] = useTransition();

  useActionToast(updateState, updating, "League updated");

  useEffect(() => {
    if (!updating && !updateState.error) setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updating]);

  function doDelete() {
    startDelete(async () => {
      const fd = new FormData();
      fd.set("leagueId", leagueId);
      const res = await deleteLeague({}, fd);
      if (res?.error) toast.error(res.error);
      else toast.success("League deleted");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ajustes de la liga</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {editing ? (
          <form action={updateAction} className="flex flex-col gap-3">
            <input type="hidden" name="leagueId" value={leagueId} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="league-edit-name">Nombre</Label>
              <Input
                id="league-edit-name"
                name="name"
                defaultValue={name}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="league-edit-format">Formato</Label>
              <select
                id="league-edit-format"
                name="format"
                defaultValue={format}
                className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            {updateState.error && (
              <p className="text-sm text-[hsl(var(--tc-destructive))]">
                {updateState.error}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={updating}>
                {updating ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-tc-fg-secondary">
              Renombra o cambia el formato.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Editar
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-tc-border-soft pt-4">
          <span className="text-[11px] text-tc-fg-tertiary">
            Elimina esta liga, sus equipos y partidas.
          </span>
          {confirmingDelete ? (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={doDelete}
              >
                {deleting ? "..." : "Eliminar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingDelete(false)}
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingDelete(true)}
              className="text-[hsl(var(--tc-destructive))]"
            >
              Eliminar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
