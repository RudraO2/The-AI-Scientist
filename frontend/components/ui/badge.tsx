import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border",
  {
    variants: {
      variant: {
        default: "bg-ink-800/80 text-ink-100 border-ink-700",
        accent: "bg-accent-500/15 text-accent-400 border-accent-500/30",
        warn: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        danger: "bg-red-500/15 text-red-400 border-red-500/30",
        outline: "bg-transparent text-ink-300 border-ink-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
