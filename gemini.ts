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
  // Use a fresh instance with the key from process.env
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = "gemini-3-flash-preview"; 
  
  const persona = isCompetitionMode 
    ? "You are a professional Billiards Coach. Use technical terms like 'tangent lines' and 'deflection'. Be precise."
    : "You are a friendly, witty Bar Buddy. Use puns, be encouraging, and keep the advice simple.";

  const promptText = `
    Analyze this pool table image. 
    Player is shooting for: ${playerSuit}.
    State: ${hasFoul ? "Foul active (2 shots or ball-in-hand)" : "Normal play"}.
    
    Style: ${persona}
    
    Goal: Identify the best 2-3 shots. Be very specific about where to hit the cue ball (spin) and which part of the pocket to aim for.
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
        systemInstruction: isCompetitionMode 
          ? "Master level pool instructor. Focus on physics and run-outs." 
          : "Fun-loving pool hall regular. Focus on easy wins and good vibes.",
      }
    });

    const text = response.text;
    if (!text) throw new Error("Coach missed the shot! Try again.");
    return JSON.parse(text) as PoolAnalysisResponse;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error("Table is a bit fuzzy. Take another photo!");
  }
};
