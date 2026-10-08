"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
}

/** Generic vertical section nav. Same surface as canvas, border separation. */
export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-tc-surface-2 text-tc-fg"
                : "text-tc-fg-tertiary hover:bg-tc-surface-2 hover:text-tc-fg-secondary"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
