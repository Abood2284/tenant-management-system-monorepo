import { and, eq } from "drizzle-orm";
import {
  TENANT_PAYMENT_ENTRIES,
  TENANTS,
  Property,
  TENANTS_RENT_FACTORS,
  MONTHLY_RENT_TRACKING,
} from "@repo/db/schema";
import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@repo/db/schema";

export async function getReceiptData(
  db: NeonHttpDatabase<typeof schema>,
  transactionId: string
) {
  const result = await db
    .select({
      // Transaction Info
      billNo: TENANT_PAYMENT_ENTRIES.ID,
      paymentDate: TENANT_PAYMENT_ENTRIES.PAYMENT_DATE,
      receivedAmount: TENANT_PAYMENT_ENTRIES.RECEIVED_AMOUNT,
      rentMonth: TENANT_PAYMENT_ENTRIES.RENT_MONTH,

      // Tenant Info
      tenantName: TENANTS.TENANT_NAME,
      propertyType: TENANTS.PROPERTY_TYPE,
      floor: TENANTS.BUILDING_FOOR,
      propertyNumber: TENANTS.PROPERTY_NUMBER,

      // Property Info
      estateName: Property.PROPERTY_NAME,
      proprietor: Property.LANDLORD_NAME,
      propertyAddress: Property.ADDRESS,

      // Rent Factors from the tenant's general record
      basic: TENANTS_RENT_FACTORS.BASIC_RENT,
      propertyTax: TENANTS_RENT_FACTORS.PROPERTY_TAX,
      repairCess: TENANTS_RENT_FACTORS.REPAIR_CESS,
      misc: TENANTS_RENT_FACTORS.MISC,
      chequeReturnCharge: TENANTS_RENT_FACTORS.CHEQUE_RETURN_CHARGE,

      // Corrected fields from the specific transaction entry
      previousOutstanding: TENANT_PAYMENT_ENTRIES.OUTSTANDING_ALLOCATED, // Changed to show what was paid towards outstanding
      penalty: TENANT_PAYMENT_ENTRIES.PENALTY_ALLOCATED,               // Changed to show what was paid towards penalty
    })
    .from(TENANT_PAYMENT_ENTRIES)
    .where(eq(TENANT_PAYMENT_ENTRIES.ID, transactionId))
    .leftJoin(TENANTS, eq(TENANT_PAYMENT_ENTRIES.TENANT_ID, TENANTS.TENANT_ID))
    .leftJoin(Property, eq(TENANTS.PROPERTY_ID, Property.PROPERTY_ID))
    .leftJoin(
      TENANTS_RENT_FACTORS,
      eq(TENANT_PAYMENT_ENTRIES.TENANT_ID, TENANTS_RENT_FACTORS.TENANT_ID)
    )
    .limit(1);

  if (!result.length) return null;
  return result[0];
}