"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Sparkles } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  const [annotation, setAnnotation] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setAfter(beforeText);
    setRationale("");
    setAnnotation("");
    setRating(null);
  };

  const submit = () => {
    if (rating === null) {
      toast.error("Pick a rating before submitting.");
      return;
    }
    const edited = after.trim() !== beforeText.trim();
    if (edited && rationale.trim().length < 10) {
      toast.error("Add a brief rationale (≥10 chars) so future plans can apply this correctly.");
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
          annotation: annotation.trim() || null,
        });
        toast.success(
          edited
            ? "Stored. The next plan in this domain will use it."
            : "Thanks — your rating is logged.",
          { icon: <Sparkles className="h-4 w-4 text-accent-400" /> },
        );
        setOpen(false);
        reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Submit failed");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="text-ink-400 hover:text-accent-400">
            <Pencil className="h-3.5 w-3.5" />
            Suggest correction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suggest correction · {section}</DialogTitle>
          <DialogDescription>
            Rate the section. Optionally edit it. Your input is stored as a memory tagged by domain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-ink-500 mb-1.5 block">Rating</label>
            <RatingInput value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-ink-500 mb-1 block">Original</label>
            <div className="rounded-md border border-ink-800 bg-ink-950/40 px-3 py-2 text-sm text-ink-400 max-h-32 overflow-y-auto">
              {beforeText}
            </div>
          </div>

          <div>
            <label htmlFor="correction-after" className="text-xs uppercase tracking-wider text-ink-500 mb-1 block">
              Corrected version <span className="normal-case text-ink-600">(optional)</span>
            </label>
            <Textarea
              id="correction-after"
              value={after}
              onChange={(e) => setAfter(e.target.value)}
              rows={5}
              className="text-sm"
            />
          </div>

          <div>
            <label htmlFor="correction-rationale" className="text-xs uppercase tracking-wider text-ink-500 mb-1 block">
              Rationale <span className="normal-case text-ink-600">(required if you edited the text)</span>
            </label>
            <Textarea
              id="correction-rationale"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Why is the corrected version right? E.g. 'In whole blood, anti-CRP needs 10 ug/mL — 5 ug/mL gave weak signal in our prior runs.'"
              rows={3}
              className="text-sm"
            />
          </div>

          <div>
            <label htmlFor="correction-annotation" className="text-xs uppercase tracking-wider text-ink-500 mb-1 block">
              Note <span className="normal-case text-ink-600">(optional)</span>
            </label>
            <Textarea
              id="correction-annotation"
              value={annotation}
              onChange={(e) => setAnnotation(e.target.value)}
              placeholder="Anything else worth remembering for future plans."
              rows={2}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={isPending}>Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Storing…" : "Submit feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
