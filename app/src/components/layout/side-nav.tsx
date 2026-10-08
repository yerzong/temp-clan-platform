"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Swords, UserPlus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}

const ICONS: Record<string, LucideIcon> = {
  overview: LayoutGrid,
  esports: Swords,
  invitations: UserPlus,
};

/** Generic vertical section nav. Active item carries the COG accent. */
export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-tc-surface-2 text-tc-fg"
                : "text-tc-fg-tertiary hover:bg-tc-surface-2 hover:text-tc-fg-secondary"
            )}
          >
            {active && (
              <span
                aria-hidden
                className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-[hsl(var(--tc-accent))]"
              />
            )}
            {Icon && (
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active
                    ? "text-[hsl(var(--tc-accent-hover))]"
                    : "text-tc-fg-muted group-hover:text-tc-fg-tertiary"
                )}
              />
            )}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
