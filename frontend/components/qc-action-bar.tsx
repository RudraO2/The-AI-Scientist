"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generatePlan } from "@/lib/api";
import { GenerationProgress } from "@/components/generation-progress";
import type { NoveltySignal } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QcActionBar({ planId, novelty }: { planId: string; novelty: NoveltySignal }) {
  const [isPending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  const onGenerate = () => {
    setGenerating(true);
    startTransition(async () => {
      try {
        await generatePlan(planId);
        router.push(`/plan/${planId}`);
      } catch (err) {
        setGenerating(false);
        toast.error(err instanceof Error ? err.message : "Plan generation failed");
      }
    });
  };

  if (generating) {
    return <GenerationProgress />;
  }

  const isMatch = novelty === "exact_match_found";

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <Button variant="ghost" asChild>
        <Link href="/">← Refine hypothesis</Link>
      </Button>
      <Button
        size="lg"
        onClick={onGenerate}
        disabled={isPending}
        className={cn(
          "min-w-[200px]",
          isMatch && "opacity-80",
        )}
      >
        Generate plan
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
