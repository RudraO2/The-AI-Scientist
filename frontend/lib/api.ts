import type {
  GeneratePlanResponse, FeedbackPayload, ParseQcResponse,
  LineageEntry, HistoryItem, Domain, Currency,
} from "./types";

function resolveUrl(path: string): string {
  if (typeof window === "undefined") {
    const base = (process.env.API_PROXY_URL ?? "http://localhost:8000").replace(/\/$/, "");
    return `${base}${path}`;
  }
  return path;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(resolveUrl(path), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!r.ok) {
    let detail = `${r.status} ${r.statusText}`;
    try { const j = await r.json(); detail = j.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return r.json() as Promise<T>;
}

export function parseQc(hypothesis: string, currency: Currency = "USD") {
  return request<ParseQcResponse>("/api/parse_qc", {
    method: "POST",
    body: JSON.stringify({ hypothesis, currency }),
  });
}

export function enhanceHypothesis(hypothesis: string) {
  return request<{ hypothesis: string }>("/api/enhance_hypothesis", {
    method: "POST",
    body: JSON.stringify({ hypothesis }),
  });
}

export function generatePlan(planId: string) {
  return request<GeneratePlanResponse>(`/api/plan/${planId}/generate`, {
    method: "POST",
  });
}

export function getPlan(planId: string) {
  return request<GeneratePlanResponse>(`/api/plan/${planId}`);
}

export function getPlanQc(planId: string) {
  return request<ParseQcResponse>(`/api/plan/${planId}/qc`);
}

export function getLineage(planId: string) {
  return request<LineageEntry[]>(`/api/plan/${planId}/lineage`);
}

export function getHistory(domain?: Domain) {
  const q = domain ? `?domain=${encodeURIComponent(domain)}` : "";
  return request<HistoryItem[]>(`/api/history${q}`);
}

export function submitFeedback(payload: FeedbackPayload) {
  return request<{ success: boolean; memory_id: string | null; correction_id: number; message: string }>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
