export interface ActionResponse<T = any> {
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

export interface TenantPaymentData {
  tenant: Tenant;
  unpaidMonths: UnpaidMonth[];
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
  CHEQUE_NUMBER?: string;
  CHEQUE_DATE?: string;
  BANK_NAME?: string;
  BANK_BRANCH?: string;
  TRANSACTION_ID?: string;
  PAYMENT_GATEWAY?: string;
  NOTES?: string;
}

export type PaymentMethod = 1 | 2 | 3; // 1: Cash, 2: Cheque, 3: Online
export type PaymentType = 1 | 2 | 3; // 1: Rent, 2: Penalty, 3: Outstanding
