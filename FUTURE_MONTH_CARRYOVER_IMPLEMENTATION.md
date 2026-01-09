# Future Month Carryover - Implementation Summary

## Overview
Enhanced the budget carryover feature to properly calculate and display carryover amounts when viewing future months. Previously, carryover calculations only worked for past and current months based on actual spending.

## Problem Statement

**Before this update:**
- Viewing February 2026 while it's January 2026 → carryover showed $0 (because January wasn't complete)
- Viewing March 2026 → carryover showed $0 (because February had no expenses yet)
- Future months didn't reflect projected overspending from current/intermediate months

**The Issue:**
The original `getCarryoverAmount` function only looked at the **immediate previous month's actual spending**, which broke for future months because:
1. The "previous month" might not be complete yet
2. It didn't include forecasted/projected expenses
3. It didn't chain carryovers through multiple months

## Solution Implemented

Modified `getCarryoverAmount` in `/app/actions/budget.ts` to:

### 1. Detect Future Months
```typescript
const targetDate = new Date(year, month - 1, 1);
const currentDate = new Date(currentYear, currentMonth - 1, 1);
const isFutureMonth = targetDate > currentDate;
```

### 2. Use Different Logic for Future vs Past/Current Months

**For Current/Past Months:**
- Uses the original logic
- Looks at previous month's **actual spending** only
- Returns overspending amount if any

**For Future Months:**
- Calculates **cumulative projected carryover**
- Starts from the current month
- Chains through each intermediate month up to the target month

### 3. Include Forecasted Expenses

For each month in the chain:
```typescript
const [stats, forecast] = await Promise.all([
  getExpenseStats(userId, iterMonth, iterYear, false, categoryIds),
  getMonthForecast(userId, iterMonth, iterYear, categoryIds),
]);

const totalProjectedSpending = stats.total + forecast.totalAmount;
```

### 4. Calculate Cumulative Carryover

For each intermediate month:
1. Get the month's budget limit
2. Subtract any carryover from previous months → **effective budget**
3. Calculate total projected spending (actual + forecasted)
4. If overspending occurs → carry it forward to next month
5. If under budget → reset carryover to 0 (month absorbs the debt)

```typescript
const effectiveBudget = budgetLimit - cumulativeCarryover;
const monthOverspend = totalProjectedSpending - effectiveBudget;

if (monthOverspend > 0) {
  cumulativeCarryover = monthOverspend;
} else {
  cumulativeCarryover = 0;
}
```

## How It Works - Example

**Scenario:** It's January 2026, viewing February 2026
- Budget: $5,000/month
- January spending so far: $3,000
- January forecasted expenses: $2,500
- **Total projected January:** $5,500

**Result when viewing February:**
- January is projected to overspend by $500
- February will show **$500 carryover** from January
- February's effective budget: $5,000 - $500 = $4,500

**Scenario 2:** Still January, now viewing March 2026
- January projected overspend: $500
- February budget: $5,000
- February effective budget: $5,000 - $500 = $4,500
- February forecasted spending: $4,000
- **February won't overspend** (under budget by $500)

**Result when viewing March:**
- Carryover resets to $0 (February absorbed January's debt)
- March's effective budget: $5,000 (full budget available)

## Benefits

✅ **Accurate future planning** - See projected carryovers before they happen  
✅ **Multi-month visibility** - View how current overspending affects future months  
✅ **Forecasted expenses included** - Accounts for recurring bills and reminders  
✅ **Debt absorption** - Shows when future months will "pay off" carryover  
✅ **Category-aware** - Works with category filters and user views  
✅ **Backwards compatible** - Past/current months work exactly as before  

## Technical Details

### Files Modified
- `/app/actions/budget.ts`
  - Added import for `getMonthForecast`
  - Updated `getCarryoverAmount` function with future month logic

### Key Dependencies
- `getMonthForecast()` - Gets projected expenses (unpaid + recurring + reminders)
- `getExpenseStats()` - Gets actual paid expenses
- `getBudgetForMonth()` - Gets budget limits (handles virtual budgets)
- `getCategoryBudgetSum()` - Aggregates category budgets when filtering

### Performance Considerations
- For future months, iterates through each intermediate month
- Uses parallel Promise.all() calls for budget and expense queries
- Leverages React cache() for repeated queries
- Maximum iteration: 12 months (one year ahead is typical)

## Testing Recommendations

### Test Case 1: Current Month Overspending → Next Month
1. Add expenses to current month that exceed budget
2. Add some forecasted expenses (recurring bills)
3. Navigate to next month
4. **Expected:** Carryover banner shows projected overspending

### Test Case 2: Multi-Month Chain
1. Set up current month to project overspending
2. Navigate 2-3 months ahead
3. **Expected:** Carryover chains through if all months overspend

### Test Case 3: Debt Absorption
1. Set up current month to overspend by small amount
2. Navigate to next month (with normal spending)
3. Navigate to third month
4. **Expected:** Third month shows $0 carryover (second month absorbed it)

### Test Case 4: Category Filtering
1. Create category-specific overspending in current month
2. Navigate to future month with category filter active
3. **Expected:** Carryover reflects category-filtered amounts

### Test Case 5: Past Months (Regression Test)
1. Navigate to past months
2. **Expected:** Carryover shows actual historical overspending (unchanged behavior)

### Test Case 6: Year Boundary
1. In December, set up overspending scenario
2. Navigate to January next year
3. **Expected:** Carryover properly crosses year boundary

## Edge Cases Handled

- **Year transitions** - December → January calculations work correctly
- **No budget set** - Returns 0 carryover (no budget = no overspending)
- **Category filtering** - Respects selected categories in all calculations
- **User views** - Works with "all users" and individual user views
- **Shared categories** - Properly handles shared vs personal category budgets
- **Zero forecasts** - Works when no forecasted expenses exist

## Settings Requirement

The carryover feature must be **enabled in settings** for calculations to run:
```typescript
settings?.enableBudgetCarryover ? getCarryoverAmount(...) : 0
```

If disabled, all carryover values default to 0 (feature is opt-in).

---

**Implementation Date:** January 2026  
**Status:** ✅ Complete  
**Related Documentation:** 
- `BUDGET_CARRYOVER_IMPLEMENTATION.md` - Original carryover feature
- `BUDGET_CARRYOVER_TESTING.md` - Testing guide for carryover feature

