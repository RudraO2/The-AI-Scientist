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
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (after.trim() === beforeText.trim()) {
      toast.error("Edit something before submitting.");
      return;
    }
    if (rationale.trim().length < 10) {
      toast.error("Add a brief rationale so future plans can apply this correctly.");
      return;
    }
    startTransition(async () => {
      try {
        await submitFeedback({
          plan_id: planId,
          domain,
          section,
          before_text: beforeText,
          after_text: after,
          rationale,
        });
        toast.success("Correction stored. Future plans for similar experiments will apply it.", {
          icon: <Sparkles className="h-4 w-4 text-accent-400" />,
        });
        setOpen(false);
        setRationale("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Submit failed");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="text-ink-400 hover:text-accent-400">
            <Pencil className="h-3.5 w-3.5" />
            Correct
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Correct {section}</DialogTitle>
          <DialogDescription>
            Your correction is stored as a memory tagged by experiment domain. The next similar plan will reflect it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-ink-500 mb-1 block">Original</label>
            <div className="rounded-md border border-ink-800 bg-ink-950/40 px-3 py-2 text-sm text-ink-400 max-h-32 overflow-y-auto">
              {beforeText}
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-ink-500 mb-1 block">Corrected version</label>
            <Textarea
              value={after}
              onChange={(e) => setAfter(e.target.value)}
              rows={5}
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-ink-500 mb-1 block">Rationale</label>
            <Textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Why is the corrected version right? E.g. 'In whole blood, anti-CRP needs 10 ug/mL — 5 ug/mL gave weak signal in our prior runs.'"
              rows={3}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={isPending}>Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Storing…" : "Store correction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
