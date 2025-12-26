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
              aiming: { type: Type.STRING, description: "Max 5 words." },
              spin: { type: Type.STRING, description: "Max 3 words." },
              power: { type: Type.STRING },
              bridge: { type: Type.STRING }
            },
            required: ["aiming", "spin", "power", "bridge"]
          },
          reasoning: { type: Type.STRING, description: "STRICTLY MAX 12 WORDS. Be witty but fast." },
          nextShotPlan: { type: Type.STRING, description: "Max 5 words." },
          confidenceScore: { type: Type.NUMBER }
        },
        required: ["targetBallColor", "targetBallLocation", "difficulty", "technique", "reasoning", "nextShotPlan", "confidenceScore"]
      }
    },
    generalAdvice: { type: Type.STRING, description: "Max 10 words summary." }
  },
  required: ["recommendations", "generalAdvice"]
};

export const analyzePoolTable = async (
  base64Image: string,
  playerSuit: PlayerSuit,
  hasFoul: boolean,
  isCompetitionMode: boolean
): Promise<PoolAnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview"; 
  
  const persona = isCompetitionMode 
    ? "Billiards Pro. Ultra-concise logic. Zero fluff."
    : "The fast-talking Pool Buddy. Witty, but keeps tips under 10 seconds to read.";

  const promptText = `
    ACTION PLAN REQUIRED. 30-second shot clock active.
    Table Context: ${playerSuit} shooting. ${hasFoul ? "2 Shots/Ball in hand." : "Standard turn."}
    
    CRITICAL INSTRUCTIONS:
    1. Identify the BEST winning path.
    2. KEEP ALL TEXT EXTREMELY SHORT. No long sentences.
    3. Use technical terms for Competition, puns for Relaxed.
    4. Focus on where to hit the cue ball.
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
    if (!text) throw new Error("Coach missed the shot.");
    return JSON.parse(text) as PoolAnalysisResponse;
  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw new Error("Coach timed out! Try a faster connection or clearer shot.");
  }
};
