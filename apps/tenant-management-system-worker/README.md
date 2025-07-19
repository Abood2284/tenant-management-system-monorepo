# Tenant Management System Worker

## Overview

The Tenant Management System Worker is a **Cloudflare Worker** that serves as the **backend API** for the Tenant Management System (TMS). It's built using **Hono.js** and provides a complete REST API for managing tenants, properties, payments, billing, and reporting.

## What is a Worker?

### Definition

A **Cloudflare Worker** is a serverless function that runs on Cloudflare's edge network. It's a lightweight, fast, and globally distributed compute platform that executes code close to users worldwide.

### Why We Use Workers

- **Global Performance**: Runs on 200+ edge locations worldwide
- **Zero Cold Starts**: Instant execution without initialization delays
- **Cost Effective**: Pay only for actual compute time
- **Scalable**: Automatically scales with traffic
- **Secure**: Built-in DDoS protection and security features
- **Developer Friendly**: Simple deployment and monitoring

## Why Was This Worker Created?

### Business Requirements

1. **Centralized API**: All frontend applications need a single, reliable API endpoint
2. **Database Access**: Secure, controlled access to the PostgreSQL database
3. **Business Logic**: Complex payment processing, allocation, and validation rules
4. **Real-time Operations**: Fast response times for payment processing
5. **Multi-tenant Support**: Handle multiple properties and tenants efficiently

### Technical Requirements

1. **Serverless Architecture**: No server management, automatic scaling
2. **Database Transactions**: Critical for payment processing integrity
3. **Type Safety**: Full TypeScript support for reliability
4. **Error Handling**: Robust error handling for financial operations
5. **Performance**: Sub-100ms response times for API calls

## What Does the Worker Do?

### Core Functionality

#### 1. **Tenant Management**

- **CRUD Operations**: Create, read, update, delete tenant records
- **Property Assignment**: Link tenants to specific properties
- **Search & Filter**: Advanced tenant search with multiple criteria
- **Validation**: Ensure data integrity and business rules

#### 2. **Payment Processing**

- **Payment Entry**: Record tenant payments with detailed allocation
- **Transaction Management**: Atomic operations for payment integrity
- **Allocation Logic**: Distribute payments across rent, penalty, and outstanding
- **Validation Rules**: Enforce business rules (no partial rent payments, etc.)

#### 3. **Property Management**

- **Property CRUD**: Manage property records and details
- **Landlord Information**: Track property ownership and contact details
- **Address Management**: Store and validate property addresses
- **Block Management**: Handle multi-block properties

#### 4. **Billing & Reporting**

- **Transaction History**: Complete payment history for tenants
- **Outstanding Balances**: Track unpaid amounts and penalties
- **Financial Reports**: Generate summaries and analytics
- **PDF Generation**: Create printable bills and statements

#### 5. **WhatsApp Integration**

- **Automated Notifications**: Send payment reminders and updates
- **Message Templates**: Standardized communication templates
- **Delivery Tracking**: Monitor message delivery status

#### 6. **Settings & Configuration**

- **System Settings**: Manage application configuration
- **Import/Export**: CSV data import and export functionality
- **User Preferences**: Store user-specific settings

### API Endpoints

```
/api/auth/*          - Authentication and session management
/api/tenant/*        - Tenant CRUD operations
/api/property/*      - Property management
/api/transaction/*   - Payment processing and history
/api/billing/*       - Billing and statement generation
/api/report/*        - Financial reporting and analytics
/api/whatsapp/*      - WhatsApp integration
/api/settings/*      - System configuration
```

## What Makes It Best?

### 1. **Dual Driver Architecture**

- **HTTP Driver**: Fast, stateless operations for simple queries
- **WebSocket Driver**: Full transaction support for critical operations
- **Optimal Performance**: Choose the right driver for each use case

### 2. **Type Safety**

- **Full TypeScript**: End-to-end type safety
- **Schema Validation**: Database schema enforced at compile time
- **API Contracts**: Strongly typed request/response interfaces

### 3. **Error Handling**

- **Comprehensive**: All errors caught and handled appropriately
- **User-Friendly**: Clear error messages for frontend display
- **Logging**: Detailed error logging for debugging
- **Graceful Degradation**: System continues working even with partial failures

### 4. **Security**

- **CORS Protection**: Proper cross-origin request handling
- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries throughout
- **Authentication**: Session-based authentication system

### 5. **Performance**

- **Edge Computing**: Global distribution for low latency
- **Connection Pooling**: Efficient database connection management
- **Caching**: Intelligent caching for frequently accessed data
- **Optimized Queries**: Database queries optimized for performance

### 6. **Scalability**

- **Auto-scaling**: Automatically handles traffic spikes
- **Stateless Design**: No server state to manage
- **Database Optimization**: Efficient queries and indexing
- **Resource Management**: Proper cleanup and resource management

## How Things Are Organized

### Project Structure

```
apps/tenant-management-system-worker/
├── src/
│   ├── index.ts              # Main application entry point
│   ├── routes/               # API route handlers
│   │   ├── auth.ts          # Authentication endpoints
│   │   ├── tenant.ts        # Tenant management
│   │   ├── property.ts      # Property management
│   │   ├── transaction.ts   # Payment processing
│   │   ├── billing.ts       # Billing and statements
│   │   ├── report.ts        # Reporting and analytics
│   │   ├── whatsapp.ts      # WhatsApp integration
│   │   └── settings.ts      # System configuration
│   └── middleware/          # Custom middleware (if needed)
├── wrangler.jsonc           # Cloudflare Worker configuration
├── package.json             # Dependencies and scripts
└── README.md               # This documentation
```

### Code Organization Principles

#### 1. **Route-Based Organization**

- Each domain has its own route file
- Clear separation of concerns
- Easy to find and modify specific functionality

#### 2. **Middleware Pattern**

- Global middleware for common functionality
- Database injection middleware
- Error handling middleware
- CORS middleware

#### 3. **Type Safety**

- Shared types from `@repo/db/schema`
- Request/response interfaces
- Environment variable types

#### 4. **Error Handling**

- Consistent error response format
- Proper HTTP status codes
- Detailed error logging

## What Should Reside in the Worker?

### ✅ **Should Be in Worker**

1. **API Endpoints**: All REST API endpoints
2. **Business Logic**: Complex validation and processing rules
3. **Database Operations**: All database queries and transactions
4. **Authentication**: Session management and user validation
5. **External Integrations**: WhatsApp, payment gateways, etc.
6. **Data Processing**: CSV imports, data transformations
7. **File Operations**: PDF generation, file uploads
8. **Caching Logic**: Server-side caching strategies

### ❌ **Should NOT Be in Worker**

1. **UI Components**: React components and UI logic
2. **Client-Side State**: Frontend state management
3. **User Interface**: Forms, buttons, styling
4. **Client-Side Validation**: Form validation (though server validation is required)
5. **Static Assets**: Images, CSS, JavaScript bundles
6. **Client-Side Routing**: Frontend navigation logic

## How It Calls the Database

### Database Architecture

#### 1. **Dual Driver Approach**

```typescript
// HTTP Driver (Default) - for simple operations
const db = c.req.db; // Injected by middleware
await db.execute(sql`SELECT * FROM tenants`);

// WebSocket Driver (Pool) - for transactions
const pool = createDbPool(c.env.DATABASE_URL);
const client = await pool.connect();
await client.query("BEGIN");
// ... transaction operations
await client.query("COMMIT");
```

#### 2. **Connection Management**

- **HTTP Driver**: Stateless, no connection management needed
- **WebSocket Driver**: Manual connection management required
- **Pool Creation**: One pool per request
- **Cleanup**: Always release connections and end pools

#### 3. **Transaction Handling**

```typescript
// Example: Payment Transaction
const pool = createDbPool(c.env.DATABASE_URL);
let client: any;

try {
  client = await pool.connect();
  await client.query("BEGIN");

  // Insert payment
  await client.query(`INSERT INTO payments...`);

  // Update balances
  await client.query(`UPDATE monthly_tracking...`);

  await client.query("COMMIT");
} catch (error) {
  if (client) await client.query("ROLLBACK");
  throw error;
} finally {
  if (client) client.release();
  await pool.end();
}
```

### Database Schema

The worker uses a comprehensive PostgreSQL schema with the following main tables:

#### Core Tables

- **TENANTS**: Tenant information and property assignments
- **Property**: Property details and landlord information
- **TENANT_PAYMENT_ENTRIES**: All payment transactions
- **MONTHLY_RENT_TRACKING**: Monthly rent and outstanding tracking

#### Supporting Tables

- **TENANTS_RENT_FACTORS**: Rent calculation factors
- **TENANT_DEBIT_NOTES**: Outstanding balance notes
- **PENALTY_INTEREST_MASTER**: Interest rate configuration

## The Dual Driver Approach

### Why Dual Drivers?

#### **HTTP Driver Benefits**

- **Lower Latency**: Faster for simple queries
- **No Connection Management**: Stateless, automatic cleanup
- **Serverless Optimized**: Perfect for edge computing
- **Simple Setup**: No manual connection handling

#### **WebSocket Driver Benefits**

- **Full Transaction Support**: BEGIN/COMMIT/ROLLBACK
- **Session Management**: Maintains connection state
- **Complex Operations**: Multi-step transactions
- **Data Integrity**: ACID properties for critical operations

### When to Use Each Driver

#### **Use HTTP Driver (`c.req.db`) for:**

```typescript
// Simple CRUD operations
await db.execute(sql`SELECT * FROM tenants WHERE id = ${tenantId}`);

// Single inserts/updates
await db.execute(
  sql`INSERT INTO tenants (name, property_id) VALUES (${name}, ${propertyId})`
);

// Read operations
await db.execute(sql`SELECT * FROM payments WHERE tenant_id = ${tenantId}`);

// Non-transactional writes
await db.execute(
  sql`UPDATE tenants SET name = ${newName} WHERE id = ${tenantId}`
);
```

#### **Use WebSocket Driver (Pool) for:**

```typescript
// Payment processing (requires atomicity)
const pool = createDbPool(c.env.DATABASE_URL);
const client = await pool.connect();
await client.query("BEGIN");
// Multiple related operations
await client.query("COMMIT");

// Complex business logic with multiple steps
// Data imports with validation
// Bulk operations that must succeed or fail together
```

### Implementation Pattern

#### **HTTP Driver Pattern**

```typescript
// Simple, fast operations
transactionRoutes.get("/list", async (c) => {
  const db = c.req.db;
  const transactions = await db.execute(sql`
    SELECT * FROM transactions 
    WHERE tenant_id = ${tenantId}
  `);
  return c.json({ status: 200, data: transactions.rows });
});
```

#### **WebSocket Driver Pattern**

```typescript
// Transactional operations
transactionRoutes.post("/add", async (c) => {
  const pool = createDbPool(c.env.DATABASE_URL);
  let client: any;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Multiple related operations
    await client.query(`INSERT INTO payments...`);
    await client.query(`UPDATE balances...`);
    await client.query(`UPDATE tracking...`);

    await client.query("COMMIT");
    return c.json({ status: 200, data: { success: true } });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    throw new HTTPException(500, { message: "Transaction failed" });
  } finally {
    if (client) client.release();
    await pool.end();
  }
});
```

### Key Requirements for WebSocket Driver

#### **1. Pool Management**

- **Create per request**: Never reuse pools across requests
- **Always cleanup**: Release client and end pool in finally block
- **Error handling**: Rollback on any error

#### **2. UUID Generation**

```typescript
// Manual UUID generation required
const paymentId = crypto.randomUUID();
await client.query(
  `
  INSERT INTO payments (id, tenant_id, amount) 
  VALUES ($1, $2, $3)
`,
  [paymentId, tenantId, amount]
);
```

#### **3. Parameterization**

```typescript
// Use $1, $2, $3... parameters
await client.query(
  `
  UPDATE tenants SET name = $1 WHERE id = $2
`,
  [newName, tenantId]
);
```

## Development Guidelines

### Adding New Endpoints

#### **1. Create Route File**

```typescript
// src/routes/new-feature.ts
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Env } from "..";

const newFeatureRoutes = new Hono<{ Bindings: Env }>();

newFeatureRoutes.get("/list", async (c) => {
  try {
    const db = c.req.db;
    // Your logic here
    return c.json({ status: 200, data: {} });
  } catch (error) {
    console.error("Error:", error);
    throw new HTTPException(500, { message: "Error message" });
  }
});

export default newFeatureRoutes;
```

#### **2. Register Routes**

```typescript
// src/index.ts
import newFeatureRoutes from "./routes/new-feature";

app.route("/api/new-feature", newFeatureRoutes);
```

### Error Handling Best Practices

#### **1. Consistent Error Format**

```typescript
return c.json({
  status: 400,
  message: "Clear error message",
});
```

#### **2. Proper HTTP Status Codes**

- **200**: Success
- **400**: Bad Request (validation errors)
- **401**: Unauthorized
- **404**: Not Found
- **500**: Internal Server Error

#### **3. Logging**

```typescript
console.error("Error in payment processing:", error);
```

### Database Best Practices

#### **1. Use Appropriate Driver**

- **HTTP Driver**: Simple operations
- **WebSocket Driver**: Transactions

#### **2. Parameterization**

```typescript
// ✅ Good
await db.execute(sql`SELECT * FROM tenants WHERE id = ${tenantId}`);

// ✅ Better (for WebSocket)
await client.query(`SELECT * FROM tenants WHERE id = $1`, [tenantId]);
```

#### **3. Transaction Management**

```typescript
// Always handle rollback and cleanup
try {
  await client.query("BEGIN");
  // operations
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
```

## Deployment

### Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@host/database
```

### Deployment Commands

```bash
# Development
npm run dev

# Deploy to Cloudflare
npm run deploy
```

### Monitoring

- **Cloudflare Dashboard**: Monitor performance and errors
- **Logs**: Check worker logs for debugging
- **Metrics**: Track response times and success rates

## Performance Optimization

### **1. Database Optimization**

- **Indexes**: Proper database indexing
- **Query Optimization**: Efficient SQL queries
- **Connection Pooling**: Proper pool management

### **2. Caching Strategy**

- **Response Caching**: Cache frequently accessed data
- **Database Caching**: Use database query caching
- **Edge Caching**: Leverage Cloudflare's edge cache

### **3. Code Optimization**

- **Minimal Dependencies**: Keep bundle size small
- **Efficient Algorithms**: Optimize business logic
- **Async Operations**: Use async/await properly

## Security Considerations

### **1. Input Validation**

- **Type Checking**: Validate all inputs
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize user inputs

### **2. Authentication**

- **Session Management**: Secure session handling
- **Authorization**: Proper access control
- **Token Validation**: Validate authentication tokens

### **3. Data Protection**

- **Encryption**: Encrypt sensitive data
- **Access Control**: Limit database access
- **Audit Logging**: Log security events

## Troubleshooting

### Common Issues

#### **1. Database Connection Errors**

```bash
# Check DATABASE_URL environment variable
# Verify database is accessible
# Check connection pool limits
```

#### **2. Transaction Errors**

```bash
# Ensure proper BEGIN/COMMIT/ROLLBACK
# Check for connection leaks
# Verify UUID generation
```

#### **3. Performance Issues**

```bash
# Monitor query performance
# Check database indexes
# Review connection pooling
```

### Debugging Tips

#### **1. Logging**

```typescript
console.log("Debug info:", { tenantId, amount });
console.error("Error details:", error);
```

#### **2. Error Tracking**

- **Cloudflare Logs**: Check worker logs
- **Database Logs**: Monitor query performance
- **Application Logs**: Track business logic errors

#### **3. Testing**

```bash
# Test locally
npm run dev

# Test specific endpoints
curl -X POST http://localhost:8787/api/transaction/add
```

## Conclusion

The Tenant Management System Worker is a robust, scalable, and secure backend API that provides all the necessary functionality for managing tenant properties and payments. Its dual driver architecture ensures optimal performance while maintaining data integrity for critical operations.

The worker follows best practices for serverless development, with proper error handling, type safety, and security measures. It's designed to scale automatically and provide fast, reliable service to frontend applications worldwide.

For new developers, start by understanding the dual driver approach, then explore the route structure and database operations. The modular design makes it easy to add new features while maintaining the existing architecture and performance characteristics.
