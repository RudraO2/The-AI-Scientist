"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Sparkles } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RatingInput } from "@/components/rating-input";
import { submitFeedback } from "@/lib/api";
import type { Domain, FeedbackSection } from "@/lib/types";

interface Props {
  planId: string;
  domain: Domain;
  section: FeedbackSection;
  beforeText: string;
  trigger?: React.ReactNode;
}

export function CorrectionDialog({ planId, domain, section, beforeText, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [after, setAfter] = useState(beforeText);
  const [rationale, setRationale] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const edited = after.trim() !== beforeText.trim();

  const reset = () => {
    setAfter(beforeText);
    setRationale("");
    setRating(null);
  };

  const submit = () => {
    if (rating === null) {
      toast.error("Pick a rating before submitting.");
      return;
    }
    if (edited && rationale.trim().length < 10) {
      toast.error("Add a brief rationale (≥10 chars) so future plans can apply this.");
      return;
    }
    startTransition(async () => {
      try {
        await submitFeedback({
          plan_id: planId,
          domain,
          section,
          before_text: beforeText,
          after_text: edited ? after : beforeText,
          rationale: edited ? rationale : "",
          rating,
          annotation: null,
        });
        toast.success(
          edited ? "Stored. Next plan in this domain will use it." : "Thanks — rating logged.",
          { icon: <Sparkles className="h-4 w-4 text-[#16342e]" /> },
        );
        setOpen(false);
        reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Submit failed");
      }
    });
  };

  const labelCls =
    "text-[10px] font-semibold uppercase tracking-[0.06em] text-[#717976] mb-1.5 block";
  const fieldCls =
    "w-full rounded-md border border-[#c1c8c5] bg-white px-3 py-2 text-sm text-[#16342e] placeholder:text-[#9aa19e] focus:outline-none focus:ring-2 focus:ring-[#16342e]/20 focus:border-[#16342e]/50 transition-all resize-none";

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="text-[#717976] hover:text-[#16342e]">
            <Pencil className="h-3.5 w-3.5" />
            Suggest correction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-w-md max-h-[85vh] p-0 gap-0 rounded-lg border border-[#c1c8c5] bg-[#f6f3f2] text-[#16342e] shadow-xl flex flex-col overflow-hidden"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#c1c8c5]/70">
          <DialogTitle
            className="text-[18px] font-medium text-[#16342e] capitalize"
            style={{ fontFamily: "Newsreader, serif" }}
          >
            Suggest correction
          </DialogTitle>
          <DialogDescription className="text-[12px] text-[#717976]">
            <span
              className="inline-block mr-2 px-2 py-0.5 rounded-full bg-[#dfe1d0] text-[#616456] text-[10px] font-semibold uppercase tracking-[0.05em]"
              style={{ fontFamily: "'Space Grotesk', monospace" }}
            >
              {section}
            </span>
            Rate it. Edit if needed. Saved to domain memory.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className={labelCls}>Rating</label>
            <RatingInput value={rating} onChange={setRating} />
          </div>

          <div>
            <label htmlFor="correction-after" className={labelCls}>
              Corrected version <span className="normal-case text-[#9aa19e] font-normal">(optional)</span>
            </label>
            <textarea
              id="correction-after"
              value={after}
              onChange={(e) => setAfter(e.target.value)}
              rows={4}
              className={fieldCls}
            />
          </div>

          {edited && (
            <div>
              <label htmlFor="correction-rationale" className={labelCls}>
                Why <span className="normal-case text-[#9aa19e] font-normal">(required)</span>
              </label>
              <textarea
                id="correction-rationale"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="E.g. anti-CRP needs 10 ug/mL in whole blood — 5 gave weak signal."
                rows={2}
                className={fieldCls}
              />
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-3 border-t border-[#c1c8c5]/70 bg-[#f6f3f2] flex justify-end gap-2 mt-0">
          <DialogClose asChild>
            <Button
              variant="ghost"
              disabled={isPending}
              className="h-9 px-3 text-[#717976] hover:bg-[#dfe1d0]/40 hover:text-[#16342e]"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={submit}
            disabled={isPending}
            className="h-9 px-4 bg-[#16342e] text-[#f6f3f2] hover:bg-[#16342e]/90 shadow-none"
          >
            {isPending ? "Storing…" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
