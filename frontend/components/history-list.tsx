"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { HistoryItem, Domain } from "@/lib/types";

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
    () => (filter === "all" ? items : items.filter((i) => i.domain === filter)),
    [items, filter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    items.forEach((i) => {
      c[i.domain] = (c[i.domain] ?? 0) + 1;
    });
    return c;
  }, [items]);

  if (items.length === 0) {
    return (
      <div
        className="border-[0.5px] border-stone-300 bg-[#fcf9f8] p-10 text-center"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <p className="text-sm text-[#414846]">No corrections yet.</p>
        <p className="mt-1 text-xs text-[#717976]">
          Generate a plan and use &quot;Suggest correction&quot; to seed memory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="flex flex-wrap gap-2">
        {DOMAINS.map((d) => {
          const count = counts[d.value] ?? 0;
          if (d.value !== "all" && count === 0) return null;
          const active = filter === d.value;
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => setFilter(d.value)}
              className={`inline-flex items-center gap-1.5 border-[0.5px] px-3 py-1 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D4B44]/30 ${
                active
                  ? "bg-[#2d4b44] text-white border-[#16342e]"
                  : "bg-[#fcf9f8] text-[#414846] border-stone-300 hover:bg-[#f6f3f2] hover:border-[#717976]"
              }`}
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              {d.label}
              <span
                className={`text-[10px] ${active ? "text-white/80" : "text-[#717976]"}`}
                style={{ fontFamily: "'Space Grotesk', monospace" }}
              >
                {count}
              </span>
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
              className="border-[0.5px] border-stone-300 bg-[#fcf9f8] p-5 hover:bg-[#f6f3f2] transition-colors"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.05em] px-2 py-0.5 bg-[#2d4b44] text-white"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    {item.domain.replace("_", " ")}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-[0.05em] px-1.5 py-0.5 bg-[#dfe1d0] text-[#616456]"
                    style={{ fontFamily: "'Space Grotesk', monospace" }}
                  >
                    {item.section}
                  </span>
                  {item.rating !== null && (
                    <span className="inline-flex items-center gap-0.5 text-amber-600">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontVariationSettings: "'FILL' 1", fontSize: "12px" }}
                      >
                        star
                      </span>
                      <span style={{ fontFamily: "'Space Grotesk', monospace", fontSize: "11px" }}>
                        {item.rating}/5
                      </span>
                    </span>
                  )}
                  {item.applied_count > 0 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 bg-[#c8eae0] text-[#16342e]"
                      style={{ fontFamily: "'Space Grotesk', monospace" }}
                    >
                      applied {item.applied_count}×
                    </span>
                  )}
                </div>
                <Link
                  href={`/plan/${item.plan_id}`}
                  className="inline-flex items-center gap-1 text-xs text-[#16342e] hover:underline"
                  style={{ fontFamily: "'Space Grotesk', monospace" }}
                >
                  view source plan
                  <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                    open_in_new
                  </span>
                </Link>
              </div>

              {edited && (
                <p
                  className="mt-3 text-sm text-[#414846] leading-relaxed line-clamp-3"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  <span className="text-[#717976]">→ </span>
                  {item.after_text}
                </p>
              )}
              {item.rationale && (
                <p
                  className="mt-1 text-xs text-[#717976] leading-relaxed line-clamp-2"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  <span className="text-[#717976]">Reason: </span>
                  {item.rationale}
                </p>
              )}
              {item.annotation && (
                <p
                  className="mt-1 text-xs text-[#717976] italic line-clamp-2"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  {item.annotation}
                </p>
              )}

              <p
                className="mt-3 text-[10px] uppercase tracking-[0.05em] text-[#717976]"
                style={{ fontFamily: "'Space Grotesk', monospace" }}
              >
                {new Date(item.created_at).toLocaleString()}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
