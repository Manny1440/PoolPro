import React, { useState, useRef } from 'react';
import { Camera, RotateCcw, AlertTriangle, Sparkles, Zap, Navigation, Trophy, ChevronRight } from 'lucide-react';
import { PlayerSuit, PoolAnalysisResponse, ShotRecommendation } from './types';
import { analyzePoolTable } from './gemini';

// --- Components ---

const ShinyEightBall = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
    <div className="absolute inset-0 bg-black rounded-full shadow-lg shadow-black/40"></div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-3/5 bg-white rounded-full flex items-center justify-center">
      <span className="text-black font-black leading-none" style={{ fontSize: size * 0.35 }}>8</span>
    </div>
    <div className="absolute top-[15%] left-[15%] w-[30%] h-[30%] bg-gradient-to-br from-white/30 to-transparent rounded-full blur-[1px]"></div>
  </div>
);

const Button = ({ children, variant = 'primary', isLoading, icon, className = '', ...props }: any) => {
  const variants: any = {
    primary: "bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 shadow-xl shadow-amber-500/20 active:from-amber-500 active:to-amber-600",
    secondary: "bg-emerald-800/40 hover:bg-emerald-700/50 text-emerald-100 border border-emerald-600/30 backdrop-blur-md",
    outline: "border-2 border-emerald-800/50 text-emerald-200 hover:bg-emerald-800/20"
  };
  return (
    <button 
      className={`inline-flex items-center justify-center px-6 py-4 rounded-2xl font-extrabold transition-all active:scale-95 disabled:opacity-50 ${variants[variant]} ${className}`} 
      disabled={isLoading} 
      {...props}
    >
      {isLoading ? (
        <div className="animate-spin h-6 w-6 border-3 border-current border-t-transparent rounded-full mr-2" />
      ) : icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

const ShotCard = ({ shot, rank }: { shot: ShotRecommendation, rank: number }) => {
  const isBest = rank === 0;
  const getBallStyle = (color: string) => {
    const c = color.toLowerCase();
    if (c.includes('red')) return 'bg-red-600 shadow-red-950/20';
    if (c.includes('yellow')) return 'bg-yellow-400 text-black shadow-yellow-900/20';
    if (c.includes('black') || c.includes('8')) return 'bg-slate-950 shadow-black';
    return 'bg-emerald-100 text-emerald-900';
  };

  return (
    <div className={`group relative overflow-hidden rounded-3xl p-5 mb-5 border transition-all animate-slide-up ${isBest ? 'bg-white border-amber-400 shadow-2xl ring-1 ring-amber-400/50' : 'bg-white/95 border-emerald-100 shadow-lg'}`}>
      {isBest && (
        <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest flex items-center gap-1">
          <Trophy size={10} /> Prime Shot
        </div>
      )}
      
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white shadow-xl ${getBallStyle(shot.targetBallColor)}`}>
          {shot.targetBallColor.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{shot.targetBallColor}</h3>
          <p className="text-slate-400 text-[11px] font-extrabold uppercase tracking-widest">{shot.targetBallLocation}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-tighter">Aim Path</div>
          <div className="text-sm text-slate-900 font-extrabold leading-tight">{shot.technique.aiming}</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-tighter">English/Spin</div>
          <div className="text-sm text-slate-900 font-extrabold leading-tight">{shot.technique.spin}</div>
        </div>
      </div>

      <div className="bg-emerald-50/50 p-4 rounded-2xl mb-4 italic text-slate-700 text-sm font-medium border border-emerald-100/50">
        "{shot.reasoning}"
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-black uppercase tracking-widest">
        <span className="flex items-center gap-1.5 text-slate-400">
          <Navigation size={12} /> {shot.nextShotPlan}
        </span>
        <span className="text-emerald-500 flex items-center gap-1">
          <Zap size={12} fill="currentColor" /> {shot.confidenceScore}% Prob
        </span>
      </div>
    </div>
  );
};

// --- Main App ---

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
      setError(err.message || "Failed to analyze the rack.");
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
    <div className={`min-h-screen bg-emerald-950 text-white font-sans selection:bg-amber-500/30 overflow-x-hidden`}>
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className={`absolute -top-24 -left-24 w-96 h-96 blur-[120px] rounded-full transition-colors duration-1000 ${isCompetitionMode ? 'bg-amber-600' : 'bg-emerald-400'}`} />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-blue-600 blur-[100px] rounded-full" />
      </div>

      <header className="sticky top-0 z-[100] px-5 py-4 flex justify-between items-center glass border-b border-white/5">
        <div className="flex items-center gap-3">
          <ShinyEightBall size={34} />
          <div>
            <h1 className="font-black text-xl tracking-tighter leading-none">PoolPro</h1>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{isCompetitionMode ? 'Championship Edition' : 'Casual Buddy'}</p>
          </div>
        </div>
        {image && (
          <button onClick={reset} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-90">
            <RotateCcw size={20} />
          </button>
        )}
      </header>

      <main className="max-w-md mx-auto px-6 py-8 relative">
        {!image ? (
          <div className="space-y-10 py-4 animate-slide-up">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/40 border border-emerald-700/50 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                <Sparkles size={12} /> AI-Powered Vision
              </div>
              <h2 className="text-4xl font-black tracking-tight leading-[1.1]">
                Master the <br /> <span className="text-amber-500 underline decoration-amber-500/30 decoration-8 underline-offset-4">Entire Table.</span>
              </h2>
            </div>

            <div className="space-y-8">
              {/* Mode Toggle */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] px-1">Coaching Intensity</label>
                <div className="bg-emerald-900/40 p-1.5 rounded-2xl flex border border-white/5">
                  <button onClick={() => setIsCompetitionMode(false)} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${!isCompetitionMode ? 'bg-emerald-600 shadow-xl text-white' : 'text-emerald-500 hover:text-emerald-400'}`}>Casual</button>
                  <button onClick={() => setIsCompetitionMode(true)} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${isCompetitionMode ? 'bg-amber-500 text-slate-950 shadow-xl' : 'text-emerald-500 hover:text-emerald-400'}`}>Pro</button>
                </div>
              </div>

              {/* Suit Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] px-1">Your Balls</label>
                <div className="grid grid-cols-3 gap-3">
                  {[PlayerSuit.OPEN, PlayerSuit.REDS, PlayerSuit.YELLOWS].map((s) => (
                    <button 
                      key={s} 
                      onClick={() => setPlayerSuit(s)} 
                      className={`py-4 rounded-2xl text-[11px] font-black transition-all border-2 ${playerSuit === s ? 'border-amber-400 bg-amber-400/10 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.1)]' : 'border-white/5 bg-white/5 text-emerald-300 hover:bg-white/10'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Foul Toggle */}
              <button 
                onClick={() => setHasFoul(!hasFoul)} 
                className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${hasFoul ? 'bg-red-500/10 border-red-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${hasFoul ? 'bg-red-500 text-white' : 'bg-emerald-800 text-emerald-400'}`}>
                    <Zap size={18} fill={hasFoul ? "currentColor" : "none"} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm tracking-tight leading-none mb-1">Opponent Foul?</p>
                    <p className="text-[10px] text-emerald-500/70 font-bold">{hasFoul ? 'Ball-in-hand logic active' : 'Standard turn rules'}</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${hasFoul ? 'bg-red-500 border-red-400' : 'border-emerald-700'}`}>
                  {hasFoul && <ChevronRight size={14} className="text-white" />}
                </div>
              </button>

              <Button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-full py-6 text-xl" 
                icon={<Camera size={26} />} 
                variant={isCompetitionMode ? 'primary' : 'primary'}
              >
                Scan Table
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-slide-up">
            <div className="relative rounded-[2.5rem] overflow-hidden border-4 border-emerald-900/50 shadow-2xl bg-black group">
              <img src={image} className={`w-full h-auto max-h-[40vh] object-contain transition-all duration-700 ${isAnalyzing ? 'scale-110 opacity-30 blur-xl' : 'scale-100 opacity-100 blur-0'}`} />
              {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-emerald-950/20">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-emerald-400/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-4 bg-emerald-400/20 rounded-full animate-pulse"></div>
                  </div>
                  <h4 className="font-black text-2xl tracking-tight mb-2">Calculating Paths...</h4>
                  <p className="text-sm font-medium text-emerald-400 opacity-80">Finding your perfect run-out.</p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-3xl text-red-200 text-sm font-black flex items-center gap-3 animate-slide-up">
                <AlertTriangle className="text-red-500 shrink-0" /> {error}
              </div>
            )}

            {!isAnalyzing && result && (
              <div className="space-y-10">
                <div className="bg-emerald-900/40 p-6 rounded-3xl border border-white/5 relative glass shadow-inner">
                  <div className="flex items-center gap-2 mb-3 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em]"><Sparkles size={14} /> Global Insight</div>
                  <p className="font-extrabold text-lg leading-tight tracking-tight text-white">{result.generalAdvice}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black uppercase text-emerald-500 tracking-[0.2em]">Strategy Options</h3>
                    <span className="text-[10px] font-black text-white/40">SCROLL DOWN</span>
                  </div>
                  {result.recommendations.map((shot, i) => (
                    <ShotCard key={i} shot={shot} rank={i} />
                  ))}
                </div>

                <div className="pt-4 flex flex-col gap-4">
                   <Button onClick={reset} variant="secondary" className="w-full" icon={<RotateCcw size={18} />}>Rescan Table</Button>
                   <p className="text-center text-[10px] font-black text-white/20 uppercase tracking-widest">Powered by PoolPro AI Vision</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      <footer className="py-8 text-center">
        <div className="inline-flex items-center gap-1.5 opacity-20 hover:opacity-100 transition-opacity duration-500 cursor-default">
           <ShinyEightBall size={16} />
           <span className="text-[10px] font-black tracking-widest uppercase">Precision Guaranteed</span>
        </div>
      </footer>
    </div>
  );
}
