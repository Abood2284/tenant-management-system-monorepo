import {
  boolean,
  timestamp,
  pgTable,
  text,
  integer,
  decimal,
  date,
  varchar,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const Property = pgTable("Property", {
  PROPERTY_ID: text("PROPERTY_ID")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  LANDLORD_NAME: varchar("LANDLORD_NAME", { length: 100 }),
  PROPERTY_NAME: varchar("PROPERTY_NAME", { length: 50 }).notNull(),
  PROPERTY_BILL_NAME: varchar("PROPERTY_BILL_NAME", { length: 50 }).notNull(),
  WARD: varchar("WARD", { length: 10 }),
  NUMBER_OF_BLOCKS: integer("NUMBER_OF_BLOCKS").notNull(),
  ADDRESS: text("ADDRESS").notNull(),
  CREATED_ON: timestamp("CREATED_ON", { mode: "date" }),
  UPDATED_ON: timestamp("UPDATED_ON", { mode: "date" }),
  PHONE_NUMBER: varchar("PHONE_NUMBER", { length: 12 }),
  FAX_NUMBER: varchar("FAX_NUMBER", { length: 12 }),
});

export const TENANTS = pgTable("TENANTS", {
  TENANT_ID: text("TENANT_ID")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  PROPERTY_ID: text("PROPERTY_ID").references(() => Property.PROPERTY_ID),
  TENANT_NAME: text("TENANT_NAME"),
  SALUTATION: varchar("SALUTATION", { length: 5 }),
  BUILDING_FOOR: text("BUILDING_FOOR"),
  PROPERTY_TYPE: text("PROPERTY_TYPE"),
  PROPERTY_NUMBER: text("PROPERTY_NUMBER"),
  TENANT_MOBILE_NUMBER: varchar("TENANT_MOBILE_NUMBER", { length: 15 }),
  NOTES: text("NOTES"),
  CREATED_ON: timestamp("CREATED_ON", { mode: "date" }),
  UPDATED_ON: timestamp("UPDATED_ON", { mode: "date" }),
  TENANCY_DATE: date("TENANCY_DATE"),
  TENANT_CODE: integer("TENANT_CODE"),
  IS_ACTIVE: boolean("IS_ACTIVE"),
  TENANCY_END_DATE: timestamp("TENANCY_END_DATE", { mode: "date" }),
  FLOOR_SORT_VALUE: integer("FLOOR_SORT_VALUE"),
  SendSMS: boolean("SendSMS"),
  Numberic_Room_Number: integer("Numberic_Room_Number"),
});

export const MONTHLY_RENT_TRACKING = pgTable("MONTHLY_RENT_TRACKING", {
  ID: text("ID")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  TENANT_ID: text("TENANT_ID")
    .references(() => TENANTS.TENANT_ID)
    .notNull(),
  RENT_MONTH: date("RENT_MONTH").notNull(),
  RENT_COLLECTED: integer("RENT_COLLECTED").default(0).notNull(),
  RENT_PENDING: integer("RENT_PENDING").default(0).notNull(),
  OUTSTANDING_AMOUNT: integer("OUTSTANDING_AMOUNT").default(0).notNull(),
  OUTSTANDING_COLLECTED: integer("OUTSTANDING_COLLECTED").default(0).notNull(),
  OUTSTANDING_PENDING: integer("OUTSTANDING_PENDING").default(0).notNull(),
  PENALTY_AMOUNT: integer("PENALTY_AMOUNT").default(0).notNull(),
  PENALTY_PAID: integer("PENALTY_PAID").default(0).notNull(),
  PENALTY_PENDING: integer("PENALTY_PENDING").default(0).notNull(),
  FINANCIAL_YEAR: text("FINANCIAL_YEAR").notNull(),
  QUARTER: text("QUARTER").notNull(),
  CREATED_ON: timestamp("CREATED_ON", { mode: "date" }).defaultNow(),
  UPDATED_ON: timestamp("UPDATED_ON", { mode: "date" }).defaultNow(),
});

export const TENANT_PAYMENT_ENTRIES = pgTable("TENANT_PAYMENT_ENTRIES", {
  ID: text("ID")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  TENANT_ID: text("TENANT_ID")
    .references(() => TENANTS.TENANT_ID)
    .notNull(),
  RENT_MONTH: date("RENT_MONTH"),
  RECEIVED_AMOUNT: integer("RECEIVED_AMOUNT").notNull(),
  RENT_ALLOCATED: integer("RENT_ALLOCATED").default(0),
  OUTSTANDING_ALLOCATED: integer("OUTSTANDING_ALLOCATED").default(0),
  PENALTY_ALLOCATED: integer("PENALTY_ALLOCATED").default(0),
  PAYMENT_METHOD: integer("PAYMENT_METHOD").notNull(),
  PAYMENT_DATE: date("PAYMENT_DATE").notNull(),
  CHEQUE_NUMBER: varchar("CHEQUE_NUMBER", { length: 20 }),
  CHEQUE_DATE: date("CHEQUE_DATE"),
  BANK_NAME: varchar("BANK_NAME", { length: 50 }),
  BANK_BRANCH: varchar("BANK_BRANCH", { length: 30 }),
  TRANSACTION_ID: varchar("TRANSACTION_ID", { length: 50 }),
  PAYMENT_GATEWAY: varchar("PAYMENT_GATEWAY", { length: 30 }),
  NOTES: text("NOTES"),
  CREATED_ON: timestamp("CREATED_ON", { mode: "date" }).defaultNow(),
  UPDATED_ON: timestamp("UPDATED_ON", { mode: "date" }).defaultNow(),
});

export const TENANTS_RENT_FACTORS = pgTable("TENANTS_RENT_FACTORS", {
  ID: text("ID")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  TENANT_ID: text("TENANT_ID").references(() => TENANTS.TENANT_ID),
  BASIC_RENT: integer("BASIC_RENT"),
  PROPERTY_TAX: integer("PROPERTY_TAX"),
  REPAIR_CESS: integer("REPAIR_CESS"),
  MISC: integer("MISC"),
  CHEQUE_RETURN_CHARGE: integer("CHEQUE_RETURN_CHARGE"),
  CREATED_ON: timestamp("CREATED_ON", { mode: "date" }),
  UPDATED_ON: timestamp("UPDATED_ON", { mode: "date" }),
  BASIC_RENTLASTUPDATEDATE: timestamp("BASIC_RENTLASTUPDATEDATE", {
    mode: "date",
  }),
  PROPERTY_MISCLASTUPDATEDATE: timestamp("PROPERTY_MISCLASTUPDATEDATE", {
    mode: "date",
  }),
  REPAIR_CESSLASTUPDATEDATE: timestamp("REPAIR_CESSLASTUPDATEDATE", {
    mode: "date",
  }),
  MISC_TLASTUPDATEDATE: timestamp("MISC_TLASTUPDATEDATE", { mode: "date" }),
  TENANT_CODE: integer("TENANT_CODE"),
  IsFactorsUpdated: boolean("IsFactorsUpdated"),
  EffectiveFrom: timestamp("EffectiveFrom", { mode: "date" }),
  FinancialYear: text("FinancialYear"),
});

export const TENANTS_RENT_FACTORS_HISTORY = pgTable(
  "TENANTS_RENT_FACTORS_HISTORY",
  {
    OriginalID: serial("OriginalID").primaryKey(),
    OriginalCreatedOn: timestamp("OriginalCreatedOn", { mode: "date" }),
    ID: text("ID").notNull(),
    TENANT_ID: text("TENANT_ID"),
    BASIC_RENT: integer("BASIC_RENT"),
    PROPERTY_TAX: integer("PROPERTY_TAX"),
    REPAIR_CESS: integer("REPAIR_CESS"),
    MISC: integer("MISC"),
    CHEQUE_RETURN_CHARGE: integer("CHEQUE_RETURN_CHARGE"),
    CREATED_ON: timestamp("CREATED_ON", { mode: "date" }),
    UPDATED_ON: timestamp("UPDATED_ON", { mode: "date" }),
    BASIC_RENTLASTUPDATEDATE: timestamp("BASIC_RENTLASTUPDATEDATE", {
      mode: "date",
    }),
    PROPERTY_MISCLASTUPDATEDATE: timestamp("PROPERTY_MISCLASTUPDATEDATE", {
      mode: "date",
    }),
    REPAIR_CESSLASTUPDATEDATE: timestamp("REPAIR_CESSLASTUPDATEDATE", {
      mode: "date",
    }),
    MISC_TLASTUPDATEDATE: timestamp("MISC_TLASTUPDATEDATE", { mode: "date" }),
    EffectiveTill: timestamp("EffectiveTill", { mode: "date" }),
    FinancialYear: text("FinancialYear"),
    BatchID: text("BatchID").notNull(),
  }
);

export const TENANT_DEBIT_NOTES = pgTable("TENANT_DEBIT_NOTES", {
  ID: serial("ID").primaryKey(),
  TENANT_ID: text("TENANT_ID").references(() => TENANTS.TENANT_ID),
  FOR_DESCRIPTION: varchar("FOR_DESCRIPTION", { length: 100 }),
  FROM_DATE: timestamp("FROM_DATE", { mode: "date" }),
  TO_DATE: timestamp("TO_DATE", { mode: "date" }),
  AMOUNT: text("AMOUNT"),
  DUE_DATE: timestamp("DUE_DATE", { mode: "date" }),
  CREATED_ON: timestamp("CREATED_ON", { mode: "date" }),
  UPDATED_ON: timestamp("UPDATED_ON", { mode: "date" }),
});

export const PENALTY_INTEREST_MASTER = pgTable("PENALTY_INTEREST_MASTER", {
  ID: text("ID")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  INTEREST_RATE: integer("INTEREST_RATE").notNull(),
  EFFECTIVE_FROM: date("EFFECTIVE_FROM"),
  CREATED_ON: timestamp("CREATED_ON", { mode: "date" }),
  UPDATED_ON: timestamp("UPDATED_ON", { mode: "date" }),
});

export const PENALTY_INTEREST_HISTORY = pgTable("PENALTY_INTEREST_HISTORY", {
  ID: serial("ID").primaryKey(),
  ORIGINAL_ID: text("ORIGINAL_ID").references(() => PENALTY_INTEREST_MASTER.ID),
  INTEREST_RATE: integer("INTEREST_RATE"),
  EFFECTIVE_FROM: timestamp("EFFECTIVE_FROM", { mode: "date" }),
  CREATED_ON: timestamp("CREATED_ON", { mode: "date" }),
  UPDATED_ON: timestamp("UPDATED_ON", { mode: "date" }),
});

export const PENALTY_INTEREST_UPDATES = pgTable("PENALTY_INTEREST_UPDATES", {
  ID: serial("ID").primaryKey(),
  INTEREST_RATE: integer("INTEREST_RATE"),
  CREATED_ON: timestamp("CREATED_ON", { mode: "date" }),
});

export const TenanatFactorUpdate = pgTable("TenanatFactorUpdate", {
  Id: serial("Id").primaryKey(),
  BasicRentPercentage: decimal("BasicRentPercentage", {
    precision: 18,
    scale: 2,
  }),
  PropertyTaxPercentage: decimal("PropertyTaxPercentage", {
    precision: 18,
    scale: 2,
  }),
  RepaircessPercentage: decimal("RepaircessPercentage", {
    precision: 18,
    scale: 2,
  }),
  MiscPercentage: decimal("MiscPercentage", { precision: 18, scale: 2 }),
  CreatedOn: timestamp("CreatedOn", { mode: "date" }),
});

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" }),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// Relations remain as previously defined
