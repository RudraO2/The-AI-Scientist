"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { label: "Drafting protocol", at: 0 },
  { label: "Sourcing materials & costing", at: 2000 },
  { label: "Phasing timeline & validation", at: 9000 },
] as const;

export function GenerationProgress() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    STAGES.forEach((s, i) => {
      if (s.at === 0) return;
      timers.push(setTimeout(() => setStage((cur) => Math.max(cur, i)), s.at));
    });
    return () => { timers.forEach(clearTimeout); };
  }, []);

  return (
    <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-5 md:p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-400" />
        Generating plan
      </div>
      <ul className="mt-4 space-y-3">
        {STAGES.map((s, i) => {
          const done = i < stage;
          const active = i === stage;
          return (
            <li key={s.label} className="flex items-center gap-3">
              <div className={cn(
                "h-6 w-6 rounded-full grid place-items-center flex-shrink-0",
                done && "bg-accent-500/20 text-accent-400",
                active && "bg-accent-500/15 text-accent-400",
                !done && !active && "bg-ink-800/60 text-ink-500",
              )}>
                {done ? <Check className="h-3.5 w-3.5" /> : active ? (
                  <motion.span
                    className="h-2 w-2 rounded-full bg-accent-400"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                ) : <span className="h-1.5 w-1.5 rounded-full bg-ink-600" />}
              </div>
              <span className={cn(
                "text-sm",
                done && "text-ink-300",
                active && "text-ink-100",
                !done && !active && "text-ink-500",
              )}>{s.label}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-xs text-ink-500">
        Typically 15–20 seconds. Don't refresh — the plan is being written to durable storage.
      </p>
    </div>
  );
}
