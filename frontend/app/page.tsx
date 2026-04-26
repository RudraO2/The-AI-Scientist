import Link from "next/link";
import { ArrowRight, BarChart3, BrainCircuit, FileText, FlaskConical, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { HypothesisForm } from "@/components/hypothesis-form";

const FEATURE_CARDS = [
  {
    icon: BrainCircuit,
    title: "Understand the hypothesis",
    text: "Breaks a plain-language idea into intervention, outcome, threshold, mechanism, control, and domain.",
  },
  {
    icon: FileText,
    title: "Run literature QC",
    text: "Checks the idea against similar work so you can spot duplicates, extensions, and novelty gaps early.",
  },
  {
    icon: FlaskConical,
    title: "Generate a lab-ready plan",
    text: "Builds protocol steps, materials, budget, validation metrics, timeline, and risk mitigation in one pass.",
  },
];

const WORKFLOW = [
  {
    step: "01",
    title: "Paste the science question",
    text: "Start with a rough statement or a full hypothesis. The form accepts real-world research phrasing, not just perfect prompts.",
  },
  {
    step: "02",
    title: "Get novelty and context",
    text: "The app checks prior work and surfaces why the idea is promising, too close to existing work, or safely novel.",
  },
  {
    step: "03",
    title: "Review the plan output",
    text: "You receive a structured experiment plan a lab can actually use: protocol, materials, cost, timeline, and validation.",
  },
  {
    step: "04",
    title: "Feed corrections back in",
    text: "When you edit and submit feedback, the memory layer learns what mattered and shapes the next plan accordingly.",
  },
];

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Less hallucination risk",
    text: "The output is grounded in QC plus recalled corrections, so each plan is less like a guess and more like a traceable draft.",
  },
  {
    icon: Layers3,
    title: "A full stack of outputs",
    text: "Not just an abstract summary. You get protocol detail, materials, budget, timeline, and validation in one place.",
  },
  {
    icon: BarChart3,
    title: "Faster research decisions",
    text: "Instead of debating the shape of the study from scratch, you can compare plans, edit one section, and move on.",
  },
];

const OUTCOMES = [
  "Novelty signal",
  "Parsed hypothesis",
  "Step-by-step protocol",
  "Materials with costs",
  "Validation metrics",
  "Risks and mitigations",
  "Memory-backed corrections",
];

export default function Home() {
  return (
    <div
      className="relative min-h-screen overflow-hidden text-[#1c1b1b]"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        backgroundColor: "#fcf9f8",
        backgroundImage:
          "linear-gradient(rgba(22, 52, 46, 0.08) 0.1px, transparent 0.1px), linear-gradient(90deg, rgba(22, 52, 46, 0.08) 0.1px, transparent 0.1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#2D4B44]/10 blur-3xl" />
        <div className="absolute right-0 top-48 h-80 w-80 rounded-full bg-[#c7d6cb]/30 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-stone-300/80 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-4 sm:gap-8">
            <span
              className="text-lg font-bold uppercase tracking-[0.24em] text-[#2D4B44] sm:text-xl"
              style={{ fontFamily: "Newsreader, serif" }}
            >
              The AI Scientist
            </span>
            <span className="hidden rounded-full border border-[#c6c8b8] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5d6052] md:inline-flex">
              Literature QC + experiment planning
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="#try-it"
              className="inline-flex items-center gap-2 rounded-full border border-[#2D4B44] bg-[#16342e] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2D4B44]"
            >
              Try it
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/history"
              className="rounded-full border border-stone-200 bg-white p-2 text-[#2D4B44] transition-colors hover:bg-stone-100"
              aria-label="History"
            >
              <span className="material-symbols-outlined" style={{ fontFamily: "Material Symbols Outlined" }}>
                history
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-7xl flex-col gap-16 px-5 pb-24 pt-10 sm:px-8 lg:gap-20 lg:pt-14">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c6c8b8] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5d6052] shadow-sm">
              <Sparkles className="h-4 w-4 text-[#2D4B44]" />
              From research idea to Monday-ready plan
            </div>
            <h1
              className="max-w-xl text-5xl font-semibold leading-[1.05] text-[#16342e] sm:text-6xl lg:text-[72px]"
              style={{ fontFamily: "Newsreader, serif" }}
            >
              Turn a rough hypothesis into a research plan that feels finished.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#414846] sm:text-xl">
              The app parses your idea, checks the literature, surfaces novelty, and generates a structured experiment
              plan with protocol detail, materials, budget, timeline, validation, and risks. It is designed to make
              the first draft feel less like a blank page and more like a lab handoff.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#try-it"
                className="inline-flex items-center gap-2 rounded-full bg-[#16342e] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2D4B44]"
              >
                Start a plan
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/history"
                className="inline-flex items-center gap-2 rounded-full border border-[#c6c8b8] bg-white px-5 py-3 text-sm font-semibold text-[#2D4B44] transition-colors hover:bg-stone-50"
              >
                Review prior plans
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["Novelty-aware", "Flags similar work before you waste time on a duplicate."],
                ["Plan-complete", "Outputs a protocol, materials, and timeline in one pass."],
                ["Memory-backed", "Feedback changes the next plan, not just the current one."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-stone-300/80 bg-white/90 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-[#16342e]">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#5d6052]">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {FEATURE_CARDS.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-3xl border border-stone-300/80 bg-white/90 p-6 shadow-[0_18px_40px_-28px_rgba(22,52,46,0.45)]"
                  style={{ transform: `translateY(${index * 4}px)` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#16342e] text-white shadow-lg shadow-[#16342e]/15">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[#16342e]" style={{ fontFamily: "Newsreader, serif" }}>
                        {card.title}
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-[#414846]">{card.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="rounded-3xl border border-[#c6c8b8] bg-[#f4f0ec] p-6">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5d6052]">
                <ShieldCheck className="h-4 w-4 text-[#2D4B44]" />
                Why it feels awesome
              </div>
              <p className="mt-3 text-base leading-7 text-[#16342e]">
                You are not just getting an answer. You are getting a full structure for thinking, testing, revising,
                and reusing research knowledge without starting from scratch every time.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-4">
          {WORKFLOW.map((item) => (
            <article key={item.step} className="rounded-3xl border border-stone-300/80 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d6052]">{item.step}</p>
              <h3 className="mt-3 text-xl font-semibold text-[#16342e]" style={{ fontFamily: "Newsreader, serif" }}>
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#414846]">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-[#c6c8b8] bg-[#16342e] p-7 text-white shadow-[0_24px_80px_-40px_rgba(22,52,46,0.7)]">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b7cbc2]">
              <Sparkles className="h-4 w-4" />
              What you get out of it
            </div>
            <h2 className="mt-4 text-3xl font-semibold leading-tight" style={{ fontFamily: "Newsreader, serif" }}>
              Everything a thoughtful first draft should already know.
            </h2>
            <p className="mt-4 text-base leading-8 text-[#d5e0db]">
              The output is meant to be practical, not decorative: something you can critique, edit, and hand to a
              teammate without translating it back into lab-speak.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {OUTCOMES.map((item) => (
                <span key={item} className="rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-sm text-[#eef5f2]">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {VALUE_PROPS.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[2rem] border border-stone-300/80 bg-white p-6 shadow-sm">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f4f0ec] text-[#16342e]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-[#16342e]" style={{ fontFamily: "Newsreader, serif" }}>
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#414846]">{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="try-it" className="scroll-mt-24 rounded-[2rem] border border-stone-300/80 bg-white/90 p-5 shadow-[0_16px_50px_-32px_rgba(22,52,46,0.45)] sm:p-8 lg:p-10">
          <div className="mb-8 max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d6052]">Start here</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#16342e] sm:text-4xl" style={{ fontFamily: "Newsreader, serif" }}>
              Paste the hypothesis and let the workflow do the rest.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[#414846]">
              This is the actual launch point: write the idea, use a sample, run QC, and generate the detailed plan.
              The rest of the page explains why it matters, but this is where the work starts.
            </p>
          </div>
          <HypothesisForm />
        </section>
      </main>
    </div>
  );
}
