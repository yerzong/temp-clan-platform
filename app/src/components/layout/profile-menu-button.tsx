import Link from "next/link";

function initials(name: string): string {
  const cleaned = name.replace(/^[.@]+/, "");
  const parts = cleaned.split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Top-bar profile entry: avatar + name, links to the profile page. */
export function ProfileMenuButton({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <Link
      href="/dashboard/profile"
      className="flex items-center gap-2 rounded-md border border-transparent px-1.5 py-1 transition-colors hover:border-tc-border hover:bg-tc-surface-2"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-tc-border bg-tc-surface-2">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-mono text-[10px] font-semibold text-tc-fg-tertiary">
            {initials(name)}
          </span>
        )}
      </span>
      <span className="hidden max-w-32 truncate text-sm text-tc-fg-secondary sm:inline">
        {name}
      </span>
    </Link>
  );
}
