import React, { useState, useRef, useCallback } from 'react';
import { Camera, RotateCcw, Info, Settings, AlertTriangle, Check, ArrowRight, CheckCircle2 } from 'lucide-react';
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
        const MAX_WIDTH = 1536; 
        const MAX_HEIGHT = 1536;
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
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

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
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#ballGrad)" stroke="#1a1a1a" strokeWidth="1" />
    <path d="M25 25 Q 50 10 75 25" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.15" />
    <ellipse cx="32" cy="28" rx="12" ry="6" fill="white" opacity="0.1" transform="rotate(-45 32 28)" />
    <circle cx="50" cy="42" r="22" fill="#f8fafc" />
    <text x="50" y="50" dy=".3em" fontSize="28" fontWeight="900" fontFamily="Arial, sans-serif" textAnchor="middle" fill="#000">8</text>
  </svg>
);

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PoolAnalysisResponse | null>(null);
  const [playerSuit, setPlayerSuit] = useState<PlayerSuit>(PlayerSuit.OPEN);
  const [hasFoul, setHasFoul] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file.");
      return;
    }

    try {
      setError(null);
      setIsAnalyzing(true);
      
      const compressedDataUrl = await compressImage(file);
      const base64Data = compressedDataUrl.split(',')[1];
      
      setImage(compressedDataUrl);
      analyzeImage(base64Data);
    } catch (err) {
      setError("Failed to process image. Please try again.");
      setIsAnalyzing(false);
      setImage(null);
    }
  };

  const analyzeImage = useCallback(async (base64Data: string) => {
    setResult(null);
    try {
      const analysis = await analyzePoolTable(base64Data, playerSuit, hasFoul);
      setResult(analysis);
    } catch (err) {
      setError("Unable to analyze the pool table. Please check your internet connection and try again.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [playerSuit, hasFoul]);

  const resetApp = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setHasFoul(false);
    setIsAnalyzing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const SuitSelector = () => (
    <div className="grid grid-cols-3 gap-2 mb-4 w-full">
      <button 
        onClick={() => setPlayerSuit(PlayerSuit.REDS)}
        className={`relative py-4 rounded-xl font-bold text-base transition-all duration-200 border-2 ${
          playerSuit === PlayerSuit.REDS 
            ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/30 transform scale-105 z-10' 
            : 'bg-emerald-800/40 border-emerald-700/50 text-emerald-100 hover:bg-emerald-700/50 backdrop-blur-sm'
        }`}
      >
        Reds
        {playerSuit === PlayerSuit.REDS && <Check size={18} className="absolute top-1 right-1 text-red-200" />}
      </button>
      <button 
        onClick={() => setPlayerSuit(PlayerSuit.YELLOWS)}
        className={`relative py-4 rounded-xl font-bold text-base transition-all duration-200 border-2 ${
          playerSuit === PlayerSuit.YELLOWS 
            ? 'bg-yellow-400 border-yellow-300 text-black shadow-lg shadow-yellow-500/30 transform scale-105 z-10' 
            : 'bg-emerald-800/40 border-emerald-700/50 text-emerald-100 hover:bg-emerald-700/50 backdrop-blur-sm'
        }`}
      >
        Yellows
        {playerSuit === PlayerSuit.YELLOWS && <Check size={18} className="absolute top-1 right-1 text-black/50" />}
      </button>
      <button 
        onClick={() => setPlayerSuit(PlayerSuit.OPEN)}
        className={`relative py-4 rounded-xl font-bold text-base transition-all duration-200 border-2 ${
          playerSuit === PlayerSuit.OPEN 
            ? 'bg-slate-800 border-slate-600 text-white shadow-lg shadow-slate-900/50 transform scale-105 z-10' 
            : 'bg-emerald-800/40 border-emerald-700/50 text-emerald-100 hover:bg-emerald-700/50 backdrop-blur-sm'
        }`}
      >
        Open
        {playerSuit === PlayerSuit.OPEN && <Check size={18} className="absolute top-1 right-1 text-slate-300" />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-emerald-950 text-white selection:bg-green-400 selection:text-emerald-950">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-emerald-950/80 backdrop-blur-md border-b border-emerald-800 px-4 py-3 safe-top">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-900 p-1.5 rounded-full border border-emerald-700 shadow-md">
              <ShinyEightBall size={28} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              PoolPro
            </h1>
          </div>
          {image && (
            <button 
              onClick={resetApp} 
              className="p-2 -mr-2 text-emerald-400 hover:text-white transition-colors"
              aria-label="Reset"
            >
              <RotateCcw size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md mx-auto w-full p-4 flex flex-col pb-safe">
        
        {/* State: Initial */}
        {!image && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 mt-4">
              <div className="relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
                <ShinyEightBall size={110} className="relative z-10 drop-shadow-2xl" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-4xl font-extrabold text-white tracking-tight">
                  Master the Table
                </h2>
                <p className="text-emerald-200/80 text-lg leading-relaxed max-w-xs mx-auto">
                  Instant AI coaching. <br/>Snap a photo, sink more balls.
                </p>
              </div>
            </div>
            
            <div className="w-full space-y-8 mt-10 mb-6">
              <div>
                <div className="flex items-center gap-3 text-lg text-green-400 font-bold uppercase tracking-wider mb-4 ml-1">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-900 border border-emerald-700 text-xs text-green-400 font-bold">1</span>
                  Select your suit
                </div>
                <SuitSelector />
              </div>

              <div>
                <div className="flex items-center gap-3 text-lg text-green-400 font-bold uppercase tracking-wider mb-4 ml-1">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-900 border border-emerald-700 text-xs text-green-400 font-bold">2</span>
                  Situation
                </div>
                <button
                  onClick={() => setHasFoul(!hasFoul)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 group ${
                    hasFoul
                      ? 'bg-red-900/40 border-red-500 text-white shadow-lg shadow-red-900/20'
                      : 'bg-emerald-800/40 border-emerald-700/50 text-emerald-100 hover:bg-emerald-700/50 backdrop-blur-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg ${hasFoul ? 'bg-red-500/20' : 'bg-emerald-900/50 border border-emerald-700/50'} transition-colors`}>
                      <AlertTriangle size={24} className={hasFoul ? "text-red-400" : "text-emerald-500"} />
                    </div>
                    <div className="text-left">
                      <div className={`font-bold text-lg ${hasFoul ? 'text-red-100' : 'text-emerald-100'}`}>Opponent Fouled</div>
                      <div className="text-sm opacity-70">I have 2 shots / Ball-in-hand</div>
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                    hasFoul ? 'border-red-500 bg-red-500 text-white' : 'border-emerald-700 bg-emerald-900/50'
                  }`}>
                    {hasFoul && <Check size={16} />}
                  </div>
                </button>
              </div>

              <div className="pt-4">
                 <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-16 text-xl shadow-amber-500/20"
                  icon={<Camera size={28} />}
                >
                  Analyze Table
                </Button>
                <p className="text-center text-xs text-emerald-400/50 mt-3 uppercase tracking-widest font-medium">
                  Upload a clear photo of the entire table
                </p>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* State: Image Selected / Analyzing / Result */}
        {image && (
          <div className="space-y-6 animate-fade-in pb-8">
            
            {/* Image Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-emerald-700 shadow-2xl bg-emerald-950">
              <img 
                src={image} 
                alt="Pool Table" 
                className={`w-full h-auto max-h-[50vh] object-contain mx-auto transition-opacity duration-500 ${isAnalyzing ? 'opacity-30 blur-sm' : 'opacity-100'}`} 
              />
              
              {/* Analyzing Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-green-500 blur-2xl opacity-30 animate-pulse rounded-full"></div>
                    <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-green-500/30 border-t-green-400"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Analyzing Table</h3>
                  <p className="text-green-300 text-sm animate-pulse font-medium uppercase tracking-widest">Finding the winning line...</p>
                </div>
              )}

              {/* Status Badges */}
              {!isAnalyzing && (
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-lg border border-white/10 ${
                    playerSuit === PlayerSuit.REDS ? 'bg-red-600/90 text-white' :
                    playerSuit === PlayerSuit.YELLOWS ? 'bg-yellow-400/90 text-black' :
                    'bg-slate-900/90 text-white'
                  }`}>
                    {playerSuit === PlayerSuit.OPEN ? 'Open Table' : `${playerSuit.toLowerCase()} Suit`}
                  </div>
                  {hasFoul && (
                    <div className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/90 text-white backdrop-blur-md shadow-lg flex items-center gap-1 border border-white/10">
                      <AlertTriangle size={12} /> 2 Shots
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-red-200 flex items-start gap-3 animate-fade-in">
                <Info className="shrink-0 mt-0.5 text-red-500" size={18} />
                <div className="flex-1">
                  <p className="font-bold">Analysis Failed</p>
                  <p className="text-sm opacity-80 mt-1">{error}</p>
                </div>
                <button onClick={resetApp} className="text-sm bg-red-900/50 border border-red-700 hover:bg-red-900 px-3 py-1 rounded-lg transition-colors text-white">
                  Retry
                </button>
              </div>
            )}

            {/* Analysis Results */}
            {!isAnalyzing && result && (
              <div className="space-y-6 animate-fade-in delay-100">
                
                {/* General Advice */}
                {result.generalAdvice && (
                   <div className="bg-emerald-800/40 rounded-xl p-5 border border-emerald-700/50 shadow-sm backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-3 text-green-400 font-bold uppercase text-xs tracking-wider">
                        <Settings size={14} /> Coach's Insight
                      </div>
                      <p className="text-emerald-100 leading-relaxed text-sm md:text-base font-medium">{result.generalAdvice}</p>
                   </div>
                )}

                {/* Recommendations */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-green-400" />
                      Best Shots
                    </h3>
                    <span className="text-xs text-emerald-300 font-bold bg-emerald-900/50 border border-emerald-800 px-3 py-1.5 rounded-full uppercase tracking-wider">
                      High Confidence
                    </span>
                  </div>
                  
                  {result.recommendations.length === 0 ? (
                    <div className="text-center bg-emerald-900/20 rounded-xl border border-emerald-800 p-8">
                      <p className="text-emerald-400 mb-2 font-medium">No clear shots found.</p>
                      <p className="text-emerald-600/70 text-sm">Try taking a photo from a higher angle or different lighting.</p>
                    </div>
                  ) : (
                    result.recommendations.map((shot, idx) => (
                      <ShotCard key={idx} shot={shot} rank={idx} />
                    ))
                  )}
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={resetApp} 
                    variant="secondary" 
                    className="w-full py-4"
                    icon={<RotateCcw size={18} />}
                  >
                    Analyze New Table
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;