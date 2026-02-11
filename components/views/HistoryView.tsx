import React from 'react';
import {
  AlertTriangle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Search,
  User as UserIcon,
} from 'lucide-react';
import { InspectionForm, InspectionStatus, User } from '@/types';
import { PersianDatePicker } from '@/components/PersianDatePicker';
import { SkeletonCard } from '@/components/SkeletonCard';

interface HistoryViewProps {
  user: User | null;
  inspectionHistory: InspectionForm[];
  selectedHistoryIndices: number[];
  isLoadingHistory: boolean;
  filterDateRange: { start: string; end: string };
  setFilterDateRange: (value: { start: string; end: string }) => void;
  historyItemsPerPage: number;
  setHistoryItemsPerPage: (value: number) => void;
  historyPage: number;
  setHistoryPage: React.Dispatch<React.SetStateAction<number>>;
  historyTotalPages: number;
  paginatedHistory: InspectionForm[];
  onBack: () => void;
  onSelectAllHistory: () => void;
  onExportExcel: () => void;
  onRefreshHistory: () => void;
  onToggleHistorySelection: (index: number) => void;
  getTraditionalName: (equipmentId: string) => string;
  getStatusColor: (status?: string) => string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  user,
  inspectionHistory,
  selectedHistoryIndices,
  isLoadingHistory,
  filterDateRange,
  setFilterDateRange,
  historyItemsPerPage,
  setHistoryItemsPerPage,
  historyPage,
  setHistoryPage,
  historyTotalPages,
  paginatedHistory,
  onBack,
  onSelectAllHistory,
  onExportExcel,
  onRefreshHistory,
  onToggleHistorySelection,
  getTraditionalName,
  getStatusColor,
}) => {
  const getPassCount = (report: InspectionForm) => {
    if (typeof report.passCount === 'number') return report.passCount;
    return report.items.filter((item) => item.status === InspectionStatus.PASS).length;
  };

  const getFailCount = (report: InspectionForm) => {
    if (typeof report.failCount === 'number') return report.failCount;
    return report.items.filter((item) => item.status === InspectionStatus.FAIL).length;
  };

  const getFailItems = (report: InspectionForm) => {
    if (report.items.length > 0) {
      return report.items
        .filter((item) => item.status === InspectionStatus.FAIL)
        .slice(0, 20)
        .map((item) => ({ task: item.task, comment: item.comment || '' }));
    }
    return (report.failTasksSample || []).map((task) => ({ task, comment: '' }));
  };

  return (
    <div className="flex flex-col h-full font-sans">
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 sticky top-0 z-20 shadow-sm border-b border-slate-100 dark:border-slate-700 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full">
              <ChevronRight className="rtl:rotate-180 dark:text-white" />
            </button>
            <h1 className="font-bold text-lg dark:text-white">سوابق بازرسی‌ها</h1>
          </div>
          <div className="flex gap-1">
            <button onClick={onSelectAllHistory} className="p-2 text-slate-500 hover:text-blue-500" title="انتخاب همه">
              {selectedHistoryIndices.length > 0 &&
              selectedHistoryIndices.length === inspectionHistory.length ? (
                <CheckSquare size={24} />
              ) : (
                <CheckSquare size={24} className="opacity-50" />
              )}
            </button>
            <button
              onClick={onExportExcel}
              className="p-2 text-slate-500 hover:text-green-600 transition-colors disabled:opacity-30"
              disabled={inspectionHistory.length === 0}
              title="دانلود اکسل"
            >
              <FileSpreadsheet size={24} />
            </button>
            <button
              onClick={onRefreshHistory}
              disabled={isLoadingHistory}
              className="p-2 text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-30"
              title="بروزرسانی"
            >
              <RefreshCw size={24} className={isLoadingHistory ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                انتخاب بازه
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <PersianDatePicker
                  value={filterDateRange.start}
                  onChange={(date) => setFilterDateRange({ ...filterDateRange, start: date })}
                />
              </div>
              <span className="text-slate-400 text-xs">تا</span>
              <div className="flex-1 relative">
                <PersianDatePicker
                  value={filterDateRange.end}
                  onChange={(date) => setFilterDateRange({ ...filterDateRange, end: date })}
                />
              </div>
              <button
                onClick={onRefreshHistory}
                disabled={isLoadingHistory}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 active:scale-95 transition-all h-[34px] w-[34px] flex items-center justify-center"
              >
                {isLoadingHistory ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mt-1">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">نمایش</span>
            <select
              value={historyItemsPerPage}
              onChange={(e) => {
                setHistoryItemsPerPage(Number(e.target.value));
                setHistoryPage(1);
              }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white text-xs rounded-lg px-2 py-1 outline-none focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:inline">
              ردیف
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 mx-1">|</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              مجموع: {inspectionHistory.length} رکورد
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={historyPage === 1}
              onClick={() => setHistoryPage(1)}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition text-slate-600 dark:text-slate-300"
            >
              <ChevronsRight className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              disabled={historyPage === 1}
              onClick={() => setHistoryPage((p) => p - 1)}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
            <div className="flex items-center gap-2 px-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">صفحه</span>
              <input
                type="number"
                min={1}
                max={historyTotalPages}
                value={historyPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= historyTotalPages) {
                    setHistoryPage(val);
                  }
                }}
                className="w-12 text-center p-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-white"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">از {historyTotalPages}</span>
            </div>
            <button
              disabled={historyPage >= historyTotalPages}
              onClick={() => setHistoryPage((p) => p + 1)}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              disabled={historyPage >= historyTotalPages}
              onClick={() => setHistoryPage(historyTotalPages)}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition text-slate-600 dark:text-slate-300"
            >
              <ChevronsLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {isLoadingHistory ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : inspectionHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50 mt-10">
            <div className="mb-4 text-slate-300" />
            <p className="text-xs text-slate-400">هیچ سابقه‌ای در این بازه زمانی یافت نشد</p>
            <p className="text-[10px] text-slate-300 mt-2">لطفا بازه زمانی را تغییر دهید</p>
          </div>
        ) : (
          <div className="space-y-4">
            <style>{` @keyframes border-turq-anim { 0% { border-color: #06b6d4; box-shadow: 0 0 0 1px #06b6d4; } 50% { border-color: #10b981; box-shadow: 0 0 0 3px #10b981; } 100% { border-color: #06b6d4; box-shadow: 0 0 0 1px #06b6d4; } } .selected-history-card { animation: border-turq-anim 2s infinite alternate; } `}</style>
            {paginatedHistory.map((report, idx) => (
              <div
                key={idx}
                className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border transition-all relative overflow-hidden ${selectedHistoryIndices.includes(idx + (historyPage - 1) * historyItemsPerPage) ? 'selected-history-card' : 'border-slate-100 dark:border-slate-700'}`}
                onClick={() => onToggleHistorySelection(idx + (historyPage - 1) * historyItemsPerPage)}
              >
                {selectedHistoryIndices.includes(idx + (historyPage - 1) * historyItemsPerPage) && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-cyan-500 to-transparent opacity-30 pointer-events-none rounded-bl-3xl" />
                )}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-white">
                      {getTraditionalName(report.equipmentId)}
                    </h3>
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(report.timestamp).toLocaleDateString('fa-IR', {
                        month: 'long',
                        day: 'numeric',
                      })}{' '}
                      |{' '}
                      {new Date(report.timestamp).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md">
                        {report.activityName || 'General'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border ${getStatusColor(report.status)}`}>
                        {report.status || 'بازبینی'}
                      </span>
                    </div>
                  </div>
                  <div className="text-left flex flex-col items-end gap-1">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <UserIcon size={10} /> {report.inspectorName}
                    </p>
                    {report.trackingCode && (
                      <div className="text-xs font-mono text-blue-500 mt-1 font-bold">
                        #{report.trackingCode}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <div className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl p-2 text-center text-xs font-bold">
                    {getPassCount(report)} سالم
                  </div>
                  <div className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl p-2 text-center text-xs font-bold">
                    {getFailCount(report)} خرابی
                  </div>
                </div>
                {getFailCount(report) > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-red-500 font-bold mb-1 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      لیست خرابی‌ها و توضیحات:
                    </p>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300 space-y-1">
                      {getFailItems(report).map((fail, i) => (
                          <div key={i} className="bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">
                            <span className="font-bold text-red-600 dark:text-red-400">
                              ❌ {fail.task}
                            </span>
                            {fail.comment && (
                              <p className="text-slate-500 dark:text-slate-400 mt-0.5 italic">
                                "{fail.comment}"
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
