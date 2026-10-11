"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Client-side pagination over an in-memory array. Returns the current page
 * slice plus controls. Resets to page 1 whenever the item count shrinks below
 * the current page (e.g. after filtering or deleting), so the view never lands
 * on an empty page.
 */
export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  // Clamp the current page if the list changed under it.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    pageCount,
    pageItems,
    setPage,
    canPrev: page > 1,
    canNext: page < pageCount,
    total: items.length,
    rangeStart: items.length === 0 ? 0 : (page - 1) * pageSize + 1,
    rangeEnd: Math.min(page * pageSize, items.length),
  };
}
