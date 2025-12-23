import { GoogleGenAI, Type } from "@google/genai";
import { PlayerSuit, PoolAnalysisResponse } from "./types";

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          targetBallColor: { type: Type.STRING },
          targetBallLocation: { type: Type.STRING },
          difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard", "Expert"] },
          technique: {
            type: Type.OBJECT,
            properties: {
              aiming: { type: Type.STRING },
              spin: { type: Type.STRING },
              power: { type: Type.STRING },
              bridge: { type: Type.STRING }
            },
            required: ["aiming", "spin", "power", "bridge"]
          },
          reasoning: { type: Type.STRING },
          nextShotPlan: { type: Type.STRING },
          confidenceScore: { type: Type.NUMBER }
        },
        required: ["targetBallColor", "targetBallLocation", "difficulty", "technique", "reasoning", "nextShotPlan", "confidenceScore"]
      }
    },
    generalAdvice: { type: Type.STRING }
  },
  required: ["recommendations", "generalAdvice"]
};

export const analyzePoolTable = async (
  base64Image: string,
  playerSuit: PlayerSuit,
  hasFoul: boolean,
  isCompetitionMode: boolean
): Promise<PoolAnalysisResponse> => {
  // Use named parameter as required by the latest SDK
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const model = "gemini-3-flash-preview"; 
  
  const persona = isCompetitionMode 
    ? "Master Billiards Coach. Use technical terms like 'tangent lines'."
    : "Friendly Pool Hall Buddy. Punny and encouraging.";

  const promptText = `
    Analyze this pool table. Player is: ${playerSuit}.
    Foul state: ${hasFoul ? "Active" : "Normal"}.
    Provide 2-3 shot suggestions in the specified JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: promptText }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Coach missed the shot. Try another photo.");
    return JSON.parse(text) as PoolAnalysisResponse;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error("Table analysis failed. Check your lighting!");
  }
};
