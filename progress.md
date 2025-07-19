# Project Progress

This document outlines the development progress of the Tenant Management System, breaking down the project into manageable steps.

## Phase 1: Core Functionality & Setup

- [x] **Project Scaffolding:** Set up the monorepo with Next.js, TypeScript, and the necessary project structure.
- [x] **Authentication (Initial):** Implement basic email and password authentication.
- [ ] **Password Hashing:** Secure user passwords by replacing plain-text storage with a robust hashing algorithm (e.g., bcrypt).
- [ ] **API Error Handling:** Refine API error responses to ensure consistency and provide clear feedback to the frontend.
- [x] **Dashboard Prototype:** Create a static prototype of the dashboard page based on the PRD.

## Phase 2: Dashboard & Key Metrics

- [ ] **Create API Endpoints for Key Metrics:**
  - `GET /api/metrics/total-tenants`
  - `GET /api/metrics/total-properties`
  - `GET /api/metrics/rent-collected`
  - `GET /api/metrics/outstanding-amounts`
- [ ] **Fetch and Display Key Metrics:** Connect the dashboard to the API endpoints to display dynamic data.
- [ ] **Create API Endpoint for Due Payments:**
  - `GET /api/payments/due`
- [ ] **Fetch and Display Due Payments:** Populate the due payments table with real data.

## Phase 3: Property Management

- [ ] **Database Schema:** Define the `properties` table in the database schema, including fields for landlord information, property name, address, and billing cycle.
- [ ] **API Endpoints:**
  - `POST /api/properties` (Create a new property)
  - `GET /api/properties` (View all properties)
  - `GET /api/properties/:id` (View a single property)
  - `PUT /api/properties/:id` (Update a property)
  - `DELETE /api/properties/:id` (Delete a property)
- [ ] **UI Components:**
  - Create a form for adding and editing properties.
  - Create a table to display all properties.
  - Implement a confirmation dialog for deleting properties.
- [ ] **Frontend Integration:** Connect the UI components to the API endpoints.

## Phase 4: Tenant Management

- [ ] **Database Schema:** Define the `tenants` table, including fields for tenant details, property assignment, rent structure, and communication preferences.
- [ ] **API Endpoints:**
  - `POST /api/tenants`
  - `GET /api/tenants`
  - `GET /api/tenants/:id`
  - `PUT /api/tenants/:id`
  - `DELETE /api/tenants/:id`
- [ ] **UI Components:**
  - Create a form for adding and editing tenants.
  - Create a table to display all tenants.
- [ ] **Frontend Integration:** Connect the UI components to the API endpoints.

## Phase 5: Billing & Transactions

- [ ] **Database Schema:** Define `transactions` and `bills` tables.
- [ ] **API Endpoints:**
  - `POST /api/transactions` (Add a new payment)
  - `GET /api/transactions` (View all payments)
  - `GET /api/tenants/:id/transactions` (View payments for a specific tenant)
  - `POST /api/bills/generate` (Generate bills for a billing cycle)
- [ ] **UI Components:**
  - Create a form for adding new payments.
  - Create a table to display transaction history.
  - Implement PDF generation for bills.
- [ ] **Frontend Integration:** Connect the UI components to the API endpoints.

## Phase 6: Reporting & Settings

- [ ] **API Endpoints for Reports:**
  - `GET /api/reports/rent-collected`
  - `GET /api/reports/taxes-paid`
  - `GET /api/reports/pending-bills`
- [ ] **UI for Reports:** Create a view to display reports with date range filters.
- [ ] **Settings Module:**
  - Implement a form for managing the admin profile.
  - Add functionality to set the rent increment percentage.

## Phase 7: WhatsApp Integration

- [ ] **Research and Select a WhatsApp API Provider.**
- [ ] **Implement API Calls for Sending Messages:**
  - Rent reminders
  - Outstanding alerts
  - Payment receipts
- [ ] **Create Pre-defined Message Templates.**
- [ ] **Integrate WhatsApp Functionality into the Relevant Modules.**

## Phase 8: Deployment & Testing

- [ ] **Unit & Integration Tests:** Write tests for all major features.
- [ ] **End-to-End Testing:** Perform thorough testing of the entire application.
- [ ] **Deployment:** Deploy the application to a production environment.

# NOTE:

Now, when you want to delete an item, you should update the deletedAt column with the current timestamp instead of using a DELETE statement. Your
queries should also be updated to filter out records where deletedAt is not null. ... Since we have implemented soft Delete approach in our Schema

## Considerations:

### Key Finding 3: History & Auditing

- In the Old SQL: The system has \_HISTORY tables, like PENALTY_INTEREST_HISTORY and TENANTS_RENT_FACTORS_HISTORY.
- What This Means: The old system never truly deleted or overwrote critical financial data. When a penalty rate or rent amount changed, it moved the old
  record into a history table. This creates an audit trail, which is essential for financial software.
- Suggestion for Your App:
  - Your soft-delete implementation is a great first step.
  - For critical financial data like rent amounts or penalty fees, consider creating a similar history/audit log. When a tenant's rent is updated, you
    could create a new entry in a rent_history table instead of just updating the value on the tenants table. This gives you a complete history of what
    the rent was at any point in time.

### Key Finding 4: Complex Payment Logic

- In the Old SQL: Look at SP_MAKE_PARTIAL_PAYMENT and SP_MAKE_OUTSTANDING_PAYMENT.
- What This Means: The system doesn't just record a payment. It has logic to handle:
  1.  Partial Payments: When a tenant pays less than the full amount due.
  2.  Outstanding Balances: It tracks and updates remaining balances.
  3.  Mappings: It explicitly links payments to the outstanding items they are paying for (TENANT_OUTSTANDING_PAYMENT_MAPPINGS).
- Suggestion for Your App:
  - Your POST /api/transactions endpoint needs to be more than a simple INSERT.
  - You need to implement logic to handle these scenarios. When a payment is made, your API should:
    1.  Check if it's a partial or full payment against a specific bill.
    2.  Update the status of the corresponding bills record (e.g., to paid or partial).
    3.  Potentially add a remainingAmount column to your bills table.

### Key Finding 5: Bulk Update Operations

- In the Old SQL: The TenantFactorsTotalUpdate and SP_TENANT_PENALTY_UPDATE procedures are very powerful.
- What This Means: The admin had the ability to apply a percentage-based rent increase to all tenants at once. They could also update the penalty
  interest rate for everyone. This is a massive time-saver.
- Suggestion for Your App:
  - This is a key feature for your Settings page.
  - You should create API endpoints like POST /api/settings/bulk-rent-update and POST /api/settings/update-penalty.
  - Crucially, the old procedures wrap these complex updates in a Transaction (BEGIN TRAN / COMMIT TRAN). Your API endpoint must do the same to ensure
    data consistency. If the update fails halfway through, it should be rolled back for all tenants.

### Key Finding 6: A Hidden "Recce Images" Feature

- In the Old SQL: The RecceImagesType and its columns (StoreSection, Area) suggest a hidden feature. "Recce" is likely short for "Reconnaissance."
- What This Means: It appears the old system had a feature, perhaps for property inspections, where an employee could upload images of different sections
  of a property and record their area.
- Suggestion for Your App:
  - This is a potential value-add feature you can propose.
  - You could implement a feature allowing admins to upload files or images (like signed agreements, inspection photos, etc.) and associate them with a
    property or tenant. You would need a new table like documents and use a cloud storage service (like Cloudflare R2 or AWS S3) to store the actual
    files.
