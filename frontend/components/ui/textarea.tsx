import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-ink-700/70 bg-ink-900/40 px-4 py-3 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40 transition-all resize-none",
        className,
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
