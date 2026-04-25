import type { GeneratePlanResponse, FeedbackPayload } from "./types";

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

export function generatePlan(hypothesis: string) {
  return request<GeneratePlanResponse>("/api/generate", {
    method: "POST",
    body: JSON.stringify({ hypothesis }),
  });
}

export function getPlan(planId: string) {
  return request<GeneratePlanResponse>(`/api/plan/${planId}`);
}

export function submitFeedback(payload: FeedbackPayload) {
  return request<{ success: boolean; memory_id: string; message: string }>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
