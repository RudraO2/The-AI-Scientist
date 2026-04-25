import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { getPlan } from "@/lib/api";
import { PlanView } from "@/components/plan-view";
import { QcCard } from "@/components/qc-card";

export const dynamic = "force-dynamic";

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data;
  try {
    data = await getPlan(id);
  } catch (e) {
    return (
      <main className="container py-20 text-center">
        <h1 className="font-serif text-2xl text-ink-100">Plan not found</h1>
        <p className="mt-2 text-ink-400">It may have expired. Generate a new one.</p>
        <Link href="/" className="mt-6 inline-block text-accent-400 hover:underline">← Back to home</Link>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen">
      <header className="container py-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-ink-100 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          New hypothesis
        </Link>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-accent-400" />
          <span className="text-xs font-mono text-ink-500">{data.plan_id}</span>
        </div>
      </header>

      <div className="container pb-20 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <PlanView plan={data.plan} planId={data.plan_id} />
        </div>
        <aside className="lg:col-span-4 space-y-6">
          <QcCard qc={data.qc} />
          <ParsedHypothesisCard parsed={data.parsed} />
        </aside>
      </div>
    </main>
  );
}

function ParsedHypothesisCard({ parsed }: { parsed: import("@/lib/types").ParsedHypothesis }) {
  const fields: [string, string][] = [
    ["Intervention", parsed.intervention],
    ["Outcome", parsed.measurable_outcome],
    ["Threshold", parsed.threshold],
    ["Mechanism", parsed.mechanism],
    ["Control", parsed.control_condition],
  ];
  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-900/50 p-5">
      <h3 className="text-sm font-semibold text-ink-50">Parsed hypothesis</h3>
      <p className="mt-1 text-xs text-ink-500">Decomposed by Gemini before plan generation.</p>
      <dl className="mt-4 space-y-3">
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
