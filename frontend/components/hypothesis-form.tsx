"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, FlaskConical, Microscope, Wind, Dna } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { parseQc } from "@/lib/api";
import { cn } from "@/lib/utils";

const SAMPLES = [
  {
    icon: Microscope,
    label: "Diagnostics",
    color: "text-sky-400",
    text:
      "A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.",
  },
  {
    icon: Dna,
    label: "Gut Health",
    color: "text-emerald-400",
    text:
      "Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.",
  },
  {
    icon: FlaskConical,
    label: "Cell Biology",
    color: "text-fuchsia-400",
    text:
      "Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose's superior membrane stabilization at low temperatures.",
  },
  {
    icon: Wind,
    label: "Climate",
    color: "text-amber-400",
    text:
      "Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of −400 mV vs SHE will fix CO₂ into acetate at a rate of at least 150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by at least 20%.",
  },
];

export function HypothesisForm() {
  const [hypothesis, setHypothesis] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    if (hypothesis.trim().length < 20) {
      toast.error("Hypothesis is too short — describe the intervention, outcome, and threshold.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await parseQc(hypothesis);
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
      className="w-full max-w-3xl mx-auto"
    >
      <div className="glass rounded-2xl p-6 shadow-2xl">
        <Textarea
          value={hypothesis}
          onChange={(e) => setHypothesis(e.target.value)}
          placeholder="State your hypothesis. Name the intervention, the measurable outcome, the threshold, and the implied control."
          rows={6}
          className="text-base leading-relaxed font-serif"
          autoFocus
        />

        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-ink-400">
            <Sparkles className="h-3.5 w-3.5 text-accent-400" />
            Semantic Scholar + arXiv · grounded in protocols.io
          </div>
          <Button
            size="lg"
            onClick={submit}
            disabled={isPending || hypothesis.trim().length < 20}
            className="min-w-[180px]"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-ink-950/40 border-t-ink-950 animate-spin" />
                Checking literature…
              </span>
            ) : (
              <>
                Run literature check
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs uppercase tracking-wider text-ink-400">Try a sample hypothesis</span>
          <span className="h-px flex-1 bg-gradient-to-r from-ink-700/60 to-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SAMPLES.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => setHypothesis(s.text)}
                disabled={isPending}
                className={cn(
                  "group text-left p-4 rounded-xl border border-ink-700/60 bg-ink-900/40 hover:border-ink-600 hover:bg-ink-800/60 transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50",
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("h-4 w-4", s.color)} />
                  <Badge variant="outline" className="text-[10px]">{s.label}</Badge>
                </div>
                <p className="text-sm text-ink-300 line-clamp-2 group-hover:text-ink-100 transition-colors">
                  {s.text}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
