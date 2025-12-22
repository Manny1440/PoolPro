import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PlayerSuit, PoolAnalysisResponse } from "../types";

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    recommendations: {
      type: Type.ARRAY,
      description: "List of recommended shots, starting with the best option.",
      items: {
        type: Type.OBJECT,
        properties: {
          targetBallColor: { type: Type.STRING, description: "Color of the ball (e.g., 'Solid Red', 'Black 8')" },
          targetBallLocation: { type: Type.STRING, description: "Where the ball is (e.g., 'Near left corner')" },
          difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard", "Expert"] },
          technique: {
            type: Type.OBJECT,
            properties: {
              aiming: { type: Type.STRING, description: "Short, punchy aim instruction (e.g., 'Thin cut left', 'Dead center')" },
              spin: { type: Type.STRING, description: "Simple spin advice (e.g., 'No spin', 'Bottom right')" },
              power: { type: Type.STRING, description: "Power level (e.g., 'Gentle tap', 'Firm hit')" },
              bridge: { type: Type.STRING, description: "Bridge advice (e.g., 'Open', 'On rail')" }
            },
            required: ["aiming", "spin", "power", "bridge"]
          },
          reasoning: { type: Type.STRING, description: "Why this shot? Keep it fun for casual, technical for pro." },
          nextShotPlan: { type: Type.STRING, description: "Where the white ball goes next." },
          confidenceScore: { type: Type.NUMBER, description: "0-100 score" }
        },
        required: ["targetBallColor", "targetBallLocation", "difficulty", "technique", "reasoning", "nextShotPlan", "confidenceScore"]
      }
    },
    generalAdvice: { type: Type.STRING, description: "Strategic vibe check for the table." }
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
  // Using gemini-3-flash-preview for maximum speed and casual play
  const model = "gemini-3-flash-preview"; 
  
  const persona = isCompetitionMode 
    ? "You are a professional Billiards Coach. Use technical terms like 'tangent lines', 'deflection', and 'safety play'."
    : "You are a friendly, witty Bar Buddy at a local pool hall. Use puns, be encouraging, and keep the advice simple. If the player is on their last ball, get hyped!";

  const promptText = `
  ${persona}
  
  Analyze this pool table image.
  Player is playing: ${playerSuit}.
  Foul active: ${hasFoul ? "Yes - they have 2 shots or ball in hand!" : "No."}
  
  Identify the white cue ball and the best path to victory.
  
  ${isCompetitionMode 
    ? "Focus on high-percentage plays and positioning for a full table clearance." 
    : "Focus on the most satisfying pot! Make the advice sound like a friend leaning over the table giving a quick tip."}
  
  Return the analysis in the specified JSON format.
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
          ? "Professional, cold, calculated pool analysis." 
          : "Fun, pun-loving, encouraging pool coach who loves a good beer and a better break.",
      }
    });

    const text = response.text;
    if (!text) throw new Error("The Coach is taking a break. Try another angle!");
    
    return JSON.parse(text) as PoolAnalysisResponse;
  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw new Error("Maybe too much chalk on the lens? Try another photo!");
  }
};
