# Budget Carryover Feature - Testing Guide

## Quick Test Checklist

### 1. Enable the Feature
- [ ] Go to Settings page
- [ ] Scroll to "Monthly Budget" section
- [ ] Toggle "Budget Carryover" switch to ON
- [ ] Verify the toggle saves successfully

### 2. Create Overspending Scenario

#### Option A: Manual Testing (Quick)
If you have existing data, you can test by:
- [ ] Check your current month's budget limit
- [ ] Add expenses that exceed the budget
- [ ] Note the overspending amount

#### Option B: Database Manipulation (More Controlled)
```sql
-- Check current budget
SELECT * FROM GlobalBudget WHERE month = 1 AND year = 2026;

-- Check current expenses for January
SELECT SUM(amount) FROM Expense 
WHERE strftime('%m', date) = '01' 
AND strftime('%Y', date) = '2026'
AND isProjected = 0
AND isPaid = 1;

-- Add a large test expense if needed
INSERT INTO Expense (
  id, userId, description, amount, date, categoryId, 
  type, isProjected, isPaid, createdAt, updatedAt
) VALUES (
  'test-expense-001', 
  'your-user-id',
  'Test overspending', 
  10000, 
  '2026-01-15', 
  'your-category-id',
  'regular', 
  0, 
  1, 
  datetime('now'), 
  datetime('now')
);
```

### 3. Verify Visual Display

On the Dashboard (current month):
- [ ] Check if you see overspending warning
- [ ] Verify "Remaining" shows negative or zero
- [ ] Progress bar should exceed 100%

### 4. Test Carryover (Next Month)

To test the carryover effect, you have two options:

#### Option A: Wait Until Next Month
- Just wait until the next month to see the carryover in action

#### Option B: Simulate Next Month (Recommended for Testing)
Temporarily modify your system date or use this approach:

1. Check what the carryover WOULD be for next month:
```typescript
// In browser console or a test script
const carryover = await fetch('/api/budget/carryover?month=2&year=2026')
  .then(r => r.json());
console.log('Expected carryover:', carryover);
```

2. Or manually calculate:
   - January Budget: ₹50,000
   - January Spending: ₹55,000
   - Expected Carryover: ₹5,000

3. When February arrives, verify:
   - [ ] Red "Carried Over" banner appears
   - [ ] Shows: "Carried Over from Last Month: ₹5,000"
   - [ ] Monthly Limit: ₹50,000
   - [ ] Effective Budget: ₹45,000
   - [ ] Progress bar starts with red segment

### 5. Test Different Views

#### Global Budget View
- [ ] Dashboard shows carryover in Budget Progress card
- [ ] Stats cards show reduced "Budget Limit"
- [ ] "Total Spent" uses effective budget for percentage

#### Category-Filtered View
- [ ] Select specific categories using filter
- [ ] Verify carryover only applies to selected categories
- [ ] Check Category Budget Progress cards show carryover

#### Individual Category Pages
- [ ] Navigate to a specific category page
- [ ] Verify category-specific carryover appears
- [ ] Check budget progress shows correct amounts

### 6. Test Toggle Off

- [ ] Go back to Settings
- [ ] Toggle "Budget Carryover" to OFF
- [ ] Return to Dashboard
- [ ] Verify no carryover is shown
- [ ] Verify full budget is available (no reduction)

### 7. Edge Cases to Test

#### Zero Budget
- [ ] Set budget to 0
- [ ] Verify no errors occur
- [ ] Carryover should handle gracefully

#### First Month of Year (December → January)
- [ ] Verify carryover correctly calculates from December to January
- [ ] Year transition should work properly

#### No Overspending
- [ ] Month with spending under budget
- [ ] Next month should show 0 carryover
- [ ] No red banner should appear

#### Multiple Users
- [ ] Switch between different users
- [ ] Verify each user's carryover is calculated correctly
- [ ] Shared categories should aggregate properly

## Expected Visual Elements

### When Carryover Exists

**Budget Progress Card:**
```
┌─────────────────────────────────────────────┐
│ Budget Progress                             │
├─────────────────────────────────────────────┤
│ ⚠️ Carried Over from Last Month             │
│    ₹5,000                                   │
│    This amount reduces your available       │
│    budget for this month                    │
│                                             │
│ Monthly Limit              ₹50,000          │
│ Effective Budget           ₹45,000          │
│ ─────────────────────────────────────────   │
│ Spent                      ₹15,000          │
│ [▓▓|████████░░░░░░░░░░░░░░░░░░░░░]         │
│ Remaining                  ₹30,000          │
└─────────────────────────────────────────────┘
```

**Budget Limit Card (Stats):**
```
┌─────────────────────────────────────────────┐
│ Budget Limit                                │
│ ₹45,000                                     │
│ ₹50,000 - ₹5,000 carryover                 │
└─────────────────────────────────────────────┘
```

**Category Card:**
```
┌─────────────────────────────────────────────┐
│ 🍕 Food                                     │
│ Limit: ₹10,000                              │
├─────────────────────────────────────────────┤
│ ⚠️ Carried Over            ₹1,000           │
│                                             │
│ Spent                      ₹3,000           │
│ [▓|████████░░░░░░░░░░░]                    │
│ Remaining                  ₹6,000           │
└─────────────────────────────────────────────┘
```

## Performance Checks

- [ ] Dashboard loads without significant delay
- [ ] Carryover calculation doesn't slow down page render
- [ ] Settings toggle responds quickly
- [ ] No console errors in browser

## Accessibility Checks

- [ ] Carryover warning is clearly visible
- [ ] Color coding is not the only indicator (text labels present)
- [ ] Toggle switch has proper labels
- [ ] All information is readable in both light/dark modes

## Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Mobile Responsiveness

- [ ] Progress bars scale properly
- [ ] Carryover banner displays well on small screens
- [ ] Toggle switch works on touch devices
- [ ] All text remains readable

## Known Limitations

1. **Historical Data**: Carryover only works going forward. Past months are not affected.
2. **Mid-Month Toggle**: Enabling/disabling mid-month takes effect immediately.
3. **Budget Changes**: If you change last month's budget retroactively, carryover may not reflect it until next calculation.

## Troubleshooting

### Carryover Not Showing
1. Check if toggle is ON in settings
2. Verify previous month had overspending
3. Check browser console for errors
4. Try refreshing the page

### Incorrect Amounts
1. Verify budget limits for previous month
2. Check that expenses are marked as `isPaid: true`
3. Ensure expenses have correct dates
4. Check category filters aren't affecting calculation

### Progress Bar Issues
1. Check if percentages exceed 100% (expected for overspending)
2. Verify color segments are in correct order
3. Test in different browsers

---

**Ready to Ship**: ✅  
**Type Check**: ✅ Passing  
**Lint Check**: ✅ No errors  
**Database**: ✅ Schema updated  
**Documentation**: ✅ Complete

