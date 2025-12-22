import React from 'react';
import { ShotRecommendation } from '../types';
import { Target, Crosshair, Zap, Navigation, Star } from 'lucide-react';

interface ShotCardProps {
  shot: ShotRecommendation;
  rank: number;
}

export const ShotCard: React.FC<ShotCardProps> = ({ shot, rank }) => {
  const isBest = rank === 0;

  const getBallStyle = (color: string) => {
    const c = color.toLowerCase();
    if (c.includes('red')) return 'bg-red-600 text-white';
    if (c.includes('yellow')) return 'bg-yellow-400 text-black border border-yellow-500';
    if (c.includes('black') || c.includes('8')) return 'bg-slate-950 text-white ring-2 ring-slate-800';
    return 'bg-emerald-100 text-emerald-900';
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 mb-3 border transition-all ${
      isBest 
        ? 'bg-white border-amber-400 shadow-xl ring-4 ring-amber-500/10' 
        : 'bg-white/95 border-emerald-800/10 shadow-lg'
    }`}>
      
      {isBest && (
        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
          <Star size={10} fill="currentColor" /> Go for this!
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-base font-black shadow-inner ${getBallStyle(shot.targetBallColor)}`}>
          {shot.targetBallColor.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 leading-none mb-0.5">{shot.targetBallColor}</h3>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-tight">{shot.targetBallLocation}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black uppercase mb-0.5">
            <Target size={12} /> Aim
          </div>
          <div className="text-slate-900 text-xs font-bold leading-tight">{shot.technique.aiming}</div>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1 text-blue-600 text-[10px] font-black uppercase mb-0.5">
            <Zap size={12} /> Spin
          </div>
          <div className="text-slate-900 text-xs font-bold leading-tight">{shot.technique.spin}</div>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
        <span className="text-lg leading-none">💡</span>
        <p className="text-slate-700 text-xs font-medium italic leading-relaxed">
          {shot.reasoning}
        </p>
      </div>
      
      <div className="mt-3 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
        <div className="flex items-center gap-1">
          <Navigation size={10} /> {shot.nextShotPlan}
        </div>
        <div className="text-emerald-500">
          {shot.confidenceScore}% Likely
        </div>
      </div>
    </div>
  );
};
