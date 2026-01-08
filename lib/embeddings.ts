import { openai, EMBEDDING_MODEL } from "./openai";
import { getIndex } from "./pinecone";
import type { Expense } from "@prisma/client";

// Confidence threshold constants for filtering search results
const MIN_CONFIDENCE_THRESHOLD = 0.2; // 20% hard floor
const RELATIVE_THRESHOLD_RATIO = 0.5; // Within 50% of top score

/**
 * Combine description and additionalDescription for embedding
 */
export function getEmbeddingText(
  description: string,
  additionalDescription?: string | null
): string {
  const parts = [description];
  if (additionalDescription) {
    parts.push(additionalDescription);
  }
  return parts.join(". ");
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error(
      "OpenAI is not configured. Please set OPENAI_API_KEY environment variable."
    );
  }
  
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts (batch processing)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!openai) {
    throw new Error(
      "OpenAI is not configured. Please set OPENAI_API_KEY environment variable."
    );
  }
  
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      encoding_format: "float",
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}

/**
 * Upsert an expense embedding to Pinecone
 */
export async function upsertExpenseEmbedding(
  expense: Pick<
    Expense,
    | "id"
    | "description"
    | "additionalDescription"
    | "userId"
    | "categoryId"
    | "date"
    | "amount"
  >
): Promise<void> {
  try {
    const embeddingText = getEmbeddingText(
      expense.description,
      expense.additionalDescription
    );
    const embedding = await generateEmbedding(embeddingText);

    const index = await getIndex();
    await index.upsert([
      {
        id: expense.id,
        values: embedding,
        metadata: {
          userId: expense.userId,
          categoryId: expense.categoryId,
          date: expense.date.toISOString(),
          amount: expense.amount,
          description: expense.description,
          additionalDescription: expense.additionalDescription || "",
        },
      },
    ]);
  } catch (error) {
    console.error("Error upserting expense embedding:", error);
    throw error;
  }
}

/**
 * Batch upsert expense embeddings to Pinecone
 */
export async function batchUpsertExpenseEmbeddings(
  expenses: Pick<
    Expense,
    | "id"
    | "description"
    | "additionalDescription"
    | "userId"
    | "categoryId"
    | "date"
    | "amount"
  >[]
): Promise<void> {
  if (expenses.length === 0) return;

  try {
    // Generate embeddings for all expenses
    const texts = expenses.map((expense) =>
      getEmbeddingText(expense.description, expense.additionalDescription)
    );
    const embeddings = await generateEmbeddings(texts);

    // Prepare vectors for upsert
    const vectors = expenses.map((expense, idx) => ({
      id: expense.id,
      values: embeddings[idx],
      metadata: {
        userId: expense.userId,
        categoryId: expense.categoryId,
        date: expense.date.toISOString(),
        amount: expense.amount,
        description: expense.description,
        additionalDescription: expense.additionalDescription || "",
      },
    }));

    // Upsert in batches of 100 (Pinecone limit)
    const index = await getIndex();
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }
  } catch (error) {
    console.error("Error batch upserting expense embeddings:", error);
    throw error;
  }
}

/**
 * Delete an expense embedding from Pinecone
 */
export async function deleteExpenseEmbedding(expenseId: string): Promise<void> {
  try {
    const index = await getIndex();
    await index.deleteOne(expenseId);
  } catch (error) {
    console.error("Error deleting expense embedding:", error);
    throw error;
  }
}

/**
 * Search for similar expenses using semantic search
 */
export async function searchSimilarExpenses(
  query: string,
  options?: {
    userId?: string | null;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    topK?: number;
  }
): Promise<
  Array<{
    id: string;
    score: number;
    metadata: {
      userId: string;
      categoryId: string;
      date: string;
      amount: number;
      description: string;
      additionalDescription: string;
    };
  }>
> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Build filter
    const filter: Record<string, any> = {};
    if (options?.userId) {
      filter.userId = { $eq: options.userId };
    }
    if (options?.categoryId) {
      filter.categoryId = { $eq: options.categoryId };
    }
    if (options?.startDate || options?.endDate) {
      filter.date = {};
      if (options.startDate) {
        filter.date.$gte = options.startDate.toISOString();
      }
      if (options.endDate) {
        filter.date.$lte = options.endDate.toISOString();
      }
    }

    // Search Pinecone
    const index = await getIndex();
    const results = await index.query({
      vector: queryEmbedding,
      topK: options?.topK || 20,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    // Filter by confidence thresholds
    const filteredMatches = results.matches.filter((match) => {
      const score = match.score ?? 0;
      const topScore = results.matches[0]?.score ?? 0;
      const relativeThreshold = topScore * RELATIVE_THRESHOLD_RATIO;
      const effectiveThreshold = Math.max(MIN_CONFIDENCE_THRESHOLD, relativeThreshold);
      return score >= effectiveThreshold;
    });

    // Format results
    return filteredMatches.map((match) => ({
      id: match.id,
      score: match.score ?? 0,
      metadata: match.metadata as {
        userId: string,
        categoryId: string,
        date: string,
        amount: number,
        description: string,
        additionalDescription: string,
      },
    }));
  } catch (error) {
    console.error("Error searching similar expenses:", error);
    throw error;
  }
}

