import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Env } from "..";

const whatsappRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /broadcast
 * Use-case: Send broadcast messages to tenants via WhatsApp.
 * Important: Uses pre-defined templates. Fills in dynamic data.
 */
whatsappRoutes.post("/broadcast", async (c) => {
  // TODO: Implement broadcast logic
  return c.json({ status: 501, message: "Not implemented" });
});

/**
 * POST /reminder
 * Use-case: Send payment reminders and rent warnings to tenants.
 * Important: Uses WhatsApp integration. Fills in due amounts and dates.
 */
whatsappRoutes.post("/reminder", async (c) => {
  // TODO: Implement reminder logic
  return c.json({ status: 501, message: "Not implemented" });
});

/**
 * POST /receipt
 * Use-case: Share rent receipts and bills with tenants after payment.
 * Important: Sends WhatsApp message immediately after payment is recorded.
 */
whatsappRoutes.post("/receipt", async (c) => {
  // TODO: Implement receipt sharing logic
  return c.json({ status: 501, message: "Not implemented" });
});

export default whatsappRoutes;
