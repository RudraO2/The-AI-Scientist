"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { parseQc, enhanceHypothesis } from "@/lib/api";
import type { Currency } from "@/lib/types";

const CURRENCIES: { code: Currency; label: string }[] = [
  { code: "USD", label: "USD ($) — United States" },
  { code: "EUR", label: "EUR (€) — Eurozone" },
  { code: "GBP", label: "GBP (£) — United Kingdom" },
  { code: "INR", label: "INR (₹) — India" },
  { code: "JPY", label: "JPY (¥) — Japan" },
  { code: "CAD", label: "CAD (C$) — Canada" },
  { code: "AUD", label: "AUD (A$) — Australia" },
  { code: "SGD", label: "SGD (S$) — Singapore" },
  { code: "CHF", label: "CHF (Fr.) — Switzerland" },
];

const SAMPLES = [
  {
    label: "Diagnostics",
    short: "Paper-based CRP biosensor for inflammation in whole blood",
    text:
      "A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.",
  },
  {
    label: "Gut Health",
    short: "Probiotic effect on intestinal permeability in mice",
    text:
      "Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.",
  },
  {
    label: "Cell Biology",
    short: "Trehalose vs DMSO cryoprotection of HeLa cells",
    text:
      "Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose's superior membrane stabilization at low temperatures.",
  },
  {
    label: "Climate",
    short: "Microbial CO₂ fixation to acetate at the cathode",
    text:
      "Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of −400 mV vs SHE will fix CO₂ into acetate at a rate of at least 150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by at least 20%.",
  },
];

export function HypothesisForm() {
  const [hypothesis, setHypothesis] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [isPending, startTransition] = useTransition();
  const [isEnhancing, startEnhance] = useTransition();
  const [previous, setPrevious] = useState<string | null>(null);
  const router = useRouter();

  const enhance = () => {
    if (hypothesis.trim().length < 5) {
      toast.error("Write a few words first, then enhance.");
      return;
    }
    const before = hypothesis;
    startEnhance(async () => {
      try {
        const res = await enhanceHypothesis(hypothesis);
        if (res.hypothesis && res.hypothesis.trim()) {
          setPrevious(before);
          setHypothesis(res.hypothesis.trim());
          toast.success("Hypothesis enhanced. Edit further or undo.");
        } else {
          toast.error("Enhance returned empty result.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Enhance failed");
      }
    });
  };

  const undoEnhance = () => {
    if (previous !== null) {
      setHypothesis(previous);
      setPrevious(null);
    }
  };

  const submit = () => {
    if (hypothesis.trim().length < 20) {
      toast.error("Hypothesis is too short — describe the intervention, outcome, and threshold.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await parseQc(hypothesis, currency);
        router.push(`/qc/${res.plan_id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Literature check failed");
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="w-full"
    >
      {/* Main Input Canvas */}
      <div className="w-full bg-white border-[0.5px] border-stone-300 p-12 mb-12 relative">
        {/* Notebook Grid background within the card */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#16342e 0.5px, transparent 0.5px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="relative z-10">
          <label
            htmlFor="hypothesis"
            className="mb-4 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5d6052]"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Primary Research Question / Hypothesis
          </label>
          <textarea
            id="hypothesis"
            value={hypothesis}
            onChange={(e) => { setHypothesis(e.target.value); if (previous !== null) setPrevious(null); }}
            placeholder="Enter the core proposition of your upcoming study here..."
            rows={6}
            autoFocus
            disabled={isEnhancing}
            className="w-full bg-transparent border-none outline-none focus:ring-0 resize-none p-0 text-[24px] leading-[1.3] text-[#16342e] placeholder:text-[#e5e2e1] disabled:opacity-60"
            style={{ fontFamily: "Newsreader, serif", fontWeight: 500 }}
          />
          <div className="mt-8 pt-8 border-t-[0.5px] border-stone-100 flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span
                className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-stone-400"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                  edit_note
                </span>
                Plain language welcome
              </span>
              <label
                htmlFor="currency"
                className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5d6052]"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                  payments
                </span>
                Budget in
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  disabled={isPending}
                  className="border-[0.5px] border-stone-300 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#16342e] focus:outline-none focus:ring-2 focus:ring-[#2D4B44]/30"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {previous !== null && (
                <button
                  onClick={undoEnhance}
                  disabled={isPending || isEnhancing}
                  className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#717976] hover:text-[#16342e] inline-flex items-center gap-1.5 px-3 py-2 border-[0.5px] border-[#c1c8c5] bg-white hover:bg-[#f6f3f2] transition-colors disabled:opacity-50"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  type="button"
                  title="Revert to your previous text"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>undo</span>
                  Undo
                </button>
              )}
              <button
                onClick={enhance}
                disabled={isPending || isEnhancing || hypothesis.trim().length < 5}
                className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#16342e] inline-flex items-center gap-1.5 px-4 py-3 border-[0.5px] border-[#16342e] bg-white hover:bg-[#dfe1d0]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                type="button"
                title="Use AI to sharpen the hypothesis"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>auto_awesome</span>
                {isEnhancing ? "Enhancing..." : "Enhance with AI"}
              </button>
              <button
                onClick={submit}
                disabled={isPending || isEnhancing || hypothesis.trim().length < 20}
                className="bg-[#16342e] text-white text-[11px] font-semibold uppercase tracking-[0.05em] px-8 py-4 hover:bg-[#2D4B44] transition-colors border-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {isPending ? "Checking literature..." : "Proceed to Novelty Check"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Example Grid */}
      <div className="w-full">
        <h2
          className="mb-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5d6052]"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
            lightbulb
          </span>
          Inspiration from the Archive
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              onClick={() => setHypothesis(s.text)}
              disabled={isPending}
              className="group text-left bg-[#f6f3f2] border-[0.5px] border-[#c1c8c5] p-6 cursor-pointer hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-[#2D4B44]/30"
            >
              <span
                className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#c6c8b8]"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {s.label}
              </span>
              <p
                className="text-[14px] leading-[1.5] text-[#1c1b1b] group-hover:text-[#16342e] transition-colors"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {s.short}
              </p>
              <div className="mt-4 flex items-center text-[#16342e] opacity-0 group-hover:opacity-100 transition-opacity">
                <span
                  className="mr-1 text-[11px] font-semibold uppercase tracking-[0.05em]"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Load Template
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                  arrow_forward
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
