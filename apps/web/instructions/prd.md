# Project Overview

The proposed project involves developing a web-based Tenant Management System to replace the existing desktop solution. This new platform will streamline the management of properties, tenants, and rent transactions. The system will feature modules for property management and categorization, tenant management, rent billing, and financial transactions.

Admin will be able to add and manage properties by defining key attributes. Tenants can be added with assigned rent structures and linked to specific properties. Billing can be generated based on property and billing cycle, and payment transactions recorded manually with the system. Additionally, the system will support WhatsApp integration for sending rent reminders, outstanding alerts, and payment receipts.

# Core Features

1. Authentication: Admin needs authentication using Email & password and can Logout

2. Dashboard:
   - Interface From where admin can View key metrics (Total Rent, Properties ) and access app functionalities.
   - Upon logging, Admin land on the dashboard that provides a quick overview of key metrics such as the number of tenants, total properties, rent collected, and outstanding amounts.
   - It includes a summary of due payments categorized by tenant or property.- From here, Admin can navigate to different modules such as Property Management, Tenant Management, Transactions, WhatsApp Communication, and Settings.

3. Property Management:
   - Add New properties, View existing, Delete, Edit, set penalty fee.
   - Admin can create a property entry by inputting the landlord's information, property name, address, and selecting a billing cycle.
   - The created property becomes available for selection while adding tenants

4. Tenant Management:
   - Assign New Tenants To existing properties, View existing tenants info, Delete, Edit info.
   - To add a new tenant, Admin input tenant details (name, phone number, etc.), select the associated property and classification type, and define the rent breakdown (basic rent, taxes, etc.).
   - Admin also specify the preferred communication method, SMS or WhatsApp for rent notifications.
   - After saving, the tenant is linked to the property and appears in billing and payment modules.

5. Billing:
   - Get Transactions History for a Tenant for any specific Month, Generate PDF format, Print Hard Copy, Auto Generated Whatsapp Message on Every Successful Payment.

6. Transactions:
   - Add New Tenants Payment Entry, View Existing Payments Entry.
   - o Admin record incoming payments by selecting the tenant, specifying the payment date range, entering the amount received, payment method (cash, cheque, online), and transaction ID. This gets appended to the tenant’s history and updates the outstanding amount.
   - Admin can see a separate view that highlights unpaid balances across tenants and late fee penalties.

7. Reports:
   - Admin can see all the changes / logs about Total Rent Collected from all Tenants, Taxes Paid, Bills pending for selected date range.
   - Admin can generate basic property-wise reports directly from the system by selecting a date range. These reports are embedded within the data tables for easy access and analysis.
   - The reports provide a summary of all generated bills, received payments, and their breakdown by payment method (cash, cheque, online).

8. Settings:
   - Manage Admin Profile, Set Increment Percentage

9. Whatsapp Communicaiton:
   - Admin can send broadcast messages, payment reminders, and rent warnings to tenants directly via WhatsApp.
   - The system uses pre-defined (non editable) templates, which dynamically fill in tenant names, due amounts, and dates.
   - Admin can also share rent receipts and bills with individual tenants through WhatsApp immediately after recording a payment.
