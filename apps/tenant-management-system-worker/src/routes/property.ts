import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Env } from "..";
import { Property } from "@repo/db/schema";

const propertyRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /add
 * Use-case: Add a new property with landlord info, address, billing cycle, etc.
 * Important: Only admin can add properties. Validates required fields.
 */
propertyRoutes.post("/add", async (c) => {
  // TODO: Implement property creation logic
  return c.json({ status: 501, message: "Not implemented" });
});

/**
 * GET /list
 * Use-case: List all properties.
 * Important: Supports filtering, pagination in future.
 */
propertyRoutes.get("/list", async (c) => {
  try {
    const db = c.req.db;
    const properties = await db.query.Property.findMany();
    return c.json({ status: 200, data: properties });
  } catch (error) {
    console.error("Error fetching properties:", error);
    throw new HTTPException(500, { message: "Failed to fetch properties" });
  }
});

/**
 * PUT /edit/:id
 * Use-case: Edit property details.
 * Important: Only editable by admin. Validates property exists.
 */
propertyRoutes.put("/edit/:id", async (c) => {
  // TODO: Implement property editing logic
  return c.json({ status: 501, message: "Not implemented" });
});

/**
 * DELETE /delete/:id
 * Use-case: Delete a property.
 * Important: Only admin can delete. Checks for linked tenants before deletion.
 */
propertyRoutes.delete("/delete/:id", async (c) => {
  // TODO: Implement property deletion logic
  return c.json({ status: 501, message: "Not implemented" });
});

export default propertyRoutes;