import type { ParsedHypothesis } from "@/lib/types";

export function ParsedHypothesisCard({ parsed }: { parsed: ParsedHypothesis }) {
  const fields: [string, string][] = [
    ["Intervention", parsed.intervention],
    ["Outcome", parsed.measurable_outcome],
    ["Threshold", parsed.threshold],
    ["Mechanism", parsed.mechanism],
    ["Control", parsed.control_condition],
  ];
  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-900/50 p-5 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink-50">Parsed hypothesis</h3>
        <span className="text-[10px] uppercase tracking-wider text-ink-500">Decomposed by Gemini</span>
      </div>
      <dl className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        {fields.map(([label, val]) => (
          <div key={label}>
            <dt className="text-[10px] uppercase tracking-wider text-ink-500">{label}</dt>
            <dd className="mt-0.5 text-sm text-ink-200 leading-relaxed">{val}</dd>
          </div>
        ))}
      </dl>
      {parsed.keywords.length > 0 && (
        <div className="mt-4 pt-3 border-t border-ink-800/60">
          <span className="text-[10px] uppercase tracking-wider text-ink-500">Keywords</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {parsed.keywords.map((k) => (
              <span key={k} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-ink-800 text-ink-300">{k}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
