import React from 'react';
import { Clock } from 'lucide-react';

interface AutoLogoutModalProps {
  autoLogoutMinutes: number;
  onClose: () => void;
}

export const AutoLogoutModal: React.FC<AutoLogoutModalProps> = ({
  autoLogoutMinutes,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500" />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 border border-slate-100 dark:border-slate-700">
        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-4 ring-white dark:ring-slate-800 -mt-12">
          <Clock size={40} strokeWidth={2} />
        </div>
        <h3 className="font-black text-xl text-slate-800 dark:text-white mb-3">پایان نشست کاربری</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
          کاربر گرامی، به دلیل عدم فعالیت به مدت{' '}
          <span className="font-bold text-slate-800 dark:text-white mx-1">{autoLogoutMinutes} دقیقه</span>
          ، جهت حفظ امنیت از سیستم خارج شدید.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95"
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
};
