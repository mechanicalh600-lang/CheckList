import React from 'react';
import { AlertTriangle, Building2, CheckCircle2, CheckSquare, Share2, User as UserIcon, X } from 'lucide-react';
import { ChecklistItemData, Equipment, InspectionStatus, User } from '@/types';

interface SuccessViewProps {
  reportInspector: string | null;
  generatedTrackingCode: string;
  user: User | null;
  submissionDateObject: Date | null;
  currentEquipment: Equipment | null;
  checklistItems: ChecklistItemData[];
  analysisResult: string;
  returnToAdmin: boolean;
  onShareReport: () => void;
  onCloseFromAdmin: () => void;
  onResetApp: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  reportInspector,
  generatedTrackingCode,
  user,
  submissionDateObject,
  currentEquipment,
  checklistItems,
  analysisResult,
  returnToAdmin,
  onShareReport,
  onCloseFromAdmin,
  onResetApp,
}) => {
  const passCount = checklistItems.filter((i) => i.status === InspectionStatus.PASS).length;
  const failCount = checklistItems.filter((i) => i.status === InspectionStatus.FAIL).length;
  const failedItems = checklistItems.filter((i) => i.status === InspectionStatus.FAIL);

  return (
    <div className="flex flex-col font-sans h-full bg-slate-50 dark:bg-[#0f172a] overflow-hidden">
      <div className="bg-green-600 text-white pt-8 pb-12 px-6 rounded-b-[2.5rem] shadow-lg relative text-center shrink-0">
        <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-30 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md shadow-inner border border-white/20">
            <CheckCircle2 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black mb-1">
            {reportInspector ? 'گزارش بازرسی' : 'ثبت موفقیت‌آمیز'}
          </h1>
          <p className="text-green-100 text-xs font-medium opacity-90">
            {reportInspector
              ? 'مشاهده جزئیات کامل گزارش ثبت شده'
              : 'اطلاعات با موفقیت در سرور ذخیره شد'}
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 -mt-8 pb-6 relative z-10 overflow-y-auto">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden mb-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">کد رهگیری:</span>
            <span className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400 tracking-widest">
              {generatedTrackingCode}
            </span>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700 border-dashed">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
                  <UserIcon size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">بازرس</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-white">
                    {reportInspector || user?.name}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400">زمان ثبت</p>
                <p className="text-xs font-bold text-slate-700 dark:text-white dir-ltr">
                  {submissionDateObject &&
                    new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(
                      submissionDateObject
                    )}{' '}
                  |{' '}
                  {submissionDateObject &&
                    new Intl.DateTimeFormat('fa-IR', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                    }).format(submissionDateObject)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {submissionDateObject &&
                    new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(submissionDateObject)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Building2 size={14} className="text-blue-500" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    مشخصات تجهیز
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-500">نام سیستم:</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                      {currentEquipment?.name}
                    </span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-500">نام محلی:</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                      {currentEquipment?.description || '---'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">کد تجهیز:</span>
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-white">
                      {currentEquipment?.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-slate-100 dark:border-slate-700 divide-x divide-x-reverse divide-slate-100 dark:divide-slate-700">
            <div className="p-4 text-center bg-green-50/50 dark:bg-green-900/10">
              <div className="text-2xl font-black text-green-600 dark:text-green-400">{passCount}</div>
              <div className="text-[10px] font-bold text-green-700 dark:text-green-300 opacity-80">
                آیتم سالم
              </div>
            </div>
            <div className="p-4 text-center bg-red-50/50 dark:bg-red-900/10">
              <div className="text-2xl font-black text-red-600 dark:text-red-400">{failCount}</div>
              <div className="text-[10px] font-bold text-red-700 dark:text-red-300 opacity-80">
                آیتم خراب
              </div>
            </div>
          </div>

          {failedItems.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-700 bg-red-50/30 dark:bg-red-900/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-lg">
                  <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                </div>
                <h4 className="font-bold text-xs text-red-700 dark:text-red-400">
                  لیست خرابی‌ها و توضیحات
                </h4>
              </div>
              <div className="space-y-3">
                {failedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-red-100 dark:border-red-500/20 shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-red-500 font-bold text-xs mt-0.5">•</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-white mb-1">{item.task}</p>
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                            <span className="font-bold text-slate-400 ml-1">توضیحات:</span>
                            {item.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysisResult && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-700">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">تحلیل هوشمند</h4>
              <p className="text-xs leading-6 text-slate-600 dark:text-slate-300 text-justify bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                {analysisResult}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={onShareReport}
            className="bg-blue-600 text-white py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Share2 size={24} />
            <span className="text-xs">اشتراک‌گذاری گزارش</span>
          </button>
          {returnToAdmin ? (
            <button
              onClick={onCloseFromAdmin}
              className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors active:scale-95"
            >
              <X size={24} />
              <span className="text-xs">بستن</span>
            </button>
          ) : (
            <button
              onClick={onResetApp}
              className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors active:scale-95"
            >
              <CheckSquare size={24} />
              <span className="text-xs">بازگشت به خانه</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
