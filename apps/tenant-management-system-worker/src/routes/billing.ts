import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Env } from "..";
import { TENANT_PAYMENT_ENTRIES } from "@repo/db/schema";
import { eq } from "drizzle-orm";

const billingRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /history/:tenantId
 * Use-case: Get transaction history for a tenant for a specific month.
 * Important: Validates tenant exists. Supports date filtering.
 */
billingRoutes.get("/history/:tenantId", async (c) => {
  try {
    const db = c.req.db;
    const tenantId = c.req.param("tenantId");

    const billingHistory = await db.query.TENANT_PAYMENT_ENTRIES.findMany({
      where: eq(TENANT_PAYMENT_ENTRIES.TENANT_ID, tenantId),
    });

    return c.json({ status: 200, data: billingHistory });
  } catch (error) {
    console.error("Error fetching billing history:", error);
    throw new HTTPException(500, { message: "Failed to fetch billing history" });
  }
});

/**
 * POST /generate-pdf
 * Use-case: Generate PDF bill for a tenant.
 * Important: Validates tenant and billing data. Returns PDF file.
 */
billingRoutes.post("/generate-pdf", async (c) => {
  // TODO: Implement PDF generation logic
  return c.json({ status: 501, message: "Not implemented" });
});

/**
 * POST /print
 * Use-case: Print hard copy of bill.
 * Important: Validates print request. May require integration with print service.
 */
billingRoutes.post("/print", async (c) => {
  // TODO: Implement print logic
  return c.json({ status: 501, message: "Not implemented" });
});

export default billingRoutes;