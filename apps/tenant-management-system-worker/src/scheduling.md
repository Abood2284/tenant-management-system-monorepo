# Scheduled Feature Documentation

# Development of the Scheduling Feature in the Tenant Management System

## Introduction

The scheduling feature was developed to address key challenges in managing tenant rent tracking and penalties after a major data loss event. It automates recurring tasks, ensures data consistency, and supports business rules for penalties. This document explains the problems we faced, how we arrived at the solution, and the rationale for its implementation.

## Problems We Were Facing

The system encountered several issues that necessitated the creation of automated scheduling:

- **Data Loss and Recovery Needs**: All historical data was lost, leaving only tenant records and outstanding balances. This created gaps in the MONTHLY_RENT_TRACKING table, making it impossible to accurately calculate penalties or generate reports for past months.
- **Back-Data Entry Challenges**: Admins needed to enter Q1 (April-June 2025) payments retroactively. However, penalties had to be waived for timely payments entered late, requiring complex logic to recalculate and adjust penalties without data loss.
- **Manual Process Inefficiencies**: Without automation, admins had to manually create monthly rent records and apply quarterly penalties, leading to errors, delays, and scalability issues with 370+ tenants.
- **Penalty Application Inconsistencies**: Penalties for unpaid rents needed to be applied at quarter ends (e.g., July 1 for Q1 delinquencies), but manual processes risked overlooking tenants or applying incorrect rates.
- **Timezone and Date Handling Bugs**: Initial implementations had timezone mismatches, causing incorrect month processing (e.g., July processed as June).

These problems led to inaccurate financial reporting, potential revenue loss from unapplied penalties, and high administrative overhead.

## How We Came to This Conclusion

The decision to create the scheduling feature was reached through iterative brainstorming and problem-solving:

- **Initial Brainstorming**: We discussed the data loss impact and the client's requirement for back-data entry with penalty adjustments. This highlighted the need for automation to handle retroactive entries and recalculations without manual intervention.
- **Problem Decomposition**: Broke down the issues into monthly (rent tracking) and quarterly (penalties) tasks. Recognized that manual processes were unsustainable and error-prone.
- **Research and Best Practices**: Explored Cloudflare Workers Cron Triggers for reliable scheduling, Drizzle ORM for database interactions, and UTC date handling to resolve timezone bugs.
- **Iterative Development**: Started with basic cron setups, added error handling for transaction isolation, and implemented backfill for Q1. Tested locally and in production, refining based on failures (e.g., date mismatches, parameter errors).
- **Testing and Validation**: Used manual triggers to simulate runs, verified database records, and ensured carryover logic (e.g., outstanding from previous month) worked correctly.
- **Cleanup and Optimization**: Once Q1 backfill was complete, removed temporary code to maintain a clean codebase.

This conclusion was driven by the need for reliability, scalability, and accuracy in a system handling hundreds of tenants.

## Rationale for the Scheduling Feature

The feature was designed with the following rationale:

- **Automation for Efficiency**: Cron triggers ensure tasks run on time, reducing admin workload and errors.
- **Modular Design**: Separate functions for monthly tracking and penalties, with manual endpoints for testing.
- **Data Integrity**: UTC dates prevent timezone issues; validation checks ensure correct month processing.
- **Error Resilience**: Try-catch blocks and logging allow graceful failure and easy debugging.
- **Scalability**: Handles large tenant volumes with batch processing potential.
- **Business Alignment**: Supports penalty rules, financial year calculations, and back-data entry needs.

## Implementation Details

- **Monthly Scheduler**: Runs on the 1st, creating records with carried-over outstanding amounts.
- **Quarterly Scheduler**: Runs on quarter starts, applying penalties based on unpaid Q1 amounts.
- **Tools Used**: Cloudflare Workers for scheduling, Drizzle ORM for queries, Neon for database.

This feature resolves the initial problems and provides a robust foundation for future system operations. For full code, see `scheduled.ts`.

## How Scheduling is Done

The feature is implemented in `scheduled.ts`, integrated with the main worker in `index.ts`. It uses Cloudflare Workers for edge execution and Drizzle ORM for database interactions.

### Architecture

- **Cron Triggers**: Defined in `wrangler.jsonc` for monthly and quarterly runs.
  - Monthly: `"0 0 1 * *"` (1st of every month at 00:00 UTC).
  - Quarterly: `"0 0 1 1,4,7,10 *"` (1st of Jan, Apr, Jul, Oct at 00:00 UTC).
- **Event Handler**: `handleScheduledEvent` routes triggers to appropriate functions based on date.
- **Database**: Neon PostgreSQL with Drizzle ORM for type-safe queries.
- **Manual Triggers**: Endpoints for testing (e.g., `/api/manual/trigger-monthly-tracking`).

### Monthly Rent Tracking

- **Purpose**: Creates MONTHLY_RENT_TRACKING records for the current month.
- **Process**:
  1. Calculate current month using UTC to avoid timezone issues.
  2. Fetch active tenants and rent factors.
  3. For each tenant:
     - Check if record exists.
     - Fetch previous month's outstanding.
     - Calculate rent pending.
     - Insert new record if missing.
- **Key Logic**:
  - Financial year: April-March (e.g., July 2025 is FY 2025-26, Q2).
  - Outstanding carryover: From previous month's OUTSTANDING_PENDING.
- **Code Snippet**:
  ```typescript
  const rentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  // ... fetch tenants ...
  const prev = await db.select({ outstanding: schema.MONTHLY_RENT_TRACKING.OUTSTANDING_PENDING })
    .from(schema.MONTHLY_RENT_TRACKING)
    .where(and(eq(schema.MONTHLY_RENT_TRACKING.TENANT_ID, tenant.tenantId), eq(schema.MONTHLY_RENT_TRACKING.RENT_MONTH, prevMonth)));
  // ... insert if not exists ...
  ```

### Quarterly Penalty Application

- **Purpose**: Applies penalties to unpaid rents from the previous quarter.
- **Process**:
  1. Calculate previous quarter range.
  2. Fetch penalty rate (default 5%).
  3. Query unpaid rents from previous quarter.
  4. For each:
     - Calculate total pending.
     - Apply penalty if needed.
     - Update record.
- **Key Logic**:
  - Penalty = floor(totalPending * rate / 100).
  - Skip if no pending or penalty already applied.
- **Code Snippet**:
  ```typescript
  const { startDate, endDate } = getPreviousQuarterRange();
  // ... fetch unpaidRents ...
  const penaltyAmount = Math.floor((totalPending * penaltyRate) / 100);
  await db.update(schema.MONTHLY_RENT_TRACKING).set({ PENALTY_AMOUNT: penaltyAmount /* ... */ }).where(eq(schema.MONTHLY_RENT_TRACKING.ID, record.trackingId));
  ```

### Work Track and Development History

The feature was developed iteratively, addressing data loss and automation needs.

- **Initial Setup**: Added Cron Triggers to existing worker for quarterly penalties, using internal endpoints for modularity.
- **Error Handling**: Fixed TypeScript errors (e.g., ScheduledController type), timezone issues, and query failures.
- **Backfill Implementation**: Created temporary Q1 backfill for April-June 2025 to recover from data loss, with sequential processing and error recovery.
- **Testing Phases**:
  - Local: Used `--test-scheduled` and curl for manual triggers.
  - Production: Manual API calls to verify July processing.
- **Cleanup**: Removed backfill code after successful Q1 population.
- **Challenges Overcome**: Date/timezone bugs, transaction isolation, parameter mismatches in Drizzle ORM.

### Testing and Verification

- **Local Testing**: `npx wrangler dev --test-scheduled` + curl to trigger endpoints.
- **Production Testing**: Manual triggers to simulate July run, verifying records in MONTHLY_RENT_TRACKING.
- **Auto-Run**: Next trigger on August 1; monitor via Cloudflare logs.

### Maintenance and Future Improvements

- **Monitoring**: Use Cloudflare logs for errors; add notifications for failures.
- **Scaling**: Optimize for more tenants with batching.
- **Extensions**: Add annual rent increment scheduler.

This documentation serves as the work track and reference for the scheduling feature.