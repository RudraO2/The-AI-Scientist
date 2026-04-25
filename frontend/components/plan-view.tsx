"use client";
import { motion } from "framer-motion";
import {
  Beaker, Clock, DollarSign, ListChecks, ShieldAlert, Layers,
  Brain, Sparkles, ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CorrectionDialog } from "@/components/correction-dialog";
import { formatUsd } from "@/lib/utils";
import type { ExperimentPlan, Domain } from "@/lib/types";

export function PlanView({ plan, planId }: { plan: ExperimentPlan; planId: string }) {
  const domain = plan.domain as Domain;

  return (
    <div className="space-y-6">
      <PlanHeader plan={plan} />
      {plan.applied_corrections.length > 0 && <AppliedCorrectionsBanner plan={plan} />}

      <Tabs defaultValue="protocol" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="protocol"><Beaker className="h-3.5 w-3.5 mr-1" />Protocol</TabsTrigger>
          <TabsTrigger value="materials"><Layers className="h-3.5 w-3.5 mr-1" />Materials</TabsTrigger>
          <TabsTrigger value="budget"><DollarSign className="h-3.5 w-3.5 mr-1" />Budget</TabsTrigger>
          <TabsTrigger value="timeline"><Clock className="h-3.5 w-3.5 mr-1" />Timeline</TabsTrigger>
          <TabsTrigger value="validation"><ListChecks className="h-3.5 w-3.5 mr-1" />Validation</TabsTrigger>
          <TabsTrigger value="risks"><ShieldAlert className="h-3.5 w-3.5 mr-1" />Risks</TabsTrigger>
        </TabsList>

        <TabsContent value="protocol"><ProtocolSection plan={plan} planId={planId} domain={domain} /></TabsContent>
        <TabsContent value="materials"><MaterialsSection plan={plan} planId={planId} domain={domain} /></TabsContent>
        <TabsContent value="budget"><BudgetSection plan={plan} planId={planId} domain={domain} /></TabsContent>
        <TabsContent value="timeline"><TimelineSection plan={plan} planId={planId} domain={domain} /></TabsContent>
        <TabsContent value="validation"><ValidationSection plan={plan} planId={planId} domain={domain} /></TabsContent>
        <TabsContent value="risks"><RisksSection plan={plan} /></TabsContent>
      </Tabs>
    </div>
  );
}

function PlanHeader({ plan }: { plan: ExperimentPlan }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
    >
      <Badge variant="accent" className="mb-3 capitalize">{plan.domain.replace("_", " ")}</Badge>
      <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight leading-tight text-balance">
        {plan.title}
      </h1>
      <p className="mt-3 text-ink-300 text-sm leading-relaxed max-w-3xl">{plan.hypothesis_summary}</p>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Protocol steps" value={`${plan.protocol.length}`} />
        <Stat label="Materials" value={`${plan.materials.length}`} />
        <Stat label="Budget" value={formatUsd(plan.total_budget_usd)} />
        <Stat label="Timeline" value={`${plan.total_duration_weeks} wk`} />
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-700/60 bg-ink-900/40 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-1 font-mono text-lg text-ink-50">{value}</div>
    </div>
  );
}

function AppliedCorrectionsBanner({ plan }: { plan: ExperimentPlan }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-accent-500/30 bg-gradient-to-r from-accent-500/10 to-emerald-500/5 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-md bg-accent-500/20 grid place-items-center flex-shrink-0">
          <Brain className="h-4 w-4 text-accent-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-accent-400">Applied {plan.applied_corrections.length} past correction{plan.applied_corrections.length === 1 ? "" : "s"}</span>
            <Sparkles className="h-3 w-3 text-accent-400" />
          </div>
          <p className="mt-1 text-xs text-ink-400">
            Memory layer (HydraDB) retrieved corrections from past similar experiments and applied them silently before generation.
          </p>
          <ul className="mt-3 space-y-2">
            {plan.applied_corrections.map((c, i) => (
              <li key={i} className="text-xs text-ink-300 flex items-start gap-2">
                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-accent-500" />
                <span>
                  <span className="font-mono text-[10px] text-accent-400 mr-2">→ {c.applied_to_section}</span>
                  {c.correction_text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

// ---------- Section components ----------

function ProtocolSection({ plan, planId, domain }: { plan: ExperimentPlan; planId: string; domain: Domain }) {
  return (
    <div className="space-y-3">
      {plan.protocol.map((step) => (
        <Card key={step.step_number} className="group">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="font-mono text-sm w-8 h-8 rounded-md bg-accent-500/15 text-accent-400 grid place-items-center flex-shrink-0">
                {step.step_number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-medium text-ink-50">{step.title}</h4>
                  <Badge variant="outline" className="font-mono">{step.duration_minutes} min</Badge>
                </div>
                <p className="mt-2 text-sm text-ink-300 leading-relaxed">{step.description}</p>
                {step.critical_notes && (
                  <div className="mt-3 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-medium">Critical</span>
                    <p className="mt-0.5 text-xs text-amber-100/80">{step.critical_notes}</p>
                  </div>
                )}
                {step.references.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {step.references.map((r, i) => (
                      <a key={i} href={r} target="_blank" rel="noopener" className="text-[10px] text-ink-500 hover:text-accent-400 underline underline-offset-2">{r.replace(/^https?:\/\//, "").slice(0, 36)}{r.length > 36 ? "…" : ""}</a>
                    ))}
                  </div>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <CorrectionDialog
                  planId={planId} domain={domain} section="protocol"
                  beforeText={`Step ${step.step_number}: ${step.title}\n${step.description}${step.critical_notes ? `\nCritical: ${step.critical_notes}` : ""}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MaterialsSection({ plan, planId, domain }: { plan: ExperimentPlan; planId: string; domain: Domain }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Bill of materials</CardTitle>
        <CorrectionDialog
          planId={planId} domain={domain} section="materials"
          beforeText={plan.materials.map(m => `${m.name} (${m.supplier}${m.catalog_number ? ` #${m.catalog_number}` : ""}) — ${m.quantity} @ ${formatUsd(m.unit_cost_usd)}`).join("\n")}
        />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-ink-800/60">
          {plan.materials.map((m, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 px-5 py-3 items-center hover:bg-ink-800/30 transition-colors">
              <div className="col-span-12 md:col-span-5">
                <div className="text-sm font-medium text-ink-100">{m.name}</div>
                <div className="text-xs text-ink-500 mt-0.5">{m.supplier}{m.catalog_number && <span className="font-mono"> · #{m.catalog_number}</span>}</div>
              </div>
              <div className="col-span-4 md:col-span-2 text-xs text-ink-300 font-mono">{m.quantity}</div>
              <div className="col-span-4 md:col-span-2 text-xs text-ink-400 font-mono">{formatUsd(m.unit_cost_usd)}</div>
              <div className="col-span-4 md:col-span-3 text-sm text-ink-100 font-mono text-right">{formatUsd(m.line_total_usd)}</div>
            </div>
          ))}
          <div className="grid grid-cols-12 px-5 py-4 bg-ink-900/40">
            <div className="col-span-9 text-sm text-ink-300">Total materials</div>
            <div className="col-span-3 text-right text-base font-mono font-medium text-accent-400">
              {formatUsd(plan.materials.reduce((s, m) => s + m.line_total_usd, 0))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetSection({ plan, planId, domain }: { plan: ExperimentPlan; planId: string; domain: Domain }) {
  const matsTotal = plan.materials.reduce((s, m) => s + m.line_total_usd, 0);
  const overhead = Math.max(0, plan.total_budget_usd - matsTotal);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Budget summary</CardTitle>
        <CorrectionDialog planId={planId} domain={domain} section="budget"
          beforeText={`Materials: ${formatUsd(matsTotal)}; Overhead/labour: ${formatUsd(overhead)}; Total: ${formatUsd(plan.total_budget_usd)}`} />
      </CardHeader>
      <CardContent className="space-y-3">
        <BudgetRow label="Materials" value={matsTotal} pct={matsTotal / plan.total_budget_usd} />
        <BudgetRow label="Overhead / labour estimate" value={overhead} pct={overhead / plan.total_budget_usd} />
        <div className="pt-3 border-t border-ink-800/60 flex items-center justify-between">
          <span className="text-sm text-ink-300">Total project cost</span>
          <span className="font-mono text-2xl font-medium bg-gradient-to-r from-accent-400 to-emerald-400 bg-clip-text text-transparent">
            {formatUsd(plan.total_budget_usd)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetRow({ label, value, pct }: { label: string; value: number; pct: number }) {
  const safePct = Math.max(0, Math.min(1, isFinite(pct) ? pct : 0));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-300">{label}</span>
        <span className="font-mono text-ink-100">{formatUsd(value)}</span>
      </div>
      <div className="mt-1.5 h-1.5 bg-ink-800/60 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-accent-500 to-emerald-400" style={{ width: `${safePct * 100}%` }} />
      </div>
    </div>
  );
}

function TimelineSection({ plan, planId, domain }: { plan: ExperimentPlan; planId: string; domain: Domain }) {
  const totalWk = plan.total_duration_weeks || plan.timeline.reduce((s, p) => s + p.duration_weeks, 0);
  let cursor = 0;
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Project timeline · {totalWk} weeks total</CardTitle>
        <CorrectionDialog planId={planId} domain={domain} section="timeline"
          beforeText={plan.timeline.map(p => `${p.phase_name}: ${p.duration_weeks}w (deps: ${p.dependencies.join(", ") || "none"})`).join("\n")} />
      </CardHeader>
      <CardContent className="space-y-3">
        {plan.timeline.map((phase, i) => {
          const start = cursor;
          cursor += phase.duration_weeks;
          const startPct = (start / totalWk) * 100;
          const widthPct = (phase.duration_weeks / totalWk) * 100;
          return (
            <div key={i}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-ink-100">{phase.phase_name}</span>
                <span className="font-mono text-xs text-ink-400">{phase.duration_weeks}w</span>
              </div>
              <div className="relative h-7 bg-ink-800/40 rounded-md overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute top-0 bottom-0 bg-gradient-to-r from-accent-500/30 to-emerald-500/30 border-l-2 border-accent-400 grid place-items-start px-2"
                  style={{ left: `${startPct}%` }}
                >
                  <span className="text-[10px] font-mono text-accent-300 truncate">{phase.deliverables[0]}</span>
                </motion.div>
              </div>
              {phase.deliverables.length > 0 && (
                <ul className="mt-1.5 ml-1 text-xs text-ink-500 space-y-0.5">
                  {phase.deliverables.map((d, j) => <li key={j}>· {d}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ValidationSection({ plan, planId, domain }: { plan: ExperimentPlan; planId: string; domain: Domain }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Validation metrics</CardTitle>
        <CorrectionDialog planId={planId} domain={domain} section="validation"
          beforeText={plan.validation.map(v => `${v.metric} → ${v.success_threshold} via ${v.measurement_method}`).join("\n")} />
      </CardHeader>
      <CardContent className="space-y-3">
        {plan.validation.map((v, i) => (
          <div key={i} className="rounded-lg border border-ink-700/60 bg-ink-900/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium text-ink-100">{v.metric}</span>
              <Badge variant="accent" className="font-mono">{v.success_threshold}</Badge>
            </div>
            <p className="mt-2 text-sm text-ink-400">Method: {v.measurement_method}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RisksSection({ plan }: { plan: ExperimentPlan }) {
  return (
    <Card>
      <CardHeader><CardTitle>Risks and mitigations</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {plan.risks_and_mitigations.map((r, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-ink-900/40 border border-ink-800/60">
            <ShieldAlert className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-ink-200 leading-relaxed">{r}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
