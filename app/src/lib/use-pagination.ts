"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Client-side pagination over an in-memory array. Returns the current page
 * slice plus controls, including a changeable page size. Resets/clamps the page
 * whenever the item count or page size changes so the view never lands on an
 * empty page.
 */
export function usePagination<T>(items: T[], initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  // Clamp the current page if the list or page size changed under it.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  function setPageSize(size: number) {
    setPageSizeState(size);
    setPage(1);
  }

  return {
    page,
    pageSize,
    pageCount,
    pageItems,
    setPage,
    setPageSize,
    canPrev: page > 1,
    canNext: page < pageCount,
    total: items.length,
    rangeStart: items.length === 0 ? 0 : (page - 1) * pageSize + 1,
    rangeEnd: Math.min(page * pageSize, items.length),
  };
}
