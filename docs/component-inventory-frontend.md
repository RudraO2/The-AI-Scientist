# Component Inventory — Frontend

## Feature Components — `frontend/components/`

| File | Type | Responsibility |
|---|---|---|
| `hypothesis-form.tsx` | client | Textarea + 4 sample chips + submit. Calls `generatePlan`, navigates on success. |
| `plan-view.tsx` | client | The 6-tab plan UI (Protocol / Materials / Budget / Timeline / Validation / Risks). Hosts 5 internal sub-components: `ProtocolSection`, `MaterialsSection`, `BudgetSection`, `TimelineSection`, `ValidationSection`, plus `RisksSection`. Also defines `PlanHeader`, `Stat`, `BudgetRow`, `AppliedCorrectionsBanner`. |
| `correction-dialog.tsx` | client | Per-section correction modal. POSTs to `/api/feedback`. Shared by 5 plan sections (protocol, materials, budget, timeline, validation). |
| `qc-card.tsx` | client | Sidebar card showing novelty signal (icon, label, variant) and up to 3 references. |

There is also a single inline component defined in `app/plan/[id]/page.tsx:50` — `ParsedHypothesisCard` — which renders intervention/outcome/threshold/mechanism/control plus keyword pills. Kept inline because it's small and single-use.

## UI Primitives — `frontend/components/ui/`

shadcn-style atoms. Standard implementations with the project's accent palette wired into CVA variants where applicable.

| File | Backed by | Usage |
|---|---|---|
| `badge.tsx` | (CVA only) | Domain pill, novelty signal, threshold badge, line-item tags. Variants: `accent`, `warn`, `danger`, `outline`. |
| `button.tsx` | Radix Slot | "Generate Plan" submit, dialog Cancel/Confirm, "Correct" trigger. Variants per CVA. |
| `card.tsx` | (none) | Wrapper for materials/budget/timeline/validation/risks/qc sections. Exports `Card`, `CardHeader`, `CardTitle`, `CardContent`. |
| `dialog.tsx` | `@radix-ui/react-dialog` 1.1.4 | Backs `CorrectionDialog`. Exports `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogTrigger`, `DialogClose`. |
| `skeleton.tsx` | (none) | Loading shimmer. **Currently unused** — submission flow uses an inline spinner in the button instead. |
| `tabs.tsx` | `@radix-ui/react-tabs` 1.1.2 | Backs the 6-tab plan navigation in `PlanView`. |
| `textarea.tsx` | (none) | Used in `HypothesisForm` (hypothesis input) and `CorrectionDialog` (corrected version + rationale). |

## Design System Notes

- **Type:** Source Serif 4 for headings (h1, plan title, hypothesis textarea), Inter for body, JetBrains Mono for numeric/code (catalog numbers, durations, USD totals).
- **Colors:** custom `ink` scale (50–950 cool-blue greys) for surfaces, `accent` (emerald 50/100/400/500/600) for affordances, `amber` (400/500) for warnings/critical notes.
- **Surfaces:** `.glass` utility = `backdrop-blur-xl bg-ink-900/60 border-ink-700/60`. Used on hypothesis form panel and plan header card.
- **Decorative:** `.grid-bg` scanlines (3% white) at top of landing page; three radial gradients at body level (emerald + sky + amber).
- **Animation:** Framer Motion mount fades on form and plan header; per-phase width animation on timeline bars; sonner toasts on action results.
- **Dark mode only.** `<html className="dark">` is hardcoded. No light-mode toggle.

## Component Reuse

- `<CorrectionDialog>` is the only reused feature component (5 instances).
- `<Card>` family is used in 5 sections + QC sidebar.
- `<Badge>` appears 4 ways (domain, novelty, sample chip label, validation threshold).
- `<Button>` appears 3 ways (submit, dialog actions, "Correct" ghost trigger).

## Components Not Worth Extracting

- `Stat` (4-up stat cards in `PlanHeader`) — used once.
- `BudgetRow` — used once inside `BudgetSection`.
- `ParsedHypothesisCard` — used once on plan page.

These are kept inline for clarity and to avoid premature abstraction.
