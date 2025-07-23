// apps/tenant-management-system-worker/src/routes/report.ts
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { and, eq, sum, count, desc, gt, sql } from "drizzle-orm";
import {
  Property,
  TENANTS,
  TENANT_PAYMENT_ENTRIES,
  MONTHLY_RENT_TRACKING,
} from "@repo/db/schema";
import type { Env } from "..";

const reportRoutes = new Hono<{ Bindings: Env }>();

reportRoutes.get("/dashboard", async (c) => {
  try {
    const db = c.req.db;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfMonthStr = firstDayOfMonth.toISOString().slice(0, 10);

    // --- Corrected KPI Queries ---

    // 1. Total Outstanding (across all time for active tenants)
    const totalOutstandingQuery = db
      .select({
        total:
          sql<number>`COALESCE(SUM(${MONTHLY_RENT_TRACKING.RENT_PENDING}), 0) + COALESCE(SUM(${MONTHLY_RENT_TRACKING.OUTSTANDING_PENDING}), 0) + COALESCE(SUM(${MONTHLY_RENT_TRACKING.PENALTY_PENDING}), 0)`.mapWith(
            Number
          ),
      })
      .from(MONTHLY_RENT_TRACKING)
      .leftJoin(TENANTS, eq(MONTHLY_RENT_TRACKING.TENANT_ID, TENANTS.TENANT_ID))
      .where(eq(TENANTS.IS_ACTIVE, true)) // Only count for active tenants
      .then((res) => res[0]?.total || 0);

    // 2. Monthly KPIs (filtered specifically for the current month, any day)
    const monthlyKpiQuery = db
      .select({
        rentCollectedThisMonth:
          sql<number>`COALESCE(SUM(${MONTHLY_RENT_TRACKING.RENT_COLLECTED}), 0)`.mapWith(
            Number
          ),
        rentPendingThisMonth:
          sql<number>`COALESCE(SUM(${MONTHLY_RENT_TRACKING.RENT_PENDING}), 0)`.mapWith(
            Number
          ),
      })
      .from(MONTHLY_RENT_TRACKING)
      .leftJoin(TENANTS, eq(MONTHLY_RENT_TRACKING.TENANT_ID, TENANTS.TENANT_ID))
      .where(
        and(
          sql`date_trunc('month', ${MONTHLY_RENT_TRACKING.RENT_MONTH}) = date_trunc('month', CURRENT_DATE)`,
          eq(TENANTS.IS_ACTIVE, true)
        )
      )
      .then((res) => res[0]);

    // 3. Occupancy KPIs
    const occupancyQuery = db
      .select({
        activeTenants: count(TENANTS.TENANT_ID),
        totalUnits:
          sql<number>`(SELECT SUM(${Property.NUMBER_OF_BLOCKS}) FROM ${Property})`.mapWith(
            Number
          ),
      })
      .from(TENANTS)
      .where(eq(TENANTS.IS_ACTIVE, true))
      .then((res) => res[0]);

    // --- Priority Action & Activity Feed Queries (These were mostly correct) ---
    const highestDuesQuery = db
      .select({
        tenantId: TENANTS.TENANT_ID,
        tenantName: TENANTS.TENANT_NAME,
        totalDue: sql<number>`SUM(
        COALESCE(${MONTHLY_RENT_TRACKING.RENT_PENDING}, 0) + 
        COALESCE(${MONTHLY_RENT_TRACKING.OUTSTANDING_PENDING}, 0) + 
        COALESCE(${MONTHLY_RENT_TRACKING.PENALTY_PENDING}, 0)
      )`.mapWith(Number),
        dueSince:
          sql<string>`MIN(CASE WHEN ${MONTHLY_RENT_TRACKING.RENT_PENDING} > 0 OR ${MONTHLY_RENT_TRACKING.OUTSTANDING_PENDING} > 0 THEN ${MONTHLY_RENT_TRACKING.RENT_MONTH} END)`.mapWith(
            String
          ),
      })
      .from(MONTHLY_RENT_TRACKING)
      .leftJoin(TENANTS, eq(MONTHLY_RENT_TRACKING.TENANT_ID, TENANTS.TENANT_ID))
      .where(eq(TENANTS.IS_ACTIVE, true))
      .groupBy(TENANTS.TENANT_ID)
      .having(
        gt(
          sql`SUM(
            COALESCE(${MONTHLY_RENT_TRACKING.RENT_PENDING}, 0) + 
            COALESCE(${MONTHLY_RENT_TRACKING.OUTSTANDING_PENDING}, 0) + 
            COALESCE(${MONTHLY_RENT_TRACKING.PENALTY_PENDING}, 0)
          )`,
          0
        )
      )
      .orderBy(
        desc(
          sql`SUM(
            COALESCE(${MONTHLY_RENT_TRACKING.RENT_PENDING}, 0) + 
            COALESCE(${MONTHLY_RENT_TRACKING.OUTSTANDING_PENDING}, 0) + 
            COALESCE(${MONTHLY_RENT_TRACKING.PENALTY_PENDING}, 0)
          )`
        )
      )
      .limit(5);

    const unpaidThisMonthQuery = db
      .select({
        tenantId: TENANTS.TENANT_ID,
        tenantName: TENANTS.TENANT_NAME,
        unitNumber: TENANTS.PROPERTY_NUMBER,
        rentPending: MONTHLY_RENT_TRACKING.RENT_PENDING,
      })
      .from(MONTHLY_RENT_TRACKING)
      .leftJoin(TENANTS, eq(MONTHLY_RENT_TRACKING.TENANT_ID, TENANTS.TENANT_ID))
      .where(
        and(
          eq(MONTHLY_RENT_TRACKING.RENT_MONTH, firstDayOfMonth),
          gt(MONTHLY_RENT_TRACKING.RENT_PENDING, 0),
          eq(TENANTS.IS_ACTIVE, true)
        )
      )
      .orderBy(desc(MONTHLY_RENT_TRACKING.RENT_PENDING))
      .limit(5);

    // New: Get the real count of unpaid tenants for this month
    const unpaidThisMonthCountQuery = db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(MONTHLY_RENT_TRACKING)
      .leftJoin(TENANTS, eq(MONTHLY_RENT_TRACKING.TENANT_ID, TENANTS.TENANT_ID))
      .where(
        and(
          eq(MONTHLY_RENT_TRACKING.RENT_MONTH, firstDayOfMonth),
          gt(MONTHLY_RENT_TRACKING.RENT_PENDING, 0),
          eq(TENANTS.IS_ACTIVE, true)
        )
      )
      .then((res) => res[0]?.count || 0);

    const activityFeedQuery = db
      .select({
        id: TENANT_PAYMENT_ENTRIES.ID,
        tenantName: TENANTS.TENANT_NAME,
        amount: TENANT_PAYMENT_ENTRIES.RECEIVED_AMOUNT,
        date: TENANT_PAYMENT_ENTRIES.PAYMENT_DATE,
        type: sql<string>`'payment'`.as("type"),
      })
      .from(TENANT_PAYMENT_ENTRIES)
      .leftJoin(
        TENANTS,
        eq(TENANT_PAYMENT_ENTRIES.TENANT_ID, TENANTS.TENANT_ID)
      )
      .orderBy(desc(TENANT_PAYMENT_ENTRIES.PAYMENT_DATE))
      .limit(5);

    // Execute all queries in parallel for performance
    const [
      totalOutstanding,
      monthlyKpis,
      occupancy,
      highestDues,
      unpaidThisMonth,
      unpaidThisMonthCount,
      activityFeed,
    ] = await Promise.all([
      totalOutstandingQuery,
      monthlyKpiQuery,
      occupancyQuery,
      highestDuesQuery,
      unpaidThisMonthQuery,
      unpaidThisMonthCountQuery,
      activityFeedQuery,
    ]);

    // Debug logs for API
    console.log("totalOutstanding", totalOutstanding);
    console.log("monthlyKpis", monthlyKpis);
    console.log("occupancy", occupancy);
    console.log("highestDues", highestDues);
    console.log("unpaidThisMonth", unpaidThisMonth);
    console.log("activityFeed", activityFeed);

    const rentCollectedThisMonth = monthlyKpis?.rentCollectedThisMonth || 0;
    const rentPendingThisMonth = monthlyKpis?.rentPendingThisMonth || 0;
    const totalDueThisMonth = rentCollectedThisMonth + rentPendingThisMonth;

    const responseData = {
      status: 200,
      data: {
        kpis: {
          totalOutstanding: totalOutstanding,
          rentCollectedThisMonth: rentCollectedThisMonth,
          rentPendingThisMonth: rentPendingThisMonth,
          occupancyRate:
            occupancy.totalUnits > 0
              ? Math.round(
                  (occupancy.activeTenants / occupancy.totalUnits) * 100
                )
              : 0,
          activeTenants: occupancy.activeTenants,
          totalUnits: occupancy.totalUnits,
        },
        monthlyCollectionStatus: {
          collectedAmount: rentCollectedThisMonth,
          totalDue: totalDueThisMonth,
          percentage:
            totalDueThisMonth > 0
              ? Math.round((rentCollectedThisMonth / totalDueThisMonth) * 100)
              : 0,
        },
        priorityActions: {
          highestDues,
          unpaidThisMonth,
          unpaidThisMonthCount, // <-- add the real count here
        },
        activityFeed,
      },
    };
    console.log("API responseData", JSON.stringify(responseData, null, 2));
    return c.json(responseData);
  } catch (error) {
    console.error("Error fetching dashboard report:", error);
    throw new HTTPException(500, {
      message: "Failed to fetch dashboard report",
    });
  }
});

export default reportRoutes;
