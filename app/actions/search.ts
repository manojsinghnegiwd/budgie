"use server";

import { prisma } from "@/lib/prisma";
import {
  searchSimilarExpenses,
  upsertExpenseEmbedding,
  batchUpsertExpenseEmbeddings,
} from "@/lib/embeddings";
import { ensureIndexExists, isPineconeAvailable } from "@/lib/pinecone";
import { isOpenAIAvailable } from "@/lib/openai";
import type { Expense, Category, User } from "@prisma/client";

/**
 * Check if semantic search is available (requires both OpenAI and Pinecone)
 */
export async function isSemanticSearchAvailable(): Promise<boolean> {
  return isOpenAIAvailable() && isPineconeAvailable();
}

export type SearchResult = Expense & {
  category: Category;
  user: User;
  score: number;
};

/**
 * Fallback search using traditional SQL text search
 */
async function fallbackTextSearch(
  query: string,
  filters?: {
    userId?: string | null;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<SearchResult[]> {
  const whereClause: any = {
    OR: [
      {
        description: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        additionalDescription: {
          contains: query,
          mode: "insensitive",
        },
      },
    ],
  };

  // Apply filters
  if (filters?.userId !== undefined && filters.userId !== null) {
    whereClause.userId = filters.userId;
  }
  if (filters?.categoryId) {
    whereClause.categoryId = filters.categoryId;
  }
  if (filters?.startDate || filters?.endDate) {
    whereClause.date = {};
    if (filters.startDate) {
      whereClause.date.gte = filters.startDate;
    }
    if (filters.endDate) {
      whereClause.date.lte = filters.endDate;
    }
  }

  const expenses = await prisma.expense.findMany({
    where: whereClause,
    include: {
      category: true,
      user: true,
    },
    orderBy: {
      date: "desc",
    },
    take: filters?.limit || 20,
  });

  // Add a default score for fallback results
  return expenses.map((expense) => ({
    ...expense,
    score: 1.0,
  }));
}

/**
 * Search expenses semantically using natural language
 */
export async function searchExpenses(
  query: string,
  filters?: {
    userId?: string | null;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    // Try semantic search first
    try {
      const similarExpenses = await searchSimilarExpenses(query, {
        userId: filters?.userId,
        categoryId: filters?.categoryId,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        topK: filters?.limit || 20,
      });

      if (similarExpenses.length === 0) {
        return [];
      }

      // Get expense IDs
      const expenseIds = similarExpenses.map((result) => result.id);

      // Fetch full expense data from database
      const expenses = await prisma.expense.findMany({
        where: {
          id: {
            in: expenseIds,
          },
        },
        include: {
          category: true,
          user: true,
        },
      });

      // Create a map of expenses by ID for quick lookup
      const expenseMap = new Map(
        expenses.map((expense) => [expense.id, expense])
      );

      // Combine expenses with similarity scores, maintaining order
      const results: SearchResult[] = [];
      for (const similar of similarExpenses) {
        const expense = expenseMap.get(similar.id);
        if (expense) {
          results.push({
            ...expense,
            score: similar.score,
          });
        }
      }

      return results;
    } catch (semanticError: any) {
      // If semantic search fails due to missing configuration, fall back to text search
      if (
        semanticError.message?.includes("not configured") ||
        semanticError.message?.includes("OPENAI_API_KEY") ||
        semanticError.message?.includes("PINECONE_API_KEY")
      ) {
        console.warn(
          "Semantic search not available, falling back to text search:",
          semanticError.message
        );
        return await fallbackTextSearch(query, filters);
      }
      // Re-throw other errors
      throw semanticError;
    }
  } catch (error) {
    console.error("Error searching expenses:", error);
    throw new Error(
      `Failed to search expenses: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Sync a single expense embedding to Pinecone
 */
export async function syncExpenseEmbedding(expenseId: string): Promise<void> {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      select: {
        id: true,
        description: true,
        additionalDescription: true,
        userId: true,
        categoryId: true,
        date: true,
        amount: true,
      },
    });

    if (!expense) {
      throw new Error(`Expense ${expenseId} not found`);
    }

    await upsertExpenseEmbedding(expense);
  } catch (error) {
    console.error("Error syncing expense embedding:", error);
    throw error;
  }
}

/**
 * Backfill all expense embeddings to Pinecone (for bulk sync)
 * This is designed to be called from a script, not from the UI
 */
export async function syncAllEmbeddings(options?: {
  batchSize?: number;
  onProgress?: (processed: number, total: number) => void;
}): Promise<{ success: number; failed: number }> {
  const batchSize = options?.batchSize || 100;
  let success = 0;
  let failed = 0;

  try {
    // Ensure Pinecone index exists
    await ensureIndexExists();

    // Get total count
    const totalCount = await prisma.expense.count();
    console.log(`Found ${totalCount} expenses to sync`);

    // Process in batches
    let offset = 0;
    while (offset < totalCount) {
      try {
        const expenses = await prisma.expense.findMany({
          select: {
            id: true,
            description: true,
            additionalDescription: true,
            userId: true,
            categoryId: true,
            date: true,
            amount: true,
          },
          skip: offset,
          take: batchSize,
        });

        if (expenses.length === 0) break;

        await batchUpsertExpenseEmbeddings(expenses);
        success += expenses.length;

        if (options?.onProgress) {
          options.onProgress(offset + expenses.length, totalCount);
        }

        console.log(
          `Synced ${offset + expenses.length}/${totalCount} expenses`
        );

        offset += batchSize;
      } catch (error) {
        console.error(`Error syncing batch at offset ${offset}:`, error);
        failed += batchSize;
        offset += batchSize;
      }
    }

    console.log(
      `Sync complete: ${success} successful, ${failed} failed out of ${totalCount} total`
    );
    return { success, failed };
  } catch (error) {
    console.error("Error syncing all embeddings:", error);
    throw error;
  }
}

