# 📷 Receipt Scanner - Quick Start Guide

## How to Use

### Step 1: Open Add Expense Dialog
Click the **"Add Expense"** button on your dashboard or expenses page.

### Step 2: Click the "📷 Scan" Tab
The dialog now has 4 tabs:
- **📷 Scan** (NEW!) - AI-powered receipt scanning
- **Regular** - Manual expense entry
- **Recurring** - Recurring bills
- **Reminder** - Expense reminders

### Step 3: Upload or Take Photo
Two options:
- **Take Photo**: Use your device camera (works on mobile)
- **Upload Image**: Select an image from your device

### Step 4: Wait for Analysis
The AI will analyze your receipt (takes 2-5 seconds) and extract:
- ✅ Total amount
- ✅ Date
- ✅ Merchant name
- ✅ Description
- ✅ Suggested category (matched from your existing categories)
- ✅ Line items
- ✅ Additional details

### Step 5: Review & Submit
After analysis:
- The form automatically switches to the **Regular** tab
- All fields are pre-filled with the extracted data
- Review the information
- Adjust any fields if needed
- Click **"Add Expense"** to save

---

## Tips for Best Results

### 📸 Take Clear Photos
- Ensure good lighting
- Hold camera straight (not at an angle)
- Make sure all text is visible
- Avoid blurry or shaky photos

### 💡 Supported Receipt Types
- ✅ Grocery receipts
- ✅ Restaurant bills
- ✅ Online purchase confirmations
- ✅ Gas station receipts
- ✅ Store receipts
- ✅ Service invoices
- ✅ Utility bills

### 🎯 Category Matching
The AI will suggest a category based on:
- Your existing categories in Budgie
- The merchant name
- The items purchased
- Receipt context

If no good match is found, you can select the category manually.

---

## Example Workflow

```
📱 User: Grocery shopping at Whole Foods
         Amount: $156.78

1. Click "Add Expense"
2. Click "📷 Scan" tab
3. Take photo of receipt
4. AI extracts:
   - Description: "Whole Foods groceries"
   - Amount: 156.78
   - Category: "Groceries" ✓
   - Merchant: "Whole Foods"
   - Items: "Organic apples, milk, bread, chicken..."
5. Review form (already filled)
6. Click "Add Expense"
✅ Done!
```

---

## Troubleshooting

### "OpenAI is not configured"
**Solution**: Make sure `OPENAI_API_KEY` is set in your `.env.local` file.

### Low Confidence / Incorrect Data
**Solution**: 
- Retake the photo with better lighting
- Make sure receipt is not wrinkled or damaged
- Manually adjust the fields if needed

### Category Not Matched
**Solution**:
- The AI only suggests from your existing categories
- If you don't have the right category, add it first in Settings
- You can always select/change the category manually

### Image Upload Failed
**Solution**:
- Check image size (max 10MB)
- Use supported formats (JPG, PNG, HEIC, WebP)
- Check your internet connection

---

## Privacy & Data

- ✅ Receipt images are **not stored** on the server
- ✅ Images are processed in real-time
- ✅ Only extracted text data is saved to your database
- ✅ Processing is done via OpenAI API (end-to-end encrypted)

---

## Cost

The receipt scanner uses OpenAI's GPT-4 Vision API:
- **Cost per scan**: ~$0.01-0.03
- **100 scans/month**: ~$1-3/month
- Your OpenAI API key is used for billing

---

## Feedback & Support

Found a bug or have a suggestion? 
- Check the logs in your browser console
- Report issues with example receipt types
- Suggest improvements for better accuracy

---

**Happy scanning! 🎉**

