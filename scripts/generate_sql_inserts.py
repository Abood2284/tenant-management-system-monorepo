

import csv
import uuid
import os

# --- Configuration ---
CSV_FOLDER = '/Users/abdulraheem/Developer/Next/tenant-management-system-monorepo/csv/'
OUTPUT_SQL_FILE = '/Users/abdulraheem/Developer/Next/tenant-management-system-monorepo/migration_data.sql'

# --- Mappings for old IDs to new UUIDs ---
property_id_map = {}
tenant_id_map = {}
transaction_id_map = {}
outstanding_id_map = {}
penalty_id_map = {}

# --- SQL statements will be collected here ---
sql_statements = []

# --- Helper function to handle data cleaning ---
def clean(value, data_type='text'):
    if value is None or value.strip() in ['', 'NULL', 'NA']:
        return "NULL"
    
    # Escape single quotes for SQL
    cleaned_value = value.strip().replace("'", "''")

    if data_type == 'text':
        return f"'{cleaned_value}'"
    if data_type == 'integer':
        try:
            return str(int(float(cleaned_value)))
        except (ValueError, TypeError):
            return "0"
    if data_type == 'boolean':
        return 'true' if cleaned_value == '1' else 'false'
    if data_type == 'date':
        # Attempt to parse various date formats
        for fmt in ("%d-%m-%y", "%Y-%m-%d %H:%M:%S.%f", "%d-%m-%y %H:%M:%S.%f", "%d-%m-%y %H:%M:%S", "%Y-%m-%d", "%d-%m-%Y"):
            try:
                from datetime import datetime
                dt = datetime.strptime(cleaned_value, fmt)
                return f"'{dt.strftime('%Y-%m-%d %H:%M:%S')}'"
            except ValueError:
                continue
        return "NULL" # Return NULL if no format matches
    return f"'{cleaned_value}'"

def process_files():
    # --- 1. User --- 
    # We need a user to associate the data with.
    admin_user_id = str(uuid.uuid4())
    sql_statements.append(
        f"INSERT INTO \"user\" (id, name, email, password) VALUES ('{admin_user_id}', 'Admin', 'admin@tms.com', '$2b$10$E9.E3.E3.E3.E3.E3.E3.E3.E3.E3.E3.E');"
    )
    print("Generated SQL for user.")

    # --- 2. Properties ---
    with open(os.path.join(CSV_FOLDER, 'property.csv'), 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            old_id = row['\ufeffPROPERTY_ID']
            new_id = str(uuid.uuid4())
            property_id_map[old_id] = new_id
            sql_statements.append(
                f"INSERT INTO properties (id, name, address, landlord_name, property_bill_name, ward, number_of_blocks, phone_number, fax_number, user_id, created_at, updated_at) VALUES ("
                f"'{new_id}', {clean(row['PROPERTY_NAME'])}, {clean(row['ADDRESS'])}, {clean(row['LANDLORD_NAME'])}, {clean(row['PROPERTY_BILL_NAME'])}, "
                f"{clean(row['WARD'])}, {clean(row['NUMBER_OF_BLOCKS'], 'integer')}, {clean(row['PHONE_NUMBER'])}, {clean(row['FAX_NUMBER'])}, '{admin_user_id}', "
                f"{clean(row['CREATED_ON'], 'date')}, {clean(row['UPDATED_ON'], 'date')});"
            )
    print(f"Processed {len(property_id_map)} properties.")

    # --- 3. Tenants ---
    with open(os.path.join(CSV_FOLDER, 'tenants.csv'), 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            old_id = row['TENANT_ID']
            new_id = str(uuid.uuid4())
            tenant_id_map[old_id] = new_id
            
            property_id = property_id_map.get(row['PROPERTY_ID'], "NULL")
            if property_id != "NULL":
                property_id = f"'{property_id}'"

            sql_statements.append(
                f"INSERT INTO tenants (id, name, salutation, building_floor, property_type, property_number, phone, notes, tenancy_date, tenancy_end_date, is_active, send_sms, tenant_code, floor_sort_value, numeric_room_number, property_id, user_id, created_at, updated_at) VALUES ("
                f"'{new_id}', {clean(row['TENANT_NAME'])}, {clean(row['SALUTATION'])}, {clean(row['BUILDING_FLOOR'])}, {clean(row['PROPERTY_TYPE'])}, "
                f"{clean(row['PROPERTY_NUMBER'])}, {clean(row['TENANT_MOBILE_NUMBER'])}, {clean(row['NOTES'])}, {clean(row['TENANCY_DATE'], 'date')}, "
                f"{clean(row['TENANCY_END_DATE'], 'date')}, {clean(row['IS_ACTIVE'], 'boolean')}, {clean(row['SendSMS'], 'boolean')}, {clean(row['TENANT_CODE'])}, "
                f"{clean(row['FLOOR_SORT_VALUE'], 'integer')}, {clean(row['Numberic_Room_Number'])}, {property_id}, '{admin_user_id}', "
                f"{clean(row['CREATED_ON'], 'date')}, {clean(row['UPDATED_ON'], 'date')});"
            )
    print(f"Processed {len(tenant_id_map)} tenants.")

    # --- 4. Rent Factors ---
    with open(os.path.join(CSV_FOLDER, 'tenant_rent_factors.csv'), 'r') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            tenant_id = tenant_id_map.get(row['TENANT_ID'])
            if tenant_id:
                new_id = str(uuid.uuid4())
                sql_statements.append(
                    f"INSERT INTO rent_factors (id, tenant_id, basic_rent, property_tax, repair_cess, misc, cheque_return_charge, financial_year, created_at, updated_at) VALUES ("
                    f"'{new_id}', '{tenant_id}', {clean(row['BASIC_RENT'], 'integer')}, {clean(row['PROPERTY_TAX'], 'integer')}, {clean(row['REPAIR_CESS'], 'integer')}, "
                    f"{clean(row['MISC'], 'integer')}, {clean(row['CHEQUE_RETURN_CHARGE'], 'integer')}, {clean(row['FinancialYear'])}, "
                    f"{clean(row['CREATED_ON'], 'date')}, {clean(row['UPDATED_ON'], 'date')});"
                )
                count += 1
    print(f"Processed {count} rent factors.")

    # --- 5. Transactions (Payment Entries) ---
    with open(os.path.join(CSV_FOLDER, 'Tenant_payment_entries.csv'), 'r') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            tenant_id = tenant_id_map.get(row['TENANT_ID'])
            if tenant_id:
                old_id = row['ID']
                new_id = str(uuid.uuid4())
                transaction_id_map[old_id] = new_id
                sql_statements.append(
                    f"INSERT INTO transactions (id, tenant_id, property_id, rent_month, penalty_amount, current_rent, amount, payment_method, cheque_number, cheque_date, bank_name, bank_branch, group_payment_id, payment_type, user_id, created_at, updated_at) VALUES ("
                    f"'{new_id}', '{tenant_id}', '{property_id_map.get(row['PROPERTY_ID'])}', {clean(row['RENT_MONTH'], 'date')}, {clean(row['PENALTY_AMOUNT'], 'integer')}, "
                    f"{clean(row['CURRENT_RENT'], 'integer')}, {clean(row['RECEIVED_AMOUNT'], 'integer')}, {clean(row['PAYMENT_METHOD'])}, {clean(row['CHEQUE_NUMBER'])}, "
                    f"{clean(row['CHEQUE_DATE'], 'date')}, {clean(row['BANK_NAME'])}, {clean(row['BANK_BRANCH'])}, {clean(row['GROUP_PAYMENT_ID'])}, "
                    f"{clean(row['PAYMENT_TYPE'], 'integer')}, '{admin_user_id}', {clean(row['ENTRY_CREATED_ON'], 'date')}, {clean(row['ENTRY_UPDATED_ON'], 'date')});"
                )
                count += 1
    print(f"Processed {count} transactions.")

    # --- 6. Tenant Outstandings ---
    with open(os.path.join(CSV_FOLDER, 'Tenant_outstandings.csv'), 'r') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            tenant_id = tenant_id_map.get(row['TENANT_ID'])
            if tenant_id:
                old_id = row['ID']
                new_id = str(uuid.uuid4())
                outstanding_id_map[old_id] = new_id
                sql_statements.append(
                    f"INSERT INTO tenant_outstandings (id, tenant_id, outstanding_type, outstanding_amount, outstanding_as_on, created_at, updated_at) VALUES ("
                    f"'{new_id}', '{tenant_id}', {clean(row['OUTSTANDING_TYPE'], 'integer')}, {clean(row['OUTSTANDING_AMOUNT'], 'integer')}, "
                    f"{clean(row['OUTSTANDING_AS_ON'], 'date')}, {clean(row['CREATED_ON'], 'date')}, {clean(row['UPDATED_ON'], 'date')});"
                )
                count += 1
    print(f"Processed {count} tenant outstandings.")

    # --- 7. Tenant Debit Notes ---
    with open(os.path.join(CSV_FOLDER, 'Tenant_DebitNotes.csv'), 'r') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            tenant_id = tenant_id_map.get(row['TENANT_ID'])
            if tenant_id:
                new_id = str(uuid.uuid4())
                sql_statements.append(
                    f"INSERT INTO tenant_debit_notes (id, tenant_id, for_description, from_date, to_date, amount, due_date, created_at, updated_at) VALUES ("
                    f"'{new_id}', '{tenant_id}', {clean(row['FOR_DESCRIPTION'])}, {clean(row['FROM_DATE'], 'date')}, {clean(row['TO_DATE'], 'date')}, "
                    f"{clean(row['AMOUNT'])}, {clean(row['DUE_DATE'], 'date')}, {clean(row['CREATED_ON'], 'date')}, {clean(row['UPDATED_ON'], 'date')});"
                )
                count += 1
    print(f"Processed {count} tenant debit notes.")

    # --- 8. Outstanding Payment Mappings ---
    with open(os.path.join(CSV_FOLDER, 'Tenent_outstanding_payment_mappings.csv'), 'r') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            outstanding_id = outstanding_id_map.get(row['TENANT_OUTSTANDING_ID'])
            payment_id = transaction_id_map.get(row['PAYMENT_ID'])
            if outstanding_id and payment_id:
                new_id = str(uuid.uuid4())
                sql_statements.append(
                    f"INSERT INTO tenant_outstanding_payment_mappings (id, tenant_outstanding_id, payment_id, created_at) VALUES ("
                    f"'{new_id}', '{outstanding_id}', '{payment_id}', {clean(row['CREATED_ON'], 'date')});"
                )
                count += 1
    print(f"Processed {count} outstanding payment mappings.")

    # --- 9. Penalties ---
    with open(os.path.join(CSV_FOLDER, 'Penatly_interest_master.csv'), 'r') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            old_id = row['ID']
            new_id = str(uuid.uuid4())
            penalty_id_map[old_id] = new_id
            sql_statements.append(
                f"INSERT INTO penalties (id, interest_rate, effective_from, created_at, updated_at) VALUES ("
                f"'{new_id}', {clean(row['INTEREST_RATE'], 'integer')}, {clean(row['EFFECTIVE_FROM'], 'date')}, "
                f"{clean(row['CREATED_ON'], 'date')}, {clean(row['UPDATED_ON'], 'date')});"
            )
            count += 1
    print(f"Processed {count} penalties.")

    # --- Write to file ---
    with open(OUTPUT_SQL_FILE, 'w') as f:
        f.write('\n'.join(sql_statements))
    print(f"\nSuccessfully generated SQL file at: {OUTPUT_SQL_FILE}")

if __name__ == "__main__":
    process_files()

