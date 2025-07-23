// apps/tenant-management-system-worker/src/routes/transaction.ts

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Env, createDbPool } from "..";
import {
  TENANT_PAYMENT_ENTRIES,
  TENANTS,
  MONTHLY_RENT_TRACKING,
  Property,
} from "@repo/db/schema"; // Adjust imports as needed
import { eq, gte, lte, and, sql, like } from "drizzle-orm";
import { getReceiptData } from "../services/query";
import { generateBillPdf, IReceiptData } from "../services/billingService";

const transactionRoutes = new Hono<{ Bindings: Env }>();

transactionRoutes.get("/:id/receipt", async (c) => {
  const { id } = c.req.param();
  if (!id)
    throw new HTTPException(400, { message: "Transaction ID is required" });

  try {
    const receiptData = await getReceiptData(c.req.db, id);
    if (!receiptData)
      throw new HTTPException(404, { message: "Receipt data not found" });

    // Generate the PDF
    const pdfBytes = await generateBillPdf(receiptData as IReceiptData);

    // Set headers for file download
    c.header("Content-Type", "application/pdf");
    c.header(
      "Content-Disposition",
      `attachment; filename="bill-${receiptData.billNo}.pdf"`
    );
    return c.body(pdfBytes);
  } catch (error) {
    console.error("Failed to generate PDF receipt:", error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: "Failed to generate PDF receipt" });
  }
});

/**
 * POST /add
 * Use-case: Add a new payment entry for a tenant.
 * Important: Validates tenant and payment details. Updates outstanding amount.
 */
transactionRoutes.post("/add", async (c) => {
  try {
    const body = await c.req.json();

    // Validate required fields
    if (
      !body.TENANT_ID ||
      !body.RECEIVED_AMOUNT ||
      !body.PAYMENT_METHOD ||
      !body.PAYMENT_DATE
    ) {
      return c.json({ status: 400, message: "Missing required fields" });
    }

    // Validate payment method specific fields
    if (body.PAYMENT_METHOD === 2) {
      // Cheque
      if (!body.CHEQUE_NUMBER || !body.CHEQUE_DATE || !body.BANK_NAME) {
        return c.json({
          status: 400,
          message: "Cheque payment requires cheque number, date, and bank name",
        });
      }
    }

    if (body.PAYMENT_METHOD === 3) {
      // Online
      if (!body.TRANSACTION_ID) {
        return c.json({
          status: 400,
          message: "Online payment requires transaction ID",
        });
      }
    }

    // Validate allocation amounts
    const totalAllocated =
      (body.RENT_ALLOCATED || 0) +
      (body.PENALTY_ALLOCATED || 0) +
      (body.OUTSTANDING_ALLOCATED || 0);
    if (totalAllocated > body.RECEIVED_AMOUNT) {
      return c.json({
        status: 400,
        message: "Total allocated amount cannot exceed received amount",
      });
    }

    // Create pool for this request
    const pool = createDbPool(c.env.DATABASE_URL);
    let client: any;

    try {
      client = await pool.connect();
      await client.query("BEGIN");

      // Insert payment entry
      const paymentResult = await client.query(
        `
        INSERT INTO "TENANT_PAYMENT_ENTRIES" (
          "ID", "TENANT_ID", "RENT_MONTH", "RECEIVED_AMOUNT",
          "RENT_ALLOCATED", "OUTSTANDING_ALLOCATED", "PENALTY_ALLOCATED",
          "PAYMENT_METHOD", "PAYMENT_DATE", "CHEQUE_NUMBER", "CHEQUE_DATE",
          "BANK_NAME", "BANK_BRANCH", "TRANSACTION_ID", "PAYMENT_GATEWAY", "NOTES"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING "ID"
      `,
        [
          crypto.randomUUID(), // Manual UUID generation
          body.TENANT_ID,
          body.RENT_MONTH || null,
          body.RECEIVED_AMOUNT,
          body.RENT_ALLOCATED || 0,
          body.OUTSTANDING_ALLOCATED || 0,
          body.PENALTY_ALLOCATED || 0,
          body.PAYMENT_METHOD,
          body.PAYMENT_DATE,
          body.CHEQUE_NUMBER || null,
          body.CHEQUE_DATE || null,
          body.BANK_NAME || null,
          body.BANK_BRANCH || null,
          body.TRANSACTION_ID || null,
          body.PAYMENT_GATEWAY || null,
          body.NOTES || null,
        ]
      );

      const paymentId = paymentResult.rows[0]?.ID;

      // Update monthly rent tracking for rent allocation
      if (body.RENT_ALLOCATED && body.RENT_ALLOCATED > 0 && body.RENT_MONTH) {
        await client.query(
          `
          UPDATE "MONTHLY_RENT_TRACKING"
          SET 
            "RENT_COLLECTED" = "RENT_COLLECTED" + $1,
            "RENT_PENDING" = "RENT_PENDING" - $1,
            "UPDATED_ON" = NOW()
          WHERE "TENANT_ID" = $2 
            AND "RENT_MONTH" = $3
        `,
          [body.RENT_ALLOCATED, body.TENANT_ID, body.RENT_MONTH]
        );
      }

      // === REFACTORED: Handle both paid and waived penalties ===
      console.log("body.IS_PENALTY_WAIVED", body.IS_PENALTY_WAIVED);

      // Case 1: A portion of the penalty was actually paid.
      if (
        body.PENALTY_ALLOCATED &&
        body.PENALTY_ALLOCATED > 0 &&
        body.RENT_MONTH
      ) {
        await client.query(
          `
          UPDATE "MONTHLY_RENT_TRACKING"
          SET 
            "PENALTY_PAID" = "PENALTY_PAID" + $1,
            "PENALTY_PENDING" = "PENALTY_PENDING" - $1,
            "UPDATED_ON" = NOW()
          WHERE "TENANT_ID" = $2 AND "RENT_MONTH" = $3
        `,
          [body.PENALTY_ALLOCATED, body.TENANT_ID, body.RENT_MONTH]
        );
      }
      // Case 2: The penalty was waived (either by date or manually).
      else if (body.IS_PENALTY_WAIVED === true && body.RENT_MONTH) {
        await client.query(
          `
          UPDATE "MONTHLY_RENT_TRACKING"
          SET
          "PENALTY_PAID" = "PENALTY_PAID" + "PENALTY_PENDING",
          "PENALTY_PENDING" = 0,
          "UPDATED_ON" = NOW()
          WHERE "TENANT_ID" = $1 AND "RENT_MONTH" = $2
        `,
          [body.TENANT_ID, body.RENT_MONTH]
        );
      }

      // Update monthly rent tracking for outstanding allocation (affects current month)
      if (body.OUTSTANDING_ALLOCATED && body.OUTSTANDING_ALLOCATED > 0) {
        await client.query(
          `
          UPDATE "MONTHLY_RENT_TRACKING"
          SET 
            "OUTSTANDING_COLLECTED" = "OUTSTANDING_COLLECTED" + $1,
            "OUTSTANDING_PENDING" = "OUTSTANDING_PENDING" - $1,
            "OUTSTANDING_AMOUNT" = GREATEST("OUTSTANDING_AMOUNT" - $1, 0),
            "UPDATED_ON" = NOW()
          WHERE "TENANT_ID" = $2 
            AND "RENT_MONTH" = (
              SELECT "RENT_MONTH" 
              FROM "MONTHLY_RENT_TRACKING" 
              WHERE "TENANT_ID" = $2
              ORDER BY "RENT_MONTH" DESC 
              LIMIT 1
            )
        `,
          [body.OUTSTANDING_ALLOCATED, body.TENANT_ID]
        );
      }

      await client.query("COMMIT");

      return c.json({ status: 200, data: { paymentId } });
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      console.error("Error adding payment:", error);
      throw new HTTPException(500, { message: "Failed to add payment" });
    } finally {
      if (client) client.release();
      await pool.end();
    }
  } catch (error) {
    console.error("Error adding payment:", error);
    return c.json({ status: 500, message: "Failed to add payment" });
  }
});

/**
 * GET /list
 * Use-case: List all payment transactions with pagination and filtering.
 * Important: Joins with TENANTS and Property for names.
 */
transactionRoutes.get("/list", async (c) => {
  try {
    const db = c.req.db;
    const {
      page = "1",
      limit = "10",
      tenantId,
      dateFrom,
      dateTo,
      method,
      status,
      search,
    } = c.req.query();
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE conditions for raw SQL
    let whereClause = "";
    const conditions = [];

    if (tenantId) {
      conditions.push(`tpe."TENANT_ID" = '${tenantId}'`);
    }
    if (dateFrom) {
      conditions.push(`tpe."PAYMENT_DATE" >= '${dateFrom}'`);
    }
    if (dateTo) {
      conditions.push(`tpe."PAYMENT_DATE" <= '${dateTo}'`);
    }
    if (method) {
      conditions.push(`tpe."PAYMENT_METHOD" = ${parseInt(method)}`);
    }
    if (status) {
      conditions.push(`tpe."PAYMENT_METHOD" = ${parseInt(status)}`);
    }
    if (search) {
      conditions.push(`t."TENANT_NAME" ILIKE '%${search}%'`);
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(" AND ")}`;
    }

    // Use raw SQL with proper parameterization and include rent factors and pending amounts
    const transactions = await db.execute(sql`
      SELECT 
        tpe."ID",
        tpe."TENANT_ID",
        tpe."RENT_MONTH",
        tpe."RECEIVED_AMOUNT",
        tpe."RENT_ALLOCATED",
        tpe."OUTSTANDING_ALLOCATED",
        tpe."PENALTY_ALLOCATED",
        tpe."PAYMENT_METHOD",
        tpe."PAYMENT_DATE",
        tpe."CHEQUE_NUMBER",
        tpe."CHEQUE_DATE",
        tpe."BANK_NAME",
        tpe."BANK_BRANCH",
        tpe."TRANSACTION_ID",
        tpe."PAYMENT_GATEWAY",
        tpe."NOTES",
        tpe."CREATED_ON",
        tpe."UPDATED_ON",
        t."TENANT_NAME",
        p."PROPERTY_NAME",
        p."PROPERTY_ID",
        COALESCE(trf."BASIC_RENT", 0) as "BASIC_RENT",
        COALESCE(trf."PROPERTY_TAX", 0) as "PROPERTY_TAX",
        COALESCE(trf."REPAIR_CESS", 0) as "REPAIR_CESS",
        COALESCE(trf."MISC", 0) as "MISC",
        COALESCE(trf."BASIC_RENT", 0) + COALESCE(trf."PROPERTY_TAX", 0) + COALESCE(trf."REPAIR_CESS", 0) + COALESCE(trf."MISC", 0) as "TOTAL_RENT",
        COALESCE(mrt."RENT_PENDING", 0) as "RENT_PENDING",
        COALESCE(mrt."PENALTY_PENDING", 0) as "PENALTY_PENDING",
        COALESCE(mrt."OUTSTANDING_PENDING", 0) as "OUTSTANDING_PENDING"
      FROM "TENANT_PAYMENT_ENTRIES" tpe
      LEFT JOIN "TENANTS" t ON tpe."TENANT_ID" = t."TENANT_ID"
      LEFT JOIN "Property" p ON t."PROPERTY_ID" = p."PROPERTY_ID"
      LEFT JOIN "TENANTS_RENT_FACTORS" trf ON tpe."TENANT_ID" = trf."TENANT_ID"
      LEFT JOIN "MONTHLY_RENT_TRACKING" mrt ON tpe."TENANT_ID" = mrt."TENANT_ID" AND tpe."RENT_MONTH" = mrt."RENT_MONTH"
      ${sql.raw(whereClause)}
      ORDER BY tpe."CREATED_ON" DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `);

    const totalResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM "TENANT_PAYMENT_ENTRIES" tpe
      LEFT JOIN "TENANTS" t ON tpe."TENANT_ID" = t."TENANT_ID"
      ${sql.raw(whereClause)}
    `);

    const total = totalResult.rows[0]?.count || 0;

    return c.json({
      status: 200,
      transData: transactions.rows,
      total,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw new HTTPException(500, { message: "Failed to fetch transactions" });
  }
});

/**
 * GET /unpaid
 * Use-case: List unpaid balances with penalties and property details.
 * Important: Aggregates from MONTHLY_RENT_TRACKING.
 */
transactionRoutes.get("/unpaid", async (c) => {
  try {
    const db = c.req.db;

    // Use raw SQL with quoted names
    const unpaid = await db.execute(sql`
      SELECT 
        mrt."TENANT_ID",
        t."TENANT_NAME" as "tenantName",
        p."PROPERTY_NAME" as "propertyName",
        SUM(mrt."OUTSTANDING_PENDING") as "outstandingAmount",
        MAX(mrt."RENT_MONTH") as "dueDate",
        SUM(mrt."PENALTY_PENDING") as "penalty"
      FROM "MONTHLY_RENT_TRACKING" mrt
      LEFT JOIN "TENANTS" t ON mrt."TENANT_ID" = t."TENANT_ID"
      LEFT JOIN "Property" p ON t."PROPERTY_ID" = p."PROPERTY_ID"
      GROUP BY mrt."TENANT_ID", t."TENANT_NAME", p."PROPERTY_NAME"
      HAVING SUM(mrt."OUTSTANDING_PENDING") > 0
      ORDER BY SUM(mrt."OUTSTANDING_PENDING") DESC
    `);

    return c.json({ status: 200, unpaidData: unpaid.rows });
  } catch (error) {
    console.error("Error fetching unpaid balances:", error);
    throw new HTTPException(500, {
      message: "Failed to fetch unpaid balances",
    });
  }
});

/**
 * GET /summary
 * Use-case: Get aggregate stats for transactions.
 */
transactionRoutes.get("/summary", async (c) => {
  try {
    const db = c.req.db;

    // Use raw SQL with quoted names
    const summary = await db.execute(sql`
      SELECT 
        COALESCE(SUM(tpe."RECEIVED_AMOUNT"), 0) as "totalReceived",
        COALESCE(SUM(mrt."OUTSTANDING_PENDING"), 0) as "totalOutstanding"
      FROM "TENANT_PAYMENT_ENTRIES" tpe
      FULL OUTER JOIN "MONTHLY_RENT_TRACKING" mrt ON tpe."TENANT_ID" = mrt."TENANT_ID"
    `);

    const summaryData = summary.rows[0] || {
      totalReceived: 0,
      totalOutstanding: 0,
    };

    return c.json({ status: 200, summaryData });
  } catch (error) {
    console.error("Error fetching summary:", error);
    throw new HTTPException(500, { message: "Failed to fetch summary" });
  }
});

/**
 * DELETE /delete/:transactionId
 * Use-case: Delete a payment transaction and reverse its allocations.
 * Important: Validates transaction exists, reverses MONTHLY_RENT_TRACKING updates, soft deletes payment entry.
 */
transactionRoutes.delete("/delete/:transactionId", async (c) => {
  try {
    const transactionId = c.req.param("transactionId");

    if (!transactionId) {
      return c.json({ status: 400, message: "Transaction ID is required" });
    }

    // Create pool for this request
    const pool = createDbPool(c.env.DATABASE_URL);
    let client: any;

    try {
      client = await pool.connect();
      await client.query("BEGIN");

      // First, fetch the transaction details to validate it exists and get allocation amounts
      const transactionResult = await client.query(
        `
        SELECT 
          tpe."ID", tpe."TENANT_ID", tpe."RENT_MONTH", 
          tpe."RECEIVED_AMOUNT", tpe."RENT_ALLOCATED", 
          tpe."PENALTY_ALLOCATED", tpe."OUTSTANDING_ALLOCATED",
          tpe."PAYMENT_DATE", tpe."PAYMENT_METHOD",
          t."TENANT_NAME", p."PROPERTY_NAME"
        FROM "TENANT_PAYMENT_ENTRIES" tpe
        LEFT JOIN "TENANTS" t ON tpe."TENANT_ID" = t."TENANT_ID"
        LEFT JOIN "Property" p ON t."PROPERTY_ID" = p."PROPERTY_ID"
        WHERE tpe."ID" = $1
      `,
        [transactionId]
      );

      if (transactionResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return c.json({
          status: 404,
          message: "Transaction not found",
        });
      }

      const transaction = transactionResult.rows[0];

      // Reverse MONTHLY_RENT_TRACKING updates for rent allocation
      if (transaction.RENT_ALLOCATED > 0 && transaction.RENT_MONTH) {
        await client.query(
          `
          UPDATE "MONTHLY_RENT_TRACKING"
          SET 
            "RENT_COLLECTED" = "RENT_COLLECTED" - $1,
            "RENT_PENDING" = "RENT_PENDING" + $1,
            "UPDATED_ON" = NOW()
          WHERE "TENANT_ID" = $2 
            AND "RENT_MONTH" = $3
        `,
          [
            transaction.RENT_ALLOCATED,
            transaction.TENANT_ID,
            transaction.RENT_MONTH,
          ]
        );
      }

      // Reverse MONTHLY_RENT_TRACKING updates for penalty allocation
      if (transaction.PENALTY_ALLOCATED > 0 && transaction.RENT_MONTH) {
        await client.query(
          `
          UPDATE "MONTHLY_RENT_TRACKING"
          SET 
            "PENALTY_PAID" = "PENALTY_PAID" - $1,
            "PENALTY_PENDING" = "PENALTY_PENDING" + $1,
            "UPDATED_ON" = NOW()
          WHERE "TENANT_ID" = $2 
            AND "RENT_MONTH" = $3
        `,
          [
            transaction.PENALTY_ALLOCATED,
            transaction.TENANT_ID,
            transaction.RENT_MONTH,
          ]
        );
      }

      // Reverse MONTHLY_RENT_TRACKING updates for outstanding allocation
      if (transaction.OUTSTANDING_ALLOCATED > 0) {
        await client.query(
          `
          UPDATE "MONTHLY_RENT_TRACKING"
          SET 
            "OUTSTANDING_COLLECTED" = "OUTSTANDING_COLLECTED" - $1,
            "OUTSTANDING_PENDING" = "OUTSTANDING_PENDING" + $1,
            "OUTSTANDING_AMOUNT" = "OUTSTANDING_AMOUNT" + $1,
            "UPDATED_ON" = NOW()
          WHERE "TENANT_ID" = $2
            AND "RENT_MONTH" = (
              SELECT "RENT_MONTH" 
              FROM "MONTHLY_RENT_TRACKING" 
              WHERE "TENANT_ID" = $2
              ORDER BY "RENT_MONTH" DESC 
              LIMIT 1
            )
        `,
          [transaction.OUTSTANDING_ALLOCATED, transaction.TENANT_ID]
        );
      }

      // Hard delete the payment entry
      await client.query(
        `
        DELETE FROM "TENANT_PAYMENT_ENTRIES"
        WHERE "ID" = $1
      `,
        [transactionId]
      );

      await client.query("COMMIT");

      return c.json({
        status: 200,
        message: "Transaction deleted successfully",
        data: {
          transactionId,
          tenantName: transaction.TENANT_NAME,
          propertyName: transaction.PROPERTY_NAME,
          reversedAmounts: {
            rentReversed: transaction.RENT_ALLOCATED,
            penaltyReversed: transaction.PENALTY_ALLOCATED,
            outstandingReversed: transaction.OUTSTANDING_ALLOCATED,
          },
        },
      });
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      console.error("Error deleting transaction:", error);
      throw new HTTPException(500, { message: "Failed to delete transaction" });
    } finally {
      if (client) client.release();
      await pool.end();
    }
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return c.json({ status: 500, message: "Failed to delete transaction" });
  }
});

export default transactionRoutes;
