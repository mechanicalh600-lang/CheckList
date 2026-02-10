import React from 'react';
import { Building, Clock, X, Zap } from 'lucide-react';
import { CompanyLogo } from '../Logo';

interface SystemSettingsModalProps {
  orgTitle: string;
  setOrgTitle: (value: string) => void;
  autoLogoutMinutes: number;
  setAutoLogoutMinutes: (value: number) => void;
  onClose: () => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  orgTitle,
  setOrgTitle,
  autoLogoutMinutes,
  setAutoLogoutMinutes,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
              <Zap size={20} className="text-amber-500" />
            </div>
            تنظیمات سیستم
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} className="text-slate-500 dark:text-slate-300" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center mb-4">
            <CompanyLogo className="h-24 w-24" />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Building size={16} className="text-blue-500" />
              مشخصات سازمان
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                  نام سازمان (نمایش در صفحه ورود)
                </label>
                <input
                  type="text"
                  value={orgTitle}
                  onChange={(e) => setOrgTitle(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm outline-none focus:border-blue-500 dark:text-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">تغییرات به صورت خودکار ذخیره می‌شوند.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-red-500" />
              تنظیمات نشست کاربر
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                  خروج خودکار پس از عدم فعالیت (دقیقه)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={autoLogoutMinutes}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setAutoLogoutMinutes(1);
                      return;
                    }
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      setAutoLogoutMinutes(Math.max(1, val));
                    }
                  }}
                  onBlur={() => {
                    if (autoLogoutMinutes < 1) {
                      setAutoLogoutMinutes(1);
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm outline-none focus:border-blue-500 dark:text-white text-center font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  اگر کاربر به مدت تعیین شده فعالیتی نداشته باشد، به صفحه ورود هدایت می‌شود.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
