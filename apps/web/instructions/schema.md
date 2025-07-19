### Detailed Explanations (schema.md Content)

Table Explanations
• Property: Core property details (unchanged).
• TENANTS: Tenant profiles (unchanged).
• users/sessions: Authentication (unchanged).
• MONTHLY_RENT_TRACKING: Monthly status summary for rent, outstanding, penalties.
• TENANT_PAYMENT_ENTRIES: Transaction logs with allocations.
• TENANTS_RENT_FACTORS: Current rent structures.
• TENANTS_RENT_FACTORS_HISTORY: Rent change history.
• TENANT_DEBIT_NOTES: Extra charges.
• PENALTY_INTEREST_MASTER: Current penalty settings.
• PENALTY_INTEREST_HISTORY/UPDATES: Penalty audit logs.
• TenanatFactorUpdate: Bulk update logs.

#### Table: Property

Purpose: Stores property details for organization and billing.

- `PROPERTY_ID`: Unique identifier for the property.
- `LANDLORD_NAME`: Name of the property owner.
- `PROPERTY_NAME`: Common name of the property.
- `PROPERTY_BILL_NAME`: Name used on bills.
- `WARD`: Municipal ward.
- `NUMBER_OF_BLOCKS`: Total units in the property.
- `ADDRESS`: Full address.
- `CREATED_ON`: Timestamp when record was created.
- `UPDATED_ON`: Timestamp when record was last updated.
- `PHONE_NUMBER`: Contact phone.
- `FAX_NUMBER`: Fax number (legacy).

#### Table: TENANTS

Purpose: Stores tenant information linked to properties.

- `TENANT_ID`: Unique identifier for the tenant.
- `PROPERTY_ID`: Foreign key to Property table.
- `TENANT_NAME`: Full name.
- `SALUTATION`: Prefix (e.g., Mr.).
- `BUILDING_FOOR`: Floor level.
- `PROPERTY_TYPE`: Type (e.g., Shop).
- `PROPERTY_NUMBER`: Unit number.
- `TENANT_MOBILE_NUMBER`: Phone number.
- `NOTES`: Additional remarks.
- `CREATED_ON`: Creation timestamp.
- `UPDATED_ON`: Update timestamp.
- `TENANCY_DATE`: Start date.
- `TENANT_CODE`: Legacy code.
- `IS_ACTIVE`: Active status.
- `TENANCY_END_DATE`: End date.
- `FLOOR_SORT_VALUE`: Sorting value for floors.
- `SendSMS`: SMS preference.
- `Numberic_Room_Number`: Numeric room number.

#### Table: MONTHLY_RENT_TRACKING

Purpose: Tracks monthly financial status, including rent, outstanding, and penalties (merged for simplicity).

- `ID`: Unique identifier.
- `TENANT_ID`: Foreign key to TENANTS.
- `RENT_MONTH`: The month being tracked.
- `RENT_COLLECTED`: Total rent collected for the month.
- `RENT_PENDING`: Remaining rent due for the month.
- `OUTSTANDING_AMOUNT`: Starting outstanding balance for the month.
- `OUTSTANDING_COLLECTED`: Outstanding collected this month (partials allowed).
- `OUTSTANDING_PENDING`: Remaining outstanding after collections.
- `PENALTY_AMOUNT`: Total penalty for the month.
- `PENALTY_PAID`: Penalty paid (full amount only).
- `PENALTY_PENDING`: Remaining penalty.
- `FINANCIAL_YEAR`: e.g., "2024-25".
- `QUARTER`: e.g., "Q1".
- `CREATED_ON`: Creation timestamp.
- `UPDATED_ON`: Update timestamp.

#### Table: TENANT_PAYMENT_ENTRIES

Purpose: Logs individual payment transactions with allocations.

- `ID`: Unique identifier.
- `TENANT_ID`: Foreign key to TENANTS.
- `RENT_MONTH`: Month the payment applies to (selected by admin).
- `RECEIVED_AMOUNT`: Total amount received.
- `RENT_ALLOCATED`: Amount allocated to rent (full for selected month).
- `OUTSTANDING_ALLOCATED`: Amount allocated to outstanding (partials allowed).
- `PENALTY_ALLOCATED`: Amount allocated to penalty (full for selected period).
- `PAYMENT_METHOD`: Code (1=Cash, 2=Cheque, 3=Online).
- `PAYMENT_DATE`: Date of payment.
- `CHEQUE_NUMBER`: For cheques.
- `CHEQUE_DATE`: Cheque date.
- `BANK_NAME`: Bank name.
- `BANK_BRANCH`: Bank branch.
- `TRANSACTION_ID`: For online payments.
- `PAYMENT_GATEWAY`: Gateway used.
- `NOTES`: Admin notes.
- `CREATED_ON`: Creation timestamp.
- `UPDATED_ON`: Update timestamp.

#### Table: TENANTS_RENT_FACTORS

Purpose: Stores current rent breakdown for tenants.

- `ID`: Unique identifier.
- `TENANT_ID`: Foreign key to TENANTS.
- `BASIC_RENT`: Base rent amount.
- `PROPERTY_TAX`: Tax component.
- `REPAIR_CESS`: Maintenance charges.
- `MISC`: Miscellaneous charges.
- `CHEQUE_RETURN_CHARGE`: Bounced cheque fee.
- `CREATED_ON`: Creation timestamp.
- `UPDATED_ON`: Update timestamp.
- `BASIC_RENTLASTUPDATEDATE`: Last update for basic rent.
- `PROPERTY_MISCLASTUPDATEDATE`: Last update for property/misc.
- `REPAIR_CESSLASTUPDATEDATE`: Last update for repair cess.
- `MISC_TLASTUPDATEDATE`: Last update for misc.
- `TENANT_CODE`: Legacy code.
- `IsFactorsUpdated`: Flag for recent updates.
- `EffectiveFrom`: Effective date.
- `FinancialYear`: Accounting year.

#### Table: TENANTS_RENT_FACTORS_HISTORY

Purpose: Archives historical rent factor changes.

- `OriginalID`: Unique history ID.
- `OriginalCreatedOn`: Original creation date.
- `ID`: Reference to original record.
- `TENANT_ID`: Tenant reference.
- `BASIC_RENT`: Historical basic rent.
- `PROPERTY_TAX`: Historical tax.
- `REPAIR_CESS`: Historical cess.
- `MISC`: Historical misc.
- `CHEQUE_RETURN_CHARGE`: Historical charge.
- `CREATED_ON`: Creation timestamp.
- `UPDATED_ON`: Update timestamp.
- `BASIC_RENTLASTUPDATEDATE`: Historical update date.
- `PROPERTY_MISCLASTUPDATEDATE`: Historical update date.
- `REPAIR_CESSLASTUPDATEDATE`: Historical update date.
- `MISC_TLASTUPDATEDATE`: Historical update date.
- `EffectiveTill`: End of effectiveness.
- `FinancialYear`: Historical year.
- `BatchID`: Batch operation ID.

#### Table: TENANT_DEBIT_NOTES

Purpose: Records additional charges.

- `ID`: Unique identifier.
- `TENANT_ID`: Foreign key to TENANTS.
- `FOR_DESCRIPTION`: Charge description.
- `FROM_DATE`: Start date.
- `TO_DATE`: End date.
- `AMOUNT`: Charge amount.
- `DUE_DATE`: Due date.
- `CREATED_ON`: Creation timestamp.
- `UPDATED_ON`: Update timestamp.

#### Table: PENALTY_INTEREST_MASTER

Purpose: Stores current penalty rate.

- `ID`: Unique identifier.
- `INTEREST_RATE`: Penalty percentage.
- `EFFECTIVE_FROM`: Start date.
- `CREATED_ON`: Creation timestamp.
- `UPDATED_ON`: Update timestamp.

#### Table: PENALTY_INTEREST_HISTORY

Purpose: Archives penalty rate changes.

- `ID`: Unique identifier.
- `ORIGINAL_ID`: Reference to master.
- `INTEREST_RATE`: Historical rate.
- `EFFECTIVE_FROM`: Historical start.
- `CREATED_ON`: Creation timestamp.
- `UPDATED_ON`: Update timestamp.

#### Table: PENALTY_INTEREST_UPDATES

Purpose: Logs penalty rate updates.

- `ID`: Unique identifier.
- `INTEREST_RATE`: Updated rate.
- `CREATED_ON`: Update timestamp.

#### Table: TenanatFactorUpdate

Purpose: Logs bulk rent factor updates.

- `Id`: Unique identifier.
- `BasicRentPercentage`: Percentage change for basic rent.
- `PropertyTaxPercentage`: Percentage change for tax.
- `RepaircessPercentage`: Percentage change for cess.
- `MiscPercentage`: Percentage change for misc.
- `CreatedOn`: Creation timestamp.

#### Table: users

Purpose: Stores admin user accounts.

- `id`: Unique identifier.
- `name`: User name.
- `email`: Email (unique).
- `password`: Hashed password.
- `emailVerified`: Verification timestamp.
- `createdAt`: Creation timestamp.
- `updatedAt`: Update timestamp.
- `deletedAt`: Deletion timestamp.

#### Table: sessions

Purpose: Manages user sessions.

- `sessionToken`: Unique token.
- `userId`: Foreign key to users.
- `expires`: Expiration timestamp.

## Step 4: Example Flow (How Tables Are Used and Connected)

Here's a complete example for Abdul paying ₹30,000 in April (covering March rent fully, plus partial outstanding).

1. **Setup (Initial Data)**:
   - `TENANTS`: Abdul's record exists with `TENANT_ID`.
   - `TENANTS_RENT_FACTORS`: Defines monthly rent (e.g., ₹10,000).
   - `MONTHLY_RENT_TRACKING`: Records for March and April show pending rent/penalties (queried via `TENANT_ID` relation).

2. **Admin Adds Payment (TENANT_PAYMENT_ENTRIES)**:
   - Admin selects tenant from `TENANTS`.
   - System queries `MONTHLY_RENT_TRACKING` for unpaid months (e.g., March shows ₹10,000 pending).
   - Admin allocates: Full rent for March (₹10,000), partial outstanding (₹20,000).
   - Insert into `TENANT_PAYMENT_ENTRIES` with allocations.

3. **Update Status (MONTHLY_RENT_TRACKING)**:
   - For March: Update `RENT_COLLECTED += 10000`, `RENT_PENDING = 0`.
   - For April (or global): Update `OUTSTANDING_COLLECTED += 20000`, `OUTSTANDING_PENDING -= 20000`.
   - Relations ensure updates via `TENANT_ID`.

4. **Manual Actions**:
   - Admin presses "Generate PDF" button: Queries `TENANT_PAYMENT_ENTRIES` and `MONTHLY_RENT_TRACKING` for the tenant/month to create receipt.
   - Admin presses "Send WhatsApp" button: Similar query to send message.

5. **Penalty/History (If Applicable)**:
   - At quarter-end, use `PENALTY_INTEREST_MASTER` to calculate/add to `MONTHLY_RENT_TRACKING`.
   - Changes logged in `PENALTY_INTEREST_HISTORY` and `TENANTS_RENT_FACTORS_HISTORY` for audits.

Example Flow: Table Connections
• Setup: `TENANTS` → `TENANTS_RENT_FACTORS` (get rent amount) → `MONTHLY_RENT_TRACKING` (check unpaid months).
• Payment: Insert to `TENANT_PAYMENT_ENTRIES` → Update `MONTHLY_RENT_TRACKING` via relations.
• Penalty: `PENALTY_INTEREST_MASTER` → Code applies to `MONTHLY_RENT_TRACKING` → Log in history tables.
