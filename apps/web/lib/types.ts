export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Tenant {
  TENANT_ID: string;
  TENANT_NAME: string;
  PROPERTY_ID?: string | null;
  PROPERTY_NAME?: string;
  BUILDING_FOOR?: string;
  PROPERTY_TYPE?: string;
  PROPERTY_NUMBER?: string;
  IS_ACTIVE: boolean;
}

export interface UnpaidMonth {
  RENT_MONTH: string;
  RENT_PENDING: number;
  PENALTY_PENDING: number;
  OUTSTANDING_PENDING: number;
}

export interface AllMonth {
  RENT_MONTH: string;
  RENT_PENDING: number;
  PENALTY_PENDING: number;
  OUTSTANDING_PENDING: number;
  RENT_COLLECTED: number;
  PENALTY_PAID: number;
  OUTSTANDING_COLLECTED: number;
  isPaid: boolean;
  penaltyTriggerDate: string;
  penaltyShouldApply: boolean;
}

export interface TenantPaymentData {
  tenant: Tenant;
  unpaidMonths: UnpaidMonth[];
  allMonths?: AllMonth[];
  totalDue: number;
  rentFactors: {
    BASIC_RENT: number;
    PROPERTY_TAX: number;
    REPAIR_CESS: number;
    MISC: number;
    totalRent: number;
  };
}

export interface PaymentAllocation {
  rentMonth?: string;
  rentAllocated: number;
  penaltyAllocated: number;
  outstandingAllocated: number;
}

export interface PaymentEntry {
  TENANT_ID: string;
  RENT_MONTH?: string;
  RECEIVED_AMOUNT: number;
  RENT_ALLOCATED: number;
  OUTSTANDING_ALLOCATED: number;
  PENALTY_ALLOCATED: number;
  PAYMENT_METHOD: number;
  PAYMENT_DATE: string;
  CHEQUE_NUMBER?: string | null;
  CHEQUE_DATE?: string | null;
  BANK_NAME?: string | null;
  BANK_BRANCH?: string | null;
  TRANSACTION_ID?: string | null;
  PAYMENT_GATEWAY?: string | null;
  NOTES?: string;
  IS_PENALTY_WAIVED?: boolean;
}

export type PaymentMethod = 1 | 2 | 3; // 1: Cash, 2: Cheque, 3: Online
export type PaymentType = 1 | 2 | 3; // 1: Rent, 2: Penalty, 3: Outstanding

// Penalty Interest Types
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

export interface PenaltyInterestUpdate {
  ID: number;
  INTEREST_RATE: number;
  CREATED_ON: string | null;
}

export interface PenaltyRateChangeRequest {
  newRate: number;
  effectiveFrom: string;
}

export interface PenaltyRateChangeResponse {
  success: boolean;
  message: string;
  newRate?: PenaltyInterestMaster;
  affectedTenants?: number;
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
