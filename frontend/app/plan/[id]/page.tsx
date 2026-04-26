import Link from "next/link";
import { ArrowLeft, FlaskConical, ChevronDown } from "lucide-react";
import { getPlan } from "@/lib/api";
import { PlanView } from "@/components/plan-view";
import { QcCard } from "@/components/qc-card";
import { ParsedHypothesisCard } from "@/components/parsed-hypothesis";
import { ExportMenu } from "@/components/export-menu";

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
        <div className="flex items-center gap-4">
          <ExportMenu plan={data.plan} />
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-accent-400" />
            <span className="text-xs font-mono text-ink-500">{data.plan_id}</span>
          </div>
        </div>
      </header>

      <div className="container pb-20 max-w-5xl space-y-6">
        <details className="group rounded-xl border border-ink-800/60 bg-ink-900/30">
          <summary className="cursor-pointer list-none px-5 py-3 flex items-center justify-between text-sm text-ink-300 hover:text-ink-100 transition-colors">
            <span className="inline-flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-ink-500">Context</span>
              <span>Literature QC · Parsed hypothesis</span>
            </span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-5 pb-5 pt-1">
            <QcCard qc={data.qc} />
            <ParsedHypothesisCard parsed={data.parsed} />
          </div>
        </details>
        <PlanView plan={data.plan} planId={data.plan_id} />
      </div>
    </main>
  );
}

