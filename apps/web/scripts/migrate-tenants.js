import { readFileSync } from "fs";
import { join } from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tenants, properties } from "./schema.js";

// Database connection
const connectionString =
  process.env.DATABASE_URL || "postgresql://localhost:5432/tenant_management";
const client = postgres(connectionString);
const db = drizzle(client);

// Default user ID (you'll need to replace this with an actual user ID)
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

// Default property data (since all tenants reference the same property)
const DEFAULT_PROPERTY = {
  id: "AB23F556-57EC-4461-9A63-9975F3B67B50",
  name: "Main Property",
  address: "Property Address",
  landlordName: "Property Owner",
  billingCycle: "monthly",
  penaltyFee: 0,
  userId: DEFAULT_USER_ID,
};

function parseRptFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  // Get header line to understand column positions
  const headerLine = lines[0];
  const separatorLine = lines[1];

  // Find column boundaries based on the separator line
  const columnBoundaries = [];
  let currentPos = 0;

  // Parse the separator line to find column boundaries
  for (let i = 0; i < separatorLine.length; i++) {
    if (separatorLine[i] === "-") {
      currentPos = i;
      // Find the end of this column
      while (i < separatorLine.length && separatorLine[i] === "-") {
        i++;
      }
      columnBoundaries.push([currentPos, i]);
    }
  }

  // Skip header lines (first 2 lines)
  const dataLines = lines.slice(2).filter((line) => line.trim());

  return dataLines
    .map((line) => {
      const columns = columnBoundaries.map(([start, end]) => {
        return line.substring(start, end).trim();
      });

      // Map columns to fields based on the header
      // Header: TENANT_ID, PROPERTY_ID, TENANT_NAME, SALUTATION, BUILDING_FOOR, PROPERTY_TYPE,
      // PROPERTY_NUMBER, TENANT_MOBILE_NUMBER, NOTES, CREATED_ON, UPDATED_ON, TENANCY_DATE,
      // TENANT_CODE, IS_ACTIVE, TENANCY_END_DATE, FLOOR_SORT_VALUE, SendSMS, Numberic_Room_Number

      if (columns.length < 18) {
        console.warn(
          `Skipping malformed line with ${columns.length} columns: ${line.substring(0, 100)}...`
        );
        return null;
      }

      return {
        tenantId: columns[0],
        propertyId: columns[1],
        tenantName: columns[2],
        salutation: columns[3] || null,
        buildingFloor: columns[4] || null,
        propertyType: columns[5] || null,
        propertyNumber: columns[6] || null,
        tenantMobileNumber: columns[7] || null,
        notes: columns[8] || null,
        createdOn: columns[9] || null,
        updatedOn: columns[10] || null,
        tenancyDate: columns[11] || null,
        tenantCode: columns[12] || null,
        isActive: columns[13] === "1",
        tenancyEndDate: columns[14] || null,
        floorSortValue: columns[15] ? parseInt(columns[15]) : null,
        sendSms: columns[16] === "1",
        numericRoomNumber: columns[17] || null,
      };
    })
    .filter(Boolean); // Remove null entries
}

function transformTenantData(rawData) {
  return rawData.map((tenant) => ({
    id: tenant.tenantId,
    name: tenant.tenantName,
    salutation: tenant.salutation,
    buildingFloor: tenant.buildingFloor,
    propertyType: tenant.propertyType,
    propertyNumber: tenant.propertyNumber,
    phone: tenant.tenantMobileNumber,
    notes: tenant.notes,
    tenancyDate: tenant.tenancyDate ? new Date(tenant.tenancyDate) : null,
    tenancyEndDate:
      tenant.tenancyEndDate && tenant.tenancyEndDate !== "NULL"
        ? new Date(tenant.tenancyEndDate)
        : null,
    isActive: tenant.isActive,
    sendSms: tenant.sendSms,
    tenantCode: tenant.tenantCode,
    floorSortValue: tenant.floorSortValue,
    numericRoomNumber: tenant.numericRoomNumber,
    propertyId: tenant.propertyId,
    communicationPreference: "whatsapp", // Default value
    userId: DEFAULT_USER_ID,
    createdAt: tenant.createdOn ? new Date(tenant.createdOn) : new Date(),
    updatedAt:
      tenant.updatedOn && tenant.updatedOn !== "NULL"
        ? new Date(tenant.updatedOn)
        : new Date(),
    deletedAt: null,
  }));
}

async function migrateData() {
  try {
    console.log("Starting tenant data migration...");

    // Step 1: Create the property first
    console.log("Creating property...");
    await db.insert(properties).values(DEFAULT_PROPERTY).onConflictDoNothing();

    // Step 2: Parse and transform tenant data
    console.log("Parsing RPT file...");
    const rptFilePath = join(process.cwd(), "..", "..", "tenants-test.rpt");
    const rawData = parseRptFile(rptFilePath);
    const transformedData = transformTenantData(rawData);

    console.log(`Found ${transformedData.length} tenants to migrate`);

    // Step 3: Insert tenants in batches
    const batchSize = 50;
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize);
      console.log(
        `Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(transformedData.length / batchSize)}`
      );

      await db.insert(tenants).values(batch).onConflictDoNothing();
    }

    console.log("Migration completed successfully!");
    console.log(`Migrated ${transformedData.length} tenants`);
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateData };
