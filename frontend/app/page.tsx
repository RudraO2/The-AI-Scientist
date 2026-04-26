import Link from "next/link";
import { HypothesisForm } from "@/components/hypothesis-form";
import { FlaskConical, ArrowUpRight, Github, History } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[640px] grid-bg opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <header className="relative z-10 container py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent-500 to-emerald-600 grid place-items-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
            <FlaskConical className="h-4 w-4 text-ink-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">The AI Scientist</span>
            <span className="text-[10px] uppercase tracking-widest text-ink-400">Fulcrum × Hack-Nation</span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-100 transition-colors"
          >
            <History className="h-3.5 w-3.5" />
            View history →
          </Link>
          <a
            href="https://github.com"
            className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-100 transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </header>

      <section className="relative z-10 container pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/30 text-accent-400 text-xs font-medium mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" />
          From hypothesis to runnable experiment plan
        </div>

        <h1 className="font-serif text-5xl md:text-7xl font-semibold tracking-tight text-balance leading-[1.05]">
          Compress weeks of <span className="bg-gradient-to-r from-accent-400 via-emerald-400 to-sky-400 bg-clip-text text-transparent">research ops</span><br className="hidden md:block" />
          into a single <span className="italic">prompt.</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-ink-300 text-balance leading-relaxed">
          Drop a scientific hypothesis. Get a complete, operationally realistic experiment plan a real lab could pick up on Monday — protocols, materials with catalog numbers, budgets, timelines, validation.
        </p>

        <div className="mt-12">
          <HypothesisForm />
        </div>
      </section>

      <section className="relative z-10 container py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {[
            {
              n: "01",
              title: "Parse",
              body: "We decompose your hypothesis into intervention, measurable outcome, threshold, mechanism, and implied control.",
            },
            {
              n: "02",
              title: "Literature QC",
              body: "Semantic Scholar + arXiv search returns a novelty signal — not found, similar work, or exact match — with up to 3 references.",
            },
            {
              n: "03",
              title: "Plan + Memory",
              body: "Gemini generates a full plan grounded in real protocols. A memory layer recalls past scientist corrections so each plan beats the last.",
            },
          ].map((step) => (
            <div key={step.n} className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
              <span className="text-xs font-mono text-accent-400">{step.n}</span>
              <h3 className="mt-2 font-serif text-lg font-medium text-ink-50">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-400 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 container py-10 border-t border-ink-800/60 mt-12">
        <p className="text-xs text-ink-500 text-center">
          Challenge 04 — The AI Scientist · Powered by Fulcrum Science · Built for Hack-Nation 2026
        </p>
      </footer>
    </main>
  );
}
