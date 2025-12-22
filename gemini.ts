import { GoogleGenAI, Type } from "@google/genai";
import { PlayerSuit, PoolAnalysisResponse } from "./types";

// Fix: Removed Schema type annotation to comply with recommended @google/genai practices
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
  // Fix: Initialized GoogleGenAI using process.env.API_KEY directly as per SDK requirements
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview"; 
  
  const persona = isCompetitionMode 
    ? "You are a professional Billiards Coach. Use technical terms like 'tangent lines', 'deflection', and 'safety play'. Be precise and cold."
    : "You are a friendly, witty Bar Buddy at a local pool hall. Use puns, be encouraging, and keep the advice simple. Act like you're leaning over the table with a drink in your hand.";

  const promptText = `
    Analyze this pool table image. 
    Player is shooting for: ${playerSuit}.
    Special State: ${hasFoul ? "The opponent fouled! Tell the player they have ball-in-hand or 2 shots." : "Normal play."}
    
    GOAL: Suggest the best 2-3 shots.
    
    PERSONALITY: ${persona}
    
    Identify the white cue ball and the target balls clearly. If the image is a bit blurry, give it your best shot anyway!
    Return the response in the requested JSON format.
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

    // Fix: Accessed .text property directly as per the latest @google/genai response handling rules
    const text = response.text;
    if (!text) throw new Error("Coach is distracted by the jukebox. Try again!");
    return JSON.parse(text) as PoolAnalysisResponse;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error("The table is spinning! Try taking a clearer, steadier photo.");
  }
};
