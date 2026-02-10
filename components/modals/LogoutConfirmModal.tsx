import React from 'react';
import { ArrowRight, LogOut } from 'lucide-react';

interface LogoutConfirmModalProps {
  isModuleMode: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isModuleMode,
  onCancel,
  onConfirm,
}) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" />
      <div
        className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white dark:ring-slate-800 -mt-10">
          <LogOut size={36} strokeWidth={2.5} />
        </div>
        <h3 className="font-black text-xl text-slate-800 dark:text-white mb-3">
          {isModuleMode ? 'بازگشت به برنامه اصلی' : 'خروج از حساب کاربری'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8 px-4">
          {isModuleMode
            ? 'آیا می‌خواهید از ماژول بازرسی خارج شوید؟'
            : 'آیا مطمئن هستید که می‌خواهید از برنامه خارج شوید؟'}
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-2xl transition-all active:scale-95"
          >
            انصراف
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>بله، {isModuleMode ? 'بازگشت' : 'خروج'}</span>
            <ArrowRight size={18} className="rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
