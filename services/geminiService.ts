
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

/**
 * Generates a custom car skin image based on a prompt.
 */
export async function generateCarSkin(prompt: string): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A futuristic top-down 2D racing car sprite, ${prompt}, cyberpunk style, isolated on solid white background, high detail, neon accents.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating skin:", error);
    return null;
  }
}

/**
 * Gets real-time commentary based on game events.
 */
export async function getGameCommentary(event: string, score: number): Promise<{ text: string, sentiment: 'positive' | 'negative' | 'neutral' } | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a high-energy cyber-racing announcer. Provide a one-sentence witty commentary on this game event: "${event}". Current score: ${score}. Keep it snarky but fun.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            sentiment: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] }
          },
          required: ["text", "sentiment"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      text: data.text || "Eyes on the road, pilot!",
      sentiment: data.sentiment || "neutral"
    };
  } catch (error) {
    console.error("Error generating commentary:", error);
    return null;
  }
}
