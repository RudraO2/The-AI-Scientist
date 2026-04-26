"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Star, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { HistoryItem, Domain } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOMAINS: { value: Domain | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "diagnostics", label: "Diagnostics" },
  { value: "gut_health", label: "Gut health" },
  { value: "cell_biology", label: "Cell biology" },
  { value: "climate", label: "Climate" },
  { value: "other", label: "Other" },
];

export function HistoryList({ items }: { items: HistoryItem[] }) {
  const [filter, setFilter] = useState<Domain | "all">("all");

  const visible = useMemo(
    () => filter === "all" ? items : items.filter((i) => i.domain === filter),
    [items, filter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    items.forEach((i) => { c[i.domain] = (c[i.domain] ?? 0) + 1; });
    return c;
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-10 text-center">
        <p className="text-sm text-ink-300">No corrections yet.</p>
        <p className="mt-1 text-xs text-ink-500">Generate a plan and use "Suggest correction" to seed memory.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {DOMAINS.map((d) => {
          const count = counts[d.value] ?? 0;
          if (d.value !== "all" && count === 0) return null;
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => setFilter(d.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50",
                filter === d.value
                  ? "bg-accent-500/15 border-accent-500/40 text-accent-300"
                  : "bg-ink-900/60 border-ink-700/60 text-ink-300 hover:border-ink-600",
              )}
            >
              {d.label}
              <span className="font-mono text-[10px] text-ink-500">{count}</span>
            </button>
          );
        })}
      </div>

      <ul className="space-y-3">
        {visible.map((item) => {
          const edited = item.before_text.trim() !== item.after_text.trim();
          return (
            <li
              key={item.correction_id}
              className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="accent" className="capitalize">{item.domain.replace("_", " ")}</Badge>
                  <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-800 text-ink-300">{item.section}</span>
                  {item.rating !== null && (
                    <span className="inline-flex items-center gap-0.5 text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400" />
                      <span className="font-mono text-[11px]">{item.rating}/5</span>
                    </span>
                  )}
                  {item.applied_count > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                      applied {item.applied_count}×
                    </span>
                  )}
                </div>
                <Link
                  href={`/plan/${item.plan_id}`}
                  className="inline-flex items-center gap-1 text-xs text-accent-400 hover:underline"
                >
                  view source plan
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {edited && (
                <p className="mt-3 text-sm text-ink-200 leading-relaxed line-clamp-3">
                  <span className="text-ink-500">→ </span>{item.after_text}
                </p>
              )}
              {item.rationale && (
                <p className="mt-1 text-xs text-ink-400 leading-relaxed line-clamp-2">
                  <span className="text-ink-500">Reason: </span>{item.rationale}
                </p>
              )}
              {item.annotation && (
                <p className="mt-1 text-xs text-ink-500 italic line-clamp-2">{item.annotation}</p>
              )}

              <p className="mt-3 text-[10px] uppercase tracking-wider text-ink-500 font-mono">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
