"use client";

import { useState, useTransition } from "react";
import { Trash2, Inbox } from "lucide-react";
import { toast } from "sonner";
import type { AppNotification } from "@/lib/domain/types";
import { usePagination } from "@/lib/use-pagination";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { deleteNotification, deleteAllNotifications } from "../actions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Full notification log (bitácora). Shows every notification in a table and
 * allows permanent deletion — one row or all of them. Deletion here is real
 * (not a panel dismiss).
 */
export function NotificationLog({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  const [items, setItems] = useState<AppNotification[]>(notifications);
  const [confirmAll, setConfirmAll] = useState(false);
  const [pending, start] = useTransition();
  const pager = usePagination(items, 15);

  function removeOne(id: string) {
    setItems((prev) => prev.filter((n) => n.id !== id));
    start(async () => {
      const res = await deleteNotification(id);
      if (res?.error) toast.error(res.error);
    });
  }

  function removeAll() {
    start(async () => {
      const res = await deleteAllNotifications();
      if (res?.error) {
        toast.error(res.error);
      } else {
        setItems([]);
        setConfirmAll(false);
        toast.success("Bitácora vaciada");
      }
    });
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-4 w-4" />}
        title="Bitácora vacía"
        description="Aquí quedará el historial de notificaciones de tu organización."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setConfirmAll(true)}
          className="gap-2 text-tc-fg-secondary"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar todas
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-tc-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-tc-border bg-tc-surface-2 text-left">
              <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-tc-fg-tertiary">
                Evento
              </th>
              <th className="hidden px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-tc-fg-tertiary sm:table-cell">
                Fecha
              </th>
              <th className="w-10 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {pager.pageItems.map((n) => (
              <tr
                key={n.id}
                className="border-b border-tc-border-soft last:border-b-0 hover:bg-tc-surface-1"
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-tc-fg">{n.title}</span>
                    {n.body && (
                      <span className="text-xs text-tc-fg-tertiary">
                        {n.body}
                      </span>
                    )}
                    <span className="text-[11px] text-tc-fg-muted sm:hidden">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-tc-fg-tertiary sm:table-cell">
                  {formatDate(n.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => removeOne(n.id)}
                    aria-label="Eliminar notificación"
                    disabled={pending}
                    className="rounded-md p-1.5 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-[hsl(var(--tc-destructive))]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={pager.page}
        pageSize={pager.pageSize}
        pageCount={pager.pageCount}
        canPrev={pager.canPrev}
        canNext={pager.canNext}
        onPrev={() => pager.setPage(pager.page - 1)}
        onNext={() => pager.setPage(pager.page + 1)}
        onPageSize={pager.setPageSize}
        rangeStart={pager.rangeStart}
        rangeEnd={pager.rangeEnd}
        total={pager.total}
        noun="notificaciones"
      />

      <ConfirmDialog
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        onConfirm={removeAll}
        title="Eliminar todas las notificaciones"
        description="Se borrará todo el historial de forma permanente. Esta acción no se puede deshacer."
        confirmLabel="Eliminar todas"
        destructive
        pending={pending}
      />
    </div>
  );
}
