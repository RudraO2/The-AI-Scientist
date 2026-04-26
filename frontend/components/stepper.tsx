import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({ currentStep, totalSteps, labels }: {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-3 text-xs">
      {steps.map((n, i) => {
        const done = n < currentStep;
        const active = n === currentStep;
        const label = labels?.[i];
        return (
          <div key={n} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-6 w-6 rounded-full grid place-items-center font-mono text-[11px] border transition-colors",
                  done && "bg-accent-500/20 border-accent-500/60 text-accent-300",
                  active && "bg-accent-500 border-accent-500 text-ink-950",
                  !done && !active && "bg-ink-900/60 border-ink-700/60 text-ink-500",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : n}
              </div>
              {label && (
                <span className={cn(
                  "uppercase tracking-wider",
                  active ? "text-ink-100" : done ? "text-accent-400" : "text-ink-500",
                )}>{label}</span>
              )}
            </div>
            {i < steps.length - 1 && <span className="h-px w-8 bg-ink-700/60" />}
          </div>
        );
      })}
    </div>
  );
}
