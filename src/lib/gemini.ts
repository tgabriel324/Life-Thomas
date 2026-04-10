import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini AI client
// Note: process.env.GEMINI_API_KEY is automatically provided by the platform
export const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

/**
 * Generates an embedding for the given text using the recommended model.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: [{
        parts: [{ text }]
      }]
    });
    return result.embeddings[0].values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}
