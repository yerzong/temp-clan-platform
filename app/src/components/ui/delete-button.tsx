"use client";

import { useState, useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type DeleteState = { error?: string };

type DeleteAction = (
  prev: DeleteState,
  formData: FormData
) => Promise<DeleteState>;

/**
 * Generic delete control with inline confirmation. Reusable across modules.
 * Pass the server action, the id field name, and the id value. Renders an icon
 * button that expands to a "Remove? Yes/No" confirm before submitting.
 */
export function DeleteButton({
  action,
  idName,
  idValue,
  label = "Remove",
}: {
  action: DeleteAction;
  idName: string;
  idValue: string;
  label?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <form action={formAction} className="flex items-center gap-1.5">
          <input type="hidden" name={idName} value={idValue} />
          <span className="text-[11px] text-tc-fg-tertiary">{label}?</span>
          <Button type="submit" variant="destructive" size="sm" disabled={pending}>
            {pending ? "..." : "Yes"}
          </Button>
        </form>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
        >
          No
        </Button>
        {state.error && (
          <span className="text-[11px] text-[hsl(var(--tc-destructive))]">
            {state.error}
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-md p-2 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-[hsl(var(--tc-destructive))]"
      aria-label={label}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
