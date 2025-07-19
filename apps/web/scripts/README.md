# Tenant Data Migration

This directory contains scripts to migrate tenant data from the legacy system to the new web-based tenant management system.

## Migration Script

### `migrate-tenants.js`

This script migrates tenant data from the `.rpt` file to the new database schema.

#### Prerequisites

1. **Database Setup**: Ensure your database is running and accessible
2. **Environment Variables**: Set up your `DATABASE_URL` environment variable
3. **Dependencies**: Install required packages with `pnpm install`

#### Usage

```bash
# Run the migration
pnpm migrate:tenants
```

#### What the script does

1. **Creates Property**: Creates a default property record (since all tenants reference the same property ID)
2. **Parses RPT File**: Reads and parses the `tenants-test.rpt` file
3. **Transforms Data**: Converts the legacy format to match the new schema
4. **Bulk Insert**: Inserts tenants in batches of 50 for better performance

#### Data Mapping

| Legacy Field           | New Schema Field    | Notes                      |
| ---------------------- | ------------------- | -------------------------- |
| `TENANT_ID`            | `id`                | UUID preserved             |
| `PROPERTY_ID`          | `propertyId`        | UUID preserved             |
| `TENANT_NAME`          | `name`              | Text field                 |
| `SALUTATION`           | `salutation`        | Text field                 |
| `BUILDING_FOOR`        | `buildingFloor`     | Text field                 |
| `PROPERTY_TYPE`        | `propertyType`      | Text field                 |
| `PROPERTY_NUMBER`      | `propertyNumber`    | Text field                 |
| `TENANT_MOBILE_NUMBER` | `phone`             | Text field                 |
| `NOTES`                | `notes`             | Text field                 |
| `CREATED_ON`           | `createdAt`         | Timestamp                  |
| `UPDATED_ON`           | `updatedAt`         | Timestamp                  |
| `TENANCY_DATE`         | `tenancyDate`       | Timestamp                  |
| `TENANT_CODE`          | `tenantCode`        | Text field                 |
| `IS_ACTIVE`            | `isActive`          | Boolean (1/0 → true/false) |
| `TENANCY_END_DATE`     | `tenancyEndDate`    | Timestamp                  |
| `FLOOR_SORT_VALUE`     | `floorSortValue`    | Integer                    |
| `SendSMS`              | `sendSms`           | Boolean (1/0 → true/false) |
| `Numberic_Room_Number` | `numericRoomNumber` | Text field                 |

#### Default Values

- `userId`: Set to a default UUID (you'll need to update this with actual user IDs)
- `communicationPreference`: Set to "whatsapp" for all tenants
- `deletedAt`: Set to `null` for all tenants

#### Important Notes

1. **User ID**: The script uses a default user ID. You'll need to update this with actual user IDs after migration.
2. **Property Data**: The script creates a basic property record. You may want to update the property details with actual information.
3. **Conflict Handling**: The script uses `onConflictDoNothing()` to avoid duplicate entries if you run it multiple times.
4. **Batch Processing**: Tenants are inserted in batches of 50 for better performance.

#### Troubleshooting

- **Database Connection**: Ensure your `DATABASE_URL` is correctly set
- **File Path**: Make sure `tenants-test.rpt` is in the project root
- **Permissions**: Ensure the script has read access to the RPT file and write access to the database
