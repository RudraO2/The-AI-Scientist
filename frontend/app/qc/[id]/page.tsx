import Link from "next/link";
import { getPlanQc } from "@/lib/api";
import { QcGenerateButton } from "@/components/qc-generate-button";
import { QcHypothesisEditor } from "@/components/qc-hypothesis-editor";
import type { NoveltySignal } from "@/lib/types";

export const dynamic = "force-dynamic";

const NOVELTY_META: Record<NoveltySignal, { headline: string; sub: string }> = {
  not_found: {
    headline: "Verdict: New Ground",
    sub: "No closely matching prior work found — distinct methodology",
  },
  similar_work_exists: {
    headline: "Verdict: Adjacent Work Exists",
    sub: "Related studies found — your experiment looks like an extension",
  },
  exact_match_found: {
    headline: "Verdict: Possible Duplicate",
    sub: "A highly overlapping prior study was found — verify novelty before continuing",
  },
};

export default async function QcPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data;
  try {
    data = await getPlanQc(id);
  } catch {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "#fcf9f8",
          backgroundImage:
            "linear-gradient(rgba(22, 52, 46, 0.10) 0.1px, transparent 0.1px), linear-gradient(90deg, rgba(22, 52, 46, 0.10) 0.1px, transparent 0.1px)",
          backgroundSize: "24px 24px",
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

  const { plan_id, parsed, qc } = data;
  const meta = NOVELTY_META[qc.novelty];

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
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center px-8 h-16 w-full sticky top-0 z-50 bg-stone-50/95 backdrop-blur border-b-[0.5px] border-stone-300">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl font-bold text-[#2D4B44] uppercase tracking-widest"
            style={{ fontFamily: "Newsreader, serif" }}
          >
            The AI Scientist
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link
              href="/"
              className="text-[#2D4B44] font-semibold border-b-2 border-[#2D4B44] text-base tracking-tight"
              style={{ fontFamily: "Newsreader, serif" }}
            >
              New Plan
            </Link>
            <Link
              href="/history"
              className="text-stone-500 hover:bg-stone-100 transition-colors px-2 py-1 text-base tracking-tight"
              style={{ fontFamily: "Newsreader, serif" }}
            >
              History
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/history"
            className="p-2 cursor-pointer hover:bg-stone-100 transition-colors rounded text-[#2D4B44]"
            aria-label="History"
          >
            <span className="material-symbols-outlined">history</span>
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Side Navigation */}
        <aside className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-64px)] w-64 flex-col pt-4 pb-8 bg-stone-50 border-r-[0.5px] border-stone-300 z-40">
          <div className="px-6 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#2d4b44] flex items-center justify-center text-white font-bold">AI</div>
              <div>
                <div className="text-lg font-bold text-[#2D4B44]" style={{ fontFamily: "Newsreader, serif" }}>
                  Lab Notebook
                </div>
                <div className="text-xs text-stone-500 tracking-tight" style={{ fontFamily: "Newsreader, serif" }}>
                  Precision Planning
                </div>
              </div>
            </div>
          </div>
          <nav className="flex-grow flex flex-col space-y-1">
            <Link
              href="/"
              className="px-4 py-3 flex items-center gap-3 text-[#2D4B44] bg-stone-200/50 font-bold border-l-4 border-[#2D4B44] text-sm tracking-tight"
              style={{ fontFamily: "Newsreader, serif" }}
            >
              <span className="material-symbols-outlined">add_notes</span>
              <span>New Plan</span>
            </Link>
            <Link
              href="/history"
              className="px-4 py-3 flex items-center gap-3 text-stone-600 hover:text-[#2D4B44] hover:bg-stone-100 transition-all duration-150 text-sm tracking-tight"
              style={{ fontFamily: "Newsreader, serif" }}
            >
              <span className="material-symbols-outlined">inventory_2</span>
              <span>History</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="lg:ml-64 flex-grow flex flex-col items-center min-h-[calc(100vh-64px)] p-8 md:p-12">
          {/* Verdict Banner */}
          <section className="w-full max-w-[800px] mb-12">
            <div className="bg-[#2d4b44] p-1 border-[0.5px] border-[#16342e]">
              <div className="bg-[#fcf9f8] p-8 text-center border-[0.5px] border-[#16342e] flex flex-col items-center">
                <span
                  className="text-[11px] font-semibold text-[#16342e] tracking-[0.05em] mb-3 uppercase"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Novelty Analysis Verdict
                </span>
                <h1
                  className="text-[32px] leading-[1.2] font-semibold text-[#16342e] mb-2"
                  style={{ fontFamily: "Newsreader, serif" }}
                >
                  {meta.headline}
                </h1>
                <div className="flex items-center gap-2 text-[#16342e] font-medium max-w-[600px]">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: "18px" }}>
                    verified
                  </span>
                  <span
                    className="text-[13px] leading-[1.4]"
                    style={{ fontFamily: "'Space Grotesk', monospace" }}
                  >
                    {meta.sub}
                  </span>
                </div>
                {qc.rationale && (
                  <p
                    className="mt-4 text-sm text-[#414846] leading-relaxed max-w-[600px]"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    {qc.rationale}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Hypothesis Bento */}
          <section className="w-full max-w-[800px] grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <BentoCard label="Testing" body={parsed.intervention} />
            <BentoCard label="Measuring" body={parsed.measurable_outcome} />
            <BentoCard label="Success" body={parsed.threshold} />
          </section>

          {/* Hypothesis editor / AI enhance */}
          <section className="w-full max-w-[800px] mb-12 flex justify-end">
            <QcHypothesisEditor
              hypothesis={data.hypothesis ?? ""}
              currency={data.currency ?? "USD"}
            />
          </section>

          {/* Prior Studies */}
          {qc.references.length > 0 && (
            <section className="w-full max-w-[800px] bg-[#fcf9f8] border-[0.5px] border-stone-300 mb-12">
              <div className="px-8 py-4 border-b-[0.5px] border-stone-200 bg-stone-50/50">
                <h2
                  className="text-[24px] leading-[1.3] font-medium text-[#16342e]"
                  style={{ fontFamily: "Newsreader, serif" }}
                >
                  Closest Prior Studies
                </h2>
              </div>
              <div className="divide-y-[0.5px] divide-stone-200">
                {qc.references.map((ref, i) => (
                  <div key={i} className="p-8 flex justify-between items-start gap-6 group hover:bg-stone-50/50 transition-colors">
                    <div className="space-y-1 flex-1 min-w-0">
                      {ref.url ? (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base leading-[1.6] font-semibold text-[#16342e] underline underline-offset-4 decoration-stone-300 group-hover:decoration-[#16342e] transition-colors cursor-pointer"
                          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                        >
                          {ref.title}
                        </a>
                      ) : (
                        <h3
                          className="text-base leading-[1.6] font-semibold text-[#16342e]"
                          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                        >
                          {ref.title}
                        </h3>
                      )}
                      {ref.authors.length > 0 && (
                        <p className="text-stone-600" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                          {ref.authors.slice(0, 3).join(", ")}
                          {ref.authors.length > 3 && ", et al."}
                        </p>
                      )}
                      <div className="flex items-center gap-3 pt-2 flex-wrap">
                        {ref.similarity_reason && (
                          <span
                            className="bg-[#dfe1d0] text-[#616456] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                          >
                            {ref.similarity_reason}
                          </span>
                        )}
                        {ref.venue && (
                          <span
                            className="text-stone-400 text-xs"
                            style={{ fontFamily: "'Space Grotesk', monospace" }}
                          >
                            {ref.venue}
                          </span>
                        )}
                      </div>
                    </div>
                    {ref.year && (
                      <div
                        className="text-stone-500 flex-shrink-0"
                        style={{ fontFamily: "'Space Grotesk', monospace", fontSize: "13px" }}
                      >
                        {ref.year}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bottom Action */}
          <QcGenerateButton planId={plan_id} novelty={qc.novelty} />

          {/* Decorative Divider */}
          <div className="mt-16 w-full max-w-[800px] h-[0.5px] bg-stone-300 relative">
            <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-[#fcf9f8] px-4">
              <span className="material-symbols-outlined text-stone-400" style={{ fontSize: "18px" }}>
                science
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function BentoCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="bg-[#fcf9f8] border-[0.5px] border-stone-300 p-6 flex flex-col">
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.05em] text-stone-500 mb-4"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {label}
      </span>
      <p
        className="text-[20px] leading-[1.4] font-medium text-[#16342e]"
        style={{ fontFamily: "Newsreader, serif" }}
      >
        {body}
      </p>
    </div>
  );
}
