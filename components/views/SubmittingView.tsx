import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { AnimatedCompanyLogo } from '../Logo';

interface SubmittingViewProps {
  submitError: string | null;
  loadingText: string;
  onRetry: () => void;
  onBackToForm: () => void;
}

export const SubmittingView: React.FC<SubmittingViewProps> = ({
  submitError,
  loadingText,
  onRetry,
  onBackToForm,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 font-sans text-center h-full">
      {submitError ? (
        <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border border-red-100 dark:border-red-900/50 w-full max-w-sm animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-lg font-black text-slate-800 dark:text-white mb-2">خطا در ارسال</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{submitError}</p>
          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              <span>تلاش مجدد</span>
            </button>
            <button
              onClick={onBackToForm}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3.5 rounded-xl transition-all active:scale-95"
            >
              بازگشت و ویرایش
            </button>
          </div>
        </div>
      ) : (
        <>
          <AnimatedCompanyLogo className="w-32 h-32 mb-8" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">در حال پردازش</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{loadingText}</p>
        </>
      )}
    </div>
  );
};
