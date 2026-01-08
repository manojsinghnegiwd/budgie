# Bundle Order Walkthrough

## Your Exact Scenario

**Purchase:**
- Product of $200
- Product of $150
- Discount applied
- **Total paid: $300**

---

## How It Works - Step by Step

### Step 1: Upload Receipt
User clicks "Add Expense" → "📷 Scan" tab → Uploads receipt photo

### Step 2: GPT-4 Vision Analyzes

**AI sees:**
```
Item 1: Wireless Headphones ........ $200.00
Item 2: Smart Speaker .............. $150.00
                            -----------
Subtotal: .......................... $350.00
Bundle Discount: ................... -$50.00
                            -----------
Total: ............................. $300.00
```

**AI extracts:**
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
  "suggestedCategoryName": "Electronics",
  "confidence": 0.95
}
```

### Step 3: Success Message Displayed

```
┌─────────────────────────────────────────────────┐
│ ✓ Receipt analyzed successfully!               │
│                                                 │
│   Merchant: Best Buy                            │
│   Subtotal: $350.00                             │
│   Discounts:                                    │
│     • Bundle discount: -$50.00                  │
│   Final Total: $300.00 (saved $50.00) 💰       │
│   Category: Electronics                         │
│   Confidence: 95%                               │
│                                                 │
│   The form below has been pre-filled.           │
│   Review and adjust as needed.                  │
└─────────────────────────────────────────────────┘
```

### Step 4: Form Auto-Fills

**Description Field:**
```
Electronics bundle purchase
```

**Amount Field:**
```
$300.00  ← The actual amount you paid ✓
```

**Category:**
```
Electronics (auto-selected)
```

**Additional Description:**
```
Merchant: Best Buy. 
Items: Wireless Headphones ($200.00), Smart Speaker ($150.00). 
Subtotal: $350.00 | Discounts: Bundle discount (-$50.00) | Total Savings: $50.00
```

**Date:**
```
2026-01-08 (from receipt or today)
```

### Step 5: User Reviews

User can see:
- ✅ Amount is $300 (correct!)
- ✅ Full breakdown in additional description
- ✅ Both products listed with prices
- ✅ Discount captured: -$50
- ✅ Savings calculated: $50

Can adjust if needed, then clicks "Add Expense"

### Step 6: Saved to Database

```sql
INSERT INTO Expense (
  description: "Electronics bundle purchase",
  amount: 300.00,  ← Budget tracking uses this
  additionalDescription: "Merchant: Best Buy. Items: Wireless Headphones ($200.00), Smart Speaker ($150.00). Subtotal: $350.00 | Discounts: Bundle discount (-$50.00) | Total Savings: $50.00",
  categoryId: "electronics-id",
  date: "2026-01-08",
  ...
)
```

### Step 7: Appears in Expense List

```
┌─────────────────────────────────────────────────┐
│ Electronics bundle purchase          $300.00    │
│ Electronics • Jan 8, 2026                       │
│                                                 │
│ Merchant: Best Buy                              │
│ Items: Wireless Headphones ($200.00),           │
│        Smart Speaker ($150.00)                  │
│ Subtotal: $350.00 | Discounts: Bundle           │
│ discount (-$50.00) | Total Savings: $50.00      │
└─────────────────────────────────────────────────┘
```

---

## Budget Impact

### Your Monthly Budget: $5,000

**After this purchase:**
```
Spent:     $300  ← Correct amount!
Remaining: $4,700
Progress:  6% of budget used
```

**NOT $350** - because that's not what you actually paid!

---

## Searchability

You can now search for this expense using:

✅ **"headphones"** → Finds it (from items)  
✅ **"Best Buy"** → Finds it (from merchant)  
✅ **"bundle"** → Finds it (from discount type)  
✅ **"speaker"** → Finds it (from items)  
✅ **"electronics"** → Finds it (from category)  
✅ **"discount"** → Finds it (from additional description)  
✅ **"saved money"** → Finds it (semantic search)  

All thanks to the comprehensive additional description being indexed!

---

## Why This Is Better Than Before

### Before Enhancement
```
Amount: $300
Items: Product 1, Product 2
```
❌ Lost original prices  
❌ Lost discount information  
❌ Can't see savings  
❌ No pricing breakdown  

### After Enhancement
```
Amount: $300
Items: 
  - Wireless Headphones ($200)
  - Smart Speaker ($150)
Subtotal: $350
Discounts: Bundle discount (-$50)
Total Savings: $50
```
✅ Original prices preserved  
✅ Discount details captured  
✅ Savings tracked  
✅ Full transparency  
✅ Complete audit trail  

---

## Edge Cases Handled

### What if discount makes total less than one item?

**Scenario:**
- Item 1: $200
- Item 2: $150
- Crazy discount: -$250
- **Total: $100**

**Result:**
```
Subtotal: $350.00
Discounts: Black Friday Mega Sale (-$250.00)
Final Total: $100.00 (saved $250.00)
```

Still tracks correctly! Budget shows $100 spent.

---

### What if there's no discount?

**Scenario:**
- Item 1: $200
- Item 2: $150
- **Total: $350** (no discount)

**Result:**
```
Merchant: Best Buy
Items: Wireless Headphones ($200.00), Smart Speaker ($150.00)
```

No discount info shown - clean and simple!

---

### What if multiple discounts stack?

**Scenario:**
- Subtotal: $350
- Bundle discount: -$30
- Coupon code: -$20
- **Total: $300**

**Result:**
```
Subtotal: $350.00
Discounts:
  • Bundle discount: -$30.00
  • Coupon SAVE20: -$20.00
Final Total: $300.00 (saved $50.00)
```

Each discount tracked separately!

---

## Real Receipt Examples

### Example 1: Amazon Order
```
Receipt shows:
  Keyboard: $79.99
  Mouse: $49.99
  Subtotal: $129.98
  Prime Member Discount: -$13.00
  Tax: $9.36
  Total: $126.34

Extracted:
  Amount: $126.34 ✓
  Subtotal: $129.98
  Discounts: Prime Member Discount (-$13.00)
  Tax: $9.36
  Total Savings: $13.00
```

### Example 2: Grocery Store
```
Receipt shows:
  Various items: $87.50
  Loyalty Card Savings: -$12.30
  Total: $75.20

Extracted:
  Amount: $75.20 ✓
  Subtotal: $87.50
  Discounts: Loyalty Card Savings (-$12.30)
  Total Savings: $12.30
```

### Example 3: Buy One Get One
```
Receipt shows:
  2x Shoes @ $60 each: $120.00
  BOGO 50% Off: -$30.00
  Total: $90.00

Extracted:
  Amount: $90.00 ✓
  Subtotal: $120.00
  Discounts: BOGO 50% Off (-$30.00)
  Total Savings: $30.00
```

---

## Summary

Your bundle order scenario is **fully handled**:

✅ **Correct amount saved**: $300 (not $350)  
✅ **Original prices preserved**: $200 + $150  
✅ **Discount captured**: Bundle discount -$50  
✅ **Savings calculated**: You saved $50  
✅ **Fully searchable**: Find by items, merchant, or discount  
✅ **Budget accurate**: Tracks actual spending  
✅ **Complete transparency**: See full breakdown  

**Ready to test with real receipts! 🎉**

---

*Walkthrough created: January 8, 2026*

