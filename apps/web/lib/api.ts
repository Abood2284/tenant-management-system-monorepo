import type {
  ApiResponse,
  PenaltyInterestMaster,
  PenaltyInterestHistory,
  SystemSettings,
  PenaltyImpactExample,
  PenaltyRateChangeRequest,
  TenantImpactPreview,
} from "@repo/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787/api";

export async function fetchSystemSettings(): Promise<SystemSettings> {
  const response = await fetch(`${API_BASE_URL}/settings/system`);
  if (!response.ok) throw new Error("Failed to fetch system settings");
  const data: ApiResponse<SystemSettings> = await response.json();
  return data.data;
}

export async function updateSystemSettings(
  settings: Partial<SystemSettings>
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/settings/system`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) throw new Error("Failed to update system settings");
}

export async function fetchCurrentPenaltyRate(): Promise<PenaltyInterestMaster | null> {
  const response = await fetch(`${API_BASE_URL}/settings/penalty-current`);
  if (!response.ok) throw new Error("Failed to fetch current penalty rate");
  const data: ApiResponse<PenaltyInterestMaster | null> = await response.json();
  return data.data;
}

export async function fetchPenaltyHistory(): Promise<PenaltyInterestHistory[]> {
  const response = await fetch(`${API_BASE_URL}/settings/penalty-history`);
  if (!response.ok) throw new Error("Failed to fetch penalty history");
  const data: ApiResponse<PenaltyInterestHistory[]> = await response.json();
  return data.data;
}

export async function getPenaltyRateImpact(
  newRate: number
): Promise<TenantImpactPreview[]> {
  const response = await fetch(
    `${API_BASE_URL}/settings/penalty-impact?newRate=${newRate}`
  );
  if (!response.ok) throw new Error("Failed to fetch penalty rate impact");
  const data: ApiResponse<TenantImpactPreview[]> = await response.json();
  return data.data;
}

export async function updatePenaltyRate(
  request: PenaltyRateChangeRequest
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/settings/penalty-update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error("Failed to update penalty rate");
}

export async function fetchPenaltyImpactExample(
  newRate: number
): Promise<PenaltyImpactExample | null> {
  const response = await fetch(
    `${API_BASE_URL}/settings/penalty-impact-example?newRate=${newRate}`
  );
  if (!response.ok) throw new Error("Failed to fetch penalty impact example");
  const data: ApiResponse<PenaltyImpactExample | null> = await response.json();
  return data.data;
}
