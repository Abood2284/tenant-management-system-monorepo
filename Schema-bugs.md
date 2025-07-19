# Schema Bugs & Data Issues

This document outlines identified bugs and data inconsistencies in the Tenant Management System database schema that affect application functionality.

## Critical Issues

### 1. TENANCY_END_DATE Field Always NULL Despite Inactive Tenants

**Bug Description:**
The `TENANCY_END_DATE` field in the `TENANTS` table is always `NULL`, even when tenants are marked as inactive (`IS_ACTIVE = false`).

**Data Evidence:**

- Total tenants with `IS_ACTIVE = false`: **93 records**
- Total tenants with `IS_ACTIVE = true`: **370 records**
- **All 463 tenants have `TENANCY_END_DATE = NULL`**

**Expected Behavior:**

- When `IS_ACTIVE = false`, the `TENANCY_END_DATE` should contain the actual date when the tenancy was terminated
- When `IS_ACTIVE = true`, the `TENANCY_END_DATE` should be `NULL` (ongoing tenancy)

**Current Impact on Application:**

#### Frontend Display Issues:

1. **Duplicate Unit Cards**: The properties page shows multiple cards for the same unit/floor combination because historical tenants are displayed alongside current ones
2. **Misleading Occupancy Data**: Units appear to have multiple active tenants when only one should be active
3. **Poor User Experience**: Property managers see confusing duplicate entries that don't reflect reality

#### Business Logic Problems:

1. **Inaccurate Reporting**:
   - Occupancy rates are inflated
   - Revenue calculations may include inactive tenants
   - Historical vs current tenant distinction is impossible
2. **Data Integrity**: Cannot determine when tenancies actually ended
3. **Audit Trail**: Missing crucial information for legal and financial auditing

#### Technical Debt:

1. **Workaround Code**: Frontend must use `TENANT_ID` as React keys instead of logical business keys
2. **Complex Filtering**: Applications must rely solely on `IS_ACTIVE` flag without temporal context
3. **Data Migration Challenges**: Future data migrations or integrations lack proper tenancy end dates

**Root Cause Analysis:**
This appears to be a **data migration issue** from the legacy SQL Server system. Possible causes:

1. Original desktop application never properly set `TENANCY_END_DATE` when marking tenants inactive
2. Migration script didn't handle tenancy end dates correctly
3. Business process gaps where tenancy terminations weren't properly recorded

**Recommended Solutions:**

#### Immediate (Frontend Workaround):

- Filter tenants by `IS_ACTIVE = true` only in property listings
- Use `TENANT_ID` as unique keys to avoid React duplicate key errors

#### Short-term (Data Cleanup):

1. **Data Analysis**: Review business records to determine actual tenancy end dates
2. **Backfill Data**: Update `TENANCY_END_DATE` for inactive tenants where possible
3. **Validation Rules**: Add database constraints to ensure `TENANCY_END_DATE` is set when `IS_ACTIVE = false`

#### Long-term (Process Improvement):

1. **Application Logic**: Ensure new tenant deactivations properly set both fields
2. **Data Validation**: Add triggers or application-level checks
3. **Audit Logging**: Track all tenancy status changes with timestamps

---

## Minor Issues

### 2. Case Sensitivity in Column Names

**Issue**: Mixed case column naming (`TENANT_ID` vs `tenant_id`) can cause query failures
**Impact**: Development friction, potential runtime errors
**Solution**: Standardize on quoted uppercase column names throughout application

---

## Data Quality Metrics

- **Total Properties**: 1
- **Total Tenant Records**: 463
- **Active Tenants**: 370 (80%)
- **Inactive Tenants**: 93 (20%)
- **Missing End Dates**: 463 (100% - Critical Issue)

---

## Next Steps

1. **Immediate**: Implement frontend filtering for active tenants only
2. **Week 1**: Analyze sample inactive tenants to understand termination patterns
3. **Week 2**: Develop data cleanup strategy and validation rules
4. **Month 1**: Implement proper tenancy lifecycle management in application

---

_Last Updated: $(date)_  
_Discovered During: Frontend-Backend Integration Phase_
