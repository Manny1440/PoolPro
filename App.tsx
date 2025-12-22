import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RotateCcw, Info, Settings, AlertTriangle, Check, ArrowRight, CheckCircle2, Trophy, GraduationCap, Sparkles, Beer, Zap } from 'lucide-react';
import { PlayerSuit, PoolAnalysisResponse } from './types';
import { analyzePoolTable } from './services/geminiService';
import { Button } from './components/Button';
import { ShotCard } from './components/ShotCard';

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1280; // Faster processing with slightly lower but still high res
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75)); // Faster upload
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const ANALYSIS_STEPS = [
  "Chalking the cue...",
  "Eyeballing the angles...",
  "Checking for table tilt...",
  "Finding the cue ball...",
  "Ignoring the jukebox...",
  "Measuring the pocket...",
  "Calculating the geometry...",
  "Visualizing the win..."
];

const PRO_ANALYSIS_STEPS = [
  "Initializing spatial grid...",
  "Mapping vector trajectories...",
  "Calculating ball deflection...",
  "Analyzing rail friction...",
  "Optimizing for run-out...",
  "Evaluating safety margins..."
];

const ShinyEightBall = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ minWidth: size, minHeight: size }} 
  >
    <defs>
      <radialGradient id="ballGrad" cx="35%" cy="35%" r="65%" fx="35%" fy="35%">
        <stop offset="0%" stopColor="#555" />
        <stop offset="100%" stopColor="#000" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#ballGrad)" stroke="#1a1a1a" strokeWidth="1" />
    <circle cx="50" cy="42" r="22" fill="#f8fafc" />
    <text x="50" y="50" dy=".3em" fontSize="28" fontWeight="900" fontFamily="Arial, sans-serif" textAnchor="middle" fill="#000">8</text>
  </svg>
);

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<PoolAnalysisResponse | null>(null);
  const [playerSuit, setPlayerSuit] = useState<PlayerSuit>(PlayerSuit.OPEN);
  const [hasFoul, setHasFoul] = useState(false);
  const [isCompetitionMode, setIsCompetitionMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = isCompetitionMode ? PRO_ANALYSIS_STEPS : ANALYSIS_STEPS;

  useEffect(() => {
    let interval: number;
    if (isAnalyzing) {
      interval = window.setInterval(() => {
        setAnalysisStep((prev) => (prev + 1) % steps.length);
      }, 1000); // Faster rotations for faster model
    } else {
      setAnalysisStep(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, steps.length]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Pick a picture of the table, buddy!");
      return;
    }

    try {
      setError(null);
      setIsAnalyzing(true);
      const compressedDataUrl = await compressImage(file);
      const base64Data = compressedDataUrl.split(',')[1];
      setImage(compressedDataUrl);
      
      const analysis = await analyzePoolTable(base64Data, playerSuit, hasFoul, isCompetitionMode);
      setResult(analysis);
      setIsAnalyzing(false);
    } catch (err: any) {
      setError(err.message || "Table is too crowded. Try again!");
      setIsAnalyzing(false);
      setImage(null);
    }
  };

  const resetApp = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setHasFoul(false);
    setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const SuitSelector = () => (
    <div className="grid grid-cols-3 gap-2 mb-4 w-full">
      {(Object.keys(PlayerSuit) as Array<keyof typeof PlayerSuit>).map((suit) => (
        <button 
          key={suit}
          onClick={() => setPlayerSuit(PlayerSuit[suit])}
          className={`relative py-4 rounded-xl font-bold text-base transition-all duration-200 border-2 ${
            playerSuit === PlayerSuit[suit] 
              ? isCompetitionMode ? 'bg-amber-600 border-amber-400 text-white shadow-lg' : 'bg-emerald-600 border-emerald-400 text-white shadow-lg'
              : 'bg-emerald-800/20 border-emerald-800/40 text-emerald-100 hover:bg-emerald-700/30 backdrop-blur-sm'
          }`}
        >
          {suit === 'OPEN' ? 'Any Ball' : suit.charAt(0) + suit.slice(1).toLowerCase()}
          {playerSuit === PlayerSuit[suit] && <Check size={16} className="absolute top-1 right-1" />}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col bg-emerald-950 text-white selection:bg-green-400 selection:text-emerald-950 transition-all duration-500`}>
      
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b px-4 py-3 safe-top transition-colors duration-300 ${isCompetitionMode ? 'bg-amber-950/80 border-amber-800' : 'bg-emerald-950/80 border-emerald-800'}`}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShinyEightBall size={32} />
            <h1 className="text-xl font-bold tracking-tight">PoolPro <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ml-1 ${isCompetitionMode ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-white'}`}>
              {isCompetitionMode ? 'Match' : 'Relaxed'}
            </span></h1>
          </div>
          {image && (
            <button onClick={resetApp} className="p-2 text-emerald-400 hover:text-white transition-colors">
              <RotateCcw size={20} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full p-4 flex flex-col">
        {!image ? (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 py-8">
              <div className="relative group">
                <div className={`absolute inset-0 blur-3xl opacity-30 transition-colors duration-700 ${isCompetitionMode ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                <ShinyEightBall size={120} className="relative z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] group-hover:rotate-12 transition-transform duration-500" />
                {!isCompetitionMode && <Beer size={32} className="absolute -bottom-4 -right-4 text-amber-400 animate-bounce" />}
              </div>
              
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-white">{isCompetitionMode ? "Analyze Position" : "Wanna win?"}</h2>
                <p className="text-emerald-200/60 font-medium">{isCompetitionMode ? "Vector analysis active" : "I'll spot the best shots for ya!"}</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-emerald-900/30 p-1 rounded-xl flex border border-emerald-800/50">
                <button
                  onClick={() => setIsCompetitionMode(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${!isCompetitionMode ? 'bg-emerald-600 shadow-lg' : 'text-emerald-400'}`}
                >
                  <Beer size={16} /> Relaxed
                </button>
                <button
                  onClick={() => setIsCompetitionMode(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${isCompetitionMode ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-emerald-400'}`}
                >
                  <Trophy size={16} /> Match
                </button>
              </div>

              <div className="space-y-4">
                <SuitSelector />
                <div className="grid grid-cols-2 gap-3">
                   <button
                    onClick={() => setHasFoul(!hasFoul)}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${hasFoul ? 'bg-red-900/30 border-red-500 shadow-lg' : 'bg-emerald-900/20 border-emerald-800/40'}`}
                  >
                    <Zap size={18} className={hasFoul ? "text-red-400" : "text-emerald-600"} />
                    <span className="text-sm font-bold">2 Shots</span>
                  </button>
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-14 font-black"
                    variant={isCompetitionMode ? 'primary' : 'secondary'}
                    icon={<Camera size={20} />}
                  >
                    Go!
                  </Button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in pb-10">
            <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-800/50 shadow-2xl bg-black">
              <img src={image} alt="Pool Table" className={`w-full h-auto max-h-[40vh] object-contain mx-auto transition-all duration-300 ${isAnalyzing ? 'opacity-30 blur-sm' : 'opacity-100'}`} />
              
              {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <div className="mb-4 relative">
                    <div className="h-16 w-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-400 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles size={24} className="text-amber-400 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-white text-lg font-black tracking-tight mb-1">
                    {steps[analysisStep]}
                  </p>
                  <p className="text-emerald-400 text-[10px] uppercase tracking-widest font-bold opacity-60">
                    Flash Engine Active
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-red-200 flex items-center gap-4">
                <AlertTriangle className="text-red-500 shrink-0" size={24} />
                <div className="flex-1 text-sm font-medium">{error}</div>
                <button onClick={resetApp} className="p-2 hover:bg-red-500/20 rounded-lg"><RotateCcw size={18} /></button>
              </div>
            )}

            {!isAnalyzing && result && (
              <div className="space-y-5">
                <div className="bg-emerald-900/30 border border-emerald-800/50 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-10">
                    <Sparkles size={80} />
                  </div>
                  <div className="flex items-center gap-2 mb-2 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                    <Zap size={14} /> The {isCompetitionMode ? 'Strategy' : 'Scoop'}
                  </div>
                  <p className="text-white text-base leading-snug font-semibold">{result.generalAdvice}</p>
                </div>

                <div className="space-y-4">
                  {result.recommendations.map((shot, idx) => (
                    <ShotCard key={idx} shot={shot} rank={idx} />
                  ))}
                </div>

                <Button onClick={resetApp} variant="ghost" className="w-full text-emerald-400" icon={<RotateCcw size={18} />}>
                  Try another snap
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
