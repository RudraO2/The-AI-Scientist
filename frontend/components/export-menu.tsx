"use client";
import { useState } from "react";
import { Printer, Clipboard, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { planToMarkdown } from "@/lib/markdown";
import type { ExperimentPlan } from "@/lib/types";

export function ExportMenu({ plan }: { plan: ExperimentPlan }) {
  const [copied, setCopied] = useState(false);

  const onPrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(planToMarkdown(plan));
      setCopied(true);
      toast.success("Plan copied as Markdown.");
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Copy failed");
    }
  };

  return (
    <div data-export-menu className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={onPrint}>
        <Printer className="h-3.5 w-3.5" />
        Save as PDF
      </Button>
      <Button variant="ghost" size="sm" onClick={onCopy}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
        Copy as Markdown
      </Button>
    </div>
  );
}
