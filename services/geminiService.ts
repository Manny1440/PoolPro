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
          targetBallColor: { type: Type.STRING, description: "Color of the ball to hit (Red, Yellow, or Black)" },
          targetBallLocation: { type: Type.STRING, description: "Description of where the ball is on the table (e.g., 'Near top right corner')" },
          difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard", "Expert"] },
          technique: {
            type: Type.OBJECT,
            properties: {
              aiming: { type: Type.STRING, description: "Where to strike the object ball (e.g., 'Full face', 'Thin cut left')" },
              spin: { type: Type.STRING, description: "Spin to apply to the cue ball (e.g., 'Top spin', 'Screw back', 'Stun', 'Right english')" },
              power: { type: Type.STRING, description: "Power level (e.g., 'Soft', 'Medium', 'Power shot')" },
              bridge: { type: Type.STRING, description: "Bridge hand recommendation" }
            },
            required: ["aiming", "spin", "power", "bridge"]
          },
          reasoning: { type: Type.STRING, description: "Why this shot is chosen (e.g., easy pot, good position for next ball)" },
          nextShotPlan: { type: Type.STRING, description: "Where the cue ball aims to end up for the subsequent shot" },
          confidenceScore: { type: Type.NUMBER, description: "AI confidence in this shot 0-100" }
        },
        required: ["targetBallColor", "targetBallLocation", "difficulty", "technique", "reasoning", "nextShotPlan", "confidenceScore"]
      }
    },
    generalAdvice: { type: Type.STRING, description: "General strategic advice based on the table state" }
  },
  required: ["recommendations", "generalAdvice"]
};

export const analyzePoolTable = async (
  base64Image: string,
  playerSuit: PlayerSuit,
  hasFoul: boolean,
  isCompetitionMode: boolean
): Promise<PoolAnalysisResponse> => {
  // Use a fresh instance of GoogleGenAI to ensure current API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview"; 
  
  let promptText = `Analyze this 8-ball pool table image. 
  You are a world-class professional pool coach assisting a player.
  Identify the cue ball (white) and the object balls (Red/Yellow/Black).
  
  The player is playing: ${playerSuit}.
  ${hasFoul ? "IMPORTANT: The opponent committed a foul. The player has TWO SHOTS (or ball-in-hand). You should suggest utilizing this advantage to clear difficult balls, break clusters, or play a more aggressive shot since a miss might still leave a second visit." : ""}
  ${playerSuit === PlayerSuit.OPEN ? "The table is open. Suggest the easiest ball to pot to take control of a suit." : `Focus ONLY on potting balls of the '${playerSuit}' suit (or the Black 8-ball if it looks like the suit is cleared).`}
  
  MODE: ${isCompetitionMode ? "COMPETITION / MATCH PLAY" : "PRACTICE / TRAINING"}
  
  ${isCompetitionMode 
    ? "STRATEGY: The player is in a competitive match. Prioritize HIGH PERCENTAGE shots and SAFETY. Do not suggest risky pots unless confidence is >90%. If a pot is difficult, suggest a safety shot (snooker) or a shot that leaves the opponent in a difficult position. Minimize risk of scratching or selling the table." 
    : "STRATEGY: The player is practicing. Explain the technique in detail. Feel free to suggest creative or skill-building shots to improve their game."}

  Provide detailed shot recommendations.
  1. Identify the best opportunity.
  2. Explain exactly how to play it (aim, spin, power).
  3. Explain the positional play for the NEXT ball.
  
  If the image is unclear or no shots are viable, explain why in the generalAdvice section.
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
        systemInstruction: "You are a helpful, encouraging, and expert pool coach.",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as PoolAnalysisResponse;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};
