import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Env } from "..";
import {
  PENALTY_INTEREST_MASTER,
  TENANTS_RENT_FACTORS,
  Property,
  TENANTS,
  PENALTY_INTEREST_UPDATES,
  PenaltyInterestHistoryRelations,
} from "@repo/db/schema";
import { eq } from "drizzle-orm";
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
 * Use-case: Update default penalty percentage (system-wide or per property).
 * Important: Only admin can update. Validates input.
 */
settingsRoutes.post("/update-penalty", async (c) => {
  try {
    const db = c.req.db;
    const { penaltyPercentage } = await c.req.json();

    if (typeof penaltyPercentage !== "number") {
      throw new HTTPException(400, { message: "Invalid penalty percentage" });
    }

    // Assuming there's only one penalty setting or a way to identify it
    const existingSetting = await db.query.PENALTY_INTEREST_MASTER.findFirst();

    if (existingSetting) {
      await db
        .update(PENALTY_INTEREST_MASTER)
        .set({
          INTEREST_RATE: penaltyPercentage,
          UPDATED_ON: new Date(),
        })
        .where(eq(PENALTY_INTEREST_MASTER.ID, existingSetting.ID));
    } else {
      // If no existing setting, create a new one
      await db.insert(PENALTY_INTEREST_MASTER).values([
        {
          INTEREST_RATE: penaltyPercentage,
          EFFECTIVE_FROM: new Date().toISOString().slice(0, 10),
          CREATED_ON: new Date(),
          UPDATED_ON: new Date(),
        },
      ]);
    }

    return c.json({
      status: 200,
      message: "Penalty percentage updated successfully",
    });
  } catch (error) {
    console.error("Error updating penalty percentage:", error);
    throw new HTTPException(500, {
      message: "Failed to update penalty percentage",
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
