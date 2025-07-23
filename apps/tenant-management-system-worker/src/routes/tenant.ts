// apps/tenant-management-system-worker/src/routes/tenant.ts
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Env } from "..";
import {
  TENANTS,
  Property,
  MONTHLY_RENT_TRACKING,
  TENANTS_RENT_FACTORS,
  TENANT_PAYMENT_ENTRIES,
} from "@repo/db/schema";
import {
  eq,
  count,
  and,
  like,
  gte,
  lte,
  isNotNull,
  or,
  sql,
  desc,
  ilike,
} from "drizzle-orm";
import {
  getFinancialYearAndQuarter,
  getPenaltyTriggerDate,
} from "../lib/dates";

const tenantRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /add
 * Use-case: Assign a new tenant to a property, with details and rent breakdown.
 * Important: Only admin can add tenants. Validates required fields and property linkage.
 */
// apps/tenant-management-system-worker/src/routes/tenant.ts

tenantRoutes.post("/add", async (c) => {
  try {
    const db = c.req.db;
    const body = await c.req.json();
    const { tenant, rentFactors } = body;

    if (
      !tenant.TENANT_NAME ||
      !tenant.PROPERTY_ID ||
      !rentFactors.BASIC_RENT ||
      !rentFactors.PROPERTY_TAX ||
      !rentFactors.REPAIR_CESS ||
      !rentFactors.MISC
    ) {
      throw new HTTPException(400, { message: "Required fields are missing." });
    }

    const newTenantResult = await db
      .insert(TENANTS)
      .values({
        PROPERTY_ID: tenant.PROPERTY_ID,
        TENANT_NAME: tenant.TENANT_NAME,
        SALUTATION: tenant.SALUTATION,
        BUILDING_FOOR: tenant.BUILDING_FOOR,
        PROPERTY_TYPE: tenant.PROPERTY_TYPE,
        PROPERTY_NUMBER: tenant.PROPERTY_NUMBER,
        TENANT_MOBILE_NUMBER: tenant.TENANT_MOBILE_NUMBER,
        NOTES: tenant.NOTES,
        TENANCY_DATE: tenant.TENANCY_DATE,
        TENANCY_END_DATE: tenant.TENANCY_END_DATE || null,
        IS_ACTIVE: tenant.IS_ACTIVE,
        CREATED_ON: new Date(),
        UPDATED_ON: new Date(),
      })
      .returning();

    const createdTenant = newTenantResult[0];

    await db.insert(TENANTS_RENT_FACTORS).values({
      TENANT_ID: createdTenant.TENANT_ID,
      BASIC_RENT: rentFactors.BASIC_RENT,
      PROPERTY_TAX: rentFactors.PROPERTY_TAX,
      REPAIR_CESS: rentFactors.REPAIR_CESS,
      MISC: rentFactors.MISC,
      CREATED_ON: new Date(),
      UPDATED_ON: new Date(),
    });

    // ========== NEW LOGIC: Pre-fill Monthly Tracking Records ==========

    const tenancyDateString = tenant.TENANCY_DATE;
    const currentDate = new Date();

    // Create a UTC date object to prevent server's timezone from affecting parsing
    const tenancyDate = new Date(`${tenancyDateString}T00:00:00Z`);
    // Do not create records for tenancies that start in the future.
    // The monthly scheduler will handle them when the time comes.
    if (tenancyDate > currentDate) {
      console.log(
        `[TENANT_ADD] Tenancy for ${createdTenant.TENANT_NAME} starts in the future. Skipping pre-fill.`
      );
    } else {
      const recordsToInsert = [];
      const totalRent =
        (rentFactors?.BASIC_RENT || 0) +
        (rentFactors?.PROPERTY_TAX || 0) +
        (rentFactors?.REPAIR_CESS || 0) +
        (rentFactors?.MISC || 0);

      // Use Date.UTC to ensure the loop start is timezone-safe
      let loopMonth = new Date(
        Date.UTC(tenancyDate.getUTCFullYear(), tenancyDate.getUTCMonth(), 1)
      );
      const endMonth = new Date(
        Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1)
      );

      while (loopMonth <= endMonth) {
        const { financialYear, quarter } =
          getFinancialYearAndQuarter(loopMonth);

        recordsToInsert.push({
          TENANT_ID: createdTenant.TENANT_ID,
          RENT_MONTH: new Date(loopMonth),
          RENT_PENDING: totalRent,
          OUTSTANDING_AMOUNT: 0,
          PENALTY_AMOUNT: 0,
          RENT_COLLECTED: 0,
          OUTSTANDING_COLLECTED: 0,
          OUTSTANDING_PENDING: 0,
          PENALTY_PAID: 0,
          PENALTY_PENDING: 0,
          FINANCIAL_YEAR: financialYear,
          QUARTER: quarter,
        });

        // Move to the next month
        loopMonth.setUTCMonth(loopMonth.getUTCMonth() + 1);
      }

      if (recordsToInsert.length > 0) {
        console.log(
          `[TENANT_ADD] Pre-filling ${recordsToInsert.length} monthly tracking records for tenant ${createdTenant.TENANT_NAME}.`
        );
        await db.insert(MONTHLY_RENT_TRACKING).values(recordsToInsert);
      }
    }
    // =================================================================

    return c.json({
      status: 200,
      message: "Tenant created successfully and monthly records pre-filled.",
      data: { tenantId: createdTenant.TENANT_ID },
    });
  } catch (error) {
    console.error("Error creating tenant:", error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: "Failed to create tenant" });
  }
});

/**
 * POST /update
 * Use-case: Update tenant details and rent factors (partial update allowed).
 * Accepts: { tenantId, tenant, rentFactors }
 */
tenantRoutes.post("/update", async (c) => {
  try {
    const db = c.req.db;
    const body = await c.req.json();
    const { tenantId, tenant, rentFactors } = body;
    if (!tenantId) {
      throw new HTTPException(400, { message: "tenantId is required" });
    }
    // Update tenant fields if provided
    if (tenant && Object.keys(tenant).length > 0) {
      await db
        .update(TENANTS)
        .set({
          ...(tenant.TENANT_NAME !== undefined && {
            TENANT_NAME: tenant.TENANT_NAME,
          }),
          ...(tenant.PROPERTY_ID !== undefined && {
            PROPERTY_ID: tenant.PROPERTY_ID,
          }),
          ...(tenant.SALUTATION !== undefined && {
            SALUTATION: tenant.SALUTATION,
          }),
          ...(tenant.BUILDING_FOOR !== undefined && {
            BUILDING_FOOR: tenant.BUILDING_FOOR,
          }),
          ...(tenant.PROPERTY_TYPE !== undefined && {
            PROPERTY_TYPE: tenant.PROPERTY_TYPE,
          }),
          ...(tenant.PROPERTY_NUMBER !== undefined && {
            PROPERTY_NUMBER: tenant.PROPERTY_NUMBER,
          }),
          ...(tenant.TENANT_MOBILE_NUMBER !== undefined && {
            TENANT_MOBILE_NUMBER: tenant.TENANT_MOBILE_NUMBER,
          }),
          ...(tenant.NOTES !== undefined && { NOTES: tenant.NOTES }),
          ...(tenant.TENANCY_DATE !== undefined && {
            TENANCY_DATE: tenant.TENANCY_DATE,
          }),
          ...(tenant.TENANCY_END_DATE !== undefined && {
            TENANCY_END_DATE: tenant.TENANCY_END_DATE,
          }),
          ...(tenant.IS_ACTIVE !== undefined && {
            IS_ACTIVE: tenant.IS_ACTIVE,
          }),
          UPDATED_ON: new Date(),
        })
        .where(eq(TENANTS.TENANT_ID, tenantId));
    }
    // Update rent factors if provided
    if (rentFactors && Object.keys(rentFactors).length > 0) {
      // Find latest rent factors row for this tenant
      const latest = await db.query.TENANTS_RENT_FACTORS.findFirst({
        where: eq(TENANTS_RENT_FACTORS.TENANT_ID, tenantId),
        orderBy: desc(TENANTS_RENT_FACTORS.CREATED_ON),
      });
      if (latest) {
        await db
          .update(TENANTS_RENT_FACTORS)
          .set({
            ...(rentFactors.BASIC_RENT !== undefined && {
              BASIC_RENT: rentFactors.BASIC_RENT,
            }),
            ...(rentFactors.PROPERTY_TAX !== undefined && {
              PROPERTY_TAX: rentFactors.PROPERTY_TAX,
            }),
            ...(rentFactors.REPAIR_CESS !== undefined && {
              REPAIR_CESS: rentFactors.REPAIR_CESS,
            }),
            ...(rentFactors.MISC !== undefined && { MISC: rentFactors.MISC }),
            UPDATED_ON: new Date(),
          })
          .where(eq(TENANTS_RENT_FACTORS.ID, latest.ID));
      } else {
        // If no rent factors exist, insert new
        await db.insert(TENANTS_RENT_FACTORS).values({
          TENANT_ID: tenantId,
          BASIC_RENT: rentFactors.BASIC_RENT ?? 0,
          PROPERTY_TAX: rentFactors.PROPERTY_TAX ?? 0,
          REPAIR_CESS: rentFactors.REPAIR_CESS ?? 0,
          MISC: rentFactors.MISC ?? 0,
          CREATED_ON: new Date(),
          UPDATED_ON: new Date(),
        });
      }
    }
    return c.json({ status: 200, message: "Tenant updated successfully" });
  } catch (error) {
    console.error("Error updating tenant:", error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: "Failed to update tenant" });
  }
});

// apps/tenant-management-system-worker/src/routes/tenant.ts

/**
 * GET /detail/:id
 * Use-case: Get detailed tenant information including payment data.
 * Important: Returns tenant details with all historical unpaid months and rent factors.
 */
tenantRoutes.get("/detail/:id", async (c) => {
  try {
    const db = c.req.db;
    const tenantId = c.req.param("id");

    // Get tenant details
    const tenant = await db.query.TENANTS.findFirst({
      where: eq(TENANTS.TENANT_ID, tenantId),
    });

    if (!tenant) {
      return c.json({ status: 404, message: "Tenant not found" });
    }

    // Get property details
    const property = tenant.PROPERTY_ID
      ? await db.query.Property.findFirst({
          where: eq(Property.PROPERTY_ID, tenant.PROPERTY_ID),
        })
      : null;

    // Get current rent factors
    const rentFactors = await db.query.TENANTS_RENT_FACTORS.findFirst({
      where: eq(TENANTS_RENT_FACTORS.TENANT_ID, tenantId),
      orderBy: desc(TENANTS_RENT_FACTORS.CREATED_ON),
    });

    // Get all historical monthly tracking data from the database
    const monthlyTracking = await db.query.MONTHLY_RENT_TRACKING.findMany({
      where: eq(MONTHLY_RENT_TRACKING.TENANT_ID, tenantId),
      orderBy: desc(MONTHLY_RENT_TRACKING.RENT_MONTH),
    });

    // Get payment history for the last 12 months
    const paymentHistory = await db.query.TENANT_PAYMENT_ENTRIES.findMany({
      where: eq(TENANT_PAYMENT_ENTRIES.TENANT_ID, tenantId),
      orderBy: desc(TENANT_PAYMENT_ENTRIES.PAYMENT_DATE),
      limit: 12,
    });

    // ==================== MODIFIED LOGIC START ====================
    const today = new Date();

    // Create the `allMonths` array directly from the fetched monthly tracking data.
    // This ensures the dropdown shows all historical unpaid months from the database.
    const allMonths = monthlyTracking
      .filter((month) => new Date(month.RENT_MONTH) <= today) // Prevent future months from appearing
      .map((tracking) => {
        const monthDate = new Date(tracking.RENT_MONTH);
        const penaltyTriggerDate = getPenaltyTriggerDate(monthDate);
        return {
          RENT_MONTH: tracking.RENT_MONTH.toISOString().split("T")[0], // Format as YYYY-MM-DD
          RENT_PENDING: tracking.RENT_PENDING,
          PENALTY_PENDING: tracking.PENALTY_PENDING,
          OUTSTANDING_PENDING: tracking.OUTSTANDING_PENDING,
          RENT_COLLECTED: tracking.RENT_COLLECTED,
          PENALTY_PAID: tracking.PENALTY_PAID,
          OUTSTANDING_COLLECTED: tracking.OUTSTANDING_COLLECTED,
          isPaid: tracking.RENT_PENDING === 0, // A month is "paid" if rent is zero
          penaltyTriggerDate: penaltyTriggerDate.toISOString(),
          penaltyShouldApply: today >= penaltyTriggerDate,
        };
      });

    // Calculate total due based on the real data from all months
    const totalDue = allMonths.reduce((sum, month) => {
      // Only add to the total if the rent for that month has not been paid
      if (month.isPaid) {
        return sum;
      }
      return (
        sum +
        (month.RENT_PENDING || 0) +
        (month.PENALTY_PENDING || 0) +
        (month.OUTSTANDING_PENDING || 0)
      );
    }, 0);
    // ===================== MODIFIED LOGIC END =====================

    const totalRent =
      (rentFactors?.BASIC_RENT || 0) +
      (rentFactors?.PROPERTY_TAX || 0) +
      (rentFactors?.REPAIR_CESS || 0) +
      (rentFactors?.MISC || 0);

    return c.json({
      status: 200,
      data: {
        tenant: {
          TENANT_ID: tenant.TENANT_ID,
          TENANT_NAME: tenant.TENANT_NAME,
          PROPERTY_ID: tenant.PROPERTY_ID,
          PROPERTY_NAME: property?.PROPERTY_NAME,
          BUILDING_FOOR: tenant.BUILDING_FOOR,
          PROPERTY_TYPE: tenant.PROPERTY_TYPE,
          IS_ACTIVE: tenant.IS_ACTIVE,
        },
        property: property
          ? {
              PROPERTY_ID: property.PROPERTY_ID,
              PROPERTY_NAME: property.PROPERTY_NAME,
              PROPERTY_ADDRESS: property.ADDRESS,
            }
          : null,
        allMonths, // This now contains all historical months
        totalDue, // This now reflects the true total due
        paymentHistory: paymentHistory.map((payment) => ({
          ID: payment.ID,
          RENT_MONTH: payment.RENT_MONTH,
          RECEIVED_AMOUNT: payment.RECEIVED_AMOUNT,
          RENT_ALLOCATED: payment.RENT_ALLOCATED,
          PENALTY_ALLOCATED: payment.PENALTY_ALLOCATED,
          OUTSTANDING_ALLOCATED: payment.OUTSTANDING_ALLOCATED,
          PAYMENT_METHOD: payment.PAYMENT_METHOD,
          PAYMENT_DATE: payment.PAYMENT_DATE,
        })),
        rentFactors: {
          BASIC_RENT: rentFactors?.BASIC_RENT || 0,
          PROPERTY_TAX: rentFactors?.PROPERTY_TAX || 0,
          REPAIR_CESS: rentFactors?.REPAIR_CESS || 0,
          MISC: rentFactors?.MISC || 0,
          totalRent,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching tenant details:", error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: "Failed to fetch tenant details" });
  }
});

/**
 * GET /list
 * Use-case: List all tenants with pagination.
 * Important: Supports filtering by propertyId, status, search, current, hasContact, expiringSoon.
 */
tenantRoutes.get("/list", async (c) => {
  try {
    const db = c.req.db;
    const {
      propertyId,
      page = "1",
      limit = "10",
      status, // 'active' | 'inactive'
      search,
      current, // 'true' for current tenants
      hasContact, // 'true'
      expiringSoon, // 'true'
    } = c.req.query();
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let where = propertyId ? eq(TENANTS.PROPERTY_ID, propertyId) : undefined;
    if (status === "active") where = and(where, eq(TENANTS.IS_ACTIVE, true));
    if (status === "inactive") where = and(where, eq(TENANTS.IS_ACTIVE, false));
    if (search) {
      where = and(
        where,
        or(
          ilike(TENANTS.TENANT_NAME, `%${search}%`),
          ilike(TENANTS.PROPERTY_NUMBER, `%${search}%`),
          ilike(TENANTS.TENANT_MOBILE_NUMBER, `%${search}%`)
        )
      );
    }
    if (current === "true") {
      where = and(where, gte(TENANTS.TENANCY_END_DATE, new Date()));
    }
    if (hasContact === "true") {
      where = and(where, isNotNull(TENANTS.TENANT_MOBILE_NUMBER));
    }
    if (expiringSoon === "true") {
      const now = new Date();
      const soon = new Date(now);
      soon.setDate(now.getDate() + 60);
      where = and(
        where,
        gte(TENANTS.TENANCY_END_DATE, now),
        lte(TENANTS.TENANCY_END_DATE, soon)
      );
    }

    const tenants = await db.query.TENANTS.findMany({
      where,
      limit: limitNum,
      offset: offset,
    });
    // Get total count for pagination
    const total = await db
      .select({ count: count() })
      .from(TENANTS)
      .where(where);
    const totalCount = total[0]?.count ?? 0;

    return c.json({ status: 200, data: tenants, total: totalCount });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    throw new HTTPException(500, { message: "Failed to fetch tenants" });
  }
});

/**
 * PUT /edit/:id
 * Use-case: Edit tenant details.
 * Important: Only editable by admin. Validates tenant exists.
 */
tenantRoutes.put("/edit/:id", async (c) => {
  // TODO: Implement tenant editing logic
  return c.json({ status: 501, message: "Not implemented" });
});

/**
 * DELETE /delete/:id
 * Use-case: Delete a tenant.
 * Important: Only admin can delete. Checks for outstanding payments before deletion.
 */
tenantRoutes.delete("/delete/:id", async (c) => {
  // TODO: Implement tenant deletion logic
  return c.json({ status: 501, message: "Not implemented" });
});

export default tenantRoutes;
