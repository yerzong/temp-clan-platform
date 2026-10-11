import { Eye } from "lucide-react";
import type { LiveMemberStream } from "@/lib/domain/types";
import { BrandIcon } from "@/features/profile/brand-icon";
import { LiveChip } from "@/components/ui/live-chip";
import { LiveUptime } from "./live-uptime";

/** Compact viewer count: 1234 -> "1.2 k". */
function formatViewers(n: number): string {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(1).replace(/\.0$/, "")} k`;
}

/**
 * A live stream card: channel thumbnail with a live badge, the streamer's
 * identity, title and category. Links out to the channel in a new tab.
 */
export function LiveStreamCard({ stream }: { stream: LiveMemberStream }) {
  return (
    <a
      href={stream.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-lg border border-tc-border bg-card transition-colors hover:border-tc-border-strong"
    >
      <div className="relative aspect-video overflow-hidden bg-tc-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stream.thumbnailUrl}
          alt={`Stream de ${stream.channel}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <LiveChip className="absolute left-2 top-2" />
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur-sm">
          <Eye className="h-3 w-3" />
          {formatViewers(stream.viewerCount)}
        </span>
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
          <LiveUptime startedAt={stream.startedAt} />
        </span>
      </div>

      <div className="flex gap-3 p-3">
        <span className="relative mt-0.5 flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-tc-border bg-tc-surface-2">
          {stream.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={stream.avatarUrl}
              alt={stream.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-tc-fg-muted">
              {stream.displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card">
            <BrandIcon
              platform={stream.platform}
              className="h-3 w-3"
              style={{ color: "#9146FF" }}
            />
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-semibold text-tc-fg"
            title={stream.title}
          >
            {stream.title || "Transmisión en vivo"}
          </p>
          <p className="truncate text-xs text-tc-fg-secondary">
            {stream.displayName}
          </p>
          {stream.game && (
            <p className="mt-1 truncate text-[11px] text-tc-fg-tertiary">
              {stream.game}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}
