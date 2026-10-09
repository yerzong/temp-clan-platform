"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type ActionState = { error?: string } | undefined;

/**
 * Fires a toast when a useActionState result settles. Shows the error toast on
 * failure, or a success toast when the action completed without error after a
 * pending cycle. Pass the state and the pending flag from useActionState.
 */
export function useActionToast(
  state: ActionState,
  pending: boolean,
  successMessage: string
) {
  const wasPending = useRef(false);

  useEffect(() => {
    // Detect the transition from pending -> settled.
    if (wasPending.current && !pending) {
      if (state?.error) {
        toast.error(state.error);
      } else {
        toast.success(successMessage);
      }
    }
    wasPending.current = pending;
  }, [pending, state, successMessage]);
}
