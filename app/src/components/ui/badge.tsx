import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-tc-surface-3 text-tc-fg-secondary border border-tc-border",
        owner:
          "bg-[hsl(var(--tc-accent)/0.15)] text-[hsl(var(--tc-accent-hover))] border border-[hsl(var(--tc-accent)/0.3)]",
        admin:
          "bg-[hsl(var(--tc-amber)/0.12)] text-[hsl(var(--tc-amber))] border border-[hsl(var(--tc-amber)/0.3)]",
        creator:
          "bg-[hsl(265_60%_60%/0.14)] text-[hsl(265_70%_75%)] border border-[hsl(265_60%_60%/0.3)]",
        player:
          "bg-[hsl(var(--tc-success)/0.14)] text-[hsl(var(--tc-success))] border border-[hsl(var(--tc-success)/0.3)]",
        staff:
          "bg-tc-surface-3 text-tc-fg-secondary border border-tc-border-strong",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
