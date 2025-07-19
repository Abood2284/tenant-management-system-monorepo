CREATE TABLE IF NOT EXISTS "MONTHLY_RENT_TRACKING" (
    "ID" text PRIMARY KEY NOT NULL,
    "TENANT_ID" text NOT NULL,
    "RENT_MONTH" date NOT NULL,
    "RENT_COLLECTED" integer DEFAULT 0 NOT NULL,
    "RENT_PENDING" integer DEFAULT 0 NOT NULL,
    "OUTSTANDING_AMOUNT" integer DEFAULT 0 NOT NULL,
    "OUTSTANDING_COLLECTED" integer DEFAULT 0 NOT NULL,
    "OUTSTANDING_PENDING" integer DEFAULT 0 NOT NULL,
    "PENALTY_AMOUNT" integer DEFAULT 0 NOT NULL,
    "PENALTY_PAID" integer DEFAULT 0 NOT NULL,
    "PENALTY_PENDING" integer DEFAULT 0 NOT NULL,
    "FINANCIAL_YEAR" text NOT NULL,
    "QUARTER" text NOT NULL,
    "CREATED_ON" timestamp DEFAULT now(),
    "UPDATED_ON" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PENALTY_INTEREST_HISTORY" (
    "ID" serial PRIMARY KEY NOT NULL,
    "ORIGINAL_ID" text,
    "INTEREST_RATE" integer,
    "EFFECTIVE_FROM" timestamp,
    "CREATED_ON" timestamp,
    "UPDATED_ON" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PENALTY_INTEREST_MASTER" (
    "ID" text PRIMARY KEY NOT NULL,
    "INTEREST_RATE" integer NOT NULL,
    "EFFECTIVE_FROM" date,
    "CREATED_ON" timestamp,
    "UPDATED_ON" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PENALTY_INTEREST_UPDATES" (
    "ID" serial PRIMARY KEY NOT NULL,
    "INTEREST_RATE" integer,
    "CREATED_ON" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Property" (
    "PROPERTY_ID" text PRIMARY KEY NOT NULL,
    "LANDLORD_NAME" varchar(100),
    "PROPERTY_NAME" varchar(50) NOT NULL,
    "PROPERTY_BILL_NAME" varchar(50) NOT NULL,
    "WARD" varchar(10),
    "NUMBER_OF_BLOCKS" integer NOT NULL,
    "ADDRESS" text NOT NULL,
    "CREATED_ON" timestamp,
    "UPDATED_ON" timestamp,
    "PHONE_NUMBER" varchar(12),
    "FAX_NUMBER" varchar(12)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TENANTS" (
    "TENANT_ID" text PRIMARY KEY NOT NULL,
    "PROPERTY_ID" text,
    "TENANT_NAME" text,
    "SALUTATION" varchar(5),
    "BUILDING_FOOR" text,
    "PROPERTY_TYPE" text,
    "PROPERTY_NUMBER" text,
    "TENANT_MOBILE_NUMBER" varchar(15),
    "NOTES" text,
    "CREATED_ON" timestamp,
    "UPDATED_ON" timestamp,
    "TENANCY_DATE" date,
    "TENANT_CODE" integer,
    "IS_ACTIVE" boolean,
    "TENANCY_END_DATE" timestamp,
    "FLOOR_SORT_VALUE" integer,
    "SendSMS" boolean,
    "Numberic_Room_Number" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TENANTS_RENT_FACTORS" (
    "ID" text PRIMARY KEY NOT NULL,
    "TENANT_ID" text,
    "BASIC_RENT" integer,
    "PROPERTY_TAX" integer,
    "REPAIR_CESS" integer,
    "MISC" integer,
    "CHEQUE_RETURN_CHARGE" integer,
    "CREATED_ON" timestamp,
    "UPDATED_ON" timestamp,
    "BASIC_RENTLASTUPDATEDATE" timestamp,
    "PROPERTY_MISCLASTUPDATEDATE" timestamp,
    "REPAIR_CESSLASTUPDATEDATE" timestamp,
    "MISC_TLASTUPDATEDATE" timestamp,
    "TENANT_CODE" integer,
    "IsFactorsUpdated" boolean,
    "EffectiveFrom" timestamp,
    "FinancialYear" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TENANTS_RENT_FACTORS_HISTORY" (
    "OriginalID" serial PRIMARY KEY NOT NULL,
    "OriginalCreatedOn" timestamp,
    "ID" text NOT NULL,
    "TENANT_ID" text,
    "BASIC_RENT" integer,
    "PROPERTY_TAX" integer,
    "REPAIR_CESS" integer,
    "MISC" integer,
    "CHEQUE_RETURN_CHARGE" integer,
    "CREATED_ON" timestamp,
    "UPDATED_ON" timestamp,
    "BASIC_RENTLASTUPDATEDATE" timestamp,
    "PROPERTY_MISCLASTUPDATEDATE" timestamp,
    "REPAIR_CESSLASTUPDATEDATE" timestamp,
    "MISC_TLASTUPDATEDATE" timestamp,
    "EffectiveTill" timestamp,
    "FinancialYear" text,
    "BatchID" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TENANT_DEBIT_NOTES" (
    "ID" serial PRIMARY KEY NOT NULL,
    "TENANT_ID" text,
    "FOR_DESCRIPTION" varchar(100),
    "FROM_DATE" timestamp,
    "TO_DATE" timestamp,
    "AMOUNT" text,
    "DUE_DATE" timestamp,
    "CREATED_ON" timestamp,
    "UPDATED_ON" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TENANT_PAYMENT_ENTRIES" (
    "ID" text PRIMARY KEY NOT NULL,
    "TENANT_ID" text NOT NULL,
    "RENT_MONTH" date,
    "RECEIVED_AMOUNT" integer NOT NULL,
    "RENT_ALLOCATED" integer DEFAULT 0,
    "OUTSTANDING_ALLOCATED" integer DEFAULT 0,
    "PENALTY_ALLOCATED" integer DEFAULT 0,
    "PAYMENT_METHOD" integer NOT NULL,
    "PAYMENT_DATE" date NOT NULL,
    "CHEQUE_NUMBER" varchar(20),
    "CHEQUE_DATE" date,
    "BANK_NAME" varchar(50),
    "BANK_BRANCH" varchar(30),
    "TRANSACTION_ID" varchar(50),
    "PAYMENT_GATEWAY" varchar(30),
    "NOTES" text,
    "CREATED_ON" timestamp DEFAULT now(),
    "UPDATED_ON" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TenanatFactorUpdate" (
    "Id" serial PRIMARY KEY NOT NULL,
    "BasicRentPercentage" numeric(18, 2),
    "PropertyTaxPercentage" numeric(18, 2),
    "RepaircessPercentage" numeric(18, 2),
    "MiscPercentage" numeric(18, 2),
    "CreatedOn" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
    "sessionToken" text PRIMARY KEY NOT NULL,
    "userId" text NOT NULL,
    "expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text,
    "email" text NOT NULL,
    "password" text NOT NULL,
    "emailVerified" timestamp,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    "deleted_at" timestamp
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MONTHLY_RENT_TRACKING_TENANT_ID_TENANTS_TENANT_ID_fk') THEN
        ALTER TABLE "MONTHLY_RENT_TRACKING" ADD CONSTRAINT "MONTHLY_RENT_TRACKING_TENANT_ID_TENANTS_TENANT_ID_fk" FOREIGN KEY ("TENANT_ID") REFERENCES "public"."TENANTS"("TENANT_ID") ON DELETE no action ON UPDATE no action;
    END IF;
END;
$$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PENALTY_INTEREST_HISTORY_ORIGINAL_ID_PENALTY_INTEREST_MASTER_ID_fk') THEN
        ALTER TABLE "PENALTY_INTEREST_HISTORY" ADD CONSTRAINT "PENALTY_INTEREST_HISTORY_ORIGINAL_ID_PENALTY_INTEREST_MASTER_ID_fk" FOREIGN KEY ("ORIGINAL_ID") REFERENCES "public"."PENALTY_INTEREST_MASTER"("ID") ON DELETE no action ON UPDATE no action;
    END IF;
END;
$$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TENANTS_PROPERTY_ID_Property_PROPERTY_ID_fk') THEN
        ALTER TABLE "TENANTS" ADD CONSTRAINT "TENANTS_PROPERTY_ID_Property_PROPERTY_ID_fk" FOREIGN KEY ("PROPERTY_ID") REFERENCES "public"."Property"("PROPERTY_ID") ON DELETE no action ON UPDATE no action;
    END IF;
END;
$$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TENANTS_RENT_FACTORS_TENANT_ID_TENANTS_TENANT_ID_fk') THEN
        ALTER TABLE "TENANTS_RENT_FACTORS" ADD CONSTRAINT "TENANTS_RENT_FACTORS_TENANT_ID_TENANTS_TENANT_ID_fk" FOREIGN KEY ("TENANT_ID") REFERENCES "public"."TENANTS"("TENANT_ID") ON DELETE no action ON UPDATE no action;
    END IF;
END;
$$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TENANT_DEBIT_NOTES_TENANT_ID_TENANTS_TENANT_ID_fk') THEN
        ALTER TABLE "TENANT_DEBIT_NOTES" ADD CONSTRAINT "TENANT_DEBIT_NOTES_TENANT_ID_TENANTS_TENANT_ID_fk" FOREIGN KEY ("TENANT_ID") REFERENCES "public"."TENANTS"("TENANT_ID") ON DELETE no action ON UPDATE no action;
    END IF;
END;
$$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TENANT_PAYMENT_ENTRIES_TENANT_ID_TENANTS_TENANT_ID_fk') THEN
        ALTER TABLE "TENANT_PAYMENT_ENTRIES" ADD CONSTRAINT "TENANT_PAYMENT_ENTRIES_TENANT_ID_TENANTS_TENANT_ID_fk" FOREIGN KEY ("TENANT_ID") REFERENCES "public"."TENANTS"("TENANT_ID") ON DELETE no action ON UPDATE no action;
    END IF;
END;
$$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_userId_users_id_fk') THEN
        ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END;
$$;