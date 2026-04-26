"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generatePlan } from "@/lib/api";
import type { NoveltySignal } from "@/lib/types";

const STAGES = [
  { label: "Drafting protocol", at: 0 },
  { label: "Sourcing materials & costing", at: 2000 },
  { label: "Phasing timeline & validation", at: 9000 },
];

export function QcGenerateButton({ planId, novelty: _novelty }: { planId: string; novelty: NoveltySignal }) {
  void _novelty;
  const [isPending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState(0);
  const router = useRouter();

  const onGenerate = () => {
    setGenerating(true);
    STAGES.forEach((s, i) => {
      if (s.at === 0) return;
      setTimeout(() => setStage((cur) => Math.max(cur, i)), s.at);
    });
    startTransition(async () => {
      try {
        await generatePlan(planId);
        router.push(`/plan/${planId}`);
      } catch (err) {
        setGenerating(false);
        setStage(0);
        toast.error(err instanceof Error ? err.message : "Plan generation failed");
      }
    });
  };

  if (generating) {
    return (
      <div
        className="w-full max-w-[800px] bg-white border-[0.5px] border-stone-300 p-8"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.05em] font-semibold text-[#5d6052] mb-5">
          <span className="material-symbols-outlined animate-spin text-[#16342e]" style={{ fontSize: "14px" }}>
            progress_activity
          </span>
          Generating plan
        </div>
        <ul className="space-y-3">
          {STAGES.map((s, i) => {
            const done = i < stage;
            const active = i === stage;
            return (
              <li key={s.label} className="flex items-center gap-3">
                <div
                  className={`h-6 w-6 grid place-items-center flex-shrink-0 border-[0.5px] ${
                    done
                      ? "bg-[#16342e] text-white border-[#16342e]"
                      : active
                        ? "bg-white border-[#16342e] text-[#16342e]"
                        : "bg-stone-100 border-stone-300 text-stone-400"
                  }`}
                >
                  {done ? (
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                      check
                    </span>
                  ) : active ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#16342e] animate-pulse" />
                  ) : (
                    <span className="h-1 w-1 rounded-full bg-stone-400" />
                  )}
                </div>
                <span
                  className={`text-sm ${done ? "text-[#414846]" : active ? "text-[#16342e] font-medium" : "text-stone-400"}`}
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>
        <p
          className="mt-5 text-[11px] uppercase tracking-[0.05em] text-stone-400 font-semibold"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Typically 15–20 seconds — don't refresh
        </p>
      </div>
    );
  }

  return (
    <section className="w-full max-w-[800px] flex flex-col items-center">
      <button
        onClick={onGenerate}
        disabled={isPending}
        className="bg-[#16342e] hover:bg-[#1b433b] text-white px-12 py-4 font-bold text-lg transition-all flex items-center gap-3 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed border-none"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <span>Generate Full Plan</span>
        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
          auto_awesome
        </span>
      </button>
      <p
        className="mt-4 text-sm text-stone-500 italic"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        This will compile your parameters into a formal research protocol.
      </p>
    </section>
  );
}
