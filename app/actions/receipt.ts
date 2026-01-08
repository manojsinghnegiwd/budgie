"use server";

import { openai } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

export interface ReceiptAnalysisResult {
  description: string;
  amount: number; // Final total after all discounts
  date: string;
  suggestedCategoryId?: string;
  suggestedCategoryName?: string;
  merchant?: string;
  items?: Array<{
    name: string;
    price: number;
  }>;
  subtotal?: number; // Pre-discount subtotal
  discounts?: Array<{
    name: string; // e.g., "Bundle discount", "Coupon", "20% off"
    amount: number; // Discount amount (positive number)
  }>;
  totalSavings?: number; // Sum of all discounts
  tax?: number; // Tax amount if shown separately
  confidence: number;
  additionalDescription?: string;
}

/**
 * Analyze a receipt image using GPT-4 Vision
 * @param base64Image - Base64 encoded image (without data URL prefix)
 * @param mimeType - MIME type of the image (e.g., "image/jpeg")
 * @returns Structured receipt data
 */
export interface MultiImageReceiptData {
  base64: string;
  mimeType: string;
}

/**
 * Analyze multiple receipt images as a single order using GPT-4 Vision
 * @param images - Array of base64 encoded images with their MIME types
 * @returns Consolidated structured receipt data for a single expense
 */
export async function analyzeMultipleReceiptImages(
  images: MultiImageReceiptData[]
): Promise<ReceiptAnalysisResult> {
  if (!openai) {
    throw new Error(
      "OpenAI is not configured. Please set OPENAI_API_KEY environment variable."
    );
  }

  if (images.length === 0) {
    throw new Error("At least one image is required");
  }

  // If only one image, use the single image function
  if (images.length === 1) {
    return analyzeReceiptImage(images[0].base64, images[0].mimeType);
  }

  // Fetch categories for context
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const categoryList = categories.map((c) => c.name).join(", ");

  try {
    // Build content array with text prompt and all images
    const content: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail: "high" } }
    > = [
      {
        type: "text",
        text: `Analyze these ${images.length} receipt/bill images. IMPORTANT: All these images belong to the SAME ORDER/PURCHASE. They may be:
- Multiple pages of the same receipt
- Different angles of the same receipt
- Itemized receipt + payment confirmation
- Any combination showing parts of ONE transaction

Combine all information from ALL images into a SINGLE expense entry.

Available expense categories: ${categoryList}

Extract and CONSOLIDATE the following from ALL images:
1. Final total amount paid (the actual amount charged - only count once, not per image)
2. Date (in YYYY-MM-DD format, use the most specific date found)
3. Merchant/store name
4. Brief description of the purchase
5. Best matching category from the available list
6. ALL line items with individual prices (combine from all images, avoid duplicates)
7. Subtotal before discounts (if shown)
8. All discounts applied (bundle deals, coupons, percentage off, etc.)
9. Tax amount (if shown separately)
10. Any additional details useful for expense tracking

IMPORTANT for discounts:
- If items total $350 but final total is $300, extract the $50 discount
- Capture discount names/reasons (e.g., "Bundle discount", "Member savings", "20% off")
- List each discount separately if multiple discounts applied
- Do NOT sum totals from multiple images - find the FINAL total
- Combine item lists but avoid counting the same item twice
- If different images show different totals, use the final/grand total

Return ONLY a valid JSON object with this exact structure:
{
  "description": "Brief description of purchase",
  "amount": 123.45,
  "date": "YYYY-MM-DD",
  "suggestedCategoryName": "Category name from the list",
  "merchant": "Store name",
  "items": [
    {"name": "Item 1", "price": 50.00},
    {"name": "Item 2", "price": 75.00}
  ],
  "subtotal": 125.00,
  "discounts": [
    {"name": "Bundle discount", "amount": 10.00}
  ],
  "totalSavings": 10.00,
  "tax": 8.45,
  "additionalDescription": "Any additional context",
  "confidence": 0.9
}

Important:
- Return ONLY the JSON object, no markdown formatting or code blocks
- Ensure amount is a number without currency symbols
- Match the category name exactly as it appears in the provided list
- Set confidence between 0 and 1 based on overall image quality and how well information correlates`,
      },
    ];

    // Add all images to the content
    for (const image of images) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${image.mimeType};base64,${image.base64}`,
          detail: "high",
        },
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content,
        },
      ],
      max_tokens: 1500, // Increased for multiple images
      temperature: 0.1,
    });

    const responseContent = response.choices[0]?.message?.content || "{}";

    const jsonContent = responseContent
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(jsonContent);

    const matchedCategory = categories.find(
      (c) =>
        c.name.toLowerCase() === parsed.suggestedCategoryName?.toLowerCase()
    );

    return {
      description: parsed.description || "Receipt expense",
      amount: parseFloat(parsed.amount) || 0,
      date: parsed.date || new Date().toISOString().split("T")[0],
      suggestedCategoryId: matchedCategory?.id,
      suggestedCategoryName: parsed.suggestedCategoryName,
      merchant: parsed.merchant,
      items: parsed.items || [],
      subtotal: parsed.subtotal ? parseFloat(parsed.subtotal) : undefined,
      discounts: parsed.discounts || [],
      totalSavings: parsed.totalSavings
        ? parseFloat(parsed.totalSavings)
        : undefined,
      tax: parsed.tax ? parseFloat(parsed.tax) : undefined,
      additionalDescription: parsed.additionalDescription,
      confidence: parseFloat(parsed.confidence) || 0.5,
    };
  } catch (error) {
    console.error("Error analyzing receipt images:", error);
    throw new Error(
      "Failed to analyze receipts. Please check the image quality and try again."
    );
  }
}

export async function analyzeReceiptImage(
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<ReceiptAnalysisResult> {
  if (!openai) {
    throw new Error(
      "OpenAI is not configured. Please set OPENAI_API_KEY environment variable."
    );
  }

  // Fetch categories for context
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const categoryList = categories.map((c) => c.name).join(", ");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // GPT-4 with vision capabilities
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this receipt/bill image and extract expense information.

Available expense categories: ${categoryList}

Extract the following information from the receipt:
1. Final total amount paid (as a number, no currency symbols)
2. Date (in YYYY-MM-DD format, use today's date if not visible)
3. Merchant/store name
4. Brief description of the purchase
5. Best matching category from the available list
6. Line items with individual prices (if visible)
7. Subtotal before discounts (if shown)
8. All discounts applied (bundle deals, coupons, percentage off, etc.)
9. Tax amount (if shown separately)
10. Any additional details that might be useful for expense tracking

IMPORTANT for discounts:
- If items total $350 but final total is $300, extract the $50 discount
- Capture discount names/reasons (e.g., "Bundle discount", "Member savings", "20% off")
- List each discount separately if multiple discounts applied

Return ONLY a valid JSON object with this exact structure:
{
  "description": "Brief description of purchase",
  "amount": 123.45,
  "date": "YYYY-MM-DD",
  "suggestedCategoryName": "Category name from the list",
  "merchant": "Store name",
  "items": [
    {"name": "Item 1", "price": 50.00},
    {"name": "Item 2", "price": 75.00}
  ],
  "subtotal": 125.00,
  "discounts": [
    {"name": "Bundle discount", "amount": 10.00},
    {"name": "Coupon code ABC", "amount": 5.00}
  ],
  "totalSavings": 15.00,
  "tax": 8.45,
  "additionalDescription": "Any additional context like payment method, special notes",
  "confidence": 0.9
}

Important:
- Return ONLY the JSON object, no markdown formatting or code blocks
- Ensure amount is a number without currency symbols
- Match the category name exactly as it appears in the provided list
- Set confidence between 0 and 1 based on image quality and readability`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for more consistent extraction
    });

    const content = response.choices[0]?.message?.content || "{}";
    
    // Remove markdown code blocks if present
    const jsonContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    
    const parsed = JSON.parse(jsonContent);

    // Match suggested category to ID
    const matchedCategory = categories.find(
      (c) =>
        c.name.toLowerCase() === parsed.suggestedCategoryName?.toLowerCase()
    );

    return {
      description: parsed.description || "Receipt expense",
      amount: parseFloat(parsed.amount) || 0,
      date: parsed.date || new Date().toISOString().split("T")[0],
      suggestedCategoryId: matchedCategory?.id,
      suggestedCategoryName: parsed.suggestedCategoryName,
      merchant: parsed.merchant,
      items: parsed.items || [],
      subtotal: parsed.subtotal ? parseFloat(parsed.subtotal) : undefined,
      discounts: parsed.discounts || [],
      totalSavings: parsed.totalSavings ? parseFloat(parsed.totalSavings) : undefined,
      tax: parsed.tax ? parseFloat(parsed.tax) : undefined,
      additionalDescription: parsed.additionalDescription,
      confidence: parseFloat(parsed.confidence) || 0.5,
    };
  } catch (error) {
    console.error("Error analyzing receipt image:", error);
    throw new Error(
      "Failed to analyze receipt. Please check the image quality and try again."
    );
  }
}

