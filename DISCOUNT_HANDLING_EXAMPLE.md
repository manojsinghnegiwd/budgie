# Discount & Bundle Handling Examples

## How Bundle Orders Are Processed

The receipt scanner now intelligently handles discounts, bundle deals, and multi-item purchases.

---

## Example 1: Bundle Discount

### Scenario
You buy two products:
- Product A: $200
- Product B: $150
- **Subtotal**: $350
- **Bundle Discount**: -$50
- **Final Total**: $300

### What Gets Extracted

```json
{
  "description": "Electronics bundle purchase",
  "amount": 300.00,
  "merchant": "Best Buy",
  "items": [
    {"name": "Wireless Headphones", "price": 200.00},
    {"name": "Smart Speaker", "price": 150.00}
  ],
  "subtotal": 350.00,
  "discounts": [
    {"name": "Bundle discount", "amount": 50.00}
  ],
  "totalSavings": 50.00,
  "suggestedCategoryName": "Electronics"
}
```

### What You'll See in the App

**Success Message:**
```
✓ Receipt analyzed successfully!
  Merchant: Best Buy
  Subtotal: $350.00
  Discounts:
    • Bundle discount: -$50.00
  Final Total: $300.00 (saved $50.00)
  Category: Electronics
```

**Additional Description Field:**
```
Merchant: Best Buy. Items: Wireless Headphones ($200.00), Smart Speaker ($150.00). 
Subtotal: $350.00 | Discounts: Bundle discount (-$50.00) | Total Savings: $50.00
```

**Amount Field:** `$300.00` ✅ (What you actually paid)

---

## Example 2: Multiple Discounts

### Scenario
- Product: $100
- Coupon Code: -$10
- Member Discount: -$5
- **Final Total**: $85

### What Gets Extracted

```json
{
  "amount": 85.00,
  "subtotal": 100.00,
  "discounts": [
    {"name": "Coupon CODE123", "amount": 10.00},
    {"name": "Member savings", "amount": 5.00}
  ],
  "totalSavings": 15.00
}
```

**Additional Description:**
```
Subtotal: $100.00 | Discounts: Coupon CODE123 (-$10.00), Member savings (-$5.00) | 
Total Savings: $15.00
```

---

## Example 3: Grocery Receipt with Store Card

### Scenario
- Groceries: $87.50
- Store Card Savings: -$12.30
- Tax: +$5.10
- **Final Total**: $80.30

### What Gets Extracted

```json
{
  "amount": 80.30,
  "subtotal": 87.50,
  "discounts": [
    {"name": "Loyalty card savings", "amount": 12.30}
  ],
  "totalSavings": 12.30,
  "tax": 5.10
}
```

**Success Message:**
```
✓ Receipt analyzed successfully!
  Merchant: Whole Foods
  Subtotal: $87.50
  Discounts:
    • Loyalty card savings: -$12.30
  Tax: $5.10
  Final Total: $80.30 (saved $12.30)
```

---

## Example 4: Restaurant Split Bill

### Scenario
- Appetizer: $15
- Main Course: $28
- Dessert: $12
- **Subtotal**: $55
- **Tax**: $4.40
- **Tip**: $11 (already included)
- **Total**: $70.40

### What Gets Extracted

```json
{
  "amount": 70.40,
  "items": [
    {"name": "Appetizer", "price": 15.00},
    {"name": "Main Course", "price": 28.00},
    {"name": "Dessert", "price": 12.00}
  ],
  "subtotal": 55.00,
  "tax": 4.40,
  "additionalDescription": "Tip included: $11.00"
}
```

---

## Why This Approach Works

### ✅ Accurate Budgeting
- **Amount = What you paid** ($300, not $350)
- Your budget tracking is based on actual spending

### ✅ Context Preserved
- Original prices stored in items array
- Discount details saved for reference
- You can see what you saved

### ✅ Searchable
- All details go into `additionalDescription`
- Included in semantic search embeddings
- Can search for "bundle discount" or "Wireless Headphones"

### ✅ Transparent
- Success message shows full breakdown
- You can review before submitting
- Easy to spot AI errors

---

## Edge Cases Handled

### Case 1: No Discounts
If subtotal = final total, no discount info is shown:
```
Amount: $100.00
Items: Product A, Product B
(No discount information displayed)
```

### Case 2: Buy One Get One Free
```
Subtotal: $60.00 (2 items @ $30 each)
Discounts: BOGO Free (-$30.00)
Total: $30.00
```

### Case 3: Percentage Discounts
```
Subtotal: $200.00
Discounts: 20% off storewide (-$40.00)
Total: $160.00
```

### Case 4: Price Adjustments
```
Subtotal: $150.00
Discounts: Price match adjustment (-$25.00)
Total: $125.00
```

---

## How It Appears in Your Expense History

When you view this expense later:

**Description:** "Electronics bundle purchase"
**Amount:** $300.00
**Additional Description:**
```
Merchant: Best Buy. 
Items: Wireless Headphones ($200.00), Smart Speaker ($150.00). 
Subtotal: $350.00 | Discounts: Bundle discount (-$50.00) | Total Savings: $50.00
```

This means:
- ✅ Your budget shows correct spend: $300
- ✅ Search for "headphones" finds this expense
- ✅ You can see you saved $50
- ✅ Full receipt context is preserved

---

## Testing Your Bundle Order

To test with your specific scenario:

1. Take a photo of a receipt with:
   - Item 1: $200
   - Item 2: $150
   - Discount: -$50
   - Total: $300

2. Upload via the "📷 Scan" tab

3. Check the success message shows:
   - Subtotal: $350.00
   - Discounts: [discount name] -$50.00
   - Final Total: $300.00 (saved $50.00)

4. Verify the additional description includes all details

5. Submit and confirm the expense shows $300.00

---

## Future Enhancements

Potential additions:
- **Split by discount ratio**: Allocate discount proportionally to items
- **Savings dashboard**: Track total savings per month/category
- **Discount analytics**: "You save most on groceries"
- **Price history**: Compare prices over time for same items
- **Tax optimization**: Separate tax for business expense reports

---

**Status**: ✅ Implemented and ready to test!

**Last Updated**: January 8, 2026

