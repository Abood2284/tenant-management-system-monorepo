// apps/tenant-management-system-worker/src/routes/settings.ts
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { createDbPool, Env } from "..";
import {
  PENALTY_INTEREST_MASTER,
  TENANTS_RENT_FACTORS,
  Property,
  TENANTS,
  PENALTY_INTEREST_UPDATES,
  PENALTY_INTEREST_HISTORY,
  MONTHLY_RENT_TRACKING,
} from "@repo/db/schema";
import { eq, gt, desc } from "drizzle-orm";
import { parse } from "csv-parse/sync";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";

const importCsvValidator = z.object({
  type: z.enum(["properties", "tenants"]),
  file: z
    .instanceof(File)
    .refine((f) => f.type === "text/csv", "Only CSV files allowed")
    .refine((f) => f.size <= 1_000_000, "Max 1 MB"),
});

const settingsRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /tenant-factor-update
 * Use-case: Perform a bulk, transactional update of all tenant rent factors.
 * This operation is atomic: it either completes for all tenants or fails for all.
 * It creates an audit trail by archiving old factors and logging the batch update.
 */
settingsRoutes.post("/tenant-factor-update", async (c) => {
  const pool = createDbPool(c.env.DATABASE_URL);
  let client: any;

  try {
    const body = await c.req.json();

    // Zod schema for backend validation
    const updateSchema = z.object({
      basicRentPercentage: z.number().min(0),
      propertyTaxPercentage: z.number().min(0),
      repaircessPercentage: z.number().min(0),
      miscPercentage: z.number().min(0),
      effectiveFrom: z.string().transform((str) => new Date(str)),
    });

    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      throw new HTTPException(400, {
        message: "Invalid input.",
      });
    }
    const input = validation.data;

    client = await pool.connect();
    await client.query("BEGIN"); // Start transaction

    // 1. Log the batch update event and get its ID
    const batchLogRes = await client.query(
      `INSERT INTO "TenanatFactorUpdate" ("BasicRentPercentage", "PropertyTaxPercentage", "RepaircessPercentage", "MiscPercentage", "CreatedOn")
       VALUES ($1, $2, $3, $4, NOW()) RETURNING "Id"`,
      [
        input.basicRentPercentage,
        input.propertyTaxPercentage,
        input.repaircessPercentage,
        input.miscPercentage,
      ]
    );
    const batchId = batchLogRes.rows[0].Id;

    // 2. Fetch all current tenant rent factors
    const { rows: currentFactors } = await client.query(
      `SELECT * FROM "TENANTS_RENT_FACTORS" WHERE "TENANT_ID" IS NOT NULL`
    );

    if (currentFactors.length === 0) {
      throw new Error("No tenant rent factors found to update.");
    }

    // 3. Process each tenant factor
    for (const factor of currentFactors) {
      // 3a. Archive the current record into history
      const effectiveTill = new Date(input.effectiveFrom);
      effectiveTill.setDate(effectiveTill.getDate() - 1);

      await client.query(
        `INSERT INTO "TENANTS_RENT_FACTORS_HISTORY" 
         ("ID", "TENANT_ID", "BASIC_RENT", "PROPERTY_TAX", "REPAIR_CESS", "MISC", "EffectiveTill", "BatchID", "CREATED_ON", "UPDATED_ON")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          factor.ID,
          factor.TENANT_ID,
          factor.BASIC_RENT || 0,
          factor.PROPERTY_TAX || 0,
          factor.REPAIR_CESS || 0,
          factor.MISC || 0,
          effectiveTill.toISOString().split("T")[0],
          batchId,
        ]
      );

      // 3b. Calculate new rent values
      const newBasicRent = Math.round(
        (factor.BASIC_RENT || 0) * (1 + input.basicRentPercentage / 100)
      );
      const newPropertyTax = Math.round(
        (factor.PROPERTY_TAX || 0) * (1 + input.propertyTaxPercentage / 100)
      );
      const newRepairCess = Math.round(
        (factor.REPAIR_CESS || 0) * (1 + input.repaircessPercentage / 100)
      );
      const newMisc = Math.round(
        (factor.MISC || 0) * (1 + input.miscPercentage / 100)
      );

      // 3c. Update the live record
      await client.query(
        `UPDATE "TENANTS_RENT_FACTORS" SET
         "BASIC_RENT" = $1, "PROPERTY_TAX" = $2, "REPAIR_CESS" = $3, "MISC" = $4,
         "EffectiveFrom" = $5, "UPDATED_ON" = NOW(), "IsFactorsUpdated" = TRUE
         WHERE "ID" = $6`,
        [
          newBasicRent,
          newPropertyTax,
          newRepairCess,
          newMisc,
          input.effectiveFrom.toISOString().split("T")[0],
          factor.ID,
        ]
      );
    }

    await client.query("COMMIT"); // Commit transaction

    return c.json({
      status: 200,
      message: `Successfully updated rent factors for ${currentFactors.length} tenants.`,
    });
  } catch (error: any) {
    if (client) await client.query("ROLLBACK"); // Rollback on error
    console.error("Failed to update rent factors:", error);
    throw new HTTPException(500, {
      message: error.message || "An internal error occurred during the update.",
    });
  } finally {
    if (client) client.release(); // Always release client
    await pool.end(); // Always end the pool
  }
});

/**
 * POST /bulk-rent-update
 * Use-case: Bulk update rent increment percentage for all tenants/properties.
 * Important: Only admin can perform. Validates input and applies increment.
 */
settingsRoutes.post("/bulk-rent-update", async (c) => {
  try {
    const db = c.req.db;
    const { incrementPercentage } = await c.req.json();

    if (typeof incrementPercentage !== "number") {
      throw new HTTPException(400, { message: "Invalid increment percentage" });
    }

    // Fetch all tenant rent factors
    const allTenantRentFactors = await db.query.TENANTS_RENT_FACTORS.findMany();

    // Update each tenant's basic rent
    for (const tenantFactor of allTenantRentFactors) {
      const newBasicRent = tenantFactor.BASIC_RENT
        ? tenantFactor.BASIC_RENT * (1 + incrementPercentage / 100)
        : 0;

      await db
        .update(TENANTS_RENT_FACTORS)
        .set({
          BASIC_RENT: Math.round(newBasicRent),
          UPDATED_ON: new Date(),
        })
        .where(eq(TENANTS_RENT_FACTORS.ID, tenantFactor.ID));
    }

    return c.json({
      status: 200,
      message: "Bulk rent update completed successfully",
    });
  } catch (error) {
    console.error("Error during bulk rent update:", error);
    throw new HTTPException(500, {
      message: "Failed to perform bulk rent update",
    });
  }
});

/**
 * POST /update-penalty
 * Use-case: Update default penalty percentage with effective date and history tracking.
 * Important: Only admin can update. Validates input and moves old rate to history.
 */
settingsRoutes.post("/update-penalty", async (c) => {
  try {
    const db = c.req.db;
    const { newRate, effectiveFrom } = await c.req.json();

    if (typeof newRate !== "number" || newRate < 0 || newRate > 100) {
      throw new HTTPException(400, {
        message: "Invalid penalty rate (must be 0-100)",
      });
    }

    if (!effectiveFrom) {
      throw new HTTPException(400, { message: "Effective date is required" });
    }

    // Validate effective date is in the future
    const effectiveDate = new Date(effectiveFrom);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (effectiveDate < tomorrow) {
      throw new HTTPException(400, {
        message: "Effective date must be tomorrow or later",
      });
    }

    // Get current penalty setting
    const currentSetting = await db.query.PENALTY_INTEREST_MASTER.findFirst();

    if (currentSetting) {
      // Move current setting to history
      await db.insert(PENALTY_INTEREST_HISTORY).values({
        ORIGINAL_ID: currentSetting.ID,
        INTEREST_RATE: currentSetting.INTEREST_RATE,
        EFFECTIVE_FROM: currentSetting.EFFECTIVE_FROM
          ? new Date(currentSetting.EFFECTIVE_FROM)
          : null,
        CREATED_ON: currentSetting.CREATED_ON
          ? new Date(currentSetting.CREATED_ON)
          : null,
        UPDATED_ON: new Date(),
      });

      // Update current setting
      await db
        .update(PENALTY_INTEREST_MASTER)
        .set({
          INTEREST_RATE: newRate,
          EFFECTIVE_FROM: effectiveFrom,
          UPDATED_ON: new Date(),
        })
        .where(eq(PENALTY_INTEREST_MASTER.ID, currentSetting.ID));
    } else {
      // Create new setting if none exists
      await db.insert(PENALTY_INTEREST_MASTER).values({
        INTEREST_RATE: newRate,
        EFFECTIVE_FROM: effectiveFrom,
        CREATED_ON: new Date(),
        UPDATED_ON: new Date(),
      });
    }

    // Log the update
    await db.insert(PENALTY_INTEREST_UPDATES).values({
      INTEREST_RATE: newRate,
      CREATED_ON: new Date(),
    });

    return c.json({
      success: true,
      message: "Penalty rate updated successfully",
    });
  } catch (error) {
    console.error("Error updating penalty rate:", error);
    throw new HTTPException(500, {
      message: "Failed to update penalty rate",
    });
  }
});

/**
 * POST /update-increment
 * Use-case: Update rent increment percentage (system-wide or per user).
 */
settingsRoutes.post("/update-increment", async (c) => {
  try {
    const db = c.req.db;
    const { tenantId, incrementPercentage } = await c.req.json();

    if (typeof incrementPercentage !== "number" || !tenantId) {
      throw new HTTPException(400, {
        message: "Invalid input for increment update",
      });
    }

    const tenantRentFactors = await db.query.TENANTS_RENT_FACTORS.findFirst({
      where: eq(TENANTS_RENT_FACTORS.TENANT_ID, tenantId),
    });

    if (!tenantRentFactors) {
      throw new HTTPException(404, {
        message: "Tenant rent factors not found",
      });
    }

    const newBasicRent = tenantRentFactors.BASIC_RENT
      ? tenantRentFactors.BASIC_RENT * (1 + incrementPercentage / 100)
      : 0;

    await db
      .update(TENANTS_RENT_FACTORS)
      .set({
        BASIC_RENT: Math.round(newBasicRent),
        UPDATED_ON: new Date(),
        // You might want to update other rent factors similarly or based on specific logic
      })
      .where(eq(TENANTS_RENT_FACTORS.TENANT_ID, tenantId));

    return c.json({
      status: 200,
      message: "Rent increment updated successfully",
    });
  } catch (error) {
    console.error("Error updating rent increment:", error);
    throw new HTTPException(500, {
      message: "Failed to update rent increment",
    });
  }
});

/**
 * GET /system
 * Use-case: Get system settings (penalty, increment, notification prefs, etc.)
 */
settingsRoutes.get("/system", async (c) => {
  try {
    const db = c.req.db;
    const penaltySetting = await db.query.PENALTY_INTEREST_MASTER.findFirst();

    const systemSettings = {
      defaultPenaltyPercent: penaltySetting?.INTEREST_RATE || 0,
      // Add other system settings as needed
    };

    return c.json({ status: 200, data: systemSettings });
  } catch (error) {
    console.error("Error fetching system settings:", error);
    throw new HTTPException(500, {
      message: "Failed to fetch system settings",
    });
  }
});

/**
 * GET /penalty-current
 * Use-case: Get current penalty rate with full details
 */
settingsRoutes.get("/penalty-current", async (c) => {
  try {
    const db = c.req.db;
    const penaltySetting = await db.query.PENALTY_INTEREST_MASTER.findFirst();

    return c.json({ status: 200, data: penaltySetting });
  } catch (error) {
    console.error("Error fetching current penalty rate:", error);
    throw new HTTPException(500, {
      message: "Failed to fetch current penalty rate",
    });
  }
});

/**
 * GET /penalty-history
 * Use-case: Get penalty rate history
 */
settingsRoutes.get("/penalty-history", async (c) => {
  try {
    const db = c.req.db;
    const history = await db.query.PENALTY_INTEREST_HISTORY.findMany({
      orderBy: (PENALTY_INTEREST_HISTORY, { desc }) => [
        desc(PENALTY_INTEREST_HISTORY.CREATED_ON),
      ],
    });

    return c.json({ status: 200, data: history });
  } catch (error) {
    console.error("Error fetching penalty history:", error);
    throw new HTTPException(500, {
      message: "Failed to fetch penalty history",
    });
  }
});

/**
 * GET /penalty-impact
 * Use-case: Get impact preview of penalty rate change on tenants
 */
settingsRoutes.get("/penalty-impact", async (c) => {
  try {
    const db = c.req.db;
    const newRate = parseFloat(c.req.query("newRate") || "0");

    if (isNaN(newRate) || newRate < 0 || newRate > 100) {
      throw new HTTPException(400, { message: "Invalid penalty rate" });
    }

    // Get current penalty rate
    const currentSetting = await db.query.PENALTY_INTEREST_MASTER.findFirst();
    const currentRate = currentSetting?.INTEREST_RATE || 0;

    // Get tenants with outstanding amounts (greater than 0)
    const tenantsWithOutstanding = await db
      .select({
        tenantId: TENANTS.TENANT_ID,
        tenantName: TENANTS.TENANT_NAME,
        propertyName: Property.PROPERTY_NAME,
        outstandingAmount: MONTHLY_RENT_TRACKING.OUTSTANDING_AMOUNT,
        RENT_MONTH: MONTHLY_RENT_TRACKING.RENT_MONTH, // Add RENT_MONTH to select
      })
      .from(TENANTS)
      .leftJoin(Property, eq(TENANTS.PROPERTY_ID, Property.PROPERTY_ID))
      .leftJoin(
        MONTHLY_RENT_TRACKING,
        eq(TENANTS.TENANT_ID, MONTHLY_RENT_TRACKING.TENANT_ID)
      )
      .where(gt(MONTHLY_RENT_TRACKING.OUTSTANDING_AMOUNT, 0));

    const impactPreview = tenantsWithOutstanding.map((tenant) => {
      // For each tenant, find all months with outstanding rent
      // For now, assume only one outstanding per tenant (as in current query)
      // In a real system, you would join to get all months per tenant
      const months = [
        {
          month: tenant.RENT_MONTH || null, // Add RENT_MONTH to select if not present
          outstandingAmount: tenant.outstandingAmount || 0,
          oldPenalty: ((tenant.outstandingAmount || 0) * currentRate) / 100,
          newPenalty: ((tenant.outstandingAmount || 0) * newRate) / 100,
          difference:
            ((tenant.outstandingAmount || 0) * newRate) / 100 -
            ((tenant.outstandingAmount || 0) * currentRate) / 100,
        },
      ];
      const totalOutstanding = months.reduce(
        (sum, m) => sum + m.outstandingAmount,
        0
      );
      const totalOldPenalty = months.reduce((sum, m) => sum + m.oldPenalty, 0);
      const totalNewPenalty = months.reduce((sum, m) => sum + m.newPenalty, 0);
      const totalDifference = months.reduce((sum, m) => sum + m.difference, 0);
      return {
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName || "Unknown",
        propertyName: tenant.propertyName || "Unknown",
        months,
        totalOutstanding,
        totalOldPenalty,
        totalNewPenalty,
        totalDifference,
      };
    });

    return c.json({ status: 200, data: impactPreview });
  } catch (error) {
    console.error("Error fetching penalty impact:", error);
    throw new HTTPException(500, {
      message: "Failed to fetch penalty impact",
    });
  }
});

settingsRoutes.get("/penalty-impact-example", async (c) => {
  try {
    const db = c.req.db;
    const newRate = parseFloat(c.req.query("newRate") || "0");
    if (isNaN(newRate) || newRate < 0 || newRate > 100) {
      throw new HTTPException(400, { message: "Invalid penalty rate" });
    }
    // Get current penalty rate
    const currentSetting = await db.query.PENALTY_INTEREST_MASTER.findFirst();
    const currentRate = currentSetting?.INTEREST_RATE || 0;
    // Find a random tenant with at least one unpaid month
    const tenantsWithUnpaid = await db
      .select({
        tenantId: TENANTS.TENANT_ID,
        tenantName: TENANTS.TENANT_NAME,
        propertyName: Property.PROPERTY_NAME,
      })
      .from(TENANTS)
      .leftJoin(Property, eq(TENANTS.PROPERTY_ID, Property.PROPERTY_ID));
    // Shuffle and pick one
    const shuffled = tenantsWithUnpaid.sort(() => 0.5 - Math.random());
    let exampleTenant = null;
    let months: any[] = [];
    for (const t of shuffled) {
      // Get last 6 months' rent tracking for this tenant
      const rentTracking: Array<{
        month: string;
        outstanding: number;
        paid: number;
      }> = (
        await db
          .select({
            month: MONTHLY_RENT_TRACKING.RENT_MONTH,
            outstanding: MONTHLY_RENT_TRACKING.OUTSTANDING_AMOUNT,
            paid: MONTHLY_RENT_TRACKING.RENT_PENDING,
          })
          .from(MONTHLY_RENT_TRACKING)
          .where(eq(MONTHLY_RENT_TRACKING.TENANT_ID, t.tenantId))
          .orderBy(desc(MONTHLY_RENT_TRACKING.RENT_MONTH))
          .limit(6)
      ).map((m) => ({
        month:
          typeof m.month === "string"
            ? m.month
            : (m.month?.toISOString?.() ?? ""),
        outstanding: m.outstanding,
        paid: m.paid,
      }));
      if (rentTracking.some((m) => m.outstanding > 0)) {
        exampleTenant = t;
        // For each month, determine if penalty applies (unpaid at start of next quarter)
        months = rentTracking.map((m) => {
          const monthDate = m.month ? new Date(m.month) : null;
          const now = new Date();
          // Find the start of the next quarter after this month
          let penaltyApplies = false;
          if (monthDate) {
            const q = Math.floor(monthDate.getMonth() / 3) + 1;
            const nextQStart = new Date(monthDate.getFullYear(), q * 3, 1);
            penaltyApplies = m.outstanding > 0 && now >= nextQStart;
          }
          const oldPenalty = penaltyApplies
            ? (m.outstanding * currentRate) / 100
            : 0;
          const newPenalty = penaltyApplies
            ? (m.outstanding * newRate) / 100
            : 0;
          return {
            month: m.month,
            outstanding: m.outstanding,
            paid: m.paid,
            penaltyApplies,
            oldPenalty,
            newPenalty,
            difference: newPenalty - oldPenalty,
          };
        });
        break;
      }
    }
    if (!exampleTenant) {
      return c.json({ status: 200, data: null });
    }
    return c.json({
      status: 200,
      data: {
        tenantId: exampleTenant.tenantId,
        tenantName: exampleTenant.tenantName,
        propertyName: exampleTenant.propertyName,
        months,
        currentRate,
        newRate,
      },
    });
  } catch (error) {
    console.error("Error fetching penalty impact example:", error);
    throw new HTTPException(500, {
      message: "Failed to fetch penalty impact example",
    });
  }
});

settingsRoutes.post("/import-csv", async (c) => {
  try {
    const formData = await c.req.formData();
    const type = formData.get("type");
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return c.json(
        { ok: false, errors: ["File is required and must be a CSV file."] },
        400
      );
    }
    const parseResult = importCsvValidator.safeParse({ type, file });
    if (!parseResult.success) {
      return c.json(
        { ok: false, errors: parseResult.error.errors.map((e) => e.message) },
        400
      );
    }
    const { DATABASE_URL } = c.env;
    const sql = neon(DATABASE_URL);
    const db = drizzle(sql);
    const csvText = await file.text();
    const rows = parse(csvText, { columns: true, skip_empty_lines: true });
    if (type === "properties") {
      return c.json(await importProperties(db, rows));
    }
    if (type === "tenants") {
      return c.json(await importTenants(db, rows));
    }
    return c.json({ ok: false, errors: ["Invalid import type"] }, 400);
  } catch (error: any) {
    return c.json(
      { ok: false, errors: [error.message || "Unknown error"] },
      500
    );
  }
});

async function importProperties(db: any, rows: any[]) {
  const inserted: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];
  for (const r of rows) {
    try {
      const exists = await db
        .select()
        .from(Property)
        .where(eq(Property.PROPERTY_NAME, r.PROPERTY_NAME));
      if (exists.length) {
        skipped.push(r.PROPERTY_NAME);
        continue;
      }
      await db.insert(Property).values({
        LANDLORD_NAME: r.LANDLORD_NAME,
        PROPERTY_NAME: r.PROPERTY_NAME,
        PROPERTY_BILL_NAME: r.PROPERTY_BILL_NAME,
        WARD: r.WARD,
        NUMBER_OF_BLOCKS: Number(r.NUMBER_OF_BLOCKS),
        ADDRESS: r.ADDRESS,
        PHONE_NUMBER: r.PHONE_NUMBER,
        FAX_NUMBER: r.FAX_NUMBER,
      });
      inserted.push(r.PROPERTY_NAME);
    } catch (e: any) {
      errors.push(`Property ${r.PROPERTY_NAME}: ${e.message}`);
    }
  }
  return {
    ok: errors.length === 0,
    imported: inserted.length,
    skipped: skipped.length,
    errors,
  };
}

async function importTenants(db: any, rows: any[]) {
  const inserted: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];
  for (const r of rows) {
    try {
      const [prop] = await db
        .select()
        .from(Property)
        .where(eq(Property.PROPERTY_NAME, r.PROPERTY_NAME));
      if (!prop) {
        errors.push(`Unknown property: ${r.PROPERTY_NAME}`);
        continue;
      }
      const [tenant] = await db
        .insert(TENANTS)
        .values({
          PROPERTY_ID: prop.PROPERTY_ID,
          TENANT_NAME: r.TENANT_NAME,
          SALUTATION: r.SALUTATION,
          BUILDING_FOOR: r.BUILDING_FOOR,
          PROPERTY_TYPE: r.PROPERTY_TYPE,
          PROPERTY_NUMBER: r.PROPERTY_NUMBER,
          TENANT_MOBILE_NUMBER: r.TENANT_MOBILE_NUMBER,
          NOTES: "",
          TENANCY_DATE: r.TENANCY_DATE,
          IS_ACTIVE: true,
          SendSMS: false,
        })
        .returning({ TENANT_ID: TENANTS.TENANT_ID });
      await db.insert(TENANTS_RENT_FACTORS).values({
        TENANT_ID: tenant.TENANT_ID,
        BASIC_RENT: Number(r.BASIC_RENT),
        PROPERTY_TAX: Number(r.PROPERTY_TAX),
        REPAIR_CESS: Number(r.REPAIR_CESS),
        MISC: Number(r.MISC),
        CHEQUE_RETURN_CHARGE: 0,
      });
      inserted.push(r.TENANT_NAME);
    } catch (e: any) {
      errors.push(`Tenant ${r.TENANT_NAME}: ${e.message}`);
    }
  }
  return {
    ok: errors.length === 0,
    imported: inserted.length,
    skipped: skipped.length,
    errors,
  };
}

export default settingsRoutes;
