import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, RefreshCw, WifiOff, Flashlight } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

interface MediaTrackCapabilitiesWithTorch extends MediaTrackCapabilities {
  torch?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const requestRef = useRef<number>(0);
  
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Torch state
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchMessage, setTorchMessage] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          
          if (ctx) {
              // Optimization: Only scan the center part of the video (where the box is)
              const scanSize = Math.min(video.videoWidth, video.videoHeight) * 0.6; // Scan 60% of center
              const sx = (video.videoWidth - scanSize) / 2;
              const sy = (video.videoHeight - scanSize) / 2;

              canvas.width = 400; 
              canvas.height = 400;
              
              ctx.drawImage(video, sx, sy, scanSize, scanSize, 0, 0, 400, 400);
              
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "dontInvert",
              });
              
              if (code && code.data && code.data.trim() !== "") {
                  // Pass the scanned code directly to parent. Parent validates it against DB.
                  onScan(code.data.trim());
              }
          }
      }
      requestRef.current = requestAnimationFrame(tick);
    };

    if (permissionGranted) {
        requestRef.current = requestAnimationFrame(tick);
    }
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [permissionGranted, onScan]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const startCamera = async () => {
      setError(null);
      setPermissionGranted(false);
      setHasTorch(false);
      setTorchOn(false);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMounted) {
            setError("مرورگر شما از دوربین پشتیبانی نمی‌کند.");
        }
        return;
      }

      try {
        // Attempt 1: Preferred settings (Environment camera, HD)
        try {
            const constraints = {
                audio: false,
                video: {
                    facingMode: "environment",
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 }
                }
            } as MediaStreamConstraints;
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            console.warn("Primary camera constraints failed, trying fallback...", err);
            // Attempt 2: Fallback (Any camera)
            const fallbackConstraints = {
                audio: false,
                video: true
            } as MediaStreamConstraints;
            stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        }

        if (isMounted && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute("playsinline", "true"); 
            
            // Check torch capability
            const track = stream.getVideoTracks()[0];
            if (track) {
                const capabilities: MediaTrackCapabilitiesWithTorch = track.getCapabilities ? track.getCapabilities() : {};
                const supportsTorch =
                  !!capabilities.torch ||
                  (Array.isArray((capabilities as any).fillLightMode) &&
                    (capabilities as any).fillLightMode.includes('flash'));
                if (supportsTorch) {
                    setHasTorch(true);
                }
            }

            videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().then(() => {
                    if (isMounted) setPermissionGranted(true);
                }).catch(e => {
                    console.error("Play error", e);
                    if (isMounted) setError("خطا در پخش تصویر.");
                });
            };
        }
      } catch (err: any) {
        console.error("Camera error:", err);
        if (isMounted) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError("دسترسی به دوربین مسدود شده است.");
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError("دوربین یافت نشد.");
            } else {
                setError("خطا در دسترسی به دوربین.");
            }
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (stream) {
        // Turn off torch before stopping tracks
        const track = stream.getVideoTracks()[0];
        if (track) {
            track.applyConstraints({ advanced: [{ torch: false }] } as any).catch(() => {});
            track.stop();
        }
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [retryCount]);

  useEffect(() => {
    if (!torchMessage) return;
    const timeout = window.setTimeout(() => setTorchMessage(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [torchMessage]);

  const toggleTorch = () => {
      if (!videoRef.current || !videoRef.current.srcObject) return;
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      
      const newStatus = !torchOn;
      
      // Try to apply constraint directly without alert
      track.applyConstraints({
          advanced: [{ torch: newStatus }] as any
      }).then(() => {
          setHasTorch(true);
          setTorchOn(newStatus);
          setTorchMessage(newStatus ? 'چراغ‌قوه روشن شد.' : 'چراغ‌قوه خاموش شد.');
      }).catch(e => {
          console.error("Torch error", e);
          setTorchMessage(hasTorch ? 'امکان تغییر وضعیت چراغ‌قوه وجود ندارد.' : 'این دستگاه یا مرورگر از چراغ‌قوه پشتیبانی نمی‌کند.');
      });
  };

  const handleRetry = () => {
      setRetryCount(prev => prev + 1);
      setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 absolute top-0 w-full z-30 backdrop-blur-sm">
        <div className="flex items-center gap-2">
            <button onClick={onClose} className="flex items-center gap-2 text-white bg-white/10 rounded-full pr-1 pl-3 py-1.5 hover:bg-white/20 transition-colors">
                <div className="p-1 bg-white/20 rounded-full"><ArrowRight className="rtl:rotate-180" size={18} /></div>
                <span className="font-bold text-sm">بازگشت</span>
            </button>
        </div>
        
        {permissionGranted && (
            <button 
                onClick={toggleTorch} 
                className={`p-3 rounded-full transition-all ${
                  hasTorch
                    ? (torchOn
                        ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                        : 'bg-white/10 text-white hover:bg-white/20')
                    : 'bg-white/10 text-slate-400'
                }`}
                title={hasTorch ? (torchOn ? 'خاموش کردن چراغ‌قوه' : 'روشن کردن چراغ‌قوه') : 'چراغ‌قوه پشتیبانی نمی‌شود'}
                aria-label="کنترل چراغ‌قوه"
            >
                <Flashlight size={20} className={torchOn ? "fill-black" : ""} />
            </button>
        )}
      </div>

      {torchMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-black/70 text-white text-xs px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
          {torchMessage}
        </div>
      )}

      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        
        <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className={`absolute min-w-full min-h-full object-cover transition-opacity duration-500 ${permissionGranted ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Loading / Error State */}
        {(!permissionGranted || error) && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
                <div className="text-white text-center p-6 max-w-xs">
                {error ? (
                    <div className="flex flex-col items-center gap-4 bg-red-900/20 p-6 rounded-2xl border border-red-500/30 backdrop-blur-md">
                        {error.includes("اینترنت") ? <WifiOff size={48} className="text-red-500" /> : <AlertCircle size={48} className="text-red-500" />}
                        <p className="text-red-200 font-medium text-sm leading-relaxed">{error}</p>
                        <div className="flex gap-2 w-full">
                            <button 
                                onClick={handleRetry}
                                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={16} />
                                <span>تلاش مجدد</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-t-accent border-white/20 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-300 text-sm">در حال راه‌اندازی دوربین...</p>
                    </div>
                )}
                </div>
            </div>
        )}
        
        {/* Scanner Overlay - Only show if camera is working */}
        {permissionGranted && (
            <>
                <div className="relative w-72 h-72 border-2 border-accent/50 rounded-3xl z-10 flex items-center justify-center overflow-hidden box-content">
                        {/* Darken outside area to emphasize scanning zone */}
                        <div className="absolute top-0 left-0 w-[4000px] h-[4000px] -translate-x-1/2 -translate-y-1/2 border-[2000px] border-black/50 pointer-events-none"></div>
                        
                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-accent rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-accent rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent rounded-br-xl"></div>
                        
                        {/* Scanning line */}
                        <div className="absolute top-0 w-full h-1 bg-accent/80 shadow-[0_0_20px_rgba(14,165,233,0.8)] animate-[scan_2s_infinite]"></div>
                </div>
                <div className="absolute bottom-24 text-white/90 text-sm bg-black/60 px-6 py-3 rounded-full backdrop-blur-md border border-white/10 shadow-xl z-10">
                        QR Code را در کادر قرار دهید
                </div>
            </>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};