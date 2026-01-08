# Receipt Scanner Feature - Setup & Usage

## Overview

The Receipt Scanner feature uses GPT-4 Vision to automatically extract expense information from receipt images. Users can take photos or upload images of receipts, and the AI will extract:

- Amount
- Date
- Merchant name
- Description
- Suggested category
- Line items
- Additional context

## Files Added/Modified

### New Files
1. **`app/actions/receipt.ts`** - Server action for GPT-4 Vision analysis
2. **`components/receipt-scanner.tsx`** - UI component for image capture and upload

### Modified Files
1. **`components/add-expense-dialog.tsx`** - Added "Scan" tab with receipt scanner integration

## Setup Instructions

### 1. Ensure OpenAI API Key is Configured

Make sure your `.env.local` file has the OpenAI API key with GPT-4 Vision access:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

**Important:** The API key must have access to GPT-4 Vision models (`gpt-4o` or `gpt-4-turbo`).

### 2. Verify OpenAI Configuration

The app already uses OpenAI for semantic search embeddings. The receipt scanner uses the same configuration from `lib/openai.ts`.

### 3. Test the Feature

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the dashboard or expenses page

3. Click "Add Expense" button

4. You'll see a new "📷 Scan" tab (first tab) in the dialog

5. Click "Take Photo" (on mobile) or "Upload Image" (on desktop)

6. Select a receipt image

7. Wait for the AI to analyze (takes 2-5 seconds)

8. Review the extracted data in the success message

9. The form will be auto-filled - you can review and adjust before submitting

## Feature Flow

```
User clicks "Add Expense"
    ↓
Dialog opens with "Scan" tab active
    ↓
User takes photo or uploads image
    ↓
Image is converted to base64
    ↓
Server action calls GPT-4 Vision API
    ↓
AI analyzes receipt and returns JSON
    ↓
Data is parsed and matched to categories
    ↓
Regular expense form is auto-filled
    ↓
Tab switches to "Regular" for review
    ↓
User can adjust and submit
```

## Cost Considerations

- **GPT-4o**: ~$0.01-0.03 per receipt image
- **Monthly estimate**: For 100 receipts/month = $1-3/month
- The feature uses `gpt-4o` model with `detail: "high"` for best accuracy

## Supported Image Formats

- JPEG/JPG
- PNG
- HEIC (if browser supports)
- WebP
- Maximum file size: 10MB

## Error Handling

The component handles:
- Invalid file types
- File size limits
- API errors
- Network issues
- Poor image quality (low confidence scores)

## Testing Checklist

- [ ] Test with a clear receipt photo
- [ ] Test with a blurry/low quality image
- [ ] Test with a receipt in different currencies
- [ ] Test with handwritten receipt
- [ ] Test category matching (verify suggested category is correct)
- [ ] Test form pre-fill (all fields populated correctly)
- [ ] Test mobile camera capture
- [ ] Test desktop file upload
- [ ] Test error states (no API key, invalid image, etc.)
- [ ] Test with different receipt layouts (restaurant, grocery, online, etc.)

## Troubleshooting

### Error: "OpenAI is not configured"
- Ensure `OPENAI_API_KEY` is set in `.env.local`
- Restart the development server after adding the key

### Error: "Model not found" or "Insufficient quota"
- Verify your OpenAI account has access to GPT-4 Vision models
- Check your OpenAI API usage limits and billing

### Low accuracy or confidence
- Ensure receipt image is clear and well-lit
- Avoid blurry or angled photos
- Make sure text is readable

### Category not matched
- The AI suggests categories from your existing category list
- If a category doesn't exist, it will leave it unselected
- Create relevant categories before scanning receipts

## Future Enhancements

Potential improvements to consider:
1. Support for multiple receipts in one session
2. Save receipt images to storage (Cloudinary, S3, etc.)
3. Receipt history and re-analysis
4. Batch processing of multiple receipts
5. Support for PDF receipts
6. Integration with email (scan receipts from email)
7. OCR fallback for faster/cheaper processing
8. Custom receipt templates for recurring merchants

## Technical Details

### GPT-4 Vision Prompt Strategy

The prompt is designed to:
- List all available categories for accurate matching
- Request specific JSON structure for consistent parsing
- Include confidence scoring
- Handle missing information gracefully
- Extract both summary and detailed information

### Image Processing

- Client-side: Images are converted to base64 for API transmission
- Server-side: Base64 is embedded in the vision API request
- No image storage - processed on-the-fly for privacy

### Performance

- Average analysis time: 2-5 seconds
- No client-side image processing (keeps bundle size small)
- Uses React hooks for state management
- Error boundaries prevent crashes

## Privacy & Security

- Receipt images are NOT stored on the server
- Images are processed by OpenAI's API (check OpenAI privacy policy)
- Base64 encoding happens client-side
- No image data is saved to the database (only extracted text)

---

**Status**: ✅ Implemented and ready for testing
**Last Updated**: January 2026

