// apps/tenant-management-system-worker/src/scheduled.ts
import { neon } from "@neondatabase/serverless";
import * as schema from "@repo/db/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, gte, lt, sql, count } from "drizzle-orm";
import type { Env } from "./index";
import {
  getFinancialYearAndQuarter,
  getPreviousQuarterRange,
} from "./lib/dates";

// NOTE: Do not import 'app' here. Manual endpoint registration should be done in index.ts
// by importing and calling the exported registration functions from this file.

/**
 * =============================
 * MONTHLY RENT TRACKING WORKER
 * =============================
 *
 * BUSINESS PURPOSE:
 * This scheduler ensures every active tenant has a monthly rent tracking record
 * for the current month, even if they haven't made any payments yet. This is
 * crucial for:
 * - Accurate financial reporting and dashboards
 * - Penalty calculation logic (can't calculate penalties without base records)
 * - UI consistency (avoids null/undefined states in frontend)
 * - Audit trails and compliance
 *
 * SCHEDULE: Runs on 1st of every month at 00:00 UTC
 * TRIGGER: Cron expression "0 0 1 * *" in wrangler.jsonc
 *
 * TECHNICAL APPROACH:
 * - Queries all active tenants with their current rent factors
 * - Checks if MONTHLY_RENT_TRACKING record exists for current month
 * - If not, creates new record with:
 *   * RENT_PENDING calculated from tenant's rent factors
 *   * OUTSTANDING_AMOUNT carried over from previous month
 *   * All collection/penalty fields zeroed initially
 *   * Correct financial year and quarter metadata
 */

/**
 * Core function to process monthly rent tracking for all active tenants
 * Creates missing MONTHLY_RENT_TRACKING records for the current month
 *
 * @param db - Drizzle database instance
 * @returns Processing results with counts and details
 */
export async function processMonthlyRentTracking(db: any) {
  const startTime = new Date();
  console.log(
    `[MONTHLY_TRACKING] ========== STARTING MONTHLY RENT TRACKING PROCESS ==========`
  );
  console.log(`[MONTHLY_TRACKING] Process started at: ${startTime}`);

  const processed: {
    tenantId: string;
    tenantName: string;
    action: string;
    rentPending: number;
    outstanding: number;
    reason?: string;
  }[] = [];
  const errors: string[] = [];
  const now = new Date();

  const rentMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  // Add validation before processing
  if (now.getUTCMonth() !== rentMonth.getUTCMonth()) {
    throw new Error(`Date calculation error: Processing wrong month`);
  }

  const { financialYear, quarter } = getFinancialYearAndQuarter(rentMonth);

  console.log(
    `[MONTHLY_TRACKING] Processing rent tracking for month: ${rentMonth.toISOString()}`
  );

  try {
    // STEP 1: Fetch all active tenants with their rent factors
    const tenants = await db
      .select({
        tenantId: schema.TENANTS.TENANT_ID,
        tenantName: schema.TENANTS.TENANT_NAME,
        isActive: schema.TENANTS.IS_ACTIVE,
        basicRent: schema.TENANTS_RENT_FACTORS.BASIC_RENT,
        propertyTax: schema.TENANTS_RENT_FACTORS.PROPERTY_TAX,
        repairCess: schema.TENANTS_RENT_FACTORS.REPAIR_CESS,
        misc: schema.TENANTS_RENT_FACTORS.MISC,
      })
      .from(schema.TENANTS)
      .innerJoin(
        schema.TENANTS_RENT_FACTORS,
        eq(schema.TENANTS.TENANT_ID, schema.TENANTS_RENT_FACTORS.TENANT_ID)
      )
      .where(eq(schema.TENANTS.IS_ACTIVE, true));

    console.log(
      `[MONTHLY_TRACKING] Found ${tenants.length} active tenants to process.`
    );

    if (tenants.length === 0) {
      console.log(
        `[MONTHLY_TRACKING] WARNING: No active tenants found. This might indicate a data issue.`
      );
      return {
        processedCount: 0,
        processed,
        errors: ["No active tenants found"],
      };
    }

    // STEP 2: Process each tenant individually
    for (const tenant of tenants) {
      try {
        // Check if record already exists for this month
        const existing = await db
          .select()
          .from(schema.MONTHLY_RENT_TRACKING)
          .where(
            and(
              eq(schema.MONTHLY_RENT_TRACKING.TENANT_ID, tenant.tenantId),
              eq(schema.MONTHLY_RENT_TRACKING.RENT_MONTH, rentMonth)
            )
          );

        if (existing.length > 0) {
          processed.push({
            tenantId: tenant.tenantId,
            tenantName: tenant.tenantName,
            action: "skipped",
            reason: "Already exists",
            rentPending: 0,
            outstanding: 0,
          });
          continue;
        }

        // Get previous month's outstanding amount (if any)
        const prevMonth = new Date(rentMonth);
        prevMonth.setMonth(prevMonth.getMonth() - 1);

        const prev = await db
          .select({
            outstanding: schema.MONTHLY_RENT_TRACKING.OUTSTANDING_PENDING,
          })
          .from(schema.MONTHLY_RENT_TRACKING)
          .where(
            and(
              eq(schema.MONTHLY_RENT_TRACKING.TENANT_ID, tenant.tenantId),
              eq(schema.MONTHLY_RENT_TRACKING.RENT_MONTH, prevMonth)
            )
          );

        const outstanding = prev.length > 0 ? prev[0].outstanding : 0;

        // Calculate total rent pending for this month
        const rentPending =
          (tenant.basicRent || 0) +
          (tenant.propertyTax || 0) +
          (tenant.repairCess || 0) +
          (tenant.misc || 0);

        await db.insert(schema.MONTHLY_RENT_TRACKING).values({
          ID: crypto.randomUUID(),
          TENANT_ID: tenant.tenantId,
          RENT_MONTH: rentMonth,
          RENT_COLLECTED: 0,
          RENT_PENDING: rentPending,
          OUTSTANDING_AMOUNT: outstanding,
          OUTSTANDING_COLLECTED: 0,
          OUTSTANDING_PENDING: outstanding,
          PENALTY_AMOUNT: 0,
          PENALTY_PAID: 0,
          PENALTY_PENDING: 0,
          FINANCIAL_YEAR: financialYear,
          QUARTER: quarter,
          CREATED_ON: new Date(),
          UPDATED_ON: new Date(),
        });

        processed.push({
          tenantId: tenant.tenantId,
          tenantName: tenant.tenantName,
          action: "inserted",
          rentPending,
          outstanding,
        });
      } catch (tenantError) {
        const errorMsg = `Error processing tenant ${tenant.tenantName} (${tenant.tenantId}): ${tenantError instanceof Error ? tenantError.message : "Unknown error"}`;
        // This is an important log for debugging specific failures
        console.error(`[MONTHLY_TRACKING] ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // --- FINAL SUMMARY LOGS (KEPT FOR VISIBILITY) ---
    console.log(
      `[MONTHLY_TRACKING] ========== MONTHLY RENT TRACKING PROCESS COMPLETED ==========`
    );
    console.log(`[MONTHLY_TRACKING] Process completed at: ${endTime}`);
    console.log(`[MONTHLY_TRACKING] Total duration: ${duration}ms`);
    console.log(
      `[MONTHLY_TRACKING] Total tenants processed: ${tenants.length}`
    );
    console.log(
      `[MONTHLY_TRACKING] Records created: ${processed.filter((p) => p.action === "inserted").length}`
    );
    console.log(
      `[MONTHLY_TRACKING] Records skipped: ${processed.filter((p) => p.action === "skipped").length}`
    );
    console.log(`[MONTHLY_TRACKING] Errors encountered: ${errors.length}`);

    if (errors.length > 0) {
      console.error(`[MONTHLY_TRACKING] Errors encountered during processing:`);
      errors.forEach((error, index) => {
        console.error(`[MONTHLY_TRACKING] Error ${index + 1}: ${error}`);
      });
    }

    return { processedCount: processed.length, processed, errors };
  } catch (error) {
    const errorMsg = `Fatal error in processMonthlyRentTracking: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error(`[MONTHLY_TRACKING] ❌ ${errorMsg}`);
    errors.push(errorMsg);
    return { processedCount: processed.length, processed, errors };
  }
}

/**
 * Manual trigger endpoint registration for monthly rent tracking
 * Allows admins to manually trigger the monthly processing for testing/recovery
 */
export function registerManualMonthlyTrackingEndpoint(app: any) {
  app.post("/api/manual/trigger-monthly-tracking", async (c: any) => {
    const requestId = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(
      `[MANUAL_TRIGGER] Request ID: ${requestId} - Manual monthly tracking trigger initiated by user`
    );

    try {
      console.log(
        `[MANUAL_TRIGGER] ${requestId} - Starting manual monthly rent tracking process...`
      );
      const db = c.req.db;
      const result = await processMonthlyRentTracking(db);

      console.log(
        `[MANUAL_TRIGGER] ${requestId} - Manual monthly tracking completed successfully`
      );
      console.log(
        `[MANUAL_TRIGGER] ${requestId} - Results: ${result.processedCount} records processed, ${result.errors.length} errors`
      );

      return c.json({
        status: 200,
        message: "Manual monthly rent tracking completed successfully",
        requestId,
        ...result,
        triggeredAt: new Date(),
        triggeredBy: "manual",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(
        `[MANUAL_TRIGGER] ${requestId} - Manual monthly rent tracking trigger failed: ${errorMsg}`
      );

      return c.json(
        {
          status: 500,
          message: "Manual monthly rent tracking trigger failed",
          requestId,
          error: errorMsg,
          triggeredAt: new Date(),
          triggeredBy: "manual",
        },
        500
      );
    }
  });
}

/**
 * =============================
 * QUARTERLY PENALTY WORKER
 * =============================
 *
 * BUSINESS PURPOSE:
 * This scheduler automatically applies penalty charges to tenants who have
 * failed to pay their rent by the end of each quarter. This is essential for:
 * - Enforcing late payment policies consistently
 * - Maintaining cash flow through deterrent penalties
 * - Automating what would otherwise be manual penalty calculations
 * - Ensuring fair and systematic application of penalty rules
 *
 * SCHEDULE: Runs on 1st day of each quarter (Jan 1, Apr 1, Jul 1, Oct 1) at 00:00 UTC
 * TRIGGER: Cron expression "0 0 1 1,4,7,10 *" in wrangler.jsonc
 *
 * PENALTY LOGIC:
 * - Targets tenants with unpaid rent from the PREVIOUS quarter
 * - Penalty = (Rent Pending + Outstanding Pending) * Penalty Rate%
 * - Only applies penalty if not already applied for the calculated amount
 * - Uses penalty rate from PENALTYINTERESTMASTER table
 */

/**
 * Core function to process quarterly penalties for overdue tenants
 * Applies penalty charges to tenants with unpaid rent from previous quarter
 *
 * @param db - Drizzle database instance
 * @returns Processing results with counts, details, and summary
 */
export async function processQuarterlyPenalties(db: any) {
  const startTime = new Date();
  console.log(
    `[PENALTY_PROCESSOR] ========== STARTING QUARTERLY PENALTY PROCESSING ==========`
  );
  console.log(`[PENALTY_PROCESSOR] Process started at: ${startTime}`);

  const processed: any[] = [];
  const errors: string[] = [];
  const details: any[] = [];

  try {
    // STEP 1: Calculate previous quarter date range
    const { startDate, endDate } = getPreviousQuarterRange();

    console.log(
      `[PENALTY_PROCESSOR] Step 1: Processing penalties for previous quarter`
    );
    console.log(
      `[PENALTY_PROCESSOR] Quarter period: ${startDate.toISOString()} to ${endDate.toISOString()} (exclusive)`
    );

    // STEP 2: Fetch penalty interest rate from master table
    console.log(
      `[PENALTY_PROCESSOR] Step 2: Fetching current penalty interest rate...`
    );

    const penaltyRates = await db
      .select()
      .from(schema.PENALTY_INTEREST_MASTER)
      .orderBy(sql`${schema.PENALTY_INTEREST_MASTER.EFFECTIVE_FROM} DESC`)
      .limit(1);

    const penaltyRate =
      penaltyRates.length > 0 ? penaltyRates[0].INTEREST_RATE : 5; // Default 5%
    console.log(
      `[PENALTY_PROCESSOR] Penalty rate to be applied: ${penaltyRate}% (${
        penaltyRates.length > 0 ? "from database" : "default fallback"
      })`
    );

    // STEP 3: Query all tenants with unpaid rent from previous quarter
    console.log(
      `[PENALTY_PROCESSOR] Step 3: Querying tenants with unpaid rent from previous quarter...`
    );

    const unpaidRents = await db
      .select({
        trackingId: schema.MONTHLY_RENT_TRACKING.ID,
        tenantId: schema.MONTHLY_RENT_TRACKING.TENANT_ID,
        tenantName: schema.TENANTS.TENANT_NAME,
        rentMonth: schema.MONTHLY_RENT_TRACKING.RENT_MONTH,
        rentPending: schema.MONTHLY_RENT_TRACKING.RENT_PENDING,
        outstandingPending: schema.MONTHLY_RENT_TRACKING.OUTSTANDING_PENDING,
        currentPenalty: schema.MONTHLY_RENT_TRACKING.PENALTY_AMOUNT,
      })
      .from(schema.MONTHLY_RENT_TRACKING)
      .leftJoin(
        schema.TENANTS,
        eq(schema.MONTHLY_RENT_TRACKING.TENANT_ID, schema.TENANTS.TENANT_ID)
      )
      .where(
        and(
          gte(schema.MONTHLY_RENT_TRACKING.RENT_MONTH, startDate),
          lt(schema.MONTHLY_RENT_TRACKING.RENT_MONTH, endDate),
          // Only process records with pending rent
          sql`${schema.MONTHLY_RENT_TRACKING.RENT_PENDING} > 0`
        )
      );

    console.log(
      `[PENALTY_PROCESSOR] Found ${unpaidRents.length} tenant records with unpaid rent from previous quarter`
    );

    if (unpaidRents.length === 0) {
      console.log(
        `[PENALTY_PROCESSOR] ✓ No unpaid rent records found. No penalties to apply.`
      );
      // ... (rest of the empty summary return)
      return {
        processedCount: 0,
        errors,
        details,
        summary: {
          quarterProcessed: `${startDate.toISOString()} to ${endDate.toISOString()}`,
          penaltyRate: `${penaltyRate}%`,
          totalRecordsFound: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          totalPenaltyAmount: 0,
        },
      };
    }

    // STEP 4: Process each unpaid rent record
    console.log(
      `[PENALTY_PROCESSOR] Step 4: Processing penalties for each overdue record...`
    );

    for (const record of unpaidRents) {
      try {
        // **LOGIC CHANGE**: The base for penalty is now ONLY the pending rent.
        const penaltyBaseAmount = record.rentPending || 0;

        // Skip if there's no pending rent (this is a safeguard, though the query should already filter this).
        if (penaltyBaseAmount <= 0) {
          details.push({
            tenantId: record.tenantId,
            tenantName: record.tenantName,
            rentMonth: record.rentMonth,
            action: "skipped",
            reason: "No pending rent to apply penalty on",
          });
          continue;
        }

        // **LOGIC CHANGE**: Calculate penalty amount ONLY on the pending rent.
        const penaltyAmount = Math.floor(
          (penaltyBaseAmount * penaltyRate) / 100
        );

        // Skip if penalty is already applied and matches calculated amount
        if (record.currentPenalty >= penaltyAmount) {
          details.push({
            tenantId: record.tenantId,
            tenantName: record.tenantName,
            rentMonth: record.rentMonth,
            action: "skipped",
            reason: "Penalty already applied or higher penalty exists",
            currentPenalty: record.currentPenalty,
          });
          continue;
        }

        // Apply penalty by updating MONTHLY_RENT_TRACKING
        await db
          .update(schema.MONTHLY_RENT_TRACKING)
          .set({
            PENALTY_AMOUNT: penaltyAmount,
            PENALTY_PENDING: penaltyAmount, // Assuming penalty starts as pending
            PENALTY_PAID: 0, // Reset penalty paid
            UPDATED_ON: new Date(),
          })
          .where(eq(schema.MONTHLY_RENT_TRACKING.ID, record.trackingId));

        processed.push({
          tenantId: record.tenantId,
          tenantName: record.tenantName,
          rentMonth: record.rentMonth,
          penaltyBaseAmount,
          penaltyAmount,
          previousPenalty: record.currentPenalty || 0,
        });

        details.push({
          tenantId: record.tenantId,
          tenantName: record.tenantName,
          rentMonth: record.rentMonth,
          action: "updated",
          penaltyBaseAmount,
          penaltyAmount,
          penaltyRate: `${penaltyRate}%`,
        });
      } catch (recordError) {
        const errorMsg = `Error processing tenant ${record.tenantId} (${record.tenantName}) for ${record.rentMonth}: ${recordError instanceof Error ? recordError.message : "Unknown error"}`;
        console.error(`[PENALTY_PROCESSOR] ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // STEP 5: Calculate and log final summary
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    const totalPenaltyAmount = processed.reduce(
      (sum, p) => sum + p.penaltyAmount,
      0
    );
    const recordsSkipped = details.filter((d) => d.action === "skipped").length;

    console.log(
      `[PENALTY_PROCESSOR] ========== QUARTERLY PENALTY PROCESSING COMPLETED ==========`
    );
    console.log(`[PENALTY_PROCESSOR] Process completed at: ${endTime}`);
    console.log(`[PENALTY_PROCESSOR] Total duration: ${duration}ms`);
    console.log(
      `[PENALTY_PROCESSOR] Records found with pending rent: ${unpaidRents.length}`
    );
    console.log(`[PENALTY_PROCESSOR] Penalties applied: ${processed.length}`);
    console.log(`[PENALTY_PROCESSOR] Records skipped: ${recordsSkipped}`);
    console.log(
      `[PENALTY_PROCESSOR] Total penalty amount applied: ₹${totalPenaltyAmount}`
    );
    console.log(`[PENALTY_PROCESSOR] Errors encountered: ${errors.length}`);

    // ... (rest of the summary and error logging)

    const summary = {
      quarterProcessed: `${startDate.toISOString()} to ${endDate.toISOString()}`,
      penaltyRate: `${penaltyRate}%`,
      totalRecordsFound: unpaidRents.length,
      recordsUpdated: processed.length,
      recordsSkipped,
      totalPenaltyAmount,
    };

    return {
      processedCount: processed.length,
      errors,
      details,
      summary,
    };
  } catch (error) {
    const errorMsg = `Fatal error in processQuarterlyPenalties: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error(`[PENALTY_PROCESSOR] ❌ ${errorMsg}`);
    errors.push(errorMsg);
    // ... (rest of the fatal error return)
    return {
      processedCount: processed.length,
      errors,
      details,
      summary: {
        quarterProcessed: "Error occurred before processing",
        penaltyRate: "Unknown",
        totalRecordsFound: 0,
        recordsUpdated: processed.length,
        recordsSkipped: 0,
        totalPenaltyAmount: 0,
      },
    };
  }
}
/**
 * Manual trigger endpoint registration for quarterly penalty processing
 * Allows admins to manually trigger penalty processing for testing/recovery
 */
export function registerManualPenaltyEndpoint(app: any) {
  app.post("/api/manual/trigger-penalties", async (c: any) => {
    const requestId = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(
      `[MANUAL_PENALTY] Request ID: ${requestId} - Manual penalty processing trigger initiated by user`
    );

    try {
      console.log(
        `[MANUAL_PENALTY] ${requestId} - Starting manual quarterly penalty processing...`
      );
      const db = c.req.db;
      const result = await processQuarterlyPenalties(db);

      console.log(
        `[MANUAL_PENALTY] ${requestId} - Manual penalty processing completed successfully`
      );
      console.log(
        `[MANUAL_PENALTY] ${requestId} - Results: ${result.processedCount} records processed, ${result.errors.length} errors`
      );

      return c.json({
        status: 200,
        message: "Manual penalty processing completed successfully",
        requestId,
        ...result,
        triggeredAt: new Date(),
        triggeredBy: "manual",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(
        `[MANUAL_PENALTY] ${requestId} - Manual penalty processing trigger failed: ${errorMsg}`
      );

      return c.json(
        {
          status: 500,
          message: "Manual penalty trigger failed",
          requestId,
          error: errorMsg,
          triggeredAt: new Date(),
          triggeredBy: "manual",
        },
        500
      );
    }
  });
}

/**
 * Internal endpoint registration for quarterly penalty processing
 * Used by the scheduled cron job to trigger penalty processing
 */
export function registerInternalPenaltyEndpoint(app: any) {
  app.post("/api/internal/process-quarterly-penalties", async (c: any) => {
    const requestId = `INTERNAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(
      `[INTERNAL_PENALTY] Request ID: ${requestId} - Internal penalty processing triggered`
    );

    try {
      console.log(
        `[INTERNAL_PENALTY] ${requestId} - Starting internal quarterly penalty processing...`
      );
      const db = c.req.db;
      const result = await processQuarterlyPenalties(db);

      console.log(
        `[INTERNAL_PENALTY] ${requestId} - Internal penalty processing completed successfully`
      );

      return c.json({
        status: 200,
        message: "Quarterly penalties processed successfully",
        requestId,
        processed: result.processedCount,
        errors: result.errors,
        timestamp: new Date(),
        details: result.details,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(
        `[INTERNAL_PENALTY] ${requestId} - Internal penalty processing failed: ${errorMsg}`
      );

      return c.json(
        {
          status: 500,
          message: "Failed to process quarterly penalties",
          requestId,
          error: errorMsg,
          timestamp: new Date(),
        },
        500
      );
    }
  });
}

/**
 * =============================
 * CLOUDFLARE WORKER SCHEDULED HANDLERS
 * =============================
 *
 * These functions are called by Cloudflare Workers runtime based on the
 * cron triggers defined in wrangler.jsonc
 *
 * IMPORTANT: The scheduled function is exported and used in index.ts
 * Each cron trigger can route to different processing functions based on
 * the schedule or other criteria.
 */

/**
 * Main scheduled event handler for Cloudflare Workers
 * Routes different cron triggers to appropriate processing functions
 *
 * @param event - Scheduled event with cron details
 * @param env - Environment variables
 * @param ctx - Execution context
 */
export async function handleScheduledEvent(event: any, env: Env, ctx: any) {
  const executionId = `SCHED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[SCHEDULER] ========== SCHEDULED EVENT TRIGGERED ==========`);
  console.log(`[SCHEDULER] Execution ID: ${executionId}`);
  console.log(`[SCHEDULER] Triggered at: ${new Date()}`);
  console.log(`[SCHEDULER] Cron pattern: ${event.cron}`);
  console.log(`[SCHEDULER] Scheduled time: ${new Date(event.scheduledTime)}`);

  const db = drizzle({ client: neon(env.DATABASE_URL), schema });

  try {
    // Route based on cron pattern or date
    const now = new Date();
    const dayOfMonth = now.getDate();
    const month = now.getMonth() + 1; // 1-indexed

    // Monthly rent tracking: Runs on 1st of every month
    if (dayOfMonth === 1) {
      console.log(
        `[SCHEDULER] ${executionId} - Executing monthly rent tracking (1st of month)`
      );
      await processMonthlyRentTracking(db);
    }

    // Quarterly penalty processing: Runs on 1st of quarter months (Jan, Apr, Jul, Oct)
    if (dayOfMonth === 1 && [1, 4, 7, 10].includes(month)) {
      console.log(
        `[SCHEDULER] ${executionId} - Executing quarterly penalty processing (1st of quarter)`
      );
      const result = await processQuarterlyPenalties(db);
      console.log(
        `[SCHEDULER] ${executionId} - Penalty processing result:`,
        result
      );
    }

    console.log(
      `[SCHEDULER] ${executionId} - Scheduled execution completed successfully`
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[SCHEDULER] ${executionId} - Scheduled execution failed: ${errorMsg}`
    );

    // Could implement error notifications here (email, Slack, etc.)
    // For now, just log the error
    console.error(`[SCHEDULER] ${executionId} - Error details:`, error);
  }
}

/**
 * Quarterly task execution function called by the main scheduled handler
 * Creates an HTTP request to the internal penalty processing endpoint
 *
 * @param env - Environment variables
 * @returns Promise that resolves when task is complete
 */
export async function executeQuarterlyTask(env: Env) {
  const taskId = `TASK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(
    `[QUARTERLY_TASK] Task ID: ${taskId} - Starting quarterly penalty calculation task`
  );

  try {
    // Determine the correct base URL based on environment
    const baseUrl =
      env.NODE_ENV === "development"
        ? "http://localhost:8787"
        : "https://tenant-management-system-worker.sayyedabood69.workers.dev";

    const internalUrl = `${baseUrl}/api/internal/process-quarterly-penalties`;

    console.log(
      `[QUARTERLY_TASK] ${taskId} - Making HTTP request to internal endpoint: ${internalUrl}`
    );
    console.log(
      `[QUARTERLY_TASK] ${taskId} - Environment: ${env.NODE_ENV || "production"}`
    );

    const response = await fetch(internalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Task-ID": taskId,
        "User-Agent": "Cloudflare-Worker-Scheduler/1.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Penalty processing HTTP request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = (await response.json()) as {
      processed: number;
      errors: string[];
      details: {
        summary: {
          totalPenaltyAmount: number;
        };
      };
    };

    console.log(
      `[QUARTERLY_TASK] ${taskId} - Quarterly penalty task completed successfully`
    );
    console.log(`[QUARTERLY_TASK] ${taskId} - Processing results:`, {
      processed: result.processed,
      errors: result.errors?.length || 0,
      totalPenaltyAmount: result.details?.summary?.totalPenaltyAmount || 0,
    });

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[QUARTERLY_TASK] ${taskId} - Quarterly penalty task failed: ${errorMsg}`
    );

    // Log additional context for debugging
    console.error(`[QUARTERLY_TASK] ${taskId} - Error context:`, {
      environment: env.NODE_ENV,
      timestamp: new Date(),
      error: error,
    });

    // Don't re-throw to prevent the scheduled event from being marked as failed
    // Instead, log the error and potentially send it to a monitoring service
  }
}
