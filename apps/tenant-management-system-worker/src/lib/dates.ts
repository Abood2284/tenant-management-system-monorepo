// /apps/tenant-management-system-worker/src/lib/dates.ts

/**
 * Calculates the financial year and quarter based on the Indian FY (April-March).
 * This function is timezone-safe as it operates on UTC date components.
 */
export function getFinancialYearAndQuarter(date: Date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // 1-indexed

  let financialYear: string;
  let quarter: string;

  if (month >= 4) {
    // April to December
    financialYear = `${year}-${year + 1}`;
    if (month <= 6) quarter = "Q1";
    else if (month <= 9) quarter = "Q2";
    else quarter = "Q3";
  } else {
    // January to March
    financialYear = `${year - 1}-${year}`;
    quarter = "Q4";
  }
  return { financialYear, quarter };
}

/**
 * Calculates the UTC date range for the quarter that occurred before the current date.
 */
export function getPreviousQuarterRange(): { startDate: Date; endDate: Date } {
  const now = new Date();
  const currentMonth = now.getUTCMonth();
  const currentYear = now.getUTCFullYear();

  const currentQuarter = Math.floor(currentMonth / 3) + 1;

  let previousQuarterYear = currentYear;
  let previousQuarterStartMonth: number;

  if (currentQuarter === 1) {
    previousQuarterYear = currentYear - 1;
    previousQuarterStartMonth = 9; // Q4 starts in October (month 9)
  } else {
    previousQuarterStartMonth = (currentQuarter - 2) * 3;
  }

  const startDate = new Date(
    Date.UTC(previousQuarterYear, previousQuarterStartMonth, 1)
  );
  const endDate = new Date(
    Date.UTC(previousQuarterYear, previousQuarterStartMonth + 3, 1)
  );

  return { startDate, endDate };
}

/**
 * Calculates the date when a penalty can be applied for a given rent month.
 * This is always the first day of the following quarter.
 */
export function getPenaltyTriggerDate(monthDate: Date): Date {
  const month = monthDate.getUTCMonth(); // 0-indexed
  const year = monthDate.getUTCFullYear();

  if (month >= 3 && month <= 5) return new Date(Date.UTC(year, 6, 1)); // Q1 (Apr-Jun) -> July 1
  if (month >= 6 && month <= 8) return new Date(Date.UTC(year, 9, 1)); // Q2 (Jul-Sep) -> Oct 1
  if (month >= 9 && month <= 11) return new Date(Date.UTC(year + 1, 0, 1)); // Q3 (Oct-Dec) -> Jan 1

  // Q4 (Jan-Mar) -> April 1 of the same year (for Jan/Feb/Mar of year X, penalty is Apr 1 of year X)
  const penaltyYear = month >= 0 && month <= 2 ? year : year + 1;
  return new Date(Date.UTC(penaltyYear, 3, 1));
}
