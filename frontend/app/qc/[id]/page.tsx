import Link from "next/link";
import { ArrowLeft, FlaskConical, Brain } from "lucide-react";
import { getPlanQc } from "@/lib/api";
import { Stepper } from "@/components/stepper";
import { NoveltyHero } from "@/components/novelty-hero";
import { ParsedHypothesisCard } from "@/components/parsed-hypothesis";
import { RefGrid } from "@/components/ref-grid";
import { QcActionBar } from "@/components/qc-action-bar";

export const dynamic = "force-dynamic";

export default async function QcPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data;
  try {
    data = await getPlanQc(id);
  } catch {
    return (
      <main className="container py-20 text-center">
        <h1 className="font-serif text-2xl text-ink-100">Plan not found</h1>
        <p className="mt-2 text-ink-400">It may have expired. Generate a new one.</p>
        <Link href="/" className="mt-6 inline-block text-accent-400 hover:underline">← Back to home</Link>
      </main>
    );
  }

  const { plan_id, parsed, qc, recalled_corrections } = data;

  return (
    <main className="relative min-h-screen">
      <header className="container py-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-ink-100 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          New hypothesis
        </Link>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-accent-400" />
          <span className="text-xs font-mono text-ink-500">{plan_id}</span>
        </div>
      </header>

      <div className="container pb-20 max-w-5xl space-y-8">
        <Stepper currentStep={1} totalSteps={2} labels={["Literature check", "Generate plan"]} />

        <NoveltyHero novelty={qc.novelty} rationale={qc.rationale} />

        <ParsedHypothesisCard parsed={parsed} />

        {qc.references.length > 0 && (
          <section>
            <h3 className="text-sm uppercase tracking-wider text-ink-400 mb-3">Prior work</h3>
            <RefGrid refs={qc.references} />
          </section>
        )}

        {recalled_corrections.length > 0 && (
          <section className="rounded-xl border border-accent-500/30 bg-gradient-to-r from-accent-500/10 to-emerald-500/5 p-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-accent-500/20 grid place-items-center">
                <Brain className="h-4 w-4 text-accent-400" />
              </div>
              <div>
                <span className="text-sm font-medium text-accent-400">
                  {recalled_corrections.length} past correction{recalled_corrections.length === 1 ? "" : "s"} recalled
                </span>
                <p className="text-xs text-ink-400">
                  Memory layer found prior corrections in this domain. They will be applied during generation.
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {recalled_corrections.map((c, i) => (
                <li key={i} className="text-xs text-ink-300 leading-relaxed">
                  <span className="font-mono text-[10px] text-accent-400 mr-2">→ {c.section_hint || "general"}</span>
                  {c.text.split("\n")[0]}
                </li>
              ))}
            </ul>
          </section>
        )}

        <QcActionBar planId={plan_id} novelty={qc.novelty} />
      </div>
    </main>
  );
}
