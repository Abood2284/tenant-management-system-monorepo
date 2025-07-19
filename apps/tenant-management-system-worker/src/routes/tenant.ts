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
} from "drizzle-orm";

const tenantRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /add
 * Use-case: Assign a new tenant to a property, with details and rent breakdown.
 * Important: Only admin can add tenants. Validates required fields and property linkage.
 */
tenantRoutes.post("/add", async (c) => {
  // TODO: Implement tenant creation logic
  return c.json({ status: 501, message: "Not implemented" });
});

/**
 * GET /detail/:id
 * Use-case: Get detailed tenant information including payment data.
 * Important: Returns tenant details with unpaid months and rent factors.
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

    // Get rent factors
    const rentFactors = await db.query.TENANTS_RENT_FACTORS.findFirst({
      where: eq(TENANTS_RENT_FACTORS.TENANT_ID, tenantId),
      orderBy: desc(TENANTS_RENT_FACTORS.CREATED_ON),
    });

    const totalRent =
      (rentFactors?.BASIC_RENT || 0) +
      (rentFactors?.PROPERTY_TAX || 0) +
      (rentFactors?.REPAIR_CESS || 0) +
      (rentFactors?.MISC || 0);

    // Get all monthly tracking data (not just unpaid)
    const monthlyTracking = await db.query.MONTHLY_RENT_TRACKING.findMany({
      where: eq(MONTHLY_RENT_TRACKING.TENANT_ID, tenantId),
      orderBy: desc(MONTHLY_RENT_TRACKING.RENT_MONTH),
    });

    // Get unpaid months (only past months with pending amounts)
    const unpaidMonths = monthlyTracking.filter(
      (month) =>
        (month.RENT_PENDING > 0 ||
          month.PENALTY_PENDING > 0 ||
          month.OUTSTANDING_PENDING > 0) &&
        new Date(month.RENT_MONTH) <= new Date()
    );

    // Get payment history for the last 12 months
    const paymentHistory = await db.query.TENANT_PAYMENT_ENTRIES.findMany({
      where: eq(TENANT_PAYMENT_ENTRIES.TENANT_ID, tenantId),
      orderBy: desc(TENANT_PAYMENT_ENTRIES.PAYMENT_DATE),
      limit: 12,
    });

    // Calculate total due
    const totalDue = unpaidMonths.reduce(
      (sum, month) =>
        sum +
        (month.RENT_PENDING || 0) +
        (month.PENALTY_PENDING || 0) +
        (month.OUTSTANDING_PENDING || 0),
      0
    );

    // Get current month tracking
    const currentDate = new Date();
    const currentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const currentMonthTracking = monthlyTracking.find(
      (month) => new Date(month.RENT_MONTH).getTime() === currentMonth.getTime()
    );

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
        unpaidMonths: unpaidMonths.map((month) => ({
          RENT_MONTH: month.RENT_MONTH,
          RENT_PENDING: month.RENT_PENDING,
          PENALTY_PENDING: month.PENALTY_PENDING,
          OUTSTANDING_PENDING: month.OUTSTANDING_PENDING,
          RENT_COLLECTED: month.RENT_COLLECTED,
          PENALTY_PAID: month.PENALTY_PAID,
          OUTSTANDING_COLLECTED: month.OUTSTANDING_COLLECTED,
        })),
        currentMonth: currentMonthTracking
          ? {
              RENT_MONTH: currentMonthTracking.RENT_MONTH,
              RENT_COLLECTED: currentMonthTracking.RENT_COLLECTED,
              RENT_PENDING: currentMonthTracking.RENT_PENDING,
              PENALTY_PAID: currentMonthTracking.PENALTY_PAID,
              PENALTY_PENDING: currentMonthTracking.PENALTY_PENDING,
              OUTSTANDING_COLLECTED: currentMonthTracking.OUTSTANDING_COLLECTED,
              OUTSTANDING_PENDING: currentMonthTracking.OUTSTANDING_PENDING,
            }
          : null,
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
        totalDue,
        rentFactors: {
          BASIC_RENT: rentFactors?.BASIC_RENT || 0,
          PROPERTY_TAX: rentFactors?.PROPERTY_TAX || 0,
          REPAIR_CESS: rentFactors?.REPAIR_CESS || 0,
          MISC: rentFactors?.MISC || 0,
          totalRent,
        },
        summary: {
          totalCollected: paymentHistory.reduce(
            (sum, payment) => sum + payment.RECEIVED_AMOUNT,
            0
          ),
          totalRentCollected: paymentHistory.reduce(
            (sum, payment) => sum + (payment.RENT_ALLOCATED || 0),
            0
          ),
          totalPenaltyCollected: paymentHistory.reduce(
            (sum, payment) => sum + (payment.PENALTY_ALLOCATED || 0),
            0
          ),
          totalOutstandingCollected: paymentHistory.reduce(
            (sum, payment) => sum + (payment.OUTSTANDING_ALLOCATED || 0),
            0
          ),
          totalPending: totalDue,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching tenant details:", error);
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
          like(TENANTS.TENANT_NAME, `%${search}%`),
          like(TENANTS.PROPERTY_NUMBER, `%${search}%`),
          like(TENANTS.TENANT_MOBILE_NUMBER, `%${search}%`)
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
