import React, { useState, useRef } from 'react';
import { Camera, RotateCcw, AlertTriangle, Sparkles, Zap, Navigation, Trophy, ChevronRight, Target, AlertCircle, Beer } from 'lucide-react';
import { PlayerSuit, PoolAnalysisResponse, ShotRecommendation } from './types';
import { analyzePoolTable } from './gemini';

const ShinyEightBall = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
    <div className="absolute inset-0 bg-black rounded-full shadow-2xl shadow-black/60"></div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-3/5 bg-white rounded-full flex items-center justify-center">
      <span className="text-black font-black leading-none" style={{ fontSize: size * 0.35 }}>8</span>
    </div>
    <div className="absolute top-[15%] left-[15%] w-[30%] h-[30%] bg-gradient-to-br from-white/40 to-transparent rounded-full blur-[1px]"></div>
  </div>
);

const Button = ({ children, variant = 'primary', isLoading, icon, className = '', ...props }: any) => {
  const variants: any = {
    primary: "bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 shadow-[0_10px_30px_-5px_rgba(245,158,11,0.4)] active:translate-y-0.5 active:shadow-none hover:from-amber-300 hover:to-amber-400 border-t border-white/20",
    secondary: "bg-emerald-800/40 hover:bg-emerald-700/50 text-emerald-100 border border-emerald-600/30 backdrop-blur-md shadow-lg",
  };
  return (
    <button 
      className={`inline-flex items-center justify-center px-8 py-5 rounded-[1.5rem] font-black text-lg transition-all disabled:opacity-50 ${variants[variant]} ${className}`} 
      disabled={isLoading} 
      {...props}
    >
      {isLoading ? (
        <div className="animate-spin h-6 w-6 border-3 border-current border-t-transparent rounded-full mr-3" />
      ) : icon && <span className="mr-3">{icon}</span>}
      {children}
    </button>
  );
};

const ShotCard = ({ shot, rank }: { shot: ShotRecommendation, rank: number }) => {
  const isBest = rank === 0;
  
  const getBallStyle = (color: string) => {
    const c = color.toLowerCase();
    if (c.includes('red')) return 'bg-red-600 shadow-[0_10px_20px_-5px_rgba(220,38,38,0.5)]';
    if (c.includes('yellow')) return 'bg-yellow-400 text-black shadow-[0_10px_20px_-5px_rgba(250,204,21,0.5)]';
    if (c.includes('black') || c.includes('8')) return 'bg-slate-950 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5)]';
    return 'bg-emerald-100 text-emerald-900 shadow-lg';
  };

  return (
    <div className={`group relative overflow-hidden rounded-[2.5rem] p-7 mb-8 border transition-all animate-slide-up ${isBest ? 'bg-white border-amber-400 shadow-[0_30px_60px_-12px_rgba(251,191,36,0.3)] ring-1 ring-amber-400/50 scale-[1.03]' : 'bg-white/95 border-emerald-100 shadow-xl shadow-black/10'}`}>
      {isBest && (
        <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-[10px] font-black px-6 py-2.5 rounded-bl-[1.5rem] uppercase tracking-[0.2em] flex items-center gap-2">
          <Trophy size={12} fill="currentColor" /> Best Play
        </div>
      )}
      
      <div className="flex items-center gap-5 mb-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl text-white shadow-2xl relative ${getBallStyle(shot.targetBallColor)}`}>
          {shot.targetBallColor.charAt(0).toUpperCase()}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/40 rounded-full"></div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-1.5">{shot.targetBallColor}</h3>
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-black uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100 w-fit">
            <Target size={12} className="text-emerald-500" /> {shot.targetBallLocation}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <div className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-tighter flex items-center gap-1.5">
            <Sparkles size={14} /> Aim Point
          </div>
          <div className="text-[15px] text-slate-900 font-extrabold leading-tight">{shot.technique.aiming}</div>
        </div>
        <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <div className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-tighter flex items-center gap-1.5">
            <Zap size={14} /> Spin/English
          </div>
          <div className="text-[15px] text-slate-900 font-extrabold leading-tight">{shot.technique.spin}</div>
        </div>
      </div>

      <div className="bg-emerald-50/50 p-6 rounded-[1.5rem] mb-6 border border-emerald-100/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400/30"></div>
        <p className="text-slate-700 text-[15px] font-semibold italic leading-relaxed pl-2">
          "{shot.reasoning}"
        </p>
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-slate-100 text-[11px] font-black uppercase tracking-widest">
        <span className="flex items-center gap-2 text-slate-400">
          <Navigation size={14} className="rotate-45 text-emerald-400" /> {shot.nextShotPlan}
        </span>
        <span className="text-emerald-500 flex items-center gap-1.5 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
          <Zap size={14} fill="currentColor" /> {shot.confidenceScore}% Prob.
        </span>
      </div>
    </div>
  );
};

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PoolAnalysisResponse | null>(null);
  const [playerSuit, setPlayerSuit] = useState<PlayerSuit>(PlayerSuit.OPEN);
  const [hasFoul, setHasFoul] = useState(false);
  const [isCompetitionMode, setIsCompetitionMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setError(null);
      setIsAnalyzing(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setImage(dataUrl);
        const analysis = await analyzePoolTable(dataUrl.split(',')[1], playerSuit, hasFoul, isCompetitionMode);
        setResult(analysis);
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "Coach couldn't see the table properly. Try another angle.");
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-emerald-950 text-white font-sans selection:bg-amber-500/30 overflow-x-hidden">
      <header className="sticky top-0 z-[100] px-6 py-6 flex justify-between items-center glass border-b border-white/10 shadow-2xl">
        <div className="flex items-center gap-4">
          <ShinyEightBall size={46} />
          <div>
            <h1 className="font-black text-2xl tracking-tighter leading-none italic uppercase">PoolPro</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${isCompetitionMode ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-white'}`}>
                {isCompetitionMode ? 'Match' : 'Relaxed'}
              </span>
            </div>
          </div>
        </div>
        {image && (
          <button onClick={reset} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-all active:scale-90 border border-white/10 shadow-xl">
            <RotateCcw size={24} className="text-emerald-400" />
          </button>
        )}
      </header>

      <main className="max-w-md mx-auto px-6 py-12">
        {!image ? (
          <div className="space-y-14 animate-slide-up">
            <div className="space-y-6 text-center relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-400/10 blur-[100px] rounded-full"></div>
              
              <div className="relative mb-4 flex justify-center items-center">
                 <ShinyEightBall size={140} className="z-10" />
                 <div className="absolute bottom-0 right-1/4 translate-x-1/2 translate-y-1/2 bg-amber-500/10 p-3 rounded-full border border-amber-500/20 z-20">
                   <Beer size={32} className="text-amber-400" />
                 </div>
              </div>

              <h2 className="text-[3.5rem] font-black tracking-tighter leading-[0.85] uppercase">
                Wanna <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">win?</span>
              </h2>
              <p className="text-emerald-400 font-bold text-xl leading-snug">
                I'll spot the best shots for ya!
              </p>
            </div>

            <div className="space-y-10 bg-emerald-900/20 p-10 rounded-[3.5rem] border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] backdrop-blur-sm relative">
              <div className="space-y-5">
                <div className="bg-emerald-950/80 p-2.5 rounded-[1.75rem] flex border border-white/5 shadow-inner">
                  <button onClick={() => setIsCompetitionMode(false)} className={`flex-1 py-5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${!isCompetitionMode ? 'bg-emerald-600 shadow-xl text-white' : 'text-emerald-700 hover:text-emerald-500'}`}>
                    <Beer size={16} /> Relaxed
                  </button>
                  <button onClick={() => setIsCompetitionMode(true)} className={`flex-1 py-5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${isCompetitionMode ? 'bg-amber-500 text-slate-950 shadow-xl' : 'text-emerald-700 hover:text-emerald-500'}`}>
                    <Trophy size={16} /> Match
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  {[PlayerSuit.OPEN, PlayerSuit.REDS, PlayerSuit.YELLOWS].map((s) => (
                    <button key={s} onClick={() => setPlayerSuit(s)} className={`py-6 rounded-[1.5rem] text-[11px] font-black border-2 transition-all shadow-lg flex flex-col items-center gap-2 ${playerSuit === s ? 'border-emerald-400 bg-emerald-400/20 text-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.15)]' : 'border-white/5 bg-white/5 text-emerald-400 opacity-40 hover:opacity-100 hover:bg-white/10'}`}>
                      {s === PlayerSuit.OPEN ? 'Any Ball' : s}
                      {playerSuit === s && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <button 
                  onClick={() => setHasFoul(!hasFoul)} 
                  className={`w-full p-6 rounded-[1.5rem] border-2 flex items-center justify-between transition-all group shadow-xl ${hasFoul ? 'bg-amber-500/15 border-amber-500/50' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-all shadow-lg ${hasFoul ? 'bg-amber-500 text-slate-950 scale-110 shadow-amber-500/20' : 'bg-white/10 text-emerald-500'}`}>
                      <Zap size={22} />
                    </div>
                    <div className="text-left">
                      <div className={`font-black text-[15px] leading-none mb-1.5 ${hasFoul ? 'text-amber-500' : 'text-white'}`}>2 Shots?</div>
                      <div className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">Double Visit Active</div>
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${hasFoul ? 'bg-amber-500 border-amber-400 shadow-lg' : 'border-white/20'}`}>
                    {hasFoul && <ChevronRight size={16} className="text-slate-950" />}
                  </div>
                </button>
              </div>

              <div className="pt-6">
                <Button onClick={() => fileInputRef.current?.click()} className="w-full py-8 text-xl" icon={<Camera size={32} />}>GO!</Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-slide-up">
            <div className={`relative rounded-[3.5rem] overflow-hidden border-8 border-emerald-900/50 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] bg-black aspect-[3/4] ${isAnalyzing ? 'scanning-glow' : ''}`}>
              <img src={image} className={`w-full h-full object-cover transition-all duration-1000 ${isAnalyzing ? 'scale-125 opacity-30 blur-3xl' : ''}`} />
              {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                  <div className="relative mb-10">
                     <div className="w-28 h-28 border-t-4 border-amber-400 rounded-full animate-spin shadow-[0_0_80px_rgba(251,191,36,0.6)]" />
                     <ShinyEightBall size={40} className="absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <h4 className="font-black text-4xl tracking-tighter mb-4 uppercase">Winning Moves...</h4>
                  <p className="text-emerald-400 font-bold text-lg opacity-80">Reading the felt for you</p>
                </div>
              )}
              {!isAnalyzing && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-[2.5rem] text-red-200 text-[15px] font-black flex items-center gap-5 shadow-2xl">
                <AlertTriangle className="text-red-500 shrink-0" size={32} /> 
                <span>{error}</span>
              </div>
            )}

            {!isAnalyzing && result && (
              <div className="space-y-12 pb-24">
                <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 p-10 rounded-[3rem] border border-white/10 glass shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative">
                  <div className="absolute -top-4 left-10 bg-amber-500 text-slate-900 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">The Word</div>
                  <p className="font-bold text-2xl leading-relaxed text-white italic mt-2">"{result.generalAdvice}"</p>
                </div>

                <div className="space-y-8">
                  <label className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.6em] ml-2">Spotted Shots</label>
                  {result.recommendations.map((shot, i) => (
                    <ShotCard key={i} shot={shot} rank={i} />
                  ))}
                </div>

                <Button onClick={reset} variant="secondary" className="w-full py-7" icon={<RotateCcw size={22} />}>New Table Scan</Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
