"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getLineage } from "@/lib/api";
import type { LineageEntry } from "@/lib/types";

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
    <div
      data-lineage-panel
      className="border-[0.5px] border-[#c1c8c5] bg-[#fcf9f8] overflow-hidden"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-3 px-5 py-3 text-left transition-colors ${
          disabled ? "opacity-60 cursor-default" : "hover:bg-[#f6f3f2]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#16342e]" style={{ fontSize: "18px" }}>
            account_tree
          </span>
          <span className="text-sm text-[#414846]">
            {loading
              ? "Loading lineage…"
              : count === 0
                ? "Lineage: no past corrections influenced this plan"
                : `Lineage: this plan was shaped by ${count} correction${count === 1 ? "" : "s"} from ${sources} past plan${sources === 1 ? "" : "s"}`}
          </span>
        </div>
        {!disabled && (
          <span
            className={`material-symbols-outlined text-[#717976] transition-transform ${open ? "rotate-180" : ""}`}
            style={{ fontSize: "18px" }}
          >
            expand_more
          </span>
        )}
      </button>

      {open && entries && entries.length > 0 && (
        <div className="border-t border-[#c1c8c5] divide-y divide-[#e5e2e1]">
          {entries.map((e) => (
            <div key={e.correction_id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="text-[10px] uppercase tracking-[0.05em] px-1.5 py-0.5 bg-[#dfe1d0] text-[#616456]"
                    style={{ fontFamily: "'Space Grotesk', monospace" }}
                  >
                    {e.applied_section}
                  </span>
                  {e.rating !== null && (
                    <span className="inline-flex items-center gap-0.5 text-amber-600">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: "12px" }}>
                        star
                      </span>
                      <span style={{ fontFamily: "'Space Grotesk', monospace", fontSize: "11px" }}>
                        {e.rating}/5
                      </span>
                    </span>
                  )}
                </div>
                <Link
                  href={`/plan/${e.source_plan_id}`}
                  className="inline-flex items-center gap-1 text-xs text-[#16342e] hover:underline"
                  style={{ fontFamily: "'Space Grotesk', monospace" }}
                >
                  from plan #{e.source_plan_id}
                  <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                    open_in_new
                  </span>
                </Link>
              </div>
              {e.before_text !== e.after_text && (
                <p className="mt-2 text-xs text-[#414846] leading-relaxed line-clamp-3">
                  <span className="text-[#717976]">→ </span>
                  {e.after_text}
                </p>
              )}
              {e.rationale && (
                <p className="mt-1 text-xs text-[#717976] leading-relaxed line-clamp-2">
                  <span className="text-[#717976]">Reason: </span>
                  {e.rationale}
                </p>
              )}
              {e.annotation && (
                <p className="mt-1 text-xs text-[#717976] italic line-clamp-2">{e.annotation}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="px-5 py-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
