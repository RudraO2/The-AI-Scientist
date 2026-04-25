"use client";
import { Search, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LiteratureQCResult } from "@/lib/types";

const NOVELTY_META = {
  not_found: {
    icon: CheckCircle2,
    label: "Novel territory",
    variant: "accent" as const,
    color: "text-accent-400",
    description: "No closely matching prior work surfaced. You may be breaking new ground.",
  },
  similar_work_exists: {
    icon: Search,
    label: "Similar work exists",
    variant: "warn" as const,
    color: "text-amber-400",
    description: "Related work was found. Your experiment looks like an extension, not a duplicate.",
  },
  exact_match_found: {
    icon: AlertTriangle,
    label: "Possible duplicate",
    variant: "danger" as const,
    color: "text-red-400",
    description: "A highly overlapping prior study was found. Verify novelty before proceeding.",
  },
};

export function QcCard({ qc }: { qc: LiteratureQCResult }) {
  const meta = NOVELTY_META[qc.novelty];
  const Icon = meta.icon;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-ink-800/60">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${meta.color}`} />
          <CardTitle>Literature QC</CardTitle>
        </div>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-ink-300 leading-relaxed">{qc.rationale}</p>
        {qc.references.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-ink-800/60">
            <span className="text-xs uppercase tracking-wider text-ink-500">References</span>
            <ul className="space-y-3">
              {qc.references.map((ref, i) => (
                <li key={i} className="text-sm">
                  <a
                    href={ref.url || "#"}
                    target="_blank"
                    rel="noopener"
                    className="group flex items-start gap-2 text-ink-100 hover:text-accent-400 transition-colors"
                  >
                    <span className="line-clamp-2 flex-1">{ref.title}</span>
                    {ref.url && <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </a>
                  <div className="mt-1 flex items-center gap-2 text-xs text-ink-500">
                    {ref.year && <span>{ref.year}</span>}
                    {ref.venue && <span>· {ref.venue}</span>}
                    {ref.similarity_reason && <span>· {ref.similarity_reason}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
