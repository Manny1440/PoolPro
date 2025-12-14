import React from 'react';
import { ShotRecommendation } from '../types';
import { Target, Crosshair, Zap, Navigation } from 'lucide-react';

interface ShotCardProps {
  shot: ShotRecommendation;
  rank: number;
}

export const ShotCard: React.FC<ShotCardProps> = ({ shot, rank }) => {
  const isBest = rank === 0;

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 mb-4 border transition-all ${
      isBest 
        ? 'bg-white border-amber-500 shadow-xl shadow-amber-500/20' 
        : 'bg-white/90 border-slate-200 shadow-lg shadow-black/20'
    }`}>
      
      {isBest && (
        <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
          Best Option
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold shadow-sm ${
          shot.targetBallColor.toLowerCase().includes('red') ? 'bg-red-600 text-white' :
          shot.targetBallColor.toLowerCase().includes('yellow') ? 'bg-yellow-400 text-black border border-yellow-500' :
          shot.targetBallColor.toLowerCase().includes('black') ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
        }`}>
          {shot.targetBallColor[0].toUpperCase()}
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">{shot.targetBallColor} Ball</h3>
          <p className="text-slate-500 text-sm">{shot.targetBallLocation}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase mb-1">
            <Target size={14} /> Aim
          </div>
          <div className="text-slate-800 font-medium">{shot.technique.aiming}</div>
        </div>
        <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase mb-1">
            <Zap size={14} /> Spin
          </div>
          <div className="text-slate-800 font-medium">{shot.technique.spin}</div>
        </div>
        <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase mb-1">
            <Crosshair size={14} /> Power
          </div>
          <div className="text-slate-800 font-medium">{shot.technique.power}</div>
        </div>
        <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-purple-600 text-xs font-bold uppercase mb-1">
            <Navigation size={14} /> Plan
          </div>
          <div className="text-slate-800 font-medium text-xs leading-snug">{shot.nextShotPlan}</div>
        </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
        <p className="text-slate-600 italic text-sm">"{shot.reasoning}"</p>
      </div>
    </div>
  );
};