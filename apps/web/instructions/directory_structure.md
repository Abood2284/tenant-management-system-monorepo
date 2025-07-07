
# Directory Structure

This document outlines the directory structure for the Tenant Management System, including both the frontend (Next.js web app) and the backend (Cloudflare Worker).

## Monorepo Root

```
/
├── apps/
│   ├── web/                            # Frontend Next.js application
│   └── tenant-management-system-worker/ # Backend Cloudflare Worker
├── packages/
│   ├── db/                             # Shared database schema (Drizzle ORM)
│   ├── ui/                             # Shared React UI components
│   ├── eslint-config/                  # Shared ESLint configuration
│   └── typescript-config/              # Shared TypeScript configuration
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```

## Frontend (apps/web)

The frontend is a Next.js application using the App Router.

```
apps/web/
├── app/
│   ├── (auth)/                         # Route group for authentication
│   │   └── login/
│   │       └── page.tsx                # Login page UI
│   ├── (dashboard)/                    # Route group for protected app sections
│   │   ├── layout.tsx                  # Dashboard layout (sidebar, header)
│   │   ├── page.tsx                    # Main dashboard page
│   │   ├── properties/                 # Property management section
│   │   │   ├── page.tsx                # List, view, search properties
│   │   │   ├── [id]/page.tsx           # View/Edit a single property
│   │   │   └── new/page.tsx            # Add new property form
│   │   ├── tenants/                    # Tenant management section
│   │   │   ├── page.tsx                # List, view, search tenants
│   │   │   ├── [id]/page.tsx           # View/Edit a single tenant
│   │   │   └── new/page.tsx            # Add new tenant form
│   │   ├── billing/                    # Billing and invoicing section
│   │   │   └── page.tsx                # Generate bills, view history
│   │   ├── transactions/               # Payment transaction management
│   │   │   ├── page.tsx                # List all transactions
│   │   │   └── new/page.tsx            # Form to add a new payment
│   │   ├── reports/                    # Reporting section
│   │   │   └── page.tsx                # View and generate reports
│   │   └── settings/                   # User and application settings
│   │       └── page.tsx                # Manage profile, app settings
│   ├── api/                            # Next.js API routes (if needed for frontend-specific tasks)
│   │   └── auth/[...nextauth]/route.ts # NextAuth.js route handler
│   ├── globals.css                     # Global stylesheets
│   └── layout.tsx                      # Root layout
├── components/
│   ├── ui/                             # Generic UI elements (proxied from packages/ui)
│   ├── dashboard/                      # Components specific to the dashboard layout
│   ├── forms/                          # Reusable form components
│   └── icons/                          # Custom icon components
├── lib/
│   ├── api.ts                          # Client-side functions to call backend API
│   ├── auth.ts                         # Authentication configuration (NextAuth.js)
│   ├── utils.ts                        # Utility functions (formatting, etc.)
│   └── validators.ts                   # Zod schemas for form validation
├── public/                             # Static assets (images, fonts)
├── server/
│   └── index.ts                        # Server-side utilities (not API routes)
├── drizzle.config.ts                   # Drizzle ORM configuration
├── next.config.ts                      # Next.js configuration
└── package.json
```

## Backend (apps/tenant-management-system-worker)

The backend is a Cloudflare Worker handling API requests and business logic.

```
apps/tenant-management-system-worker/
└── src/
    ├── index.ts                        # Worker entry point, router setup (e.g., Hono)
    ├── handlers/                       # Request handlers for API routes
    │   ├── auth.ts                     # Login, logout, session management
    │   ├── properties.ts               # CRUD operations for properties
    │   ├── tenants.ts                  # CRUD operations for tenants
    │   ├── billing.ts                  # Handlers for bill generation
    │   ├── transactions.ts             # Handlers for payment recording
    │   ├── reports.ts                  # Handlers for report generation
    │   └── whatsapp.ts                 # Handlers for sending WhatsApp messages
    ├── services/                       # Core business logic
    │   ├── propertyService.ts
    │   ├── tenantService.ts
    │   ├── billingService.ts
    │   └── whatsappService.ts          # Logic for interacting with WhatsApp API
    ├── db/
    │   └── queries.ts                  # Database queries using Drizzle ORM
    └── lib/
        └── types.ts                    # TypeScript types and interfaces for the backend
```
