import { readFileSync } from "fs";
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

  console.log("Column boundaries:", columnBoundaries);

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

function testParsing() {
  try {
    console.log("Testing RPT file parsing...");

    const rptFilePath = join(process.cwd(), "..", "..", "tenants-test.rpt");
    const rawData = parseRptFile(rptFilePath);

    console.log(`Successfully parsed ${rawData.length} tenant records`);

    // Show first 3 records as examples
    if (rawData.length > 0) {
      console.log("\nFirst 3 records:");
      rawData.slice(0, 3).forEach((tenant, index) => {
        console.log(`\n--- Record ${index + 1} ---`);
        console.log(`ID: ${tenant.tenantId}`);
        console.log(`Name: ${tenant.tenantName}`);
        console.log(`Property ID: ${tenant.propertyId}`);
        console.log(`Phone: ${tenant.tenantMobileNumber}`);
        console.log(`Property Type: ${tenant.propertyType}`);
        console.log(`Property Number: ${tenant.propertyNumber}`);
        console.log(`Is Active: ${tenant.isActive}`);
        console.log(`Send SMS: ${tenant.sendSms}`);
        console.log(`Salutation: ${tenant.salutation}`);
        console.log(`Building Floor: ${tenant.buildingFloor}`);
      });

      // Show some statistics
      const activeTenants = rawData.filter((t) => t.isActive).length;
      const inactiveTenants = rawData.filter((t) => !t.isActive).length;
      const propertyTypes = [
        ...new Set(rawData.map((t) => t.propertyType).filter(Boolean)),
      ];
      const buildingFloors = [
        ...new Set(rawData.map((t) => t.buildingFloor).filter(Boolean)),
      ];

      console.log("\n--- Statistics ---");
      console.log(`Total tenants: ${rawData.length}`);
      console.log(`Active tenants: ${activeTenants}`);
      console.log(`Inactive tenants: ${inactiveTenants}`);
      console.log(`Property types: ${propertyTypes.join(", ")}`);
      console.log(`Building floors: ${buildingFloors.join(", ")}`);
    } else {
      console.log("No valid records found");
    }

    console.log("\nParsing test completed successfully!");
  } catch (error) {
    console.error("Parsing test failed:", error);
    process.exit(1);
  }
}

testParsing();
