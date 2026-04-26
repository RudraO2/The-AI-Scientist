import { Search, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NoveltySignal } from "@/lib/types";
import { cn } from "@/lib/utils";

const NOVELTY_META = {
  not_found: {
    icon: CheckCircle2,
    label: "Novel territory",
    variant: "accent" as const,
    color: "text-accent-400",
    ring: "border-accent-500/30 bg-gradient-to-br from-accent-500/10 to-emerald-500/5",
    headline: "Looks like novel ground.",
    description: "No closely matching prior work surfaced in our literature scan.",
  },
  similar_work_exists: {
    icon: Search,
    label: "Similar work exists",
    variant: "warn" as const,
    color: "text-amber-400",
    ring: "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5",
    headline: "Related work was found.",
    description: "Your experiment looks like an extension or refinement, not a duplicate.",
  },
  exact_match_found: {
    icon: AlertTriangle,
    label: "Possible duplicate",
    variant: "danger" as const,
    color: "text-red-400",
    ring: "border-red-500/40 bg-gradient-to-br from-red-500/10 to-red-500/5",
    headline: "A highly overlapping prior study was found.",
    description: "Verify novelty before continuing — the plan can still be generated, but consider refining first.",
  },
};

export function NoveltyHero({ novelty, rationale }: { novelty: NoveltySignal; rationale: string }) {
  const meta = NOVELTY_META[novelty];
  const Icon = meta.icon;
  return (
    <div className={cn("rounded-2xl border p-6 md:p-8", meta.ring)}>
      <div className="flex items-start gap-4">
        <div className={cn("h-10 w-10 rounded-xl bg-ink-900/60 grid place-items-center flex-shrink-0", meta.color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            <span className="text-[10px] uppercase tracking-wider text-ink-500">Step 1 · Literature check</span>
          </div>
          <h2 className="mt-3 font-serif text-2xl md:text-3xl text-ink-50 leading-tight tracking-tight">
            {meta.headline}
          </h2>
          <p className="mt-2 text-sm md:text-base text-ink-300 leading-relaxed max-w-2xl">{meta.description}</p>
          <p className="mt-4 text-sm text-ink-400 leading-relaxed">{rationale}</p>
        </div>
      </div>
    </div>
  );
}
