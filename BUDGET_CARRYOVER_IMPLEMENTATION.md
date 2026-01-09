# Budget Carryover Feature - Implementation Summary

## Overview
Implemented a budget carryover feature that allows overspending from the previous month to be "carried over" and reduce the available budget for the current month. This feature can be toggled on/off in settings.

## Features Implemented

### 1. Database Changes
- Added `enableBudgetCarryover` boolean field to the `Settings` model (defaults to `false`)
- Applied schema changes using `prisma db push`

### 2. Backend Changes

#### `/app/actions/budget.ts`
- **New Function**: `getCarryoverAmount(month, year, userId, categoryIds)`
  - Calculates overspending from previous month
  - Supports both global and category-filtered budgets
  - Returns 0 if no overspending occurred

#### `/app/actions/settings.ts`
- **New Function**: `updateBudgetCarryover(enabled: boolean)`
  - Allows toggling the carryover feature on/off
  - Updates or creates settings record

### 3. UI Components Updated

#### Budget Progress Component (`/components/budget-progress.tsx`)
- Added `carryoverAmount` prop
- Displays carryover in a distinct red warning banner at the top
- Shows "Monthly Limit" and "Effective Budget" when carryover exists
- Updated progress bar with 4 segments:
  1. **Red segment**: Carryover from last month
  2. **Primary color**: Current spending
  3. **Amber**: Forecasted expenses
  4. **Gray**: Remaining budget
- Calculates all metrics based on effective budget (budget - carryover)

#### Category Budget Progress (`/components/category-budget-progress.tsx`)
- Added `carryoverAmounts` prop (Record<categoryId, amount>)
- Shows carryover for each category in a red banner
- Updated progress bars to show carryover segment
- Calculates per-category effective budgets

#### Dashboard Stats (`/components/dashboard-stats.tsx`)
- Added `carryoverAmount` prop
- Shows effective budget in the "Budget Limit" card
- Displays carryover deduction in subtitle when applicable
- All calculations use effective budget

#### Budget Settings (`/components/budget-settings.tsx`)
- Added toggle switch for enabling/disabling budget carryover
- Shows descriptive help text explaining the feature
- Properly separated from budget limit setting with visual divider

### 4. Integration Points

Updated all sections that display budget information:

1. **Dashboard Stats Section** (`/components/dashboard/stats-section.tsx`)
   - Fetches carryover amount based on settings
   - Passes to DashboardStats component

2. **Budget Category Section** (`/components/dashboard/budget-category-section.tsx`)
   - Fetches carryover for filtered categories
   - Passes to BudgetProgress component

3. **Category Budget Section** (`/components/category/category-budget-section.tsx`)
   - Fetches category-specific carryover
   - Shows in individual category pages

4. **Settings Page** (`/app/settings/page.tsx`)
   - Passes `enableBudgetCarryover` to BudgetSettings component

## Visual Design

### Progress Bar Visualization
```
Without Carryover:
[████████████ Spent ████████░░░░░░░ Available ░░░░░░░]

With Carryover:
[▓▓ Carryover ▓▓|████████ Spent ████|▒▒ Forecast ▒▒|░░░ Available ░░░]
```

### Color Scheme
- **Red/Destructive**: Carryover amount (shows budget reduction)
- **Primary**: Current spending
- **Amber**: Forecasted/projected expenses
- **Gray**: Remaining available budget

## User Experience

### When Carryover is Enabled:
1. If user overspent last month by ₹2,000
2. Current month shows:
   - Monthly Limit: ₹50,000
   - Carried Over: ₹2,000 (in red warning box)
   - Effective Budget: ₹48,000
   - Progress bar starts with red segment

### When Carryover is Disabled:
- Works exactly as before
- No carryover calculations performed
- Full budget available each month

## Settings Toggle

Location: **Settings Page > Monthly Budget Section**

```
┌────────────────────────────────────────┐
│ Budget Carryover                [ON]   │
│ When enabled, any overspending from    │
│ last month will reduce your available  │
│ budget this month                      │
└────────────────────────────────────────┘
```

## Technical Details

### Carryover Calculation Logic
```typescript
// Get previous month
const prevMonth = month === 1 ? 12 : month - 1;
const prevYear = month === 1 ? year - 1 : year;

// Calculate overspending
const overspent = prevStats.total - prevBudget.monthlyLimit;
return Math.max(0, overspent); // Only positive overspending
```

### Effective Budget Calculation
```typescript
const effectiveBudget = budget.monthlyLimit - carryoverAmount;
const adjustedRemaining = effectiveBudget - totalUsed;
```

## Supported Scenarios

✅ Global budget carryover  
✅ Category-specific budget carryover  
✅ User-specific budget carryover  
✅ Filtered view (category selection) carryover  
✅ Works with forecasted expenses  
✅ Respects burn rate calculations  

## Benefits

1. **Accountability**: Users see the impact of overspending
2. **Budget Discipline**: Encourages staying within limits
3. **Flexible**: Can be turned off if not desired
4. **Transparent**: Clear visual indication of carryover amounts
5. **Comprehensive**: Works at all budget levels (global, category, user)

## Migration Path

- No migration required for existing data
- Default setting is `false` (disabled)
- Users can opt-in via settings
- Backwards compatible with existing budgets

## Files Modified

### Schema & Database
- `prisma/schema.prisma`

### Backend Actions
- `app/actions/budget.ts`
- `app/actions/settings.ts`

### UI Components
- `components/budget-progress.tsx`
- `components/category-budget-progress.tsx`
- `components/dashboard-stats.tsx`
- `components/budget-settings.tsx`

### Page Components
- `app/settings/page.tsx`

### Integration Components
- `components/dashboard/stats-section.tsx`
- `components/dashboard/budget-category-section.tsx`
- `components/category/category-budget-section.tsx`

## Testing Recommendations

1. **Enable Carryover**: Toggle on in settings
2. **Create Overspending**: Spend more than budget in current month
3. **Next Month**: Check that carryover appears in next month's budget
4. **Disable**: Turn off carryover and verify it stops affecting budgets
5. **Category Level**: Test with category-specific budgets
6. **Edge Cases**: Test with zero budget, negative amounts, month transitions (Dec→Jan)

---

**Implementation Date**: January 2026  
**Status**: ✅ Complete

