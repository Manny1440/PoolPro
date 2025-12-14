export enum PlayerSuit {
  OPEN = 'OPEN',
  REDS = 'REDS',
  YELLOWS = 'YELLOWS'
}

export interface ShotTechnique {
  aiming: string;
  spin: string;
  power: string;
  bridge: string;
}

export interface ShotRecommendation {
  targetBallColor: string;
  targetBallLocation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  technique: ShotTechnique;
  reasoning: string;
  nextShotPlan: string;
  confidenceScore: number;
}

export interface PoolAnalysisResponse {
  recommendations: ShotRecommendation[];
  generalAdvice: string;
}