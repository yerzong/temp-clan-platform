"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type DeleteState = { error?: string };

type DeleteAction = (
  prev: DeleteState,
  formData: FormData
) => Promise<DeleteState>;

/**
 * Generic delete control with inline confirmation. Reusable across modules.
 * Calls the server action directly via a transition (robust when the action is
 * passed as a prop from a server component).
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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function doDelete() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set(idName, idValue);
      const res = await action({}, fd);
      if (res?.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        setConfirming(false);
        toast.success("Removed");
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-tc-fg-tertiary">{label}?</span>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={doDelete}
        >
          {pending ? "..." : "Yes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          No
        </Button>
        {error && (
          <span className="text-[11px] text-[hsl(var(--tc-destructive))]">
            {error}
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
