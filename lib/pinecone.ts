import { Pinecone } from "@pinecone-database/pinecone";

// Check for Pinecone API key
if (!process.env.PINECONE_API_KEY) {
  console.warn("PINECONE_API_KEY is not set. Semantic search will not work.");
}

// Initialize Pinecone client
export const pinecone = process.env.PINECONE_API_KEY
  ? new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })
  : null;

// Index name for expense embeddings
export const INDEX_NAME = process.env.PINECONE_INDEX_NAME || "budgie-expenses";

/**
 * Check if Pinecone is configured and available
 */
export function isPineconeAvailable(): boolean {
  return !!process.env.PINECONE_API_KEY && !!pinecone;
}

// Get the index
export async function getIndex() {
  if (!pinecone) {
    throw new Error(
      "Pinecone is not configured. Please set PINECONE_API_KEY environment variable."
    );
  }
  return pinecone.index(INDEX_NAME);
}

// Create index if it doesn't exist
export async function ensureIndexExists() {
  if (!pinecone) {
    throw new Error(
      "Pinecone is not configured. Please set PINECONE_API_KEY environment variable."
    );
  }
  
  try {
    const existingIndexes = await pinecone.listIndexes();
    const indexExists = existingIndexes.indexes?.some(
      (index) => index.name === INDEX_NAME
    );

    if (!indexExists) {
      console.log(`Creating Pinecone index: ${INDEX_NAME}`);
      await pinecone.createIndex({
        name: INDEX_NAME,
        dimension: 1536, // text-embedding-3-small dimensions
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
      });
      
      // Wait for index to be ready
      console.log("Waiting for index to be ready...");
      let isReady = false;
      while (!isReady) {
        const description = await pinecone.describeIndex(INDEX_NAME);
        isReady = description.status?.ready ?? false;
        if (!isReady) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      console.log("Index is ready!");
    }
  } catch (error) {
    console.error("Error ensuring index exists:", error);
    throw error;
  }
}

