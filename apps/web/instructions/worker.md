# Tenant Management Worker API Documentation

## Overview

The Tenant Management Worker is a Cloudflare Worker that serves as the backend API for the Linkp application. It's built using Hono.js and provides various endpoints for managing Property Management, Tenant Management, Billing, Transactions etc

## Database Connection Strategy

### Dual Driver Approach

The Linkp Worker uses a **dual driver approach** to optimize performance and functionality:

1. **HTTP Driver (Default)**: Used for most queries via `c.req.db`
   - Lower latency for single queries
   - Simpler setup and connection management
   - No session management needed
   - **Limitation**: No support for interactive transactions

2. **WebSocket Driver (Pool)**: Used specifically for transactional operations
   - Full transaction support with BEGIN/COMMIT/ROLLBACK
   - Session management capabilities
   - `node-postgres` compatibility
   - **Requirement**: Must be created and closed per request in serverless environments

### When to Use Each Driver

#### Use HTTP Driver (`c.req.db`) for:

- Simple CRUD operations
- Single queries
- Read operations
- Non-transactional writes
- Most API endpoints

#### Use WebSocket Driver (Pool) for:

- Multi-step transactions
- Operations requiring atomicity
- Complex business logic with multiple database operations
- Any operation where you need to rollback on failure

## Transaction Management with WebSocket Driver

### Pool Creation and Management

```typescript
import { createDbPool } from "@repo/db";

// Create pool for this request
const pool = createDbPool();
let client: any;

try {
  client = await pool.connect();
  await client.query("BEGIN");

  // Your transactional operations here

  await client.query("COMMIT");
} catch (error) {
  if (client) await client.query("ROLLBACK");
  throw error;
} finally {
  if (client) client.release();
  await pool.end();
}
```

### Key Requirements for Serverless Environments

1. **Create Pool Per Request**: Never reuse pools across requests
2. **Always Close Connections**: Release client and end pool in finally block
3. **Handle Rollbacks**: Rollback transaction on any error
4. **Manual UUID Generation**: Generate UUIDs manually for primary keys when using raw SQL

### Example: Workspace Creation with Transaction

```typescript
workspaceRoutes.post("/create", async (c) => {
  const handler = withSession(async (c, session) => {
    const pool = createDbPool();
    let client: any;

    try {
      const workspaceData = await c.req.json();

      client = await pool.connect();
      await client.query("BEGIN");

      // Step 1: Check/create creator profile
      let creatorId = workspaceData.creatorId;
      if (!creatorId) {
        const { rows: existingCreators } = await client.query(
          `SELECT * FROM creators WHERE user_id = $1 LIMIT 1`,
          [workspaceData.userId]
        );

        if (existingCreators.length === 0) {
          const { rows: newCreators } = await client.query(
            `INSERT INTO creators (id, user_id, bio, categories, social_proof, promotion_rate, monetization_enabled) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
              crypto.randomUUID(), // Manual UUID generation
              workspaceData.userId,
              null,
              workspaceData.categories || [],
              null,
              null,
              false,
            ]
          );
          creatorId = newCreators[0].id;
        } else {
          creatorId = existingCreators[0].id;
        }
      }

      // Step 2: Create workspace
      const { rows: newWorkspaces } = await client.query(
        `INSERT INTO workspaces (id, name, slug, user_id, creator_id, avatar_url, template_id, template_config, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
         ON CONFLICT DO NOTHING RETURNING *`,
        [
          crypto.randomUUID(), // Manual UUID generation
          workspaceData.name,
          workspaceData.slug,
          workspaceData.userId,
          creatorId,
          workspaceData.avatarUrl,
          workspaceData.templateId,
          workspaceData.templateConfig,
          workspaceData.isActive ?? true,
        ]
      );

      // Step 3: Update user onboarding status
      await client.query(
        `UPDATE "user" SET onboarding_completed = true, user_type = 'creator' WHERE id = $1`,
        [workspaceData.userId]
      );

      await client.query("COMMIT");

      return c.json({
        status: 200,
        data: {
          slug: newWorkspaces[0].slug,
          ...newWorkspaces[0],
        },
      });
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      throw new HTTPException(500, { message: "Failed to create workspace" });
    } finally {
      if (client) client.release();
      await pool.end();
    }
  });
  return handler(c);
});
```

### Important Considerations

#### UUID Generation

When using raw SQL with tables that have UUID primary keys:

```typescript
// ❌ Don't rely on database defaults
INSERT INTO creators (user_id, bio) VALUES ($1, $2)

// ✅ Manually generate UUIDs
INSERT INTO creators (id, user_id, bio) VALUES ($1, $2, $3)
// Where $1 = crypto.randomUUID()
```

#### Error Handling

Always implement proper error handling:

```typescript
try {
  // Transaction operations
} catch (error) {
  if (client) await client.query("ROLLBACK");
  // Log error and throw appropriate HTTPException
} finally {
  if (client) client.release();
  await pool.end();
}
```

#### Connection Management

- **Never reuse pools** across different requests
- **Always release clients** before ending the pool
- **Handle connection failures** gracefully

## Adding a New API Endpoint

### Step 1: Create Route File

1. Create a new file in `src/routes/` named after your feature (e.g., `analytics.ts`)
2. Basic route file structure:

   ```typescript
   import { Hono } from "hono";
   import { Env } from "../index";
   import { HTTPException } from "hono/http-exception";

   const featureRoutes = new Hono<{ Bindings: Env }>();

   // Add your routes here
   featureRoutes.get("/path", async (c) => {
     try {
       // Your logic here
       return c.json({ status: 200, data: {} });
     } catch (error) {
       console.error("Error:", error);
       throw new HTTPException(500, { message: "Error message" });
     }
   });

   export default featureRoutes;
   ```

### Step 2: Register Routes

1. Open `src/index.ts`
2. Import your route file:
   ```typescript
   import featureRoutes from "./routes/feature";
   ```
3. Register the routes with a base path:
   ```typescript
   app.route("/api/feature", featureRoutes);
   ```

### Step 3: Error Handling

- Always wrap your route handlers in try-catch blocks
- Use `HTTPException` for known error cases
- Log errors appropriately

### Step 4: Database Access

- Access the database through `c.req.db` for simple operations
- Use `createDbPool()` for transactional operations
- Use the schema from `@repo/db/schema`
- Follow the existing patterns for database queries

## Best Practices

1. **Type Safety**
   - Use TypeScript interfaces for request/response data
   - Import types from `@repo/db/types`

2. **Error Handling**
   - Provide meaningful error messages
   - Use appropriate HTTP status codes
   - Log errors with context
   - Always rollback transactions on error

3. **Performance**
   - Implement caching where appropriate
   - Use database indexes for frequent queries
   - Keep response payloads minimal
   - Choose the right driver for your use case

4. **Security**
   - Always validate input data
   - Use CORS appropriately
   - Implement rate limiting for public endpoints

5. **Testing**
   - Write unit tests for new endpoints
   - Test error cases
   - Validate response formats
   - Test transaction rollback scenarios

## Example: Adding an Analytics Endpoint

```typescript
// src/routes/analytics.ts
import { Hono } from "hono";
import { Env } from "../index";
import { HTTPException } from "hono/http-exception";
import { withSession } from "../auth/session";

const analyticsRoutes = new Hono<{ Bindings: Env }>();

analyticsRoutes.get("/workspace/:id/stats", withSession, async (c) => {
  try {
    const workspaceId = c.req.param("id");
    // Implementation here
    return c.json({ status: 200, data: {} });
  } catch (error) {
    console.error("Analytics error:", error);
    throw new HTTPException(500, { message: "Failed to fetch analytics" });
  }
});

export default analyticsRoutes;
```

## Deployment

- The worker is automatically deployed to Cloudflare
- Environment variables are managed through Cloudflare's dashboard
- Staging and production environments use different configurations
