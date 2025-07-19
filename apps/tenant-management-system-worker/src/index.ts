// apps/tenant-management-system-worker/src/index.ts
// Main entry point for the Tenant Management System worker application
// This file sets up the Hono server, middleware, and routes
import { neon, Pool } from "@neondatabase/serverless";
import * as schema from "@repo/db/schema";
import { NeonHttpDatabase, drizzle } from "drizzle-orm/neon-http";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import authRoutes from "./routes/auth";
import propertyRoutes from "./routes/property";
import tenantRoutes from "./routes/tenant";
import billingRoutes from "./routes/billing";
import transactionRoutes from "./routes/transaction";
import reportRoutes from "./routes/report";
import whatsappRoutes from "./routes/whatsapp";
import settingsRoutes from "./routes/settings";

export interface Env {
  DATABASE_URL: string;
}

// Export a function to create a new pool for each request
// This is used for transactional operations that require WebSocket driver
export function createDbPool(connectionString: string) {
  return new Pool({
    connectionString,
  });
}

// Extend HonoRequest to include database instance
declare module "hono" {
  interface HonoRequest {
    db: NeonHttpDatabase<typeof schema>;
  }
}

// Create Hono app instance with typed environment
const app = new Hono<{ Bindings: Env }>();

// Error handling middleware
const errorHandler = createMiddleware(async (c, next) => {
  try {
    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }

    console.error("Unhandled error:", error);

    return c.json(
      {
        status: 500,
        message: "Internal Server Error",
        error: c.env.NODE_ENV === "development" ? error : undefined,
      },
      500
    );
  }
});

/**
 * injectDB Middleware
 *
 * Purpose:
 *   - Attaches a Drizzle ORM instance (using the Neon HTTP driver) to every request as `c.req.db`.
 *   - Provides fast, stateless, low-latency database access for simple queries (CRUD, reads, single-statement writes).
 *   - Automatically runs on all `/api/*` routes.
 *
 * Importance:
 *   - The HTTP driver is ideal for serverless/edge environments because it does not maintain persistent connections.
 *   - It is safe, efficient, and scalable for most API endpoints that do not require multi-step transactions.
 *   - Keeps the codebase simple for the majority of use cases.
 *
 * When to use:
 *   - For all endpoints that do NOT require interactive transactions or session-based operations.
 *   - Examples: fetching data, updating a single record, simple inserts, etc.
 *
 * When NOT to use:
 *   - For endpoints that require multi-step, atomic transactions (e.g., workspace creation, proposal acceptance, Instagram OAuth, etc.).
 *   - In those cases, use the WebSocket Pool driver (`createDbPool()`), create a pool per request, and manage transactions manually with `BEGIN`/`COMMIT`/`ROLLBACK`.
 *   - Do NOT use `c.req.db.transaction()` for transactions, as the HTTP driver does not support them.
 *
 * How it relates to pooling/transactions:
 *   - The pooling mechanism is only used in specific route handlers that require true transactions.
 *   - For all other routes, `injectDB` provides the default, efficient DB access layer.
 *
 * Summary:
 *   - Use `injectDB` (HTTP driver) for simple, stateless DB access (default for most routes).
 *   - Use the pooling mechanism (WebSocket driver) for transactional, multi-step, or session-based DB access (used manually in specific routes).
 */
export const injectDB = createMiddleware(async (c, next) => {
  try {
    console.log(`Connecting to database...${c.env.DATABASE_URL}`);

    const sql = neon(c.env.DATABASE_URL);

    c.req.db = drizzle({ client: sql, schema });

    await next();
  } catch (error) {
    console.error("Database connection error:", error);
    throw new HTTPException(503, { message: "Database connection failed" });
  }
});

// Enhanced CORS configuration with hardcoded origins

const configureCORS = () => {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://web.sayyedabood69.workers.dev",
  ];

  return cors({
    origin: (origin) => {
      // Allow if the origin is in the list of allowed origins
      if (allowedOrigins.includes(origin)) {
        return origin;
      }

      // Default to the first origin in the list if the origin is null or not specified
      if (!origin) {
        return allowedOrigins[0];
      }

      // Block requests if the origin does not match any of the allowed origins
      return null;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 600,
  });
};

// Apply CORS middleware
app.use("*", async (c, next) => {
  console.log(`[DEBUG] Applying CORS middleware for: ${c.req.url}`);
  const corsMiddleware = configureCORS();
  return corsMiddleware(c, next);
});

// Apply error handling middleware globally
app.use("/*", errorHandler);

// Apply database injection middleware globally
app.use("/api/*", injectDB);

// Routes

/**
 * Authentication Routes (/api/auth)
 *
 * Responsible for handling user authentication, including:
 * - User login and session creation
 * - User registration or creation (invite-only)
 * - User logout and session invalidation
 *
 * Key endpoints:
 * - POST /api/auth/login: Authenticate a user and create a session
 * - POST /api/auth/create-user: Create a new user (admin-only)
 * - POST /api/auth/logout: Invalidate a user's session
 */
app.route("/api/auth", authRoutes);

/**
 * Property Management Routes (/api/property)
 * - POST /api/property/add: Add a new property
 * - GET /api/property/list: List all properties
 * - PUT /api/property/edit/:id: Edit property details
 * - DELETE /api/property/delete/:id: Delete a property
 *
 * Use-case: Manage property records, including creation, editing, and deletion.
 * Important: Only admin can perform write operations. Deletion checks for linked tenants.
 */
app.route("/api/property", propertyRoutes);

/**
 * Tenant Management Routes (/api/tenant)
 * - POST /api/tenant/add: Assign a new tenant to a property
 * - GET /api/tenant/list: List all tenants
 * - PUT /api/tenant/edit/:id: Edit tenant details
 * - DELETE /api/tenant/delete/:id: Delete a tenant
 *
 * Use-case: Manage tenant records, including assignment, editing, and deletion.
 * Important: Only admin can perform write operations. Deletion checks for outstanding payments.
 */
app.route("/api/tenant", tenantRoutes);

/**
 * Billing Routes (/api/billing)
 * - GET /api/billing/history/:tenantId: Get transaction history for a tenant
 * - POST /api/billing/generate-pdf: Generate PDF bill for a tenant
 * - POST /api/billing/print: Print hard copy of bill
 *
 * Use-case: Manage billing, generate statements, and print or export bills.
 * Important: Validates tenant and billing data. PDF/print may require integration.
 */
app.route("/api/billing", billingRoutes);

/**
 * Transaction Routes (/api/transaction)
 * - POST /api/transaction/add: Add a new payment entry for a tenant
 * - GET /api/transaction/list: List all payment transactions
 * - GET /api/transaction/unpaid: List unpaid balances and penalties
 *
 * Use-case: Record and view payment transactions, highlight unpaid balances.
 * Important: Validates tenant/payment details. Unpaid view highlights overdue payments.
 */
app.route("/api/transaction", transactionRoutes);

/**
 * Report Routes (/api/report)
 * - GET /api/report/summary: Get summary of rent, taxes, bills for a date range
 * - GET /api/report/property-wise: Generate property-wise reports
 *
 * Use-case: Generate summary and property-wise reports for analytics and dashboard.
 * Important: Supports date range filtering. Used for embedded data tables.
 */
app.route("/api/report", reportRoutes);

/**
 * WhatsApp Communication Routes (/api/whatsapp)
 * - POST /api/whatsapp/broadcast: Send broadcast messages to tenants
 * - POST /api/whatsapp/reminder: Send payment reminders and rent warnings
 * - POST /api/whatsapp/receipt: Share rent receipts and bills after payment
 *
 * Use-case: Integrate WhatsApp for notifications, reminders, and receipts.
 * Important: Uses pre-defined templates. Fills in dynamic data for each tenant.
 */
app.route("/api/whatsapp", whatsappRoutes);

/**
 * Settings Routes (/api/settings)
 * - POST /api/settings/bulk-rent-update: Bulk update rent increment percentage
 * - POST /api/settings/update-penalty: Update default penalty percentage
 * - GET/POST /api/settings/profile: Get/update admin profile
 * - POST /api/settings/update-increment: Update rent increment percentage
 * - GET /api/settings/system: Get system settings
 *
 * Use-case: Manage system-wide and user-specific settings, including penalties, increments, and profile.
 */
app.route("/api/settings", settingsRoutes);

app.get("/", async (c) => {
  return c.json({ status: 200, message: "Healthy All System Working" });
});

export default app;
