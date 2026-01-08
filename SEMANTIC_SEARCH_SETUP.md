# Semantic Search Setup Guide

This guide explains how to set up and use the semantic search feature for expenses.

## Overview

The semantic search feature allows you to search for expenses using natural language queries. It uses:
- **OpenAI Embeddings** (text-embedding-3-small) to convert expense descriptions into vectors
- **Pinecone** as a vector database to store and search embeddings

**Note**: If semantic search is not configured (missing API keys), the app will automatically fall back to traditional keyword-based text search. The application works perfectly fine without semantic search enabled.

## Prerequisites

1. **OpenAI API Key**: Get one from https://platform.openai.com/api-keys
2. **Pinecone Account**: Sign up at https://www.pinecone.io/ (free tier available)

## Environment Variables

Add these to your `.env.local` file:

```bash
# OpenAI (for semantic search embeddings)
OPENAI_API_KEY="sk-..."

# Pinecone (for vector search)
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX_NAME="budgie-expenses"
```

## Database Schema

The `Expense` model now includes an optional `additionalDescription` field:

```prisma
model Expense {
  // ... existing fields ...
  description           String
  additionalDescription String?  // Optional field for extra searchable context
  // ... other fields ...
}
```

## Initial Setup

### 1. Apply Database Migration

The migration has already been applied if you followed the implementation. The `additionalDescription` column should exist in your Turso database.

### 2. Create Pinecone Index

The index will be created automatically when you run the backfill script. Alternatively, you can create it manually:

- **Dimensions**: 1536 (for text-embedding-3-small)
- **Metric**: cosine
- **Cloud**: AWS
- **Region**: us-east-1 (or your preferred region)

### 3. Backfill Existing Expenses

Run the backfill script to generate embeddings for all existing expenses:

```bash
npx tsx scripts/backfill-embeddings.ts
```

This will:
- Create the Pinecone index if it doesn't exist
- Fetch all expenses from your database
- Generate embeddings for each expense's description
- Upload vectors to Pinecone in batches
- Show progress and completion statistics

## Usage

### Adding/Editing Expenses

When creating or editing an expense, you can now add:
- **Description**: The main description (required)
- **Additional Details**: Optional extra context that will be included in semantic search

Both fields are embedded together for richer semantic matching.

### Searching

1. Navigate to the **Search** page (via sidebar or mobile nav)
2. Enter a natural language query, for example:
   - "groceries from last month"
   - "coffee expenses"
   - "costco purchases"
   - "rent and utilities"
3. Use filters to narrow down results:
   - **Category**: Search within a specific category
   - **User**: Search expenses from a specific user or all users

### How It Works

```
User Query → OpenAI Embedding → Pinecone Search → Expense IDs → Turso Fetch → Results
```

1. Your search query is converted to an embedding
2. Pinecone finds the most similar expense embeddings
3. Expense IDs are returned with similarity scores
4. Full expense data is fetched from Turso
5. Results are displayed with match percentages

## Maintenance

### Syncing New Expenses

New expenses are automatically embedded when:
- Creating a new expense (regular, recurring, or reminder)
- Updating an expense's description or additional description
- Embeddings are deleted when expenses are deleted

### Re-running Backfill

If you need to regenerate all embeddings:

```bash
npx tsx scripts/backfill-embeddings.ts
```

The script is idempotent and safe to run multiple times.

## Cost Considerations

### OpenAI

- **Model**: text-embedding-3-small
- **Cost**: ~$0.02 per 1M tokens
- **Typical expense**: ~10-50 tokens
- **Estimate**: ~1,000-5,000 expenses per $0.01

### Pinecone

- **Free Tier**: 1 index, 100K vectors, includes querying
- **Paid Tier**: If you exceed free tier limits

For a typical household budget app with hundreds to low thousands of expenses, the free tiers should be sufficient.

## Fallback Search

If semantic search is not configured or unavailable, the app automatically uses traditional SQL text search:
- Searches in both `description` and `additionalDescription` fields
- Case-insensitive keyword matching
- Supports all the same filters (user, category, date range)

The UI will display a yellow info banner when using fallback text search.

## Troubleshooting

### "Failed to search expenses" error

**Error**: Console shows "Failed to search expenses"

**Solution**: Check the browser console or server logs for the specific error. Common causes:
- Missing `OPENAI_API_KEY` or `PINECONE_API_KEY` → App will fallback to text search
- Invalid API keys → Verify your keys are correct
- Network issues → Check your internet connection
- Pinecone index doesn't exist → Run the backfill script

### Yellow banner: "Using Basic Text Search"

This means semantic search is not configured. To enable semantic search:
1. Add `OPENAI_API_KEY` and `PINECONE_API_KEY` to `.env.local`
2. Run `npx tsx scripts/backfill-embeddings.ts`
3. Restart your development server

### "No results found"

- Ensure the backfill script completed successfully
- Check that your Pinecone API key is valid
- Verify the index name matches your environment variable
- Try the text search fallback by temporarily removing API keys

### Slow search

- Pinecone queries are typically very fast (<100ms)
- If slow, check your network connection and Pinecone region
- Text search fallback is also very fast for databases with reasonable size

### Embeddings not updating

- Check server logs for errors
- Ensure OpenAI API key has sufficient credits
- Verify network connectivity to OpenAI and Pinecone
- Check that expense creation/update actions complete successfully

## Technical Details

### Embedding Model

- **Model**: text-embedding-3-small
- **Dimensions**: 1536
- **Context Length**: 8191 tokens

### Vector Storage

- **Provider**: Pinecone serverless
- **Metric**: Cosine similarity
- **Metadata**: userId, categoryId, date, amount, descriptions

### Search Parameters

- **Top K**: 20 results (configurable)
- **Filters**: User, category, date range
- **Score**: Cosine similarity (0-1, higher is better match)

