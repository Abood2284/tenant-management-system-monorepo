# Payment Components

This directory contains components for handling payment functionality in the tenant management system. All API calls are made to the dedicated worker service.

## Components

### AddPaymentModal

A multi-step modal form for adding payment entries with the following features:

- **Step 1: Tenant Selection** - Search and select active tenants
- **Step 2: Payment Details** - Enter payment amount, date, method, and method-specific details
- **Step 3: Payment Allocation** - Allocate payment to rent, penalty, and outstanding amounts
- **Step 4: Review & Confirm** - Review all details before saving

## Worker API Endpoints

The component uses the following worker endpoints:

### `/api/tenant/list`

- **GET**: Fetch active tenants with optional search
- **Query Parameters**: `search`, `status`, `limit`

### `/api/tenant/detail/[tenantId]`

- **GET**: Fetch tenant payment data including unpaid months and rent factors

### `/api/transaction/add`

- **POST**: Add a new payment entry with proper validation and database updates

## Features

- **Full Payment Validation**: Rent and penalty payments must be paid in full for selected months
- **Partial Outstanding**: Outstanding amounts can be paid partially
- **Method-Specific Fields**: Different fields for Cash, Cheque, and Online payments
- **Real-time Validation**: Form validation at each step
- **Database Transactions**: Atomic operations to ensure data consistency
- **Error Handling**: Comprehensive error handling and user feedback

## Usage

```tsx
import { AddPaymentModal } from "@/components/payment";

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <AddPaymentModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSuccess={() => {
        // Handle successful payment
        setIsModalOpen(false);
        // Refresh data
      }}
    />
  );
}
```

## Environment Variables

The component uses the following environment variable:

- `NEXT_PUBLIC_WORKER_URL`: The URL of the worker service (defaults to the deployed worker URL)

## Business Rules

1. **Rent Payments**: Must be paid in full for the selected month
2. **Penalty Payments**: Must be paid in full for the selected month
3. **Outstanding Payments**: Can be paid partially
4. **Allocation Validation**: Total allocated cannot exceed received amount
5. **Method Validation**: Cheque requires number, date, and bank name; Online requires transaction ID
6. **Date Validation**: Payment date cannot be in the future
7. **Tenant Validation**: Only active tenants can receive payments
