import Link from "next/link";
import { getPlan } from "@/lib/api";
import { PlanView } from "@/components/plan-view";
import { ExportMenu } from "@/components/export-menu";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data;
  try {
    data = await getPlan(id);
  } catch {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "#e2e4d3",
        }}
      >
        <div className="text-center">
          <h1 className="text-2xl text-[#16342e]" style={{ fontFamily: "Newsreader, serif" }}>
            Plan not found
          </h1>
          <p className="mt-2 text-stone-500" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            It may have expired. Generate a new one.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-[#16342e] underline underline-offset-4"
            style={{ fontFamily: "Newsreader, serif" }}
          >
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const plan = data.plan;
  const totalWk = plan.total_duration_weeks || plan.timeline.reduce((s, p) => s + p.duration_weeks, 0);

  return (
    <div
      className="relative min-h-screen text-[#1c1b1b]"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        backgroundColor: "#fcf9f8",
        backgroundImage:
          "linear-gradient(rgba(22, 52, 46, 0.10) 0.1px, transparent 0.1px), linear-gradient(90deg, rgba(22, 52, 46, 0.10) 0.1px, transparent 0.1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Side Navigation */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col pt-4 pb-8 bg-stone-50 border-r-[0.5px] border-stone-300 z-50">
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2d4b44] flex items-center justify-center text-white font-bold">AI</div>
            <div>
              <h1
                className="text-lg font-bold text-[#2D4B44]"
                style={{ fontFamily: "Newsreader, serif" }}
              >
                Lab Notebook
              </h1>
              <p
                className="text-xs tracking-tight text-stone-500"
                style={{ fontFamily: "Newsreader, serif" }}
              >
                Precision Planning
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <Link
            href="/"
            className="px-4 py-3 flex items-center gap-3 text-sm tracking-tight text-stone-600 hover:text-[#2D4B44] hover:bg-stone-100 transition-all duration-150"
            style={{ fontFamily: "Newsreader, serif" }}
          >
            <span className="material-symbols-outlined">add_notes</span>
            New Plan
          </Link>
          <Link
            href="/history"
            className="px-4 py-3 flex items-center gap-3 text-sm tracking-tight text-stone-600 hover:text-[#2D4B44] hover:bg-stone-100 transition-all duration-150"
            style={{ fontFamily: "Newsreader, serif" }}
          >
            <span className="material-symbols-outlined">inventory_2</span>
            History
          </Link>
        </nav>
      </aside>

      {/* Top Header */}
      <header
        className="flex justify-between items-center px-8 h-16 sticky top-0 z-40 bg-stone-50/95 backdrop-blur border-b-[0.5px] border-stone-300 lg:ml-64"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xl font-bold text-[#2D4B44] uppercase tracking-widest"
            style={{ fontFamily: "Newsreader, serif" }}
          >
            The AI Scientist
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ExportMenu plan={plan} />
          <Link
            href="/history"
            className="p-2 cursor-pointer hover:bg-stone-100 transition-colors rounded text-[#2D4B44]"
            aria-label="History"
          >
            <span className="material-symbols-outlined">history</span>
          </Link>
        </div>
      </header>

      <main className="lg:ml-64 p-8 md:p-12 flex justify-center min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-[850px] space-y-12">
          {/* Document Header */}
          <section className="space-y-6">
            <div className="space-y-2">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5d6052]"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Protocol ID: {data.plan_id.toUpperCase()} · {plan.domain.replace("_", " ")}
              </p>
              <h1
                className="text-[32px] leading-[1.2] font-semibold text-[#16342e]"
                style={{ fontFamily: "Newsreader, serif" }}
              >
                {plan.title}
              </h1>
              <p
                className="text-base text-[#414846] leading-relaxed max-w-3xl pt-2"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {plan.hypothesis_summary}
              </p>
            </div>

            {/* Metric Strip */}
            <div className="grid grid-cols-3 border-y-[0.5px] border-[#c1c8c5] py-8">
              <div className="text-center border-r-[0.5px] border-[#c1c8c5]">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5d6052] mb-1"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Budget
                </p>
                <p
                  className="text-[24px] leading-[1.3] font-medium text-[#16342e]"
                  style={{ fontFamily: "Newsreader, serif" }}
                >
                  {formatMoney(plan.total_budget_usd, plan.currency)}
                </p>
              </div>
              <div className="text-center border-r-[0.5px] border-[#c1c8c5]">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5d6052] mb-1"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Timeline
                </p>
                <p
                  className="text-[24px] leading-[1.3] font-medium text-[#16342e]"
                  style={{ fontFamily: "Newsreader, serif" }}
                >
                  {totalWk} {totalWk === 1 ? "Week" : "Weeks"}
                </p>
              </div>
              <div className="text-center">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5d6052] mb-1"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Materials
                </p>
                <p
                  className="text-[24px] leading-[1.3] font-medium text-[#16342e]"
                  style={{ fontFamily: "Newsreader, serif" }}
                >
                  {plan.materials.length} Items
                </p>
              </div>
            </div>
          </section>

          {/* Context disclosure */}
          <details className="group border-[0.5px] border-stone-300 bg-[#fcf9f8]">
            <summary
              className="cursor-pointer list-none px-5 py-3 flex items-center justify-between text-sm text-[#414846] hover:text-[#16342e] transition-colors"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5d6052]"
                >
                  Context
                </span>
                <span>Literature QC · Parsed hypothesis</span>
              </span>
              <span
                className="material-symbols-outlined transition-transform group-open:rotate-180"
                style={{ fontSize: "18px" }}
              >
                expand_more
              </span>
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-5 pb-5 pt-1">
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5d6052] mb-2"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Literature QC · {data.qc.novelty.replace(/_/g, " ")}
                </p>
                <p
                  className="text-sm text-[#414846] leading-relaxed"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  {data.qc.rationale}
                </p>
                {data.qc.references.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {data.qc.references.slice(0, 3).map((r, i) => (
                      <li key={i} className="text-xs text-[#414846]">
                        {r.url ? (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#16342e] underline underline-offset-2 hover:decoration-[#16342e]"
                          >
                            {r.title}
                          </a>
                        ) : (
                          r.title
                        )}
                        {r.year && (
                          <span
                            className="ml-2 text-[#717976]"
                            style={{ fontFamily: "'Space Grotesk', monospace" }}
                          >
                            {r.year}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5d6052] mb-2"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Parsed hypothesis
                </p>
                <dl className="grid grid-cols-1 gap-y-2.5 text-sm">
                  {[
                    ["Intervention", data.parsed.intervention],
                    ["Outcome", data.parsed.measurable_outcome],
                    ["Threshold", data.parsed.threshold],
                    ["Mechanism", data.parsed.mechanism],
                    ["Control", data.parsed.control_condition],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <dt
                        className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#717976]"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        {label}
                      </dt>
                      <dd
                        className="mt-0.5 text-sm text-[#414846] leading-relaxed"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        {val}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </details>

          {/* Tabs + sections */}
          <PlanView plan={plan} planId={data.plan_id} />

          {/* Footer */}
          <footer className="pt-12 border-t-[0.5px] border-[#c1c8c5] flex justify-between items-center opacity-90 flex-wrap gap-6">
            <div className="flex gap-12">
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5d6052] mb-1"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Plan ID
                </p>
                <p
                  className="text-[13px] leading-[1.4] text-[#414846]"
                  style={{ fontFamily: "'Space Grotesk', monospace" }}
                >
                  {data.plan_id.toUpperCase()}
                </p>
              </div>
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5d6052] mb-1"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Domain
                </p>
                <p
                  className="text-[13px] leading-[1.4] text-[#414846] uppercase tracking-tight"
                  style={{ fontFamily: "'Space Grotesk', monospace" }}
                >
                  {plan.domain.replace("_", " ")}
                </p>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
