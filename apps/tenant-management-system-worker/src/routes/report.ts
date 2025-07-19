import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Env } from "..";
import { and, eq, gte, sql, desc } from "drizzle-orm";
import {
  Property,
  TENANTS,
  TENANT_PAYMENT_ENTRIES,
  MONTHLY_RENT_TRACKING,
} from "@repo/db/schema";

const reportRoutes = new Hono<{ Bindings: Env }>();

// ... (summary and property-wise routes remain the same)

/**
 * GET /summary
 * Use-case: Get dashboard summary metrics for the main dashboard.
 * Returns: propertyName, totalUnits, occupiedUnits, totalTenants, rentCollected, outstandingAmount, thisMonthCollection, pendingPayments, occupancyRate
 */
reportRoutes.get("/summary", async (c) => {
  try {
    const db = c.req.db;
    // 1. Get first property (for propertyName)
    const property = await db.query.Property.findFirst();
    const propertyName = property?.PROPERTY_NAME || "N/A";

    // 2. Total units (sum of NUMBER_OF_BLOCKS)
    const properties = await db.query.Property.findMany();
    const totalUnits = properties.reduce(
      (sum, p) => sum + (p.NUMBER_OF_BLOCKS || 0),
      0
    );

    // 3. Occupied units (active tenants)
    const tenants = await db.query.TENANTS.findMany();
    const occupiedUnits = tenants.filter((t) => t.IS_ACTIVE).length;

    // 4. Total tenants
    const totalTenants = tenants.length;

    // 5. Rent collected (sum of RECEIVED_AMOUNT)
    const payments = await db.query.TENANT_PAYMENT_ENTRIES.findMany();
    const rentCollected = payments.reduce(
      (sum, p) => sum + (p.RECEIVED_AMOUNT || 0),
      0
    );

    // 6. Outstanding amount (sum of OUTSTANDING_PENDING for all tenants)
    const monthlyTracking = await db.query.MONTHLY_RENT_TRACKING.findMany();
    // Filter for July 2025 in-memory
    const julyTracking = monthlyTracking.filter((row) => {
      if (!row.RENT_MONTH) return false;
      const d = new Date(row.RENT_MONTH);
      return d.getFullYear() === 2025 && d.getMonth() === 6; // July is month 6 (0-based)
    });
    const outstandingAmount = julyTracking.reduce(
      (sum, o) => sum + (o.OUTSTANDING_PENDING || 0),
      0
    );

    // 7. This month collection (sum of RECEIVED_AMOUNT for current month)
    const now = new Date();
    const thisMonthPayments = payments.filter((p) => {
      if (!p.CREATED_ON) return false;
      const d = new Date(p.CREATED_ON);
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    });
    const thisMonthCollection = thisMonthPayments.reduce(
      (sum, p) => sum + (p.RECEIVED_AMOUNT || 0),
      0
    );

    // 8. Pending payments (tenants with outstanding > 0)
    const tenantOutstandingMap = new Map();
    for (const o of julyTracking) {
      if (!o.TENANT_ID) continue;
      tenantOutstandingMap.set(
        o.TENANT_ID,
        (tenantOutstandingMap.get(o.TENANT_ID) || 0) +
          (o.OUTSTANDING_PENDING || 0)
      );
    }
    const pendingPayments = Array.from(tenantOutstandingMap.values()).filter(
      (amt) => amt > 0
    ).length;

    // 9. Occupancy rate
    const occupancyRate =
      totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    return c.json({
      status: 200,
      data: {
        propertyName,
        totalUnits,
        occupiedUnits,
        totalTenants,
        rentCollected,
        outstandingAmount,
        thisMonthCollection,
        pendingPayments,
        occupancyRate,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    throw new HTTPException(500, {
      message: "Failed to fetch dashboard summary",
    });
  }
});

/**
 * GET /outstanding-tenants
 * Use-case: Get a paginated list of tenants with outstanding balances.
 * Important: Supports pagination via `page` and `limit` query params.
 */
reportRoutes.get("/outstanding-tenants", async (c) => {
  try {
    const db = c.req.db;
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = (page - 1) * limit;

    // Determine current month (UTC)
    const now = new Date();
    const currentMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 1)
    );
    const currentMonthStr = currentMonth.toISOString().slice(0, 10); // 'YYYY-MM-DD'

    // Get all tracking for current month only
    const allTracking = (
      await db.query.MONTHLY_RENT_TRACKING.findMany()
    ).filter((row) => {
      if (!row.RENT_MONTH) return false;
      // Compare only year and month
      const d = new Date(row.RENT_MONTH);
      return (
        d.getUTCFullYear() === currentMonth.getUTCFullYear() &&
        d.getUTCMonth() === currentMonth.getUTCMonth()
      );
    });

    // Group by tenant
    const tenantMap = new Map();
    for (const row of allTracking) {
      if (!row.TENANT_ID) continue;
      const prev = tenantMap.get(row.TENANT_ID) || 0;
      tenantMap.set(row.TENANT_ID, prev + (row.OUTSTANDING_PENDING || 0));
    }
    const allTenants = await db.query.TENANTS.findMany();
    let outstandingRows = Array.from(tenantMap.entries())
      .filter(([_, outstandingAmount]) => outstandingAmount > 0)
      .map(([tenantId, outstandingAmount]) => {
        const tenant = allTenants.find((t) => t.TENANT_ID === tenantId);
        return {
          tenantId,
          tenantName: tenant?.TENANT_NAME || "",
          unitNumber: tenant?.PROPERTY_NUMBER || "",
          outstandingAmount,
        };
      })
      .sort((a, b) => b.outstandingAmount - a.outstandingAmount);

    const total = outstandingRows.length;
    outstandingRows = outstandingRows.slice(offset, offset + limit);

    return c.json({ status: 200, data: outstandingRows, total });
  } catch (error) {
    console.error("Error fetching outstanding tenants report:", error);
    throw new HTTPException(500, {
      message: "Failed to fetch outstanding tenants report",
    });
  }
});

/**
 * GET /recent-payments
 * Use-case: Get a paginated list of recent payment activities.
 * Important: Supports pagination via `page` and `limit` query params.
 */
reportRoutes.get("/recent-payments", async (c) => {
  try {
    const db = c.req.db;
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "10");
    const offset = (page - 1) * limit;

    const payments = await db.query.TENANT_PAYMENT_ENTRIES.findMany();
    const allTenants = await db.query.TENANTS.findMany();
    const allTracking = await db.query.MONTHLY_RENT_TRACKING.findMany();
    // Join payments with tenants and outstanding
    const recentPayments = payments
      .sort((a, b) => {
        const da = a.CREATED_ON ? new Date(a.CREATED_ON).getTime() : 0;
        const db_ = b.CREATED_ON ? new Date(b.CREATED_ON).getTime() : 0;
        return db_ - da;
      })
      .slice(offset, offset + limit)
      .map((p) => {
        const tenant = allTenants.find((t) => t.TENANT_ID === p.TENANT_ID);
        const tracking = allTracking.find((t) => t.TENANT_ID === p.TENANT_ID);
        return {
          id: p.ID,
          tenant: tenant?.TENANT_NAME || "",
          unit: tenant?.PROPERTY_NUMBER || "",
          amount: p.RECEIVED_AMOUNT,
          date: p.CREATED_ON,
          status:
            tracking && tracking.OUTSTANDING_PENDING > 0 ? "overdue" : "paid",
        };
      });

    return c.json({ status: 200, data: recentPayments });
  } catch (error) {
    console.error("Error fetching recent payments:", error);
    throw new HTTPException(500, {
      message: "Failed to fetch recent payments",
    });
  }
});

export default reportRoutes;
