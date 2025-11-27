import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateContinuation = async (currentText: string): Promise<string> => {
  try {
    const prompt = `You are a helpful writing assistant. Continue the following text naturally. Maintain the tone and style of the existing text. Do not repeat the last sentence provided. Just provide the continuation text immediately without any conversational filler.\n\n---\n${currentText}\n---`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text generated from Gemini.");
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
