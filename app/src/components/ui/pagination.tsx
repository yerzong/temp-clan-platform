"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Generic pagination control. Shows "x–y de z" plus prev/next buttons. Hidden
 * when there is only one page. Pair with the usePagination hook.
 */
export function Pagination({
  page,
  pageCount,
  canPrev,
  canNext,
  onPrev,
  onNext,
  rangeStart,
  rangeEnd,
  total,
  noun = "resultados",
}: {
  page: number;
  pageCount: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  noun?: string;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 pt-1">
      <span className="text-[11px] text-tc-fg-muted">
        {rangeStart}–{rangeEnd} de {total} {noun}
      </span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Página anterior"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border border-tc-border text-tc-fg-secondary transition-colors",
            canPrev
              ? "hover:border-tc-border-strong hover:text-tc-fg"
              : "cursor-not-allowed opacity-40"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="min-w-16 text-center font-mono text-xs text-tc-fg-tertiary">
          {page} / {pageCount}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Página siguiente"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border border-tc-border text-tc-fg-secondary transition-colors",
            canNext
              ? "hover:border-tc-border-strong hover:text-tc-fg"
              : "cursor-not-allowed opacity-40"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
