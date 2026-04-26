# Architecture — Frontend

## Executive Summary

The frontend is a Next.js 15 App Router application with two routes: a marketing/input landing page (`/`) and a dynamic plan detail page (`/plan/[id]`). It is intentionally minimal — no global state library, no data-fetching library, no client-side routing logic beyond Next's default. The plan page is a server component that fetches via `getPlan(id)`; the form page is mostly static with one client component for the textarea + submit.

The visual design is "scientific dark" — Source Serif 4 headings over Inter body, glassmorphism cards over a subtle radial-gradient background, and a green/emerald accent (`#10b981` family) for affordances. Framer Motion animates two specific moments: form mount, and timeline bar fills. Sonner handles toasts. Radix primitives back the button, dialog, tabs, and badge atoms.

## Technology Stack

| Category | Technology | Version | Justification |
|---|---|---|---|
| Framework | Next.js | 15.1.4 | App Router, server components, streaming |
| UI library | React | 19.0.0 | Required by Next 15 |
| Language | TypeScript | 5.7 | `strict: true`, `noEmit: true` |
| Styling | Tailwind CSS | 3.4.17 | Utility-first; custom `ink/accent/amber` palettes |
| Primitives | Radix UI | Dialog 1.1.4, Slot 1.1.1, Tabs 1.1.2 | Accessible unstyled atoms |
| Animation | framer-motion | 11.15 | Mount animations + timeline bar fill |
| Icons | lucide-react | 0.469 | Tree-shakable line icons |
| Toasts | sonner | 1.7.1 | Bottom-right dark-themed notifications |
| Class merge | clsx + tailwind-merge | 2.1 / 2.6 | `cn()` utility |
| CVA | class-variance-authority | 0.7.1 | Variant management on Button/Badge |

## Architecture Pattern

**Server-first Next.js App Router.** Pages are server components by default; only the four feature components that need browser APIs are marked `"use client"`:

- `components/hypothesis-form.tsx` — needs `useState`, `useTransition`, `useRouter`
- `components/plan-view.tsx` — uses Framer Motion + Tabs (Radix needs client)
- `components/correction-dialog.tsx` — Radix Dialog + state
- `components/qc-card.tsx` — uses Radix Card and reads novelty enum (could be server, marked client for symmetry with sibling)

The page at `app/plan/[id]/page.tsx` is a server component that calls `getPlan(id)` directly during render and passes data to client children. `export const dynamic = "force-dynamic"` opts out of static caching since plan IDs are ephemeral.

There is no global state. There is no data-fetching layer (no SWR/React Query). API calls go through a single `request<T>` wrapper in `lib/api.ts` using native `fetch` with `cache: "no-store"`.

## Module Map

### `app/layout.tsx`

Root HTML with `lang="en" className="dark"`. Loads three font stylesheets via `<link>`: rsms.me Inter, Google Fonts Source Serif 4, Google Fonts JetBrains Mono. Sets metadata title + description. Renders a sonner `<Toaster theme="dark" position="bottom-right">` with custom ink-themed toast styling.

### `app/page.tsx` (landing)

Server component. Hero with gradient h1 ("Compress weeks of research ops into a single prompt"), pulses an "indicator dot" badge, mounts the client `<HypothesisForm />`, then renders three explainer cards (Parse / Literature QC / Plan + Memory). Footer credits the challenge.

Decorative: absolute-positioned `grid-bg` div with linear-gradient mask for fading scanlines at top of viewport.

### `app/plan/[id]/page.tsx`

Async server component. Awaits `params`, calls `getPlan(id)`, falls into a "Plan not found" view on any error (typical cause: backend restart wiped `PLANS`).

Layout is a 12-col grid: `<PlanView />` on the left 8 cols, sidebar (`<QcCard />` + `<ParsedHypothesisCard />`) on the right 4. The `ParsedHypothesisCard` is defined inline in the page file — it is small, single-use, and not worth its own component file.

### `app/globals.css`

Three Tailwind layers + custom utilities:

- `.glass` — backdrop-blur-xl with semi-transparent ink-900 over an ink-700 border
- `.grid-bg` — 32px scanline pattern at 3% opacity
- `.text-balance` — `text-wrap: balance`
- `.skeleton-shimmer` — used on `<Skeleton />` UI primitive

Body has three radial gradients (emerald top-left, blue top-right, amber bottom-center) at 4–6% opacity, fixed attachment.

### `components/hypothesis-form.tsx`

Client. Holds `hypothesis: string` and `isPending` state. Four hardcoded `SAMPLES` (Diagnostics / Gut Health / Cell Biology / Climate) match the brief's example inputs verbatim. Submit calls `generatePlan(hypothesis)`, toasts on result, navigates via `router.push(\`/plan/${res.plan_id}\`)`. Validates `hypothesis.trim().length >= 20` client-side and disables the button below the threshold; backend has matching `min_length=20`.

Animated mount: `motion.div` with opacity+y fade.

### `components/plan-view.tsx`

Client. The main plan UI. Six sub-components, each rendered inside a Radix `<TabsContent>`:

| Tab | Sub-component | Responsibility |
|---|---|---|
| Protocol | `ProtocolSection` | Numbered cards per `ProtocolStep`, amber `Critical` callout when `critical_notes` present, hover-reveals `<CorrectionDialog>` |
| Materials | `MaterialsSection` | Table-like grid with line totals + materials sum; one dialog at the section header |
| Budget | `BudgetSection` | Materials vs. overhead/labour split (overhead = total − materials), gradient progress bars |
| Timeline | `TimelineSection` | Phase Gantt-like rows with Framer Motion width animation per phase |
| Validation | `ValidationSection` | Cards per `ValidationMetric` with success-threshold badge |
| Risks | `RisksSection` | Plain risk list with amber alert icons, no correction dialog |

`<PlanHeader>` shows domain badge, title, hypothesis summary, and 4 stat cards (steps / materials / budget / weeks).

`<AppliedCorrectionsBanner>` renders only when `plan.applied_corrections.length > 0`. It is the visible signal that the memory loop is working.

### `components/correction-dialog.tsx`

Client. Generic per-section correction interface, used 5× in PlanView (protocol, materials, budget, timeline, validation — risks excluded). Holds local `after`, `rationale` state. Validates that `after` differs from `before` and `rationale.trim().length >= 10` before posting `submitFeedback({plan_id, domain, section, before_text, after_text, rationale})`. Toast confirms storage.

### `components/qc-card.tsx`

Client (could be server). Maps `novelty` enum to label / icon / variant via the `NOVELTY_META` lookup. Lists references with year, venue, similarity score, opens external links in new tab.

### `components/ui/`

Seven shadcn-style atoms: `badge`, `button`, `card`, `dialog`, `skeleton`, `tabs`, `textarea`. Standard Radix-backed implementations with CVA variants. Not customised beyond the shadcn defaults aside from accent palette.

### `lib/api.ts`

Single `request<T>(path, init?)` wrapper:

- Joins `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) with path
- Sets `Content-Type: application/json` and merges caller headers
- `cache: "no-store"` — no Next data cache
- On `!r.ok`, attempts to parse `{detail: ...}` from JSON body, falls back to `${status} ${statusText}`
- Returns `r.json() as Promise<T>`

Exports three typed functions: `generatePlan(hypothesis)`, `getPlan(planId)`, `submitFeedback(payload)`.

### `lib/types.ts`

Manual mirror of `backend/schemas.py`. **Maintenance burden:** every change to a Pydantic model requires a matching TS edit. There is no codegen.

### `lib/utils.ts`

`cn(...inputs)` (twMerge ∘ clsx), `formatUsd(n)` (Intl.NumberFormat with smart fraction-digits rule), `pluralize(n, s, p?)`.

## Data Flow

```
User types hypothesis
    │
    ▼
HypothesisForm.submit()
    │
    ├─ POST /api/generate
    │      ├─ Gemini parse (~3s)
    │      ├─ Lit QC ‖ Hydra recall (~2s)
    │      └─ Gemini generate plan (~17s)
    │
    ▼
router.push(`/plan/${plan_id}`)
    │
    ▼
PlanPage (server) → getPlan(id) → PlanView + QcCard + ParsedHypothesisCard
    │
    └─ User edits a section
            ▼
       CorrectionDialog.submit()
            │
            └─ POST /api/feedback → HydraDB ingest
                    │
                    ▼
            (next similar plan recalls correction → applied banner)
```

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `API_PROXY_URL` | `http://localhost:8000` | Backend base URL used by Next.js rewrites to proxy `/api/*` server-side. |

## Performance Notes

- The `/plan/[id]` route is `force-dynamic`. With backend in-memory storage, caching would be a footgun.
- Plan generation blocks the form button for ~17s with a spinner. **No streaming today.** This is a known UX wart. Switching to Gemini streaming + an SSE endpoint would unblock progressive rendering.
- Tailwind purges via `content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"]`. Production CSS bundle is small.

## Testing Strategy

None present in repo. Hackathon scope.

## Deployment

Local development still uses `npm run dev` → `next dev` on port 3000. For Vercel, set the project root to `frontend` and configure `API_PROXY_URL` to the deployed backend so browser requests stay same-origin through rewrites. See [Development Guide](./development-guide.md).
