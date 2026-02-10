import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  History,
  LogOut,
  ScanLine,
  Search,
  User as UserIcon,
  Zap,
} from 'lucide-react';
import { AnalyticsDashboard } from '../AnalyticsDashboard';
import { SkeletonCard } from '../SkeletonCard';
import { InspectionForm, InspectionStatus } from '../../types';

interface HomeViewProps {
  isLoadingHistory: boolean;
  inspectionHistory: InspectionForm[];
  filterDateRange: { start: string; end: string };
  getTraditionalName: (equipmentCode: string) => string;
  getStatusColor: (status?: string) => string;
  formatHistoryDate: (timestamp: number) => string;
  onOpenScanner: () => void;
  onOpenAssetSearch: () => void;
  onOpenHistory: () => void;
}

export const HomeView = ({
  isLoadingHistory,
  inspectionHistory,
  filterDateRange,
  getTraditionalName,
  getStatusColor,
  formatHistoryDate,
  onOpenScanner,
  onOpenAssetSearch,
  onOpenHistory,
}: HomeViewProps) => {
  const getFailCount = (report: InspectionForm) => {
    if (typeof report.failCount === 'number') return report.failCount;
    return report.items.filter((item) => item.status === InspectionStatus.FAIL).length;
  };

  const getPassCount = (report: InspectionForm) => {
    if (typeof report.passCount === 'number') return report.passCount;
    return report.items.filter((item) => item.status === InspectionStatus.PASS).length;
  };

  const getFailSamples = (report: InspectionForm) => {
    if (report.items.length > 0) {
      return report.items
        .filter((item) => item.status === InspectionStatus.FAIL)
        .slice(0, 5)
        .map((item) => ({ task: item.task, comment: item.comment }));
    }
    return (report.failTasksSample || []).map((task) => ({ task, comment: '' }));
  };

  return (
    <div className="p-5 animate-fade-in-up">
      {isLoadingHistory ? (
        <div className="space-y-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 text-center py-10">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
              <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/2 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-[2rem] animate-pulse" />
            <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-[2rem] animate-pulse" />
          </div>
        </div>
      ) : (
        <AnalyticsDashboard history={inspectionHistory} filterDateRange={filterDateRange} />
      )}

      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="text-amber-600 dark:text-amber-400">
          <Zap size={16} />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-white text-sm">دسترسی سریع</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={onOpenScanner}
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 backdrop-blur-lg text-white p-5 rounded-[2.5rem] shadow-2xl shadow-blue-500/40 transition-all duration-300 active:scale-95 group h-44 flex flex-col justify-between items-start text-right border border-white/20"
        >
          <div className="absolute left-2 bottom-2 text-white opacity-20 transform rotate-12 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 pointer-events-none">
            <ScanLine size={100} strokeWidth={1} />
          </div>
          <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl shadow-inner border border-white/20 group-hover:bg-white/30 transition-colors relative z-10 mb-2">
            <ScanLine size={28} className="text-white" />
          </div>
          <div className="relative z-10 w-full">
            <span className="block font-black text-2xl tracking-tight mb-1">اسکن تجهیز</span>
            <span className="text-xs opacity-90 font-medium block mt-1">شناسایی با QR Code</span>
          </div>
        </button>

        <button
          onClick={onOpenAssetSearch}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 backdrop-blur-lg text-white p-5 rounded-[2.5rem] shadow-2xl shadow-emerald-500/40 transition-all duration-300 active:scale-95 group h-44 flex flex-col justify-between items-start text-right border border-white/20"
        >
          <div className="absolute left-2 bottom-2 text-white opacity-20 transform -rotate-12 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500 pointer-events-none">
            <Search size={100} strokeWidth={1} />
          </div>
          <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl shadow-inner border border-white/20 group-hover:bg-white/30 transition-colors relative z-10 mb-2">
            <Search size={28} className="text-white" />
          </div>
          <div className="relative z-10 w-full">
            <span className="block font-black text-2xl tracking-tight mb-1">جستجو</span>
            <span className="text-xs opacity-90 font-medium block mt-1">یافتن دستی تجهیز</span>
          </div>
        </button>
      </div>

      <div className="flex justify-between items-center mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="text-blue-600 dark:text-blue-400">
            <History size={16} />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">آخرین فعالیت‌ها</h3>
        </div>
        <button onClick={onOpenHistory} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
          مشاهده همه
          <ChevronRight size={14} className="rtl:rotate-180" />
        </button>
      </div>

      <div className="space-y-3">
        {isLoadingHistory ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : inspectionHistory.length > 0 ? (
          inspectionHistory.slice(0, 5).map((report, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col"
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      getFailCount(report) > 0
                        ? 'bg-red-50 text-red-500'
                        : 'bg-green-50 text-green-500'
                    }`}
                  >
                    {getFailCount(report) > 0 ? (
                      <AlertTriangle size={20} />
                    ) : (
                      <CheckCircle2 size={20} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 dark:text-white text-xs">
                      {getTraditionalName(report.equipmentId)}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {formatHistoryDate(report.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    <UserIcon size={12} />
                    <span>{report.inspectorName}</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded border ${getStatusColor(report.status)}`}>
                    {report.status || 'بازبینی'}
                  </span>
                </div>
              </div>

              {getFailCount(report) > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 w-full">
                  {getFailSamples(report).map((fail, fIdx) => (
                      <div key={fIdx} className="text-[10px] text-red-600 dark:text-red-400 mt-1 leading-relaxed">
                        <span className="font-bold">❌ {fail.task}</span>
                        {fail.comment ? `: ${fail.comment}` : ''}
                      </div>
                    ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <div className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl p-2 text-center text-xs font-bold">
                  {getPassCount(report)} سالم
                </div>
                <div className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl p-2 text-center text-xs font-bold">
                  {getFailCount(report)} خرابی
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 opacity-50">
            <LogOut size={48} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs text-slate-400">
              {isLoadingHistory ? 'در حال جستجو...' : 'هنوز فعالیتی ثبت نشده است'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
