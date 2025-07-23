// Shared API types for backend/frontend contract

export interface ApiResponse<T> {
  status: number;
  data: T;
  message?: string;
}

export interface PenaltyRateChangeRequest {
  newRate: number;
  effectiveFrom: string;
}

export interface TenantImpactMonth {
  month: string | null;
  outstandingAmount: number;
  oldPenalty: number;
  newPenalty: number;
  difference: number;
}

export interface TenantImpactPreview {
  tenantId: string;
  tenantName: string;
  propertyName: string;
  months: TenantImpactMonth[];
  totalOutstanding: number;
  totalOldPenalty: number;
  totalNewPenalty: number;
  totalDifference: number;
}

export interface PenaltyImpactExampleMonth {
  month: string;
  outstanding: number;
  paid: number;
  penaltyApplies: boolean;
  oldPenalty: number;
  newPenalty: number;
  difference: number;
}

export interface PenaltyImpactExample {
  tenantId: string;
  tenantName: string;
  propertyName: string;
  months: PenaltyImpactExampleMonth[];
  currentRate: number;
  newRate: number;
}

export interface PenaltyInterestMaster {
  ID: string;
  INTEREST_RATE: number;
  EFFECTIVE_FROM: string;
  CREATED_ON: string | null;
  UPDATED_ON: string | null;
}

export interface PenaltyInterestHistory {
  ID: number;
  ORIGINAL_ID: string;
  INTEREST_RATE: number;
  EFFECTIVE_FROM: string;
  CREATED_ON: string | null;
  UPDATED_ON: string | null;
}

export interface SystemSettings {
  defaultPenaltyPercent: number;
  gracePeriodDays: number;
  autoReminders: boolean;
  whatsappIntegration: boolean;
  emailNotifications: boolean;
  currency: string;
  currentPenaltyRate?: PenaltyInterestMaster;
  penaltyHistory?: PenaltyInterestHistory[];
}
