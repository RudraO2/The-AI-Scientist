"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { enhanceHypothesis, parseQc } from "@/lib/api";
import type { Currency } from "@/lib/types";

interface Props {
  hypothesis: string;
  currency: Currency;
}

export function QcHypothesisEditor({ hypothesis, currency }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(hypothesis);
  const [previous, setPrevious] = useState<string | null>(null);
  const [isEnhancing, startEnhance] = useTransition();
  const [isRerunning, startRerun] = useTransition();
  const router = useRouter();

  const enhance = () => {
    if (text.trim().length < 5) {
      toast.error("Write a few words first.");
      return;
    }
    const before = text;
    startEnhance(async () => {
      try {
        const res = await enhanceHypothesis(text);
        if (res.hypothesis?.trim()) {
          setPrevious(before);
          setText(res.hypothesis.trim());
          toast.success("Enhanced. Edit further or undo.");
        } else {
          toast.error("Enhance returned empty.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Enhance failed");
      }
    });
  };

  const undo = () => {
    if (previous !== null) {
      setText(previous);
      setPrevious(null);
    }
  };

  const rerun = () => {
    if (text.trim().length < 20) {
      toast.error("Hypothesis too short to re-run QC.");
      return;
    }
    if (text.trim() === hypothesis.trim()) {
      toast.error("No change — edit the text or enhance first.");
      return;
    }
    startRerun(async () => {
      try {
        const res = await parseQc(text, currency);
        toast.success("New QC ready.");
        router.push(`/qc/${res.plan_id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Re-run failed");
      }
    });
  };

  const busy = isEnhancing || isRerunning;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#16342e] inline-flex items-center gap-1.5 px-3 py-2 border-[0.5px] border-[#16342e] bg-white hover:bg-[#dfe1d0]/50 transition-colors"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit_note</span>
        Edit / Enhance Hypothesis
      </button>
    );
  }

  return (
    <div
      className="w-full bg-white border-[0.5px] border-[#c1c8c5] p-6 space-y-4"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5d6052]"
        >
          Refine hypothesis & re-run QC
        </span>
        <button
          type="button"
          onClick={() => { setOpen(false); setText(hypothesis); setPrevious(null); }}
          disabled={busy}
          className="material-symbols-outlined text-[#717976] hover:text-[#16342e] disabled:opacity-50"
          style={{ fontSize: "18px" }}
          aria-label="Close editor"
        >
          close
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); if (previous !== null) setPrevious(null); }}
        rows={6}
        disabled={busy}
        className="w-full bg-transparent border-[0.5px] border-[#c1c8c5] rounded-sm p-3 text-[18px] leading-[1.4] text-[#16342e] placeholder:text-[#9aa19e] focus:outline-none focus:ring-2 focus:ring-[#16342e]/20 focus:border-[#16342e]/50 resize-none disabled:opacity-60"
        style={{ fontFamily: "Newsreader, serif", fontWeight: 500 }}
      />

      <div className="flex items-center justify-end gap-3 flex-wrap">
        {previous !== null && (
          <button
            type="button"
            onClick={undo}
            disabled={busy}
            className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#717976] hover:text-[#16342e] inline-flex items-center gap-1.5 px-3 py-2 border-[0.5px] border-[#c1c8c5] bg-white hover:bg-[#f6f3f2] transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>undo</span>
            Undo
          </button>
        )}
        <button
          type="button"
          onClick={enhance}
          disabled={busy || text.trim().length < 5}
          className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#16342e] inline-flex items-center gap-1.5 px-4 py-2 border-[0.5px] border-[#16342e] bg-white hover:bg-[#dfe1d0]/50 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>auto_awesome</span>
          {isEnhancing ? "Enhancing..." : "Enhance with AI"}
        </button>
        <button
          type="button"
          onClick={rerun}
          disabled={busy || text.trim().length < 20 || text.trim() === hypothesis.trim()}
          className="bg-[#16342e] text-white text-[11px] font-semibold uppercase tracking-[0.05em] px-5 py-2.5 hover:bg-[#2D4B44] transition-colors border-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRerunning ? "Re-running QC..." : "Re-run QC"}
        </button>
      </div>
    </div>
  );
}
