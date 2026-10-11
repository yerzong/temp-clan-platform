"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Swords, Check, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Opponent } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createOpponent,
  updateOpponent,
  deleteOpponent,
} from "../actions";

/** Owner/admin manager for the org-level rivals registry (name + logo). */
export function OpponentsManager({ opponents }: { opponents: Opponent[] }) {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add() {
    if (!name.trim()) return;
    start(async () => {
      const res = await createOpponent(name.trim(), logo.trim() || null);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Rival guardado");
        setName("");
        setLogo("");
      }
    });
  }

  function remove(id: string) {
    start(async () => {
      const res = await deleteOpponent(id);
      if (!res.ok) toast.error(res.error);
      else toast.success("Rival eliminado");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border border-tc-border bg-tc-surface-1 p-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-[11px] font-medium text-tc-fg-tertiary">
            Nombre del rival
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. TSM"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[11px] font-medium text-tc-fg-tertiary">
            URL del logo (opcional)
          </label>
          <Input
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            placeholder="https://…/logo.png"
          />
        </div>
        <Button
          type="button"
          onClick={add}
          disabled={pending || !name.trim()}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>

      {opponents.length === 0 ? (
        <p className="text-xs text-tc-fg-tertiary">
          Aún no hay rivales registrados. Agrégalos aquí o créalos sobre la
          marcha al agendar una convocatoria.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-tc-border-soft overflow-hidden rounded-lg border border-tc-border">
          {opponents.map((o) =>
            editing === o.id ? (
              <EditRow
                key={o.id}
                opponent={o}
                onDone={() => setEditing(null)}
              />
            ) : (
              <li
                key={o.id}
                className="flex items-center gap-3 bg-card px-3 py-2"
              >
                {o.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.logoUrl}
                    alt=""
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-tc-surface-2 text-tc-fg-muted">
                    <Swords className="h-4 w-4" />
                  </span>
                )}
                <span className="flex-1 truncate text-sm text-tc-fg">
                  {o.name}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(o.id)}
                  aria-label="Editar rival"
                  className="rounded-md p-1.5 text-tc-fg-muted hover:bg-tc-surface-2 hover:text-tc-fg"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(o.id)}
                  disabled={pending}
                  aria-label="Eliminar rival"
                  className="rounded-md p-1.5 text-tc-fg-muted hover:bg-tc-surface-2 hover:text-[hsl(var(--tc-destructive))]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

function EditRow({
  opponent,
  onDone,
}: {
  opponent: Opponent;
  onDone: () => void;
}) {
  const [name, setName] = useState(opponent.name);
  const [logo, setLogo] = useState(opponent.logoUrl ?? "");
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const res = await updateOpponent(opponent.id, name.trim(), logo.trim() || null);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Rival actualizado");
        onDone();
      }
    });
  }

  return (
    <li className="flex flex-col gap-2 bg-tc-surface-1 px-3 py-2 sm:flex-row sm:items-center">
      <Input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
      <Input
        value={logo}
        onChange={(e) => setLogo(e.target.value)}
        placeholder="URL del logo"
        className="flex-1"
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={save}
          disabled={pending || !name.trim()}
          aria-label="Guardar"
          className="rounded-md p-1.5 text-emerald-500 hover:bg-tc-surface-2"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDone}
          aria-label="Cancelar"
          className="rounded-md p-1.5 text-tc-fg-muted hover:bg-tc-surface-2 hover:text-tc-fg"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
