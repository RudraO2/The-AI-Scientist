import type { ExperimentPlan } from "./types";
import { formatUsd } from "./utils";

export function planToMarkdown(plan: ExperimentPlan): string {
  const lines: string[] = [];
  lines.push(`# ${plan.title}`);
  lines.push("");
  lines.push(`**Domain:** ${plan.domain.replace("_", " ")}  `);
  lines.push(`**Hypothesis:** ${plan.hypothesis_summary}`);
  lines.push("");

  lines.push("## Parsed hypothesis");
  const p = plan.parsed_hypothesis;
  lines.push(`- **Intervention:** ${p.intervention}`);
  lines.push(`- **Outcome:** ${p.measurable_outcome}`);
  lines.push(`- **Threshold:** ${p.threshold}`);
  lines.push(`- **Mechanism:** ${p.mechanism}`);
  lines.push(`- **Control:** ${p.control_condition}`);
  if (p.keywords.length) lines.push(`- **Keywords:** ${p.keywords.join(", ")}`);
  lines.push("");

  lines.push("## Protocol");
  plan.protocol.forEach((s) => {
    lines.push(`### ${s.step_number}. ${s.title} _(${s.duration_minutes} min)_`);
    lines.push("");
    lines.push(s.description);
    if (s.critical_notes) {
      lines.push("");
      lines.push(`> **Critical:** ${s.critical_notes}`);
    }
    if (s.references.length) {
      lines.push("");
      lines.push(`Refs: ${s.references.map((r) => `<${r}>`).join(", ")}`);
    }
    lines.push("");
  });

  lines.push("## Materials");
  lines.push("");
  lines.push("| Item | Supplier | Catalog | Qty | Unit | Line total |");
  lines.push("|---|---|---|---|---|---|");
  plan.materials.forEach((m) => {
    lines.push(`| ${m.name} | ${m.supplier} | ${m.catalog_number ?? "—"} | ${m.quantity} | ${formatUsd(m.unit_cost_usd)} | ${formatUsd(m.line_total_usd)} |`);
  });
  lines.push("");

  lines.push("## Budget");
  const matsTotal = plan.materials.reduce((s, m) => s + m.line_total_usd, 0);
  const overhead = Math.max(0, plan.total_budget_usd - matsTotal);
  lines.push(`- Materials: ${formatUsd(matsTotal)}`);
  lines.push(`- Overhead / labour estimate: ${formatUsd(overhead)}`);
  lines.push(`- **Total:** ${formatUsd(plan.total_budget_usd)}`);
  lines.push("");

  lines.push(`## Timeline (${plan.total_duration_weeks} weeks total)`);
  plan.timeline.forEach((t) => {
    lines.push(`- **${t.phase_name}** — ${t.duration_weeks} weeks${t.dependencies.length ? ` (deps: ${t.dependencies.join(", ")})` : ""}`);
    t.deliverables.forEach((d) => lines.push(`  - ${d}`));
  });
  lines.push("");

  lines.push("## Validation");
  plan.validation.forEach((v) => {
    lines.push(`- **${v.metric}** → ${v.success_threshold} _(via ${v.measurement_method})_`);
  });
  lines.push("");

  lines.push("## Risks and mitigations");
  plan.risks_and_mitigations.forEach((r) => lines.push(`- ${r}`));
  lines.push("");

  if (plan.applied_corrections.length) {
    lines.push("## Memory: applied corrections");
    plan.applied_corrections.forEach((c) => {
      lines.push(`- **${c.applied_to_section}:** ${c.correction_text}${c.source_plan_id ? ` _(from plan #${c.source_plan_id})_` : ""}`);
    });
    lines.push("");
  }

  return lines.join("\n");
}
