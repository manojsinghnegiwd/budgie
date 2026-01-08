import OpenAI from "openai";

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set. Semantic search will not work.");
}

// Initialize OpenAI client
export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Model to use for embeddings (1536 dimensions)
export const EMBEDDING_MODEL = "text-embedding-3-small";

/**
 * Check if OpenAI is configured and available
 */
export function isOpenAIAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY && !!openai;
}

