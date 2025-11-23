import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface CameraProps {
  onCapture: (imageData: string) => void;
}

const CameraCapture: React.FC<CameraProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Flip horizontally for a mirror effect
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Reset transform
        context.setTransform(1, 0, 0, 1, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageData);
        stopCamera();
      }
    }
  }, [onCapture]);

  // Clean up on unmount
  React.useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-4">
      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
      
      <div className="relative w-full max-w-md aspect-[3/4] md:aspect-video bg-gray-900 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl">
        {!isStreaming ? (
           <div className="flex flex-col items-center justify-center h-full text-slate-400">
             <Camera size={48} className="mb-4 opacity-50" />
             <button 
               onClick={startCamera}
               className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-colors"
             >
               Start Camera
             </button>
           </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover transform -scale-x-100"
            />
            <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-4">
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
                aria-label="Take Photo"
              >
                <div className="w-full h-full rounded-full border-2 border-transparent"></div>
              </button>
               <button 
                onClick={stopCamera}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 transition-colors"
                aria-label="Switch Camera"
              >
                 <RefreshCw size={20} />
              </button>
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CameraCapture;