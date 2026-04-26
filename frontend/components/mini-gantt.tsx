"use client";
import { motion } from "framer-motion";
import type { TimelinePhase } from "@/lib/types";

const PALETTE = [
  "from-accent-500/40 to-accent-500/10",
  "from-emerald-500/40 to-emerald-500/10",
  "from-sky-500/40 to-sky-500/10",
  "from-amber-500/40 to-amber-500/10",
  "from-fuchsia-500/40 to-fuchsia-500/10",
];

export function MiniGantt({ timeline }: { timeline: TimelinePhase[] }) {
  if (!timeline.length) return null;
  const total = timeline.reduce((s, p) => s + p.duration_weeks, 0) || 1;
  return (
    <div className="flex h-3 w-full rounded-full overflow-hidden bg-ink-800/60">
      {timeline.map((p, i) => {
        const widthPct = (p.duration_weeks / total) * 100;
        return (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            animate={{ width: `${widthPct}%` }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className={`h-full bg-gradient-to-r ${PALETTE[i % PALETTE.length]}`}
            title={`${p.phase_name}: ${p.duration_weeks}w`}
          />
        );
      })}
    </div>
  );
}
