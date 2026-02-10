
import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, Camera, Video, AlertTriangle, FileEdit, Mic, MicOff, Trash2, Image as ImageIcon, Film } from 'lucide-react';
import { ChecklistItemData, InspectionStatus } from '../types';

interface Props {
  item: ChecklistItemData;
  index: number;
  onChange: (updatedItem: ChecklistItemData) => void;
}

export const ChecklistItem: React.FC<Props> = ({ item, index, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // State for media previews
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (item.photo) {
        const url = URL.createObjectURL(item.photo);
        setPhotoPreview(url);
        return () => URL.revokeObjectURL(url);
    } else {
        setPhotoPreview(null);
    }
  }, [item.photo]);

  useEffect(() => {
    if (item.video) {
        const url = URL.createObjectURL(item.video);
        setVideoPreview(url);
        return () => URL.revokeObjectURL(url);
    } else {
        setVideoPreview(null);
    }
  }, [item.video]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'fa-IR';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const currentComment = item.comment || "";
        const newComment = currentComment ? `${currentComment} ${transcript}` : transcript;
        onChange({ ...item, comment: newComment });
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [item.comment, onChange, item]);

  const toggleListening = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch(e) {
            console.error("Mic start error", e);
        }
      } else {
        alert("مرورگر شما از تایپ صوتی پشتیبانی نمی‌کند.");
      }
    }
  };

  const handleStatusChange = (status: InspectionStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ ...item, status });
    if (status === InspectionStatus.FAIL) {
        setIsExpanded(true);
    } else {
        setIsExpanded(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    if (e.target.files && e.target.files[0]) {
      onChange({ ...item, [type]: e.target.files[0] });
    }
  };
  
  const clearFile = (e: React.MouseEvent, type: 'photo' | 'video') => {
      e.stopPropagation();
      e.preventDefault();
      onChange({ ...item, [type]: null });
  };

  const getContainerClasses = () => {
    switch (item.status) {
      case InspectionStatus.PASS: 
        return 'border-l-4 border-l-green-500 bg-white dark:bg-slate-900';
      case InspectionStatus.FAIL: 
        return 'border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-900/10';
      default: 
        return 'border-l-4 border-l-slate-300 dark:border-l-slate-600 bg-white dark:bg-slate-900';
    }
  };

  const isFailAndEmpty = item.status === InspectionStatus.FAIL && (!item.comment || item.comment.trim() === '');

  return (
    <div className={`group rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden mb-4 ${getContainerClasses()}`}>
      
      {/* Header Item */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 flex items-start justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex-1 pt-1 flex gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0 mt-0.5 shadow-sm">
            {index}
          </span>
          <div>
            <h3 className={`font-bold text-base leading-snug mb-1 transition-colors ${item.status === InspectionStatus.FAIL ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
                {item.task}
            </h3>
            {item.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-2 border-r-2 border-slate-200 dark:border-slate-700 mr-0.5">
                {item.description}
                </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0 self-start">
          <button 
            onClick={(e) => handleStatusChange(InspectionStatus.PASS, e)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
              item.status === InspectionStatus.PASS 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 shadow-inner ring-1 ring-green-200 dark:ring-green-800' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 size={22} className={item.status === InspectionStatus.PASS ? "fill-current" : ""} />
          </button>
          <button 
            onClick={(e) => handleStatusChange(InspectionStatus.FAIL, e)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
              item.status === InspectionStatus.FAIL 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-inner ring-1 ring-red-200 dark:ring-red-800' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <XCircle size={22} className={item.status === InspectionStatus.FAIL ? "fill-current" : ""} />
          </button>
        </div>
      </div>

      {/* Expanded Actions */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-slate-50/50 dark:bg-slate-800/50 ${
          isExpanded || item.status === InspectionStatus.FAIL ? 'max-h-[600px] opacity-100 border-t border-slate-100 dark:border-slate-800' : 'max-h-0 opacity-0'
      }`}>
        <div className="p-4 space-y-3">
          
          {/* Comment Field with Mic */}
          <div className="relative">
             <div className={`absolute top-2 right-2 ${isFailAndEmpty ? 'text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
               <FileEdit size={16} />
             </div>
             <textarea
                placeholder={item.status === InspectionStatus.FAIL ? "علت خرابی را بنویسید (الزامی)..." : "توضیحات تکمیلی..."}
                value={item.comment}
                onChange={(e) => onChange({ ...item, comment: e.target.value })}
                className={`w-full text-right pr-9 pl-10 py-3 text-sm rounded-xl outline-none transition-all border ${
                  isFailAndEmpty
                  ? 'bg-white dark:bg-slate-900 border-red-400 dark:border-red-500/50 focus:border-red-600 ring-2 ring-red-100 dark:ring-red-900/20 placeholder:text-red-300 dark:placeholder:text-red-700 text-slate-800 dark:text-white' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-accent focus:ring-1 focus:ring-blue-100 dark:focus:ring-blue-900/20 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600'
                }`}
                rows={2}
            />
            
            {/* Voice Input Button */}
            <button 
                onClick={toggleListening}
                className={`absolute bottom-2 left-2 p-1.5 rounded-lg transition-colors ${
                    isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-accent hover:text-white'
                }`}
                title="تایپ صوتی"
            >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>
          
          {/* Validation Message */}
          {isFailAndEmpty && (
             <p className="text-[10px] text-red-500 dark:text-red-400 font-bold px-1 animate-pulse">
                * نوشتن علت خرابی الزامی است
             </p>
          )}

          {/* Media Buttons & Previews - Split Layout */}
          <div className="grid grid-cols-2 gap-3">
            {/* Photo Upload Area */}
            <div className={`relative h-28 border border-dashed rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-all duration-300 ${
                item.photo ? 'border-green-400 dark:border-green-600' : 'border-slate-300 dark:border-slate-600'
            }`}>
                {photoPreview ? (
                    <div className="w-full h-full relative group">
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <button onClick={(e) => clearFile(e, 'photo')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors z-10">
                            <XCircle size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="flex w-full h-full">
                        {/* Direct Camera Button */}
                        <label className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors border-l border-slate-100 dark:border-slate-700/50 group active:bg-blue-100 dark:active:bg-slate-700">
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment"
                                className="hidden" 
                                onChange={(e) => handleFileChange(e, 'photo')} 
                            />
                            <Camera size={24} className="text-slate-400 group-hover:text-accent mb-1 transition-colors" />
                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-accent">عکس فوری</span>
                        </label>
                        
                        {/* Gallery Button */}
                        <label className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors group active:bg-blue-100 dark:active:bg-slate-700">
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleFileChange(e, 'photo')} 
                            />
                            <ImageIcon size={24} className="text-slate-400 group-hover:text-accent mb-1 transition-colors" />
                            <span className="text-[10px] font-medium text-slate-500 group-hover:text-accent">گالری</span>
                        </label>
                    </div>
                )}
            </div>

            {/* Video Upload Area */}
            <div className={`relative h-28 border border-dashed rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-all duration-300 ${
                item.video ? 'border-green-400 dark:border-green-600' : 'border-slate-300 dark:border-slate-600'
            }`}>
                {videoPreview ? (
                    <div className="w-full h-full relative bg-black flex items-center justify-center">
                        <video src={videoPreview} className="w-full h-full object-cover" />
                        <button onClick={(e) => clearFile(e, 'video')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors z-10">
                            <XCircle size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="flex w-full h-full">
                        {/* Direct Video Camera Button */}
                        <label className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors border-l border-slate-100 dark:border-slate-700/50 group active:bg-blue-100 dark:active:bg-slate-700">
                            <input 
                                type="file" 
                                accept="video/*" 
                                capture="environment"
                                className="hidden" 
                                onChange={(e) => handleFileChange(e, 'video')} 
                            />
                            <Video size={24} className="text-slate-400 group-hover:text-accent mb-1 transition-colors" />
                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-accent">فیلم فوری</span>
                        </label>
                        
                        {/* Video Gallery Button */}
                        <label className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors group active:bg-blue-100 dark:active:bg-slate-700">
                            <input 
                                type="file" 
                                accept="video/*" 
                                className="hidden" 
                                onChange={(e) => handleFileChange(e, 'video')} 
                            />
                            <Film size={24} className="text-slate-400 group-hover:text-accent mb-1 transition-colors" />
                            <span className="text-[10px] font-medium text-slate-500 group-hover:text-accent">گالری</span>
                        </label>
                    </div>
                )}
            </div>
          </div>
          
          {item.status === InspectionStatus.FAIL && (
            <div className="flex items-start gap-2 text-red-500 dark:text-red-400 text-[10px] bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
               <AlertTriangle size={14} className="mt-0.5" />
               <p>در صورت ثبت خرابی، این مورد به صورت خودکار به کارتابل تعمیرات ارجاع داده خواهد شد.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
