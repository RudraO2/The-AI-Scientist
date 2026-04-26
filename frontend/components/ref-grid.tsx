import { ExternalLink } from "lucide-react";
import type { LiteratureRef } from "@/lib/types";

export function RefGrid({ refs }: { refs: LiteratureRef[] }) {
  if (!refs.length) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {refs.map((ref, i) => (
        <a
          key={i}
          href={ref.url || "#"}
          target="_blank"
          rel="noopener"
          className="group rounded-xl border border-ink-700/60 bg-ink-900/40 p-4 hover:border-accent-500/40 hover:bg-ink-800/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-ink-100 line-clamp-3 group-hover:text-accent-300 transition-colors">
              {ref.title}
            </span>
            {ref.url && <ExternalLink className="h-3.5 w-3.5 mt-0.5 text-ink-500 flex-shrink-0 group-hover:text-accent-400 transition-colors" />}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
            {ref.year && <span>{ref.year}</span>}
            {ref.venue && <span>· {ref.venue}</span>}
          </div>
          {ref.similarity_reason && (
            <p className="mt-2 text-xs text-ink-400 line-clamp-2">{ref.similarity_reason}</p>
          )}
        </a>
      ))}
    </div>
  );
}
