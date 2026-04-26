"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, GitBranch, Star, ExternalLink } from "lucide-react";
import { getLineage } from "@/lib/api";
import type { LineageEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LineagePanel({ planId }: { planId: string }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<LineageEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLineage(planId)
      .then((data) => { if (!cancelled) setEntries(data); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Lineage fetch failed"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [planId]);

  const count = entries?.length ?? 0;
  const sources = new Set(entries?.map((e) => e.source_plan_id) ?? []).size;
  const disabled = !loading && count === 0;

  return (
    <div data-lineage-panel className="rounded-xl border border-ink-700/60 bg-ink-900/40 overflow-hidden">
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-5 py-3 text-left transition-colors",
          disabled ? "opacity-60 cursor-default" : "hover:bg-ink-800/40",
        )}
      >
        <div className="flex items-center gap-3">
          <GitBranch className="h-4 w-4 text-accent-400" />
          <span className="text-sm text-ink-200">
            {loading ? "Loading lineage…" :
              count === 0 ? "Lineage: no past corrections influenced this plan" :
                `Lineage: this plan was shaped by ${count} correction${count === 1 ? "" : "s"} from ${sources} past plan${sources === 1 ? "" : "s"}`}
          </span>
        </div>
        {!disabled && (open ? <ChevronDown className="h-4 w-4 text-ink-400" /> : <ChevronRight className="h-4 w-4 text-ink-400" />)}
      </button>

      {open && entries && entries.length > 0 && (
        <div className="border-t border-ink-800/60 divide-y divide-ink-800/60">
          {entries.map((e) => (
            <div key={e.correction_id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-800 text-ink-300">{e.applied_section}</span>
                  {e.rating !== null && (
                    <span className="inline-flex items-center gap-0.5 text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400" />
                      <span className="font-mono text-[11px]">{e.rating}/5</span>
                    </span>
                  )}
                </div>
                <Link
                  href={`/plan/${e.source_plan_id}`}
                  className="inline-flex items-center gap-1 text-xs text-accent-400 hover:underline"
                >
                  from plan #{e.source_plan_id}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              {e.before_text !== e.after_text && (
                <p className="mt-2 text-xs text-ink-300 leading-relaxed line-clamp-3">
                  <span className="text-ink-500">→ </span>{e.after_text}
                </p>
              )}
              {e.rationale && (
                <p className="mt-1 text-xs text-ink-400 leading-relaxed line-clamp-2">
                  <span className="text-ink-500">Reason: </span>{e.rationale}
                </p>
              )}
              {e.annotation && (
                <p className="mt-1 text-xs text-ink-500 italic line-clamp-2">{e.annotation}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="px-5 py-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
