import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

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
        tenantMobileNumber: columns[7] || "0",
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

function generateSQL() {
  try {
    console.log("Generating SQL INSERT statements...");

    const rptFilePath = join(process.cwd(), "..", "..", "tenants-test.rpt");
    const rawData = parseRptFile(rptFilePath);

    console.log(`Found ${rawData.length} tenant records`);

    // System user ID for legacy data
    const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

    // Generate system user and property INSERT
    const systemUserSQL = `
-- Create system user for legacy data
INSERT INTO "user" (id, name, email, password, "emailVerified", created_at, updated_at, deleted_at)
VALUES (
  '${SYSTEM_USER_ID}',
  'Legacy System',
  'legacy@system.com',
  'legacy-password-hash',
  NOW(),
  NOW(),
  NOW(),
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Insert the property with actual legacy data
INSERT INTO properties (id, name, address, landlord_name, property_bill_name, ward, number_of_blocks, phone_number, fax_number, billing_cycle, penalty_fee, user_id, created_at, updated_at, deleted_at)
VALUES (
  'AB23F556-57EC-4461-9A63-9975F3B67B50',
  'JAY MAHAL ESTATE',
  '20/48, LOHAR CHAWL OR 39, KITCHEN GARDEN LANE, MUMBAI-4000002',
  'Jay Kajaria & Bina Kajaria',
  'JAY KAJARIA & BINA KAJARIA',
  'B',
  100,
  '2208 3250',
  '22062840',
  'monthly',
  0,
  '${SYSTEM_USER_ID}',
  '2020-07-08 21:11:48.797',
  '2020-09-19 23:39:09.923',
  NULL
) ON CONFLICT (id) DO NOTHING;

`;

    // Generate tenant INSERT statements
    const tenantSQL = rawData
      .map((tenant) => {
        const values = [
          `'${tenant.tenantId}'`,
          `'${tenant.tenantName.replace(/'/g, "''")}'`, // Escape single quotes
          tenant.salutation
            ? `'${tenant.salutation.replace(/'/g, "''")}'`
            : "NULL",
          tenant.buildingFloor
            ? `'${tenant.buildingFloor.replace(/'/g, "''")}'`
            : "NULL",
          tenant.propertyType
            ? `'${tenant.propertyType.replace(/'/g, "''")}'`
            : "NULL",
          tenant.propertyNumber
            ? `'${tenant.propertyNumber.replace(/'/g, "''")}'`
            : "NULL",
          `'${tenant.tenantMobileNumber.replace(/'/g, "''")}'`,
          tenant.notes ? `'${tenant.notes.replace(/'/g, "''")}'` : "NULL",
          tenant.tenancyDate ? `'${tenant.tenancyDate}'` : "NULL",
          tenant.tenancyEndDate && tenant.tenancyEndDate !== "NULL"
            ? `'${tenant.tenancyEndDate}'`
            : "NULL",
          tenant.isActive ? "true" : "false",
          tenant.sendSms ? "true" : "false",
          tenant.tenantCode
            ? `'${tenant.tenantCode.replace(/'/g, "''")}'`
            : "NULL",
          tenant.floorSortValue ? tenant.floorSortValue : "NULL",
          tenant.numericRoomNumber
            ? `'${tenant.numericRoomNumber.replace(/'/g, "''")}'`
            : "NULL",
          `'${tenant.propertyId}'`,
          "'whatsapp'",
          `'${SYSTEM_USER_ID}'`,
          tenant.createdOn ? `'${tenant.createdOn}'` : "NOW()",
          tenant.updatedOn && tenant.updatedOn !== "NULL"
            ? `'${tenant.updatedOn}'`
            : "NOW()",
          "NULL",
        ].join(", ");

        return `INSERT INTO tenants (id, name, salutation, building_floor, property_type, property_number, phone, notes, tenancy_date, tenancy_end_date, is_active, send_sms, tenant_code, floor_sort_value, numeric_room_number, property_id, communication_preference, user_id, created_at, updated_at, deleted_at) VALUES (${values}) ON CONFLICT (id) DO NOTHING;`;
      })
      .join("\n");

    const fullSQL = systemUserSQL + "\n-- Insert tenants\n" + tenantSQL;

    // Write to file
    const outputPath = join(process.cwd(), "migration.sql");
    writeFileSync(outputPath, fullSQL, "utf8");

    console.log(`✅ SQL file generated: ${outputPath}`);
    console.log(`📊 Summary:`);
    console.log(`   - 1 property record`);
    console.log(`   - ${rawData.length} tenant records`);
    console.log(`   - Ready to paste into Neon console`);
    console.log(
      `\n✅ Ready to run! The script will create a system user and migrate all data.`
    );
  } catch (error) {
    console.error("SQL generation failed:", error);
    process.exit(1);
  }
}

generateSQL();
