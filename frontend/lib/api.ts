import type {
  GeneratePlanResponse, FeedbackPayload, ParseQcResponse,
  LineageEntry, HistoryItem, Domain,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!r.ok) {
    let detail = `${r.status} ${r.statusText}`;
    try { const j = await r.json(); detail = j.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return r.json() as Promise<T>;
}

export function parseQc(hypothesis: string) {
  return request<ParseQcResponse>("/api/parse_qc", {
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
  return request<{ success: boolean; memory_id: string; correction_id: number; message: string }>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
