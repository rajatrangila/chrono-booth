import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Camera as CameraIcon, Wand2, RefreshCw, Send, ArrowLeft, Download, Info, Share2, Move, Trash2, History, MousePointer2, Film, PlayCircle } from 'lucide-react';
import { AppMode, ProcessingStatus, SUPPORTED_ERAS, RANDOM_ERA_ID } from './types';
import CameraCapture from './components/Camera';
import EraSelector from './components/EraSelector';
import * as GeminiService from './services/geminiService';

// Removed conflicting global declaration for window.aistudio to fix type error.
// The environment provides this type, but we will access it safely via casting if needed.

interface ImageTransform {
  scale: number;
  rotate: number;
  x: number;
  y: number;
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.UPLOAD);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [selectedEra, setSelectedEra] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  
  // New State for Video
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentEraPrompt, setCurrentEraPrompt] = useState<string>('');
  
  // Image adjustments state
  const [transform, setTransform] = useState<ImageTransform>({ scale: 1, rotate: 0, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef<{x: number, y: number} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Canvas Interaction Handlers (Pan & Zoom) ---

  const handleWheel = (e: React.WheelEvent) => {
    if (mode !== AppMode.PREVIEW) return;
    const scaleAmount = -e.deltaY * 0.001;
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale + scaleAmount, 0.5), 5)
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== AppMode.PREVIEW) return;
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !lastMousePos.current || mode !== AppMode.PREVIEW) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    
    setTransform(prev => ({
      ...prev,
      x: prev.x + (deltaX * 0.5), 
      y: prev.y + (deltaY * 0.5)
    }));

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    lastMousePos.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mode !== AppMode.PREVIEW) return;
    const touch = e.touches[0];
    setIsDragging(true);
    lastMousePos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
     if (!isDragging || !lastMousePos.current || mode !== AppMode.PREVIEW) return;
     const touch = e.touches[0];
     const deltaX = touch.clientX - lastMousePos.current.x;
     const deltaY = touch.clientY - lastMousePos.current.y;
     
     setTransform(prev => ({
       ...prev,
       x: prev.x + (deltaX * 0.5), 
       y: prev.y + (deltaY * 0.5)
     }));
 
     lastMousePos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastMousePos.current = null;
  };

  // --- Canvas Drawing Logic for WYSIWYG Preview ---

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = originalImage;
    img.onload = () => {
        const targetWidth = 900; 
        const targetHeight = 1200; 
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        const scaleX = targetWidth / img.width;
        const scaleY = targetHeight / img.height;
        const baseScale = Math.max(scaleX, scaleY);
        
        const scaledWidth = img.width * baseScale;
        const scaledHeight = img.height * baseScale;

        ctx.save();
        ctx.translate(targetWidth / 2, targetHeight / 2);
        ctx.translate(transform.x * 2, transform.y * 2); 
        ctx.rotate((transform.rotate * Math.PI) / 180);
        ctx.scale(transform.scale, transform.scale);
        
        ctx.drawImage(
            img, 
            -scaledWidth / 2, 
            -scaledHeight / 2, 
            scaledWidth, 
            scaledHeight
        );
        ctx.restore();
    };
  }, [originalImage, transform]);

  useEffect(() => {
    if (mode === AppMode.PREVIEW) {
        requestAnimationFrame(drawCanvas);
    }
  }, [mode, transform, drawCanvas]);


  // --- Handlers ---

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setOriginalImage(result);
        setMode(AppMode.PREVIEW);
        setTransform({ scale: 1, rotate: 0, x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imageData: string) => {
    setOriginalImage(imageData);
    setMode(AppMode.PREVIEW);
    setShowCamera(false);
    setTransform({ scale: 1, rotate: 0, x: 0, y: 0 });
  };

  const handleTimeTravel = async () => {
    if (!canvasRef.current || !selectedEra) return;

    setStatus(ProcessingStatus.GENERATING);
    setError(null);
    setAnalysisText(null);
    setVideoUrl(null);
    setLoadingMessage('Preparing time machine...');

    try {
      const processedImage = canvasRef.current.toDataURL('image/jpeg', 0.9);
      
      let eraPrompt = '';
      
      if (selectedEra === RANDOM_ERA_ID) {
        setLoadingMessage('AI is dreaming up a unique era...');
        const randomEra = await GeminiService.suggestRandomEra();
        eraPrompt = randomEra.promptSuffix;
      } else {
        const era = SUPPORTED_ERAS.find(e => e.id === selectedEra);
        if (!era) return;
        eraPrompt = era.promptSuffix;
      }

      // Save prompt for video generation later
      setCurrentEraPrompt(eraPrompt);
      
      setLoadingMessage('Generating time travel photo...');
      const generatedImage = await GeminiService.generateTimeTravelImage(processedImage, eraPrompt);
      setCurrentImage(generatedImage);
      setMode(AppMode.RESULT);
    } catch (err) {
      console.error(err);
      setError("Time travel malfunction! Could not generate image. Please try again.");
    } finally {
      setStatus(ProcessingStatus.IDLE);
      setLoadingMessage('');
    }
  };

  const handleGenerateVideo = async () => {
    if (!currentImage || !currentEraPrompt) return;

    // Check for API Key first
    try {
      // Cast to any to avoid type conflict with global declaration
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await aistudio.openSelectKey();
          // Assume success and proceed, handling cancellations via error catch if needed
        }
      }
    } catch (keyErr) {
      console.error("API Key selection failed", keyErr);
      setError("You must select a paid API key to use video generation.");
      return;
    }

    setStatus(ProcessingStatus.GENERATING_VIDEO);
    setError(null);
    setLoadingMessage('Directing your scene (this takes ~1 min)...');

    try {
      const videoBlobUrl = await GeminiService.generateTimeTravelVideo(currentImage, currentEraPrompt);
      setVideoUrl(videoBlobUrl);
    } catch (err) {
      console.error(err);
      setError("Video generation failed. Please try again.");
    } finally {
      setStatus(ProcessingStatus.IDLE);
      setLoadingMessage('');
    }
  };

  const handleEditImage = async () => {
    if (!currentImage || !editPrompt.trim()) return;

    setStatus(ProcessingStatus.EDITING);
    setError(null);

    try {
      const editedImage = await GeminiService.editImageWithPrompt(currentImage, editPrompt);
      setCurrentImage(editedImage);
      setEditPrompt('');
    } catch (err) {
      console.error(err);
      setError("Edit failed. Try a different prompt.");
    } finally {
      setStatus(ProcessingStatus.IDLE);
    }
  };

  const handleAnalyze = async (imageToAnalyze: string | null) => {
    if (!imageToAnalyze) return;

    setStatus(ProcessingStatus.ANALYZING);
    setError(null);
    setAnalysisText(null);

    try {
      const text = await GeminiService.analyzeImageContent(imageToAnalyze);
      setAnalysisText(text);
    } catch (err) {
      console.error(err);
      setError("Analysis failed.");
    } finally {
      setStatus(ProcessingStatus.IDLE);
    }
  };

  const handleDownload = () => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = currentImage;
      link.download = `chronobooth-${selectedEra}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (!currentImage) return;

    try {
      const blob = await (await fetch(currentImage)).blob();
      const file = new File([blob], 'chronobooth-result.jpg', { type: 'image/jpeg' });
      
      const eraName = SUPPORTED_ERAS.find(e => e.id === selectedEra)?.name || 'History';

      if (navigator.share) {
        await navigator.share({
          title: 'ChronoBooth Time Travel',
          text: `Check out my time travel trip to ${eraName} with ChronoBooth! #ChronoBooth #AI`,
          files: [file]
        });
      } else {
        handleDownload();
        alert("Sharing not available on this device. Image has been downloaded instead!");
      }
    } catch (err) {
      console.error("Share failed", err);
      if ((err as Error).name !== 'AbortError') {
         setError("Sharing failed. Try downloading instead.");
      }
    }
  };

  const handleBackToEditor = () => {
    setCurrentImage(null);
    setVideoUrl(null);
    setStatus(ProcessingStatus.IDLE);
    setError(null);
    setAnalysisText(null);
    setMode(AppMode.PREVIEW);
  };

  const handleStartOver = () => {
    setOriginalImage(null);
    setCurrentImage(null);
    setVideoUrl(null);
    setSelectedEra(null);
    setStatus(ProcessingStatus.IDLE);
    setError(null);
    setAnalysisText(null);
    setTransform({ scale: 1, rotate: 0, x: 0, y: 0 });
    setMode(AppMode.UPLOAD);
  };

  // --- Render Helpers ---

  const renderHeader = () => (
    <header className="py-6 px-4 md:px-8 flex justify-between items-center border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Wand2 className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            ChronoBooth
          </h1>
          <p className="text-xs text-slate-400 hidden md:block">Time Travel Photo Lab</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        {mode === AppMode.RESULT && (
            <button 
            onClick={handleBackToEditor}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors flex items-center gap-2"
            >
            <History size={16} />
            <span className="hidden sm:inline">Different Era</span>
            </button>
        )}
        
        {mode !== AppMode.UPLOAD && (
            <button 
            onClick={handleStartOver}
            className="px-4 py-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-900/50 text-sm font-medium transition-colors flex items-center gap-2"
            >
            <Trash2 size={16} />
            <span className="hidden sm:inline">New Photo</span>
            </button>
        )}
      </div>
    </header>
  );

  const renderUploadStage = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[60vh] animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Rewrite History <br />
            <span className="text-indigo-400">With Your Face</span>
          </h2>
          <p className="text-lg text-slate-400">
            Take a selfie or upload a group photo. 
            <br />
            You can crop and zoom to any face to travel through time.
          </p>
        </div>

        {showCamera ? (
          <CameraCapture onCapture={handleCameraCapture} />
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
            <button
              onClick={() => setShowCamera(true)}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-900/50 transition-all hover:scale-105 w-full sm:w-auto min-w-[200px]"
            >
              <CameraIcon size={24} />
              Take Selfie
            </button>
            
            <div className="relative w-full sm:w-auto">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-semibold border border-slate-700 transition-all hover:scale-105 w-full sm:w-auto min-w-[200px]"
              >
                <Upload size={24} />
                Upload Photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPreviewStage = () => (
    <div className="flex-1 flex flex-col items-center p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-1/2 space-y-6">
          <div 
             className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-black group aspect-[3/4] cursor-move"
             onWheel={handleWheel}
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={handleTouchEnd}
          >
            <canvas 
                ref={canvasRef} 
                className="w-full h-full object-contain bg-slate-900 pointer-events-none" 
            />
            <div className="absolute inset-0 pointer-events-none opacity-20">
               <div className="w-full h-full border-2 border-white/20 grid grid-cols-3 grid-rows-3">
                  {[...Array(9)].map((_, i) => <div key={i} className="border border-white/10"></div>)}
               </div>
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                <span className="bg-black/60 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 flex items-center gap-2">
                    <MousePointer2 size={12} /> Drag to pan • Scroll to zoom
                </span>
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-4">
             <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
               <Move size={16} /> Fine Tune
             </h4>
             <p className="text-xs text-slate-500">
               If you uploaded a group photo, use the cursor (or controls below) to center YOUR face.
             </p>
             <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                   <div className="flex justify-between text-xs text-slate-400">
                      <span>Zoom</span>
                      <span>{Math.round(transform.scale * 100)}%</span>
                   </div>
                   <input 
                     type="range" min="0.5" max="3" step="0.1" 
                     value={transform.scale}
                     onChange={(e) => setTransform(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                     className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                   />
                </div>
                <div className="space-y-1">
                   <div className="flex justify-between text-xs text-slate-400">
                      <span>Rotate</span>
                      <span>{transform.rotate}°</span>
                   </div>
                   <input 
                     type="range" min="-180" max="180" step="5" 
                     value={transform.rotate}
                     onChange={(e) => setTransform(prev => ({ ...prev, rotate: parseFloat(e.target.value) }))}
                     className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                   />
                </div>
                 <button 
                   onClick={() => setTransform({ scale: 1, rotate: 0, x: 0, y: 0 })}
                   className="text-xs text-slate-500 hover:text-slate-300 underline text-right w-full"
                 >
                   Reset Adjustments
                 </button>
             </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
             <h3 className="text-2xl font-bold mb-2">Select Destination</h3>
             <p className="text-slate-400 mb-6">Choose where (and when) to send yourself.</p>
             <div className="w-full">
                <EraSelector 
                selectedEra={selectedEra} 
                onSelect={setSelectedEra} 
                disabled={status === ProcessingStatus.GENERATING}
                />
             </div>
             <div className="mt-8 pt-4 border-t border-slate-700">
               <button
                 onClick={handleTimeTravel}
                 disabled={!selectedEra || status !== ProcessingStatus.IDLE}
                 className={`
                   w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                   ${!selectedEra || status !== ProcessingStatus.IDLE 
                     ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                     : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.02]'
                   }
                 `}
               >
                 {status === ProcessingStatus.GENERATING ? (
                   <>
                     <RefreshCw className="animate-spin" /> 
                     {loadingMessage || 'Travelling through time...'}
                   </>
                 ) : (
                   <>
                     <Wand2 /> Travel to {SUPPORTED_ERAS.find(e => e.id === selectedEra)?.name || 'Random Era'}
                   </>
                 )}
               </button>
             </div>
          </div>
          {error && (
            <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/30 text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderResultStage = () => (
    <div className="flex-1 flex flex-col items-center p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Main Result Image */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
           <div className="relative rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(79,70,229,0.15)] border border-slate-700 bg-black aspect-[3/4] group">
              <img 
                src={currentImage || ''} 
                alt="Time Travel Result" 
                className="w-full h-full object-contain bg-slate-900"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                 <button 
                  onClick={handleDownload}
                  className="p-3 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white transition-colors shadow-lg"
                  title="Download Image"
                 >
                   <Download size={20} />
                 </button>
              </div>
           </div>
           
           {/* Video Result Section */}
           {videoUrl && (
             <div className="relative rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(236,72,153,0.15)] border border-pink-500/30 bg-black aspect-[9/16] md:aspect-video animate-fade-in">
                <video 
                  controls 
                  src={videoUrl} 
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                />
                <div className="absolute top-4 left-4 bg-pink-600/80 backdrop-blur text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <PlayCircle size={12} /> Generated by Veo
                </div>
             </div>
           )}

           {/* Share Action Bar */}
           <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <div className="text-sm text-slate-300">
                <strong className="block text-white">Share your journey!</strong>
                Post to Instagram, Twitter, or send to friends.
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-md"
              >
                <Share2 size={18} />
                Share Image
              </button>
           </div>
        </div>

        {/* Sidebar: Actions */}
        <div className="w-full lg:w-1/3 space-y-6">
           <button 
             onClick={handleBackToEditor}
             className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-indigo-200 hover:text-white rounded-xl flex items-center justify-center gap-3 font-bold transition-colors border border-slate-600 shadow-lg"
           >
             <ArrowLeft size={20} />
             Try Another Era (Same Photo)
           </button>
           
           {/* Video Generation Button */}
           {!videoUrl && (
              <div className="bg-gradient-to-br from-pink-900/20 to-purple-900/20 p-6 rounded-2xl border border-pink-500/20 space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-pink-300">
                  <Film size={20} /> Bring to Life
                </h3>
                <p className="text-slate-400 text-sm">
                  Turn this photo into a cinematic video scene using Veo.
                </p>
                <button
                  onClick={handleGenerateVideo}
                  disabled={status === ProcessingStatus.GENERATING_VIDEO}
                  className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all border border-pink-500/30
                    ${status === ProcessingStatus.GENERATING_VIDEO 
                      ? 'bg-pink-900/20 text-pink-300 cursor-not-allowed' 
                      : 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-600/20'
                    }`}
                >
                  {status === ProcessingStatus.GENERATING_VIDEO ? (
                    <>
                       <RefreshCw className="animate-spin" size={18} /> {loadingMessage || 'Creating Video...'}
                    </>
                  ) : (
                    <>
                      <PlayCircle size={18} /> Generate Video
                    </>
                  )}
                </button>
              </div>
           )}

           {/* Editing Panel */}
           <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Wand2 size={20} className="text-indigo-400"/> Magic Edit
              </h3>
              <p className="text-slate-400 text-sm">
                Not quite right? Use AI to tweak the image.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g. 'Make me smile more'"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                  onKeyDown={(e) => e.key === 'Enter' && handleEditImage()}
                />
                <button
                  onClick={handleEditImage}
                  disabled={status === ProcessingStatus.EDITING || !editPrompt.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-3 rounded-lg transition-colors"
                >
                   {status === ProcessingStatus.EDITING ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </div>
           </div>

           {/* Analysis Panel */}
           <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Info size={20} className="text-teal-400"/> Historical Analysis
                </h3>
                <button
                  onClick={() => handleAnalyze(currentImage)}
                  disabled={status === ProcessingStatus.ANALYZING}
                  className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full transition-colors"
                >
                  {status === ProcessingStatus.ANALYZING ? 'Analyzing...' : 'Analyze Scene'}
                </button>
              </div>
              <div className="min-h-[100px] text-sm text-slate-300 leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar p-2 bg-slate-900/50 rounded-lg border border-slate-800">
                {status === ProcessingStatus.ANALYZING ? (
                  <div className="flex items-center justify-center h-full text-slate-500 gap-2">
                    <RefreshCw className="animate-spin" size={16} /> Analyzing history...
                  </div>
                ) : analysisText ? (
                  analysisText
                ) : (
                  <div className="text-slate-600 italic text-center p-4">
                    Use Gemini to analyze the historical accuracy and details of your generated image.
                  </div>
                )}
              </div>
           </div>
           
           {error && (
            <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/30 text-red-200 text-sm">
              {error}
            </div>
           )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      {renderHeader()}
      <main className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto">
        {mode === AppMode.UPLOAD && renderUploadStage()}
        {mode === AppMode.PREVIEW && renderPreviewStage()}
        {mode === AppMode.RESULT && renderResultStage()}
      </main>
      <footer className="py-6 text-center text-slate-600 text-sm">
        <p>Powered by Gemini 2.5 Flash Image & Gemini 3 Pro & Veo</p>
      </footer>
    </div>
  );
};

export default App;