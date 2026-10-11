"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE_OPTIONS = [10, 25, 50];

/**
 * Generic pagination control. Always shows the total and a page-size selector;
 * prev/next buttons appear whenever there is more than one page. Pair with the
 * usePagination hook.
 */
export function Pagination({
  page,
  pageSize,
  pageCount,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onPageSize,
  rangeStart,
  rangeEnd,
  total,
  noun = "resultados",
}: {
  page: number;
  pageSize: number;
  pageCount: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageSize: (size: number) => void;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  noun?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-tc-fg-muted">
          {rangeStart}–{rangeEnd} de {total} {noun}
        </span>
        <label className="flex items-center gap-1.5 text-[11px] text-tc-fg-muted">
          Por página
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="h-7 rounded-md border border-tc-border bg-input px-1.5 text-xs text-tc-fg outline-none focus-visible:border-tc-accent"
          >
            {SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {pageCount > 1 && (
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
      )}
    </div>
  );
}
