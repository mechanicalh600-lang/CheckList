import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Activity, Equipment } from '@/types';

interface ActivitySelectViewProps {
  currentEquipment: Equipment | null;
  availableActivities: Activity[];
  onBack: () => void;
  onSelectActivity: (activity: Activity) => void;
}

export const ActivitySelectView: React.FC<ActivitySelectViewProps> = ({
  currentEquipment,
  availableActivities,
  onBack,
  onSelectActivity,
}) => {
  return (
    <div className="p-4 font-sans flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
          <ChevronRight className="rtl:rotate-180 dark:text-white" />
        </button>
        <h1 className="font-bold text-lg dark:text-white">انتخاب فعالیت</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm mb-6 border border-slate-100 dark:border-slate-700">
        <h2 className="font-bold text-slate-800 dark:text-white mb-1">{currentEquipment?.name}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{currentEquipment?.id}</p>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        <div className="text-xs font-bold text-slate-400 mt-4 mb-2 pr-2">
          فعالیت‌های برنامه‌ریزی شده (PM):
        </div>
        {availableActivities.map((activity) => (
          <div
            key={activity.code}
            onClick={() => onSelectActivity(activity)}
            className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer active:scale-95 transition-transform flex justify-between items-center hover:border-blue-500"
          >
            <div>
              <div className="font-bold text-slate-700 dark:text-white text-sm">{activity.name}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">{activity.code}</div>
            </div>
            <ChevronRight size={18} className="text-slate-300 rtl:rotate-180" />
          </div>
        ))}
      </div>
    </div>
  );
};
