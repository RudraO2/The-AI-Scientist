"use client";
import { useState } from "react";
import Link from "next/link";
import { CorrectionDialog } from "@/components/correction-dialog";
import { LineagePanel } from "@/components/lineage-panel";
import { formatUsd } from "@/lib/utils";
import type { ExperimentPlan, Domain } from "@/lib/types";

type TabKey = "protocol" | "materials" | "timeline" | "validation" | "risks";
const TABS: { key: TabKey; label: string }[] = [
  { key: "protocol", label: "Protocol" },
  { key: "materials", label: "Materials" },
  { key: "timeline", label: "Timeline" },
  { key: "validation", label: "Success Metrics" },
  { key: "risks", label: "Risks" },
];

export function PlanView({ plan, planId }: { plan: ExperimentPlan; planId: string }) {
  const domain = plan.domain as Domain;
  const [tab, setTab] = useState<TabKey>("protocol");

  return (
    <div className="space-y-12" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {plan.applied_corrections.length > 0 && <AppliedCorrectionsBanner plan={plan} />}

      {/* Tabbed Navigation */}
      <nav className="flex border-b-[0.5px] border-[#c1c8c5] overflow-x-auto" data-tabs-list>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] transition-colors whitespace-nowrap ${
                active
                  ? "text-[#16342e] border-b-2 border-[#16342e] -mb-[0.5px]"
                  : "text-[#717976] hover:text-[#16342e] border-b-2 border-transparent"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Tab content */}
      <div data-tab-content={tab}>
        {tab === "protocol" && <ProtocolSection plan={plan} planId={planId} domain={domain} />}
        {tab === "materials" && <MaterialsSection plan={plan} planId={planId} domain={domain} />}
        {tab === "timeline" && <TimelineSection plan={plan} planId={planId} domain={domain} />}
        {tab === "validation" && <ValidationSection plan={plan} planId={planId} domain={domain} />}
        {tab === "risks" && <RisksSection plan={plan} planId={planId} domain={domain} />}
      </div>

      <LineagePanel planId={planId} />
    </div>
  );
}

function SectionHeader({ title, pill, children }: { title: string; pill?: string; children?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-end gap-4 flex-wrap">
      <h2
        className="text-[24px] leading-[1.3] font-medium text-[#16342e]"
        style={{ fontFamily: "Newsreader, serif" }}
      >
        {title}
      </h2>
      <div className="flex items-center gap-3">
        {pill && (
          <span
            className="bg-[#dfe1d0] text-[#616456] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] rounded-full"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            {pill}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

function AppliedCorrectionsBanner({ plan }: { plan: ExperimentPlan }) {
  const n = plan.applied_corrections.length;
  return (
    <details data-applied-banner className="group border-[0.5px] border-[#16342e]/30 bg-[#dfe1d0]/40">
      <summary className="cursor-pointer list-none px-5 py-3 flex items-center gap-3">
        <span className="material-symbols-outlined text-[#16342e]" style={{ fontSize: "18px" }}>
          auto_awesome
        </span>
        <span
          className="text-sm text-[#16342e] font-semibold"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Applied {n} past correction{n === 1 ? "" : "s"}
        </span>
        <span
          className="text-xs text-[#616456] truncate"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          — from memory of past corrections in this domain
        </span>
        <span
          className="material-symbols-outlined ml-auto text-[#16342e] transition-transform group-open:rotate-90"
          style={{ fontSize: "18px" }}
        >
          chevron_right
        </span>
      </summary>
      <ul className="px-5 pb-3 pt-1 space-y-2 border-t border-[#16342e]/20">
        {plan.applied_corrections.map((c, i) => (
          <li key={i} className="text-xs text-[#414846] flex items-start gap-2 pt-2 leading-relaxed">
            <span className="flex-1">
              <span
                className="font-semibold text-[10px] uppercase tracking-[0.05em] text-[#16342e] mr-2"
                style={{ fontFamily: "'Space Grotesk', monospace" }}
              >
                → {c.applied_to_section}
              </span>
              {c.correction_text}
              {c.source_plan_id && (
                <Link
                  href={`/plan/${c.source_plan_id}`}
                  className="ml-2 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#dfe1d0] text-[#616456] hover:bg-[#c6c8b8] transition-colors"
                  style={{ fontFamily: "'Space Grotesk', monospace" }}
                >
                  from plan #{c.source_plan_id}
                </Link>
              )}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function ProtocolSection({ plan, planId, domain }: { plan: ExperimentPlan; planId: string; domain: Domain }) {
  return (
    <section className="space-y-8">
      <SectionHeader title="Experimental Protocol" pill={`${plan.protocol.length} steps`}>
        <CorrectionDialog
          planId={planId}
          domain={domain}
          section="protocol"
          beforeText={plan.protocol
            .map((s) => `Step ${s.step_number}: ${s.title}\n${s.description}${s.critical_notes ? `\nCritical: ${s.critical_notes}` : ""}`)
            .join("\n\n")}
          trigger={
            <button
              className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#717976] hover:text-[#16342e] inline-flex items-center gap-1.5 transition-colors"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                edit_note
              </span>
              Suggest correction
            </button>
          }
        />
      </SectionHeader>

      <div className="space-y-0">
        {plan.protocol.map((step) => (
          <div
            key={step.step_number}
            className="group flex items-start py-6 border-b-[0.5px] border-[#c1c8c5] gap-8 hover:bg-[#f6f3f2] transition-colors px-2"
          >
            <div
              className="text-[13px] leading-[1.4] text-[#717976] shrink-0 mt-1"
              style={{ fontFamily: "'Space Grotesk', monospace" }}
            >
              {String(step.step_number).padStart(2, "0")}
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex justify-between gap-4">
                <h3
                  className="font-bold text-[#16342e] text-base leading-[1.6]"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  {step.title}
                </h3>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="text-[11px] uppercase tracking-[0.05em] text-[#717976]"
                    style={{ fontFamily: "'Space Grotesk', monospace" }}
                  >
                    {step.duration_minutes} min
                  </span>
                  <CorrectionDialog
                    planId={planId}
                    domain={domain}
                    section="protocol"
                    beforeText={`Step ${step.step_number}: ${step.title}\n${step.description}${step.critical_notes ? `\nCritical: ${step.critical_notes}` : ""}`}
                    trigger={
                      <button
                        className="material-symbols-outlined text-stone-300 group-hover:text-[#717976] hover:!text-[#16342e] transition-colors"
                        aria-label="Suggest correction for this step"
                        style={{ fontSize: "18px" }}
                      >
                        history_edu
                      </button>
                    }
                  />
                </div>
              </div>
              <p
                className="text-[#414846] leading-relaxed"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {step.description}
              </p>
              {step.critical_notes && (
                <div className="mt-3 border-l-2 border-amber-500/60 bg-amber-50 px-3 py-2">
                  <span
                    className="text-[10px] uppercase tracking-[0.05em] text-amber-700 font-semibold"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    Critical
                  </span>
                  <p className="mt-0.5 text-xs text-amber-900/90">{step.critical_notes}</p>
                </div>
              )}
              {step.references.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {step.references.map((r, i) => (
                    <a
                      key={i}
                      href={r}
                      target="_blank"
                      rel="noopener"
                      className="text-[10px] text-stone-500 hover:text-[#16342e] underline underline-offset-2"
                      style={{ fontFamily: "'Space Grotesk', monospace" }}
                    >
                      {r.replace(/^https?:\/\//, "").slice(0, 36)}
                      {r.length > 36 ? "…" : ""}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MaterialsSection({ plan, planId, domain }: { plan: ExperimentPlan; planId: string; domain: Domain }) {
  const total = plan.materials.reduce((s, m) => s + m.line_total_usd, 0);
  return (
    <section className="space-y-8">
      <SectionHeader title="Bill of Materials" pill={`${plan.materials.length} items`}>
        <CorrectionDialog
          planId={planId}
          domain={domain}
          section="materials"
          beforeText={plan.materials.map((m) => `${m.name} (${m.supplier}${m.catalog_number ? ` #${m.catalog_number}` : ""}) — ${m.quantity} @ ${formatUsd(m.unit_cost_usd)}`).join("\n")}
          trigger={
            <button
              className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#717976] hover:text-[#16342e] inline-flex items-center gap-1.5 transition-colors"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                edit_note
              </span>
              Suggest correction
            </button>
          }
        />
      </SectionHeader>
      <div className="border-y-[0.5px] border-[#c1c8c5]">
        <div
          className="grid grid-cols-12 gap-3 px-2 py-3 text-[10px] uppercase tracking-[0.05em] text-[#717976] font-semibold border-b-[0.5px] border-[#c1c8c5]"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          <div className="col-span-5">Item</div>
          <div className="col-span-2">Quantity</div>
          <div className="col-span-2">Unit cost</div>
          <div className="col-span-3 text-right">Line total</div>
        </div>
        {plan.materials.map((m, i) => (
          <div
            key={i}
            className="grid grid-cols-12 gap-3 px-2 py-4 items-start border-b-[0.5px] border-[#c1c8c5] hover:bg-[#f6f3f2] transition-colors"
          >
            <div className="col-span-12 md:col-span-5">
              <div className="text-sm font-semibold text-[#16342e]">{m.name}</div>
              <div
                className="text-xs text-[#717976] mt-0.5 flex flex-wrap items-center gap-2"
                style={{ fontFamily: "'Space Grotesk', monospace" }}
              >
                <span>{m.supplier}</span>
                {m.catalog_number && <span>· #{m.catalog_number}</span>}
                {m.catalog_number && (
                  m.verified ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-[#dfe1d0] text-[#16342e] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      title="Supplier recognised and catalog number matches a SKU shape. Not verified against the supplier catalog."
                    >
                      verified
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-[#f4d8c8] text-[#7a3a1a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      title="Supplier not in the recognised list or catalog number does not look like a SKU. Confirm before ordering."
                    >
                      unverified
                    </span>
                  )
                )}
              </div>
            </div>
            <div
              className="col-span-4 md:col-span-2 text-sm text-[#414846]"
              style={{ fontFamily: "'Space Grotesk', monospace" }}
            >
              {m.quantity}
            </div>
            <div
              className="col-span-4 md:col-span-2 text-sm text-[#414846]"
              style={{ fontFamily: "'Space Grotesk', monospace" }}
            >
              {formatUsd(m.unit_cost_usd)}
            </div>
            <div
              className="col-span-4 md:col-span-3 text-right text-sm font-semibold text-[#16342e]"
              style={{ fontFamily: "'Space Grotesk', monospace" }}
            >
              {formatUsd(m.line_total_usd)}
            </div>
          </div>
        ))}
        <div className="grid grid-cols-12 px-2 py-4 bg-[#f6f3f2]">
          <div className="col-span-9 text-sm text-[#414846]">Total materials</div>
          <div
            className="col-span-3 text-right text-base font-semibold text-[#16342e]"
            style={{ fontFamily: "'Space Grotesk', monospace" }}
          >
            {formatUsd(total)}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineSection({ plan, planId, domain }: { plan: ExperimentPlan; planId: string; domain: Domain }) {
  const totalWk = plan.total_duration_weeks || plan.timeline.reduce((s, p) => s + p.duration_weeks, 0);
  const positions = plan.timeline.map((_, i) => {
    const start = plan.timeline.slice(0, i).reduce((s, p) => s + p.duration_weeks, 0);
    return {
      startPct: (start / totalWk) * 100,
      widthPct: (plan.timeline[i].duration_weeks / totalWk) * 100,
    };
  });
  return (
    <section className="space-y-8">
      <SectionHeader title="Project Timeline" pill={`${totalWk} weeks · ${plan.timeline.length} phases`}>
        <CorrectionDialog
          planId={planId}
          domain={domain}
          section="timeline"
          beforeText={plan.timeline.map((p) => `${p.phase_name}: ${p.duration_weeks}w (deps: ${p.dependencies.join(", ") || "none"})`).join("\n")}
          trigger={
            <button
              className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#717976] hover:text-[#16342e] inline-flex items-center gap-1.5 transition-colors"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                edit_note
              </span>
              Suggest correction
            </button>
          }
        />
      </SectionHeader>
      <div className="space-y-4">
        {plan.timeline.map((phase, i) => {
          const { startPct, widthPct } = positions[i];
          return (
            <div key={i}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span
                  className="font-semibold text-[#16342e]"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  {phase.phase_name}
                </span>
                <span
                  className="text-xs text-[#717976]"
                  style={{ fontFamily: "'Space Grotesk', monospace" }}
                >
                  {phase.duration_weeks}w
                </span>
              </div>
              <div className="relative h-7 bg-[#e5e2e1] overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 bg-[#2d4b44]/30 border-l-2 border-[#16342e] grid place-items-start px-2"
                  style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                >
                  <span
                    className="text-[10px] text-[#16342e] truncate"
                    style={{ fontFamily: "'Space Grotesk', monospace" }}
                  >
                    {phase.deliverables[0]}
                  </span>
                </div>
              </div>
              {phase.deliverables.length > 0 && (
                <ul className="mt-1.5 ml-1 text-xs text-[#717976] space-y-0.5">
                  {phase.deliverables.map((d, j) => (
                    <li key={j}>· {d}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ValidationSection({ plan, planId, domain }: { plan: ExperimentPlan; planId: string; domain: Domain }) {
  return (
    <section className="space-y-8">
      <SectionHeader title="Success Metrics" pill={`${plan.validation.length} measures`}>
        <CorrectionDialog
          planId={planId}
          domain={domain}
          section="validation"
          beforeText={plan.validation.map((v) => `${v.metric} → ${v.success_threshold} via ${v.measurement_method}`).join("\n")}
          trigger={
            <button
              className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#717976] hover:text-[#16342e] inline-flex items-center gap-1.5 transition-colors"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                edit_note
              </span>
              Suggest correction
            </button>
          }
        />
      </SectionHeader>
      <div className="space-y-3">
        {plan.validation.map((v, i) => (
          <div key={i} className="border-[0.5px] border-[#c1c8c5] p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <span
                className="font-semibold text-[#16342e]"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {v.metric}
              </span>
              <span
                className="bg-[#dfe1d0] text-[#616456] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em]"
                style={{ fontFamily: "'Space Grotesk', monospace" }}
              >
                {v.success_threshold}
              </span>
            </div>
            <p
              className="mt-2 text-sm text-[#414846]"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Method: {v.measurement_method}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RisksSection({ plan, planId, domain }: { plan: ExperimentPlan; planId: string; domain: Domain }) {
  return (
    <section className="space-y-8">
      <SectionHeader title="Risks & Mitigations" pill={`${plan.risks_and_mitigations.length} items`}>
        <CorrectionDialog
          planId={planId}
          domain={domain}
          section="risks"
          beforeText={plan.risks_and_mitigations.join("\n")}
          trigger={
            <button
              className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#717976] hover:text-[#16342e] inline-flex items-center gap-1.5 transition-colors"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                edit_note
              </span>
              Suggest correction
            </button>
          }
        />
      </SectionHeader>
      <div className="space-y-2">
        {plan.risks_and_mitigations.map((r, i) => (
          <div key={i} className="flex items-start gap-3 p-4 border-[0.5px] border-[#c1c8c5] bg-[#fcf9f8]">
            <span className="material-symbols-outlined text-amber-600 flex-shrink-0 mt-0.5" style={{ fontSize: "18px" }}>
              warning
            </span>
            <p
              className="text-sm text-[#414846] leading-relaxed"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              {r}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
