"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Keeps an overlay mounted long enough to play its exit animation.
 *
 * Returns `mounted` (whether to render at all) and `closing` (whether the exit
 * animation should play). When `open` flips to false, the element stays mounted
 * with `closing = true` for `durationMs`, then unmounts. Honors the user's
 * reduced-motion preference by skipping the hold.
 *
 * Generic — use for sheets, dialogs, popovers, any mount/unmount overlay.
 */
export function useMountedTransition(open: boolean, durationMs = 300) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (timer.current) clearTimeout(timer.current);
      setMounted(true);
      setClosing(false);
      return;
    }

    // Opening -> closing: play exit, then unmount.
    if (!mounted) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setMounted(false);
      return;
    }

    setClosing(true);
    timer.current = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, durationMs);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { mounted, closing };
}
