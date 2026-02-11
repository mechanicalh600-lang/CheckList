import React from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { Activity, ChecklistItemData, Equipment } from '@/types';
import { ChecklistItem } from '@/components/ChecklistItem';
import { SkeletonCard } from '@/components/SkeletonCard';

interface InspectionFormViewProps {
  currentEquipment: Equipment | null;
  selectedActivity: Activity | null;
  checklistItems: ChecklistItemData[];
  loadingChecklist: boolean;
  calculateProgress: () => number;
  getIncompleteCount: () => number;
  onClose: () => void;
  onUpdateItem: (item: ChecklistItemData) => void;
  onSubmit: () => void;
}

export const InspectionFormView: React.FC<InspectionFormViewProps> = ({
  currentEquipment,
  selectedActivity,
  checklistItems,
  loadingChecklist,
  calculateProgress,
  getIncompleteCount,
  onClose,
  onUpdateItem,
  onSubmit,
}) => {
  const progress = calculateProgress();

  return (
    <div className="flex flex-col font-sans h-full">
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 sticky top-0 z-20 shadow-sm border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={20} className="dark:text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-800 dark:text-white text-sm truncate">
              {currentEquipment?.name}
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {selectedActivity?.name || 'بازرسی عمومی'}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold font-mono">
            {checklistItems.length} آیتم
          </div>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {loadingChecklist ? (
          <div className="space-y-4 pt-4">
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <Loader2 size={32} className="animate-spin text-blue-500 mb-2" />
              <p className="text-xs">در حال دریافت چک‌لیست...</p>
            </div>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="space-y-4 pb-24">
            {checklistItems.map((item, index) => (
              <ChecklistItem key={item.id} item={item} index={index + 1} onChange={onUpdateItem} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 border-t border-slate-100 dark:border-slate-700 sticky bottom-0 z-20">
        <button
          onClick={onSubmit}
          disabled={progress < 100 || loadingChecklist}
          className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
            progress === 100
              ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30 active:scale-95'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          {progress === 100 ? (
            <>
              <CheckCircle2 size={24} />
              <span>ثبت و تحلیل نهایی</span>
            </>
          ) : (
            <span>{getIncompleteCount()} مورد باقی‌مانده</span>
          )}
        </button>
      </div>
    </div>
  );
};
