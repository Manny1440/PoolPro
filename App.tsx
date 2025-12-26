import React, { useState, useRef } from 'react';
import { Camera, RotateCcw, AlertTriangle, Sparkles, Zap, Navigation, Trophy, ChevronRight, Target, Beer, ShoppingBag, Heart, X, CreditCard, Clock } from 'lucide-react';
import { PlayerSuit, PoolAnalysisResponse, ShotRecommendation } from './types';
import { analyzePoolTable } from './gemini';

// Helper to compress image before upload
const compressImage = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1024;
      const MAX_HEIGHT = 1024;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      // Quality 0.7 is perfect for AI vision but tiny file size
      resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
    };
    img.src = dataUrl;
  });
};

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
    primary: "bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 shadow-lg active:translate-y-0.5 active:shadow-none border-t border-white/20",
    secondary: "bg-emerald-800/40 hover:bg-emerald-700/50 text-emerald-100 border border-emerald-600/30 backdrop-blur-md",
    pro: "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
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
    if (c.includes('red')) return 'bg-red-600 shadow-md';
    if (c.includes('yellow')) return 'bg-yellow-400 text-black shadow-md';
    if (c.includes('black') || c.includes('8')) return 'bg-slate-950 shadow-md';
    return 'bg-emerald-100 text-emerald-900';
  };

  return (
    <div className={`group relative overflow-hidden rounded-[2rem] p-5 mb-5 border transition-all animate-slide-up ${isBest ? 'bg-white border-amber-400 shadow-xl ring-2 ring-amber-400/20' : 'bg-white/95 border-emerald-100 shadow-lg'}`}>
      {isBest && (
        <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-[9px] font-black px-4 py-2 rounded-bl-xl uppercase tracking-widest flex items-center gap-1.5">
          <Clock size={10} /> Fast Play
        </div>
      )}
      
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg text-white relative ${getBallStyle(shot.targetBallColor)}`}>
          {shot.targetBallColor.charAt(0).toUpperCase()}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 rounded-full"></div>
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{shot.targetBallColor}</h3>
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 w-fit">
            <Target size={10} className="text-emerald-500" /> {shot.targetBallLocation}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="text-[9px] font-black text-emerald-600 uppercase mb-1 flex items-center gap-1">
            <Sparkles size={12} /> Aim
          </div>
          <div className="text-sm text-slate-900 font-extrabold">{shot.technique.aiming}</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="text-[9px] font-black text-blue-600 uppercase mb-1 flex items-center gap-1">
            <Zap size={12} /> Spin
          </div>
          <div className="text-sm text-slate-900 font-extrabold">{shot.technique.spin}</div>
        </div>
      </div>

      <div className="bg-emerald-50/50 p-4 rounded-2xl mb-4 border border-emerald-100/50">
        <p className="text-slate-700 text-sm font-bold leading-snug">
          "{shot.reasoning}"
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] font-black uppercase tracking-wider">
        <span className="flex items-center gap-1.5 text-slate-400">
          <Navigation size={12} className="rotate-45 text-emerald-300" /> {shot.nextShotPlan}
        </span>
        <span className="text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          {shot.confidenceScore}% Hit
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
  const [showSupportModal, setShowSupportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setError(null);
      setIsAnalyzing(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fullDataUrl = e.target?.result as string;
        setImage(fullDataUrl);
        
        // Fast Pre-process: Compress image to ~1024px before sending to AI
        const compressedBase64 = await compressImage(fullDataUrl);
        
        const analysis = await analyzePoolTable(compressedBase64, playerSuit, hasFoul, isCompetitionMode);
        setResult(analysis);
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "Timeout! Try again.");
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
      {/* Support Modal (Donation flow) */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm" onClick={() => setShowSupportModal(false)}></div>
          <div className="relative bg-white text-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 animate-slide-up shadow-2xl">
            <button onClick={() => setShowSupportModal(false)} className="absolute top-6 right-6 text-slate-300"><X size={24} /></button>
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-500 mb-2">
                <Heart size={32} fill="currentColor" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">Support the Coach?</h3>
              <p className="text-slate-500 text-sm font-medium">Keep the AI sharp with a $1 tip!</p>
              <div className="space-y-3">
                <button className="w-full py-4 bg-black text-white rounded-2xl font-black flex items-center justify-center gap-3">
                  <CreditCard size={18} /> Apple Pay
                </button>
                <button className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black">
                  Credit Card ($1)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-[100] px-6 py-4 flex justify-between items-center glass">
        <div className="flex items-center gap-3">
          <ShinyEightBall size={36} />
          <h1 className="font-black text-xl tracking-tighter italic uppercase">PoolPro</h1>
        </div>
        {image && (
          <button onClick={reset} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10">
            <RotateCcw size={18} className="text-emerald-400" />
          </button>
        )}
      </header>

      <main className="max-w-md mx-auto px-6 py-8">
        {!image ? (
          <div className="space-y-10 animate-slide-up">
            <div className="space-y-4 text-center">
              <div className="relative mb-6 flex justify-center items-center">
                 <ShinyEightBall size={120} className="z-10" />
                 <div className="absolute bottom-0 right-1/4 translate-x-1/2 translate-y-1/2 bg-amber-500/20 p-2 rounded-full z-20">
                   <Clock size={24} className="text-amber-400" />
                 </div>
              </div>
              <h2 className="text-[3rem] font-black tracking-tighter leading-[0.8] uppercase">
                Ready <br /> <span className="text-amber-400">to win?</span>
              </h2>
            </div>

            <div className="bg-emerald-900/20 p-8 rounded-[2.5rem] border border-white/5 space-y-8">
              <div className="flex bg-emerald-950/80 p-1.5 rounded-2xl border border-white/5">
                <button onClick={() => setIsCompetitionMode(false)} className={`flex-1 py-4 rounded-xl font-black text-xs ${!isCompetitionMode ? 'bg-emerald-600 shadow-lg' : 'text-emerald-800'}`}>RELAXED</button>
                <button onClick={() => setIsCompetitionMode(true)} className={`flex-1 py-4 rounded-xl font-black text-xs ${isCompetitionMode ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-emerald-800'}`}>MATCH</button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[PlayerSuit.OPEN, PlayerSuit.REDS, PlayerSuit.YELLOWS].map((s) => (
                  <button key={s} onClick={() => setPlayerSuit(s)} className={`py-4 rounded-xl text-[10px] font-black border transition-all ${playerSuit === s ? 'border-emerald-400 bg-emerald-400/20 text-emerald-400' : 'border-white/5 bg-white/5 text-emerald-700'}`}>
                    {s}
                  </button>
                ))}
              </div>

              <button onClick={() => setHasFoul(!hasFoul)} className={`w-full p-4 rounded-2xl border flex items-center justify-between ${hasFoul ? 'bg-amber-500/10 border-amber-500' : 'bg-white/5 border-white/5'}`}>
                <span className="font-black text-sm uppercase">2 Shots Active?</span>
                <div className={`w-5 h-5 rounded-full border-2 ${hasFoul ? 'bg-amber-500 border-amber-400' : 'border-white/20'}`}></div>
              </button>

              <Button onClick={() => fileInputRef.current?.click()} className="w-full py-6 text-xl" icon={<Camera size={28} />}>SCAN TABLE</Button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-slide-up">
            <div className={`relative rounded-[2.5rem] overflow-hidden border-4 border-emerald-900 shadow-2xl bg-black aspect-[4/5] ${isAnalyzing ? 'scanning-glow' : ''}`}>
              <img src={image} className={`w-full h-full object-cover ${isAnalyzing ? 'opacity-40 blur-md' : ''}`} />
              {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
                  <h4 className="font-black text-2xl uppercase italic">Coach is Thinking...</h4>
                </div>
              )}
            </div>

            {!isAnalyzing && result && (
              <div className="space-y-6 pb-20">
                <div className="bg-amber-500 p-5 rounded-[1.5rem] text-slate-950 shadow-xl flex items-center gap-4">
                  <Clock size={32} className="shrink-0 opacity-50" />
                  <p className="font-black text-lg leading-tight uppercase italic">{result.generalAdvice}</p>
                </div>

                <div className="space-y-4">
                  {result.recommendations.map((shot, i) => (
                    <ShotCard key={i} shot={shot} rank={i} />
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                   <Button onClick={reset} variant="secondary" className="w-full py-5 text-sm" icon={<RotateCcw size={18} />}>New Scan</Button>
                   <div className="flex gap-2">
                     <button onClick={() => window.open('https://amazon.com', '_blank')} className="flex-1 py-4 bg-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/5">Pro Gear</button>
                     <button onClick={() => setShowSupportModal(true)} className="flex-1 py-4 bg-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/5">Tip $1</button>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
