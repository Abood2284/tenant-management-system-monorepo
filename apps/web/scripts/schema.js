import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

// Properties table
export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  landlordName: text("landlord_name").notNull(),
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  penaltyFee: integer("penalty_fee").notNull().default(0),
  userId: uuid("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Tenants table
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  salutation: text("salutation"),
  buildingFloor: text("building_floor"),
  propertyType: text("property_type"),
  propertyNumber: text("property_number"),
  phone: text("phone"),
  notes: text("notes"),
  tenancyDate: timestamp("tenancy_date"),
  tenancyEndDate: timestamp("tenancy_end_date"),
  isActive: boolean("is_active").notNull().default(true),
  sendSms: boolean("send_sms").notNull().default(true),
  tenantCode: text("tenant_code"),
  floorSortValue: integer("floor_sort_value"),
  numericRoomNumber: text("numeric_room_number"),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id),
  communicationPreference: text("communication_preference")
    .notNull()
    .default("whatsapp"),
  userId: uuid("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});
