"use client";
import { DollarSign, Clock, Layers } from "lucide-react";
import { BudgetSparkline } from "@/components/budget-sparkline";
import { MiniGantt } from "@/components/mini-gantt";
import { formatMoney } from "@/lib/utils";
import type { ExperimentPlan } from "@/lib/types";

export function AtAGlanceStrip({ plan, onTabChange }: {
  plan: ExperimentPlan;
  onTabChange: (tab: string) => void;
}) {
  const matsTotal = plan.materials.reduce((s, m) => s + m.line_total_usd, 0);
  const topItem = plan.materials.reduce(
    (top, m) => (m.line_total_usd > (top?.line_total_usd ?? -Infinity) ? m : top),
    plan.materials[0],
  );
  const top3 = [...plan.materials].sort((a, b) => b.line_total_usd - a.line_total_usd).slice(0, 3);
  const totalWk = plan.total_duration_weeks || plan.timeline.reduce((s, p) => s + p.duration_weeks, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Panel onClick={() => onTabChange("budget")} icon={DollarSign} label="Budget">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-2xl text-ink-50">{formatMoney(plan.total_budget_usd, plan.currency)}</span>
          <span className="text-[10px] uppercase tracking-wider text-ink-500">Materials {formatMoney(matsTotal, plan.currency)}</span>
        </div>
        <div className="mt-2">
          <BudgetSparkline values={plan.materials.map((m) => m.line_total_usd)} />
        </div>
        {topItem && (
          <p className="mt-1 text-xs text-ink-400 truncate">
            Top item: <span className="text-ink-200">{topItem.name}</span> · {formatMoney(topItem.line_total_usd, plan.currency)}
          </p>
        )}
      </Panel>

      <Panel onClick={() => onTabChange("timeline")} icon={Clock} label="Timeline">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-2xl text-ink-50">{totalWk} wk</span>
          <span className="text-[10px] uppercase tracking-wider text-ink-500">{plan.timeline.length} phases</span>
        </div>
        <div className="mt-3">
          <MiniGantt timeline={plan.timeline} />
        </div>
        <p className="mt-2 text-xs text-ink-400 truncate">
          Phase 1: <span className="text-ink-200">{plan.timeline[0]?.phase_name}</span>
        </p>
      </Panel>

      <Panel onClick={() => onTabChange("materials")} icon={Layers} label="Materials">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-2xl text-ink-50">{plan.materials.length}</span>
          <span className="text-[10px] uppercase tracking-wider text-ink-500">items</span>
        </div>
        <ul className="mt-2 space-y-1">
          {top3.map((m, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-ink-300 truncate">{m.name}</span>
              <span className="font-mono text-ink-400 flex-shrink-0">{formatMoney(m.line_total_usd, plan.currency)}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Panel({ onClick, icon: Icon, label, children }: {
  onClick: () => void;
  icon: typeof DollarSign;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass rounded-2xl p-5 text-left min-h-[140px] flex flex-col gap-1 transition-colors hover:border-accent-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {children}
    </button>
  );
}
