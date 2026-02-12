import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronRight, RefreshCw, Trash2, AlertCircle, CheckCircle2, Search, Eye, Calendar, Filter, BarChart3, Printer, Activity as ActivityIcon, AlertOctagon, HeartPulse, Stethoscope, FileSpreadsheet, Send, CheckCircle, TrendingUp, User, Award, Zap, PieChart, Target, AlertTriangle, Database, ChevronsLeft, ChevronsRight, ChevronLeft, Sigma, ArrowUp, ArrowDown, ArrowUpDown, XCircle, FilterX } from 'lucide-react';
import {
    deleteRows,
    getFullReport,
    getInspectionsOverview,
    getUserLogs,
    updateInspectionStatus,
} from '@/services/supabaseClient';
import XLSX from 'xlsx-js-style';
import { PersianDatePicker } from './PersianDatePicker';
import { getStartOfCurrentShamsiMonth, toShamsi } from '@/utils';

interface ReportsDashboardProps {
    onBack: () => void;
    onViewReport: (report: any) => void;
}

const SCHEMA: any = {
    REPORTS: {
        label: 'گزارشات بازرسی',
        table: 'inspections',
        idField: 'id',
        columns: [
            { key: 'equipmentName', label: 'تجهیز' },
            { key: 'inspectorName', label: 'بازرس' },
            { key: 'activityName', label: 'فعالیت' },
            { key: 'trackingCode', label: 'کد رهگیری' },
            { key: 'status', label: 'وضعیت', type: 'status' },
            { key: 'timestamp', label: 'تاریخ', type: 'date' },
        ],
        allowDelete: true, 
    },
    EQUIPMENT_HEALTH: {
        label: 'وضعیت تجهیزات',
        table: 'inspections',
        idField: 'id',
        columns: [],
        allowDelete: false,
    },
    ACTIVITY: {
        label: 'عملکرد کاربران',
        table: 'inspections',
        idField: 'id',
        columns: [],
        allowDelete: false,
    },
    LOGS: {
        label: 'لاگین کاربران',
        table: 'user_logs',
        idField: 'id',
        columns: [
            { key: 'user_code', label: 'کد پرسنلی' },
            { key: 'user_name', label: 'نام کاربر' },
            { key: 'ip_address', label: 'آدرس IP' },
            { key: 'login_timestamp', label: 'زمان ورود', type: 'datetime' }, 
        ],
        allowDelete: true,
    }
};

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ onBack, onViewReport }) => {
    const [activeTab, setActiveTab] = useState('REPORTS');
    const [loading, setLoading] = useState(false);
    const [dataList, setDataList] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<any>>(new Set());
    const [chartHover, setChartHover] = useState<{ day: number, count: number, x: number, y: number } | null>(null);
    
    // Sort & Filter State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({});
    
    // Multi-Select Filter State
    const [valueFilters, setValueFilters] = useState<Record<string, string[]>>({});
    const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);

    // Health Category Filter State (ALL, HEALTHY, WARNING, CRITICAL)
    const [healthFilter, setHealthFilter] = useState<'ALL' | 'HEALTHY' | 'WARNING' | 'CRITICAL'>('ALL');

    // Date Range Filter
    const [reportDateRange, setReportDateRange] = useState({
        start: getStartOfCurrentShamsiMonth(),
        end: new Date().toISOString().split('T')[0]
    });
    const reportDateRangeRef = useRef(reportDateRange);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [confirmationModal, setConfirmationModal] = useState<{
        show: boolean;
        id: string | null;
        status: string | null;
        title: string;
        message: string;
    }>({ show: false, id: null, status: null, title: '', message: '' });

    const currentSchema = SCHEMA[activeTab];

    useEffect(() => {
        reportDateRangeRef.current = reportDateRange;
    }, [reportDateRange]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortConfig, columnFilters, valueFilters, healthFilter]);

    // Click outside to close filters
    useEffect(() => {
        const closeFilters = () => setActiveFilterCol(null);
        if (activeFilterCol) window.addEventListener('click', closeFilters);
        return () => window.removeEventListener('click', closeFilters);
    }, [activeFilterCol]);

    // Check if any filters are active
    const hasActiveFilters = useMemo(() => {
        const hasTextFilters = Object.values(columnFilters).some(val => !!val);
        const hasMultiFilters = Object.values(valueFilters).some((val: any) => val.length > 0);
        const hasHealthFilter = activeTab === 'EQUIPMENT_HEALTH' && healthFilter !== 'ALL';
        return hasTextFilters || hasMultiFilters || hasHealthFilter;
    }, [columnFilters, valueFilters, healthFilter, activeTab]);

    const clearAllFilters = () => {
        setColumnFilters({});
        setValueFilters({});
        setHealthFilter('ALL');
        setCurrentPage(1);
    };

    const handleStartDateChange = (date: string) => {
        setReportDateRange(prev => {
            const newState = { ...prev, start: date };
            if (new Date(date) > new Date(prev.end)) newState.end = date;
            return newState;
        });
    };

    const handleEndDateChange = (date: string) => {
        setReportDateRange(prev => {
            const newState = { ...prev, end: date };
            if (new Date(date) < new Date(prev.start)) newState.start = date;
            return newState;
        });
    };

    const loadData = useCallback(async (tab: string, dateRange: { start: string; end: string }) => {
        setLoading(true);
        setStatusMessage(null);
        try {
            let data: any[] | null = null;
            
            let start: string | undefined = undefined;
            if (dateRange.start) {
                const d = new Date(dateRange.start);
                if (!isNaN(d.getTime())) start = d.toISOString();
            }

            let end: string | undefined = undefined;
            if (dateRange.end) {
                const d = new Date(dateRange.end + 'T23:59:59');
                if (!isNaN(d.getTime())) end = d.toISOString();
            }

            if (tab === 'LOGS') {
                data = await getUserLogs(start, end);
            } else if (tab === 'REPORTS') {
                // Keep full payload for report listing to preserve current fields/behaviour.
                data = await getFullReport(start, end);
            } else {
                // Use summary payload for analytics tabs to reduce transfer and processing cost.
                data = await getInspectionsOverview(undefined, start, end);
            }
            setDataList((data as any[]) || []);
        } catch (error: any) {
            console.error("Load error", error);
            setStatusMessage({ type: 'error', text: `خطا در بارگذاری داده‌ها: ${error.message}` });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { 
        setDataList([]); 
        void loadData(activeTab, reportDateRangeRef.current); 
        setSelectedIds(new Set());
        setCurrentPage(1);
        setSearchTerm(''); 
        setSortConfig(null);
        setColumnFilters({});
        setValueFilters({});
        setActiveFilterCol(null);
        setHealthFilter('ALL'); // Reset health filter on tab change
    }, [activeTab, loadData]);

    const handleDelete = async (ids: any[]) => {
        if (!confirm('آیا از حذف موارد انتخاب شده اطمینان دارید؟')) return;
        setLoading(true);
        try {
            await deleteRows(currentSchema.table, ids, currentSchema.idField);
            setStatusMessage({ type: 'success', text: 'حذف با موفقیت انجام شد' });
            setSelectedIds(new Set());
            void loadData(activeTab, reportDateRange);
        } catch (e: any) {
            setStatusMessage({ type: 'error', text: `خطا در حذف: ${e.message}` });
        } finally {
            setLoading(false);
        }
    };

    const openStatusModal = (id: string | null, newStatus: string) => {
        setConfirmationModal({
            show: true,
            id,
            status: newStatus,
            title: newStatus === 'اتمام یافته' ? 'تایید اتمام کار' : 'ارسال به کارتابل CMMS',
            message: newStatus === 'اتمام یافته' 
                ? `آیا از تغییر وضعیت ${id ? 'این گزارش' : `${selectedIds.size} گزارش انتخاب شده`} به "اتمام یافته" اطمینان دارید؟` 
                : `آیا از ارسال ${id ? 'این گزارش' : `${selectedIds.size} گزارش انتخاب شده`} به "کارتابل CMMS" اطمینان دارید؟`
        });
    };

    const performStatusChange = async () => {
        const targets = confirmationModal.id ? [confirmationModal.id] : Array.from(selectedIds);
        if (targets.length === 0 || !confirmationModal.status) return;

        setLoading(true);
        try {
            await Promise.all(targets.map(id => updateInspectionStatus(String(id), confirmationModal.status!)));
            setStatusMessage({ type: 'success', text: `وضعیت ${targets.length} مورد با موفقیت به ${confirmationModal.status} تغییر یافت.` });
            void loadData(activeTab, reportDateRange);
            setSelectedIds(new Set());
        } catch (e: any) {
            setStatusMessage({ type: 'error', text: `خطا در تغییر وضعیت: ${e.message}` });
        } finally {
            setLoading(false);
            setConfirmationModal({ ...confirmationModal, show: false });
        }
    };

    // --- SORTING & FILTERING HELPERS ---
    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key && current.direction === 'asc') {
                return { key, direction: 'desc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        setColumnFilters(prev => ({ ...prev, [key]: value }));
    };

    const processData = useCallback((rawData: any[]) => {
        let processed = [...rawData];

        // 1. Column Text Filtering
        if (Object.keys(columnFilters).length > 0) {
            processed = processed.filter(item => {
                return Object.entries(columnFilters).every(([key, value]) => {
                    const filterVal = value as string;
                    if (!filterVal) return true;
                    // Handle dates specially if needed
                    let itemValue = item[key];
                    if (key.includes('timestamp') || key.includes('date')) {
                         itemValue = new Date(itemValue).toLocaleDateString('fa-IR');
                    } else {
                         itemValue = String(itemValue || '');
                    }
                    return (itemValue as string).toLowerCase().includes(filterVal.toLowerCase());
                });
            });
        }

        // 2. Multi-Select Value Filtering
        if (Object.keys(valueFilters).length > 0) {
            processed = processed.filter(item => {
                return Object.entries(valueFilters).every(([key, selectedValues]) => {
                    const vals = selectedValues as string[];
                    if (vals.length === 0) return true;
                    let itemValue = item[key];
                    if (key.includes('timestamp') || key.includes('date')) {
                         itemValue = new Date(itemValue).toLocaleDateString('fa-IR');
                    } else {
                         itemValue = String(itemValue || '');
                    }
                    return vals.includes(itemValue);
                });
            });
        }

        // 3. Sorting
        if (sortConfig) {
            processed.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        // 4. Global Search (kept as optional/backup)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            processed = processed.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(term)));
        }

        return processed;
    }, [columnFilters, valueFilters, sortConfig, searchTerm]);

    // Helper for Unique Values
    const getUniqueValues = (key: string) => {
        return Array.from(new Set(dataList.map(item => {
            if (key.includes('timestamp') || key.includes('date')) {
                return new Date(item[key]).toLocaleDateString('fa-IR');
            }
            return String(item[key] || '');
        }))).sort();
    };

    // --- ANALYTICS CALCULATIONS ---
    const calculateActivityMatrix = () => {
        const startShamsi = toShamsi(reportDateRange.start);
        const month = startShamsi ? parseInt(startShamsi.split('/')[1], 10) : 1;
        const daysCount = month <= 6 ? 31 : (month === 12 ? 29 : 30);

        const matrix: Record<string, { name: string, days: Record<number, number>, total: number }> = {};
        const dailyTotals: Record<number, number> = {};

        dataList.forEach(insp => {
            const shamsiDate = toShamsi(new Date(insp.timestamp || insp.login_timestamp || Date.now()).toISOString());
            const dayPart = shamsiDate ? parseInt(shamsiDate.split('/')[2], 10) : 0;
            const userCode = insp.inspectorCode || insp.user_code || 'Unknown';
            const userName = insp.inspectorName || insp.user_name || 'نامشخص';

            if (!matrix[userCode]) matrix[userCode] = { name: userName, days: {}, total: 0 };
            
            if (dayPart > 0 && dayPart <= daysCount) {
                matrix[userCode].days[dayPart] = (matrix[userCode].days[dayPart] || 0) + 1;
                matrix[userCode].total += 1;
                dailyTotals[dayPart] = (dailyTotals[dayPart] || 0) + 1;
            }
        });

        const sortedUsers = Object.values(matrix).sort((a, b) => b.total - a.total);
        return { sortedUsers, dailyTotals, daysCount };
    };

    const calculateEquipmentHealth = () => {
        const stats: Record<string, { name: string, id: string, totalInspections: number, totalItems: number, totalFails: number, lastInspection: string, healthScore: number }> = {};

        dataList.forEach(insp => {
            if (!insp.equipmentId && !insp.items) return;

            const eqId = insp.equipmentId || 'Unknown';
            if (!stats[eqId]) {
                stats[eqId] = {
                    name: insp.equipmentName || 'نامشخص',
                    id: eqId,
                    totalInspections: 0,
                    totalItems: 0,
                    totalFails: 0,
                    lastInspection: insp.timestamp,
                    healthScore: 100
                };
            }
            const record = stats[eqId];
            record.totalInspections += 1;
            if (insp.timestamp && new Date(insp.timestamp) > new Date(record.lastInspection)) {
                record.lastInspection = insp.timestamp;
            }

            const hasSummaryCounts =
                typeof insp.checklistTotal === 'number' || typeof insp.failCount === 'number';

            if (hasSummaryCounts) {
                record.totalItems += Number(insp.checklistTotal || 0);
                record.totalFails += Number(insp.failCount || 0);
            } else if (Array.isArray(insp.items)) {
                insp.items.forEach((item: any) => {
                    record.totalItems += 1;
                    if (item.status === 'FAIL') record.totalFails += 1;
                });
            }
        });

        const items = Object.values(stats).map(item => ({
            ...item,
            healthScore: item.totalItems > 0 ? Math.round(((item.totalItems - item.totalFails) / item.totalItems) * 100) : 100
        })).sort((a, b) => a.healthScore - b.healthScore);

        const totalEquipments = items.length;
        const criticalEquipments = items.filter(i => i.healthScore < 70).length;
        const warningEquipments = items.filter(i => i.healthScore >= 70 && i.healthScore < 90).length;
        const healthyEquipments = items.filter(i => i.healthScore >= 90).length;
        const avgScore = totalEquipments > 0 ? Math.round(items.reduce((sum, i) => sum + i.healthScore, 0) / totalEquipments) : 0;

        return { items, summary: { totalEquipments, criticalEquipments, warningEquipments, healthyEquipments, avgScore } };
    };

    // --- RENDERERS ---
    const renderActivityReport = () => {
        const { sortedUsers, dailyTotals, daysCount } = calculateActivityMatrix();
        
        // Apply Sort/Filter manually
        const processedUsers = processData(sortedUsers);

        const dailyTrend = Array.from({length: daysCount}, (_, i) => ({
            day: i + 1,
            count: dailyTotals[i + 1] || 0
        }));
        
        const maxDaily = Math.max(...dailyTrend.map(d => d.count), 5);
        const maxUserTotal = Math.max(...sortedUsers.map(u => u.total), 1);

        const svgPoints = dailyTrend.map((d, index) => {
             const x = 100 - ((index / (daysCount - 1)) * 100);
             const y = 100 - ((d.count / maxDaily) * 85);
             return `${x},${y}`;
        }).join(" ");

        return (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                        {/* ... (Charts remain same) ... */}
                        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none"></div>
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400 shadow-sm">
                                <Award size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white text-base">رتبه‌بندی بازرسین</h3>
                                <p className="text-[10px] text-slate-500 font-bold mt-0.5 opacity-70">نفرات برتر در ثبت گزارشات</p>
                            </div>
                        </div>
                        <div className="space-y-4 max-h-52 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                            {sortedUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                                    <User size={40} strokeWidth={1.5} className="mb-2 opacity-50"/>
                                    <p className="text-xs">داده‌ای ثبت نشده است</p>
                                </div>
                            ) : (
                                sortedUsers.slice(0, 10).map((user, idx) => (
                                    <div key={idx} className="flex items-center gap-3 group">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-xs shadow-sm shrink-0 ${idx === 0 ? 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-200' : idx === 1 ? 'bg-slate-300 text-slate-800 ring-2 ring-slate-100' : idx === 2 ? 'bg-orange-300 text-orange-900 ring-2 ring-orange-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>{idx + 1}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="font-bold text-slate-700 dark:text-white truncate pl-2">{user.name}</span>
                                                <span className="font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 rounded text-[10px]">{user.total}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110 ${idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : idx === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-500' : idx === 2 ? 'bg-gradient-to-r from-orange-400 to-red-400' : 'bg-blue-500'}`} style={{ width: `${(user.total / maxUserTotal) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {/* ... (Trend Chart) ... */}
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-2xl text-red-600 dark:text-red-400 shadow-sm"><TrendingUp size={20} strokeWidth={2.5} /></div>
                                <div><h3 className="font-black text-slate-800 dark:text-white text-base">روند بازرسی‌های روزانه</h3><p className="text-[10px] text-slate-500 font-bold mt-0.5 opacity-70">آمار بازدیدهای ماه جاری</p></div>
                            </div>
                            <div className="bg-red-50 text-red-600 dark:bg-slate-700 dark:text-red-300 px-3 py-1 rounded-full text-xs font-bold">{Object.values(dailyTotals).reduce((a, b) => a + b, 0)} بازرسی کل</div>
                        </div>
                        <div className="h-48 relative w-full z-10 px-2 pb-6">
                            <svg viewBox="0 -5 100 110" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                <defs><linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" /><stop offset="100%" stopColor="#ef4444" stopOpacity="0" /></linearGradient></defs>
                                {[0, 25, 50, 75, 100].map((percent) => <g key={percent}><line x1="0" y1={100 - (percent * 0.85)} x2="100" y2={100 - (percent * 0.85)} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" strokeDasharray="2 2" className="text-slate-400" /></g>)}
                                <path d={`M100,100 ${svgPoints} L0,100 Z`} fill="url(#redGradient)" />
                                <polyline points={svgPoints} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
                                {dailyTrend.map((d, index) => <g key={index} className="group/point" onMouseEnter={() => setChartHover({ day: d.day, count: d.count, x: 100 - ((index / (daysCount - 1)) * 100), y: 100 - ((d.count / maxDaily) * 85) })} onMouseLeave={() => setChartHover(null)}><rect x={(100 - ((index / (daysCount - 1)) * 100)) - 2} y="0" width="4" height="100" fill="transparent" className="cursor-pointer"/>{d.count > 0 && <circle cx={100 - ((index / (daysCount - 1)) * 100)} cy={100 - ((d.count / maxDaily) * 85)} r="1.5" fill="#ef4444" stroke="white" strokeWidth="0.5" vectorEffect="non-scaling-stroke" className="transition-all duration-200 group-hover/point:r-[3]"/>}</g>)}
                            </svg>
                            {chartHover && <div className="absolute z-50 pointer-events-none transition-all duration-150 ease-out" style={{ left: `${chartHover.x}%`, top: `${chartHover.y}%` }}><div className="transform -translate-x-1/2 -translate-y-full -mt-3"><div className="bg-slate-900 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap border border-slate-700/50 flex items-center gap-1.5"><span>{chartHover.day}م :</span><span className="text-blue-300">{chartHover.count} بازرسی</span></div><div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-700/50"></div></div></div>}
                            <div className="absolute bottom-0 left-0 w-full h-4">{dailyTrend.map((d, i) => <div key={i} className={`absolute bottom-0 text-[9px] text-slate-400 font-medium font-mono transform -translate-x-1/2 transition-opacity ${d.day % 2 !== 0 ? 'opacity-100' : 'opacity-0'}`} style={{ left: `${100 - ((i / (daysCount - 1)) * 100)}%` }}>{d.day}</div>)}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-visible flex-1 flex flex-col no-print">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-center border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 border border-slate-100 dark:border-slate-700 w-12 min-w-[3rem] sticky right-0 bg-slate-50 dark:bg-slate-800 z-30 shadow-[-5px_0_5px_-5px_rgba(0,0,0,0.1)]">#</th>
                                    
                                    {/* Sortable/Filterable Name Column */}
                                    <th className="p-2 border border-slate-100 dark:border-slate-700 min-w-[150px] sticky right-12 bg-slate-50 dark:bg-slate-800 z-30 shadow-[-5px_0_5px_-5px_rgba(0,0,0,0.1)]">
                                        <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600" onClick={() => handleSort('name')}>
                                                    <span>نام بازرس</span>
                                                    {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                                                </div>
                                                <div className="relative">
                                                    <div 
                                                        className={`w-1.5 h-1.5 rounded-full border cursor-pointer ${valueFilters['name']?.length ? 'animate-police-strobe border-none' : 'border-slate-400 hover:border-blue-400'}`}
                                                        onClick={(e) => { e.stopPropagation(); setActiveFilterCol(activeFilterCol === 'name' ? null : 'name'); }}
                                                    ></div>
                                                    {activeFilterCol === 'name' && (
                                                        <div className="absolute top-5 left-0 w-48 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-slate-100 dark:border-slate-700 p-2 z-50 max-h-60 overflow-y-auto" onClick={e => e.stopPropagation()}>
                                                            {/* Select All Option */}
                                                            <div 
                                                                className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer border-b border-slate-100 dark:border-slate-700 mb-1" 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const uniqueValues = getUniqueValues('name');
                                                                    const isAllSelected = (valueFilters['name']?.length || 0) === uniqueValues.length;
                                                                    setValueFilters(prev => ({
                                                                        ...prev,
                                                                        ['name']: isAllSelected ? [] : uniqueValues as string[]
                                                                    }));
                                                                }}
                                                            >
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={(valueFilters['name']?.length || 0) === getUniqueValues('name').length}
                                                                    readOnly
                                                                    className="rounded text-blue-600 focus:ring-0 pointer-events-none"
                                                                />
                                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-full text-right">انتخاب همه</span>
                                                            </div>

                                                            {getUniqueValues('name').map(val => (
                                                                <div key={val as string} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer" onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setValueFilters(prev => {
                                                                        const current = prev['name'] || [];
                                                                        const next = current.includes(val as string) ? current.filter(v => v !== val) : [...current, val as string];
                                                                        return { ...prev, ['name']: next };
                                                                    });
                                                                }}>
                                                                    <input type="checkbox" checked={valueFilters['name']?.includes(val as string)} readOnly className="rounded text-blue-600 focus:ring-0 pointer-events-none" />
                                                                    <span className="text-xs truncate text-slate-700 dark:text-slate-300 w-full text-right">{val as string || '(خالی)'}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="relative w-full">
                                                <input 
                                                    type="text" 
                                                    value={columnFilters['name'] || ''}
                                                    onChange={(e) => handleFilterChange('name', e.target.value)}
                                                    className="w-full text-xs py-1.5 pr-2 pl-7 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 font-normal outline-none focus:border-blue-500 transition-colors placeholder-transparent"
                                                />
                                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </th>
                                    
                                    {Array.from({ length: daysCount }).map((_, i) => (
                                        <th key={i} className="p-2 border border-slate-100 dark:border-slate-700 w-10 text-[10px]">{i + 1}</th>
                                    ))}
                                    
                                    {/* Sortable/Filterable Total Column */}
                                    <th className="p-2 border border-slate-100 dark:border-slate-700 min-w-[80px]">
                                        <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 justify-center cursor-pointer hover:text-blue-600" onClick={() => handleSort('total')}>
                                                    <span>مجموع</span>
                                                    {sortConfig?.key === 'total' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                                                </div>
                                            </div>
                                            <div className="relative w-full">
                                                <input 
                                                    type="text" 
                                                    value={columnFilters['total'] || ''}
                                                    onChange={(e) => handleFilterChange('total', e.target.value)}
                                                    className="w-full text-xs py-1.5 pr-2 pl-7 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 font-normal outline-none focus:border-blue-500 transition-colors placeholder-transparent"
                                                />
                                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {processedUsers.length === 0 ? (
                                    <tr><td colSpan={daysCount + 3} className="p-10 text-slate-400">داده‌ای یافت نشد</td></tr>
                                ) : (
                                    <>
                                        {processedUsers.map((user, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="p-2 border border-slate-100 dark:border-slate-700 sticky right-0 bg-white dark:bg-slate-800 z-20 shadow-[-5px_0_5px_-5px_rgba(0,0,0,0.1)]">
                                                    <div className={`w-7 h-7 flex items-center justify-center rounded-full font-black text-[10px] mx-auto ${idx === 0 ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300' : idx === 1 ? 'bg-slate-200 text-slate-700 ring-1 ring-slate-400' : idx === 2 ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-300' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>{idx + 1}</div>
                                                </td>
                                                <td className="p-3 border border-slate-100 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 sticky right-12 bg-white dark:bg-slate-800 z-20 shadow-[-5px_0_5px_-5px_rgba(0,0,0,0.1)] text-right">{user.name}</td>
                                                {Array.from({ length: daysCount }).map((_, i) => {
                                                    const day = i + 1;
                                                    const count = user.days[day] || 0;
                                                    return (
                                                        <td key={i} className={`p-1 border border-slate-100 dark:border-slate-700 text-xs ${count > 0 ? 'bg-green-50 text-green-700 font-bold dark:bg-green-900/20 dark:text-green-400' : 'text-slate-300'}`}>{count || '-'}</td>
                                                    );
                                                })}
                                                <td className="p-3 border border-slate-100 dark:border-slate-700 font-black text-blue-600 dark:text-blue-400">{user.total}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-blue-50 dark:bg-blue-900/10 font-black text-blue-600 dark:text-blue-400 border-t-2 border-blue-100 dark:border-blue-900/30">
                                            <td className="p-2 border border-blue-100 dark:border-blue-900/30 sticky right-0 bg-blue-50 dark:bg-slate-900 z-20 shadow-[-5px_0_5px_-5px_rgba(0,0,0,0.1)]"><div className="w-7 h-7 flex items-center justify-center mx-auto opacity-50"><Sigma size={16} /></div></td>
                                            <td className="p-3 border border-blue-100 dark:border-blue-900/30 sticky right-12 bg-blue-50 dark:bg-slate-900 z-20 shadow-[-5px_0_5px_-5px_rgba(0,0,0,0.1)] text-right">مجموع کل</td>
                                            {Array.from({ length: daysCount }).map((_, i) => (<td key={i} className="p-1 border border-blue-100 dark:border-blue-900/30 text-xs">{dailyTotals[i + 1] || 0}</td>))}
                                            <td className="p-3 border border-blue-100 dark:border-blue-900/30 text-lg">{Object.values(dailyTotals).reduce((a, b) => a + b, 0)}</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderEquipmentHealth = () => {
        const { items, summary } = calculateEquipmentHealth();
        
        // Filter Based on Widget Selection
        let filteredByWidget = items;
        if (healthFilter === 'HEALTHY') filteredByWidget = items.filter(i => i.healthScore >= 90);
        else if (healthFilter === 'WARNING') filteredByWidget = items.filter(i => i.healthScore >= 70 && i.healthScore < 90);
        else if (healthFilter === 'CRITICAL') filteredByWidget = items.filter(i => i.healthScore < 70);

        // Filter & Sort Logic for this specific view (on top of widget filter)
        const processedItems = processData(filteredByWidget);

        return (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 no-print">
                    {/* Total Equipment */}
                    <div 
                        onClick={() => setHealthFilter('ALL')}
                        className={`relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-xl shadow-blue-500/20 group min-h-[160px] flex flex-col justify-between cursor-pointer transition-all ${healthFilter === 'ALL' ? 'ring-4 ring-blue-300 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
                    >
                        <div className="absolute -left-2 -bottom-2 text-white opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <Database size={100} strokeWidth={1.5} />
                        </div>
                        <div className="relative z-10 flex justify-between items-center">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl shadow-inner border border-white/20">
                                <Database size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-blue-100 text-lg font-bold mb-2 opacity-90">تعداد تجهیزات</p>
                            </div>
                        </div>
                        <div className="relative z-10 flex items-end gap-3">
                            <div className="text-4xl font-black text-white">{summary.totalEquipments}</div>
                            <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-sm text-[10px] text-white font-bold mb-1.5">کل موجودی</div>
                        </div>
                    </div>

                    {/* Healthy Equipment */}
                    <div 
                        onClick={() => setHealthFilter('HEALTHY')}
                        className={`relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-xl shadow-emerald-500/20 group min-h-[160px] flex flex-col justify-between cursor-pointer transition-all ${healthFilter === 'HEALTHY' ? 'ring-4 ring-emerald-300 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
                    >
                        <div className="absolute -left-2 -bottom-2 text-white opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <CheckCircle2 size={100} strokeWidth={1.5} />
                        </div>
                        <div className="relative z-10 flex justify-between items-center">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl shadow-inner border border-white/20">
                                <CheckCircle2 size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-emerald-100 text-lg font-bold mb-2 opacity-90">تجهیزات سالم</p>
                            </div>
                        </div>
                        <div className="relative z-10 flex items-end gap-3">
                            <div className="text-4xl font-black text-white">{summary.healthyEquipments}</div>
                            <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-sm text-[10px] text-white font-bold mb-1.5">امتیاز سلامت &ge; ۹۰</div>
                        </div>
                    </div>

                    {/* Defective Equipment (Formerly Warning) */}
                    <div 
                        onClick={() => setHealthFilter('WARNING')}
                        className={`relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-2xl shadow-xl shadow-amber-500/20 group min-h-[160px] flex flex-col justify-between cursor-pointer transition-all ${healthFilter === 'WARNING' ? 'ring-4 ring-amber-300 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
                    >
                        <div className="absolute -left-2 -bottom-2 text-white opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <AlertOctagon size={100} strokeWidth={1.5} />
                        </div>
                        <div className="relative z-10 flex justify-between items-center">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl shadow-inner border border-white/20">
                                <AlertOctagon size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-amber-100 text-lg font-bold mb-2 opacity-90">تجهیزات معیوب</p>
                            </div>
                        </div>
                        <div className="relative z-10 flex items-end gap-3">
                            <div className="text-4xl font-black text-white">{summary.warningEquipments}</div>
                            <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-sm text-[10px] text-white font-bold mb-1.5">امتیاز سلامت ۷۰ تا ۹۰</div>
                        </div>
                    </div>

                    {/* Critical Equipment */}
                    <div 
                        onClick={() => setHealthFilter('CRITICAL')}
                        className={`relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-2xl shadow-xl shadow-red-500/20 group min-h-[160px] flex flex-col justify-between cursor-pointer transition-all ${healthFilter === 'CRITICAL' ? 'ring-4 ring-red-300 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
                    >
                        <div className="absolute -left-2 -bottom-2 text-white opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <AlertTriangle size={100} strokeWidth={1.5} />
                        </div>
                        <div className="relative z-10 flex justify-between items-center">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl shadow-inner border border-white/20">
                                <AlertTriangle size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-red-100 text-lg font-bold mb-2 opacity-90">تجهیزات بحرانی</p>
                            </div>
                        </div>
                        <div className="relative z-10 flex items-end gap-3">
                            <div className="text-4xl font-black text-white">{summary.criticalEquipments}</div>
                            <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-sm text-[10px] text-white font-bold mb-1.5">امتیاز سلامت &lt; ۷۰</div>
                        </div>
                    </div>

                    {/* Health Score - Non-clickable / Static Stats */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-purple-700 p-6 rounded-2xl shadow-xl shadow-violet-500/20 group min-h-[160px] flex flex-col justify-between cursor-default">
                        <div className="absolute -left-2 -bottom-2 text-white opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <HeartPulse size={100} strokeWidth={1.5} />
                        </div>
                        <div className="relative z-10 flex justify-between items-center">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl shadow-inner border border-white/20">
                                <HeartPulse size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-violet-100 text-lg font-bold mb-2 opacity-90">میانگین سلامت</p>
                            </div>
                        </div>
                        <div className="relative z-10 flex items-end gap-3">
                            <div className="text-4xl font-black text-white">{summary.avgScore}%</div>
                            <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-sm text-[10px] text-white font-bold mb-1.5">میانگین کل</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-visible no-print">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    {['name', 'totalInspections', 'totalFails', 'healthScore', 'status'].map(key => {
                                        const label = key === 'name' ? 'تجهیز' : key === 'totalInspections' ? 'تعداد بازرسی' : key === 'totalFails' ? 'خرابی ثبت شده' : key === 'healthScore' ? 'امتیاز سلامت' : 'وضعیت';
                                        return (
                                            <th key={key} className="p-2 whitespace-nowrap align-top">
                                                <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600" onClick={() => handleSort(key)}>
                                                            <span>{label}</span>
                                                            {sortConfig?.key === key ? (
                                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                                            ) : <ArrowUpDown size={14} className="opacity-30" />}
                                                        </div>
                                                        
                                                        {key !== 'status' && ( // No multi-select for status currently (simplified)
                                                            <div className="relative">
                                                                <div 
                                                                    className={`w-1.5 h-1.5 rounded-full border cursor-pointer ${valueFilters[key]?.length ? 'animate-police-strobe border-none' : 'border-slate-400 hover:border-blue-400'}`}
                                                                    onClick={(e) => { e.stopPropagation(); setActiveFilterCol(activeFilterCol === key ? null : key); }}
                                                                ></div>
                                                                {activeFilterCol === key && (
                                                                    <div className="absolute top-5 left-0 w-48 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-slate-100 dark:border-slate-700 p-2 z-50 max-h-60 overflow-y-auto" onClick={e => e.stopPropagation()}>
                                                                        <div 
                                                                            className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer border-b border-slate-100 dark:border-slate-700 mb-1" 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const uniqueValues = Array.from(new Set(items.map((i: any) => String(i[key])))).sort();
                                                                                const isAllSelected = (valueFilters[key]?.length || 0) === uniqueValues.length;
                                                                                setValueFilters(prev => ({ ...prev, [key]: isAllSelected ? [] : uniqueValues }));
                                                                            }}
                                                                        >
                                                                            <input type="checkbox" checked={(valueFilters[key]?.length || 0) === Array.from(new Set(items.map((i: any) => String(i[key])))).length} readOnly className="rounded text-blue-600 focus:ring-0 pointer-events-none"/>
                                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-full text-right">انتخاب همه</span>
                                                                        </div>
                                                                        {Array.from(new Set(items.map((i: any) => String(i[key])))).sort().map(val => (
                                                                            <div key={val} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer" onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setValueFilters(prev => {
                                                                                    const current = prev[key] || [];
                                                                                    const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
                                                                                    return { ...prev, [key]: next };
                                                                                });
                                                                            }}>
                                                                                <input type="checkbox" checked={valueFilters[key]?.includes(val)} readOnly className="rounded text-blue-600 focus:ring-0 pointer-events-none" />
                                                                                <span className="text-xs truncate text-slate-700 dark:text-slate-300 w-full text-right">{val}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="relative w-full">
                                                        <input 
                                                            type="text" 
                                                            value={columnFilters[key] || ''}
                                                            onChange={(e) => handleFilterChange(key, e.target.value)}
                                                            className="w-full text-xs py-1.5 pr-2 pl-7 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 font-normal outline-none focus:border-blue-500 transition-colors placeholder-transparent"
                                                        />
                                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {processedItems.map((item, idx) => (
                                    <tr key={idx} 
                                        className={`transition-colors border-b border-slate-100 dark:border-slate-700/50
                                            ${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}
                                            hover:bg-blue-50 dark:hover:bg-slate-700/50
                                        `}
                                    >
                                        <td className="p-4">
                                            <div className="font-bold text-slate-700 dark:text-white">{item.name}</div>
                                            <div className="text-xs text-slate-400 font-mono mt-0.5">{item.id}</div>
                                        </td>
                                        <td className="p-4 text-center font-bold text-slate-600 dark:text-slate-300">{item.totalInspections}</td>
                                        <td className="p-4 text-center font-bold text-red-500">{item.totalFails}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${item.healthScore >= 90 ? 'bg-green-500' : item.healthScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${item.healthScore}%` }}></div>
                                                </div>
                                                <span className={`text-xs font-bold ${item.healthScore >= 90 ? 'text-green-500' : item.healthScore >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>{item.healthScore}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {item.healthScore >= 90 ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">سالم</span>
                                            ) : item.healthScore >= 70 ? (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold">هشدار</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">بحرانی</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // Filtered data for table views (Generic)
    const filteredData = useMemo(() => {
        return processData(dataList);
    }, [dataList, processData]);

    // ... (Remainder of component: paginatedData, totalPages, handles, toggleSelect, selectAll, return JSX) ...
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handlePrintPDF = () => {
        let dataToPrint: any[] = [];
        let columns: Array<{ key: string; label: string; type?: string }> = [];

        if (activeTab === 'REPORTS' || activeTab === 'LOGS') {
            dataToPrint = filteredData;
            columns = currentSchema.columns;
        } else if (activeTab === 'EQUIPMENT_HEALTH') {
            const { items } = calculateEquipmentHealth();
            dataToPrint = processData(items);
            columns = [
                { key: 'name', label: 'نام تجهیز' },
                { key: 'id', label: 'کد تجهیز' },
                { key: 'totalInspections', label: 'تعداد بازرسی' },
                { key: 'totalFails', label: 'خرابی ثبت شده' },
                { key: 'healthScore', label: 'امتیاز سلامت (%)' },
            ];
        } else if (activeTab === 'ACTIVITY') {
            const { sortedUsers } = calculateActivityMatrix();
            dataToPrint = processData(sortedUsers);
            columns = [
                { key: 'name', label: 'نام بازرس' },
                { key: 'total', label: 'مجموع گزارشات' },
            ];
        }

        if (!dataToPrint.length || !columns.length) {
            setStatusMessage({ type: 'error', text: 'داده‌ای برای چاپ وجود ندارد.' });
            return;
        }

        const escapeHtml = (value: string) =>
            value
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#39;');

        const formatPrintValue = (item: any, column: { key: string; type?: string }) => {
            const rawValue = item[column.key];
            if (rawValue === null || rawValue === undefined || rawValue === '') return '---';
            if (column.type === 'date') {
                const date = new Date(rawValue);
                return isNaN(date.getTime()) ? '---' : date.toLocaleDateString('fa-IR');
            }
            if (column.type === 'datetime') {
                const date = new Date(rawValue);
                return isNaN(date.getTime()) ? '---' : date.toLocaleString('fa-IR');
            }
            return String(rawValue);
        };

        const nameMap: Record<string, string> = {
            REPORTS: 'گزارشات بازرسی',
            LOGS: 'لاگ ورود کاربران',
            EQUIPMENT_HEALTH: 'وضعیت تجهیزات',
            ACTIVITY: 'عملکرد کاربران',
        };

        const headerCells = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
        const bodyRows = dataToPrint
            .map((item, index) => {
                const cells = columns
                    .map((column) => `<td>${escapeHtml(formatPrintValue(item, column))}</td>`)
                    .join('');
                return `<tr><td>${index + 1}</td>${cells}</tr>`;
            })
            .join('');

        const now = new Date();
        const printWindow = window.open('', '_blank', 'width=1200,height=900');
        if (!printWindow) {
            setStatusMessage({ type: 'error', text: 'امکان باز کردن پنجره چاپ وجود ندارد.' });
            return;
        }

        const html = `
            <!doctype html>
            <html lang="fa" dir="rtl">
            <head>
                <meta charset="utf-8" />
                <title>${escapeHtml(nameMap[activeTab] || 'گزارش')}</title>
                <style>
                    body { font-family: Vazirmatn, Tahoma, sans-serif; margin: 24px; color: #0f172a; }
                    .meta { margin-bottom: 16px; font-size: 12px; color: #334155; }
                    h1 { margin: 0 0 8px; font-size: 22px; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: center; vertical-align: middle; }
                    th { background: #0f172a; color: #fff; font-weight: 700; }
                    tr:nth-child(even) td { background: #f8fafc; }
                    .summary { margin: 8px 0 16px; font-size: 13px; font-weight: 700; }
                </style>
            </head>
            <body>
                <h1>${escapeHtml(nameMap[activeTab] || 'گزارش')}</h1>
                <div class="meta">تاریخ چاپ: ${escapeHtml(now.toLocaleString('fa-IR'))}</div>
                <div class="meta">بازه گزارش: از ${escapeHtml(reportDateRange.start)} تا ${escapeHtml(reportDateRange.end)}</div>
                <div class="summary">مجموع: ${dataToPrint.length} رکورد</div>
                <table>
                    <thead><tr><th>#</th>${headerCells}</tr></thead>
                    <tbody>${bodyRows}</tbody>
                </table>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    // ... (handleExportExcel, toggleSelect, selectAll) ...
    const handleExportExcel = () => {
        // ... same code ...
        let dataToExport: any[] = [];
        let columns: any[] = [];

        if (activeTab === 'REPORTS' || activeTab === 'LOGS') {
            dataToExport = filteredData;
            columns = currentSchema.columns;
        } else if (activeTab === 'EQUIPMENT_HEALTH') {
            const { items } = calculateEquipmentHealth();
            dataToExport = items;
            columns = [
                { key: 'name', label: 'نام تجهیز' },
                { key: 'id', label: 'کد تجهیز' },
                { key: 'totalInspections', label: 'تعداد بازرسی' },
                { key: 'totalFails', label: 'خرابی ثبت شده' },
                { key: 'healthScore', label: 'امتیاز سلامت (%)' },
            ];
        } else if (activeTab === 'ACTIVITY') {
            const { sortedUsers } = calculateActivityMatrix();
            dataToExport = sortedUsers;
            columns = [
                { key: 'name', label: 'نام بازرس' },
                { key: 'total', label: 'مجموع گزارشات' },
            ];
        }

        if (!dataToExport || dataToExport.length === 0) {
            setStatusMessage({ type: 'error', text: 'داده‌ای برای خروجی وجود ندارد.' });
            return;
        }

        const excelRows = dataToExport.map(item => {
            const row: any = {};
            columns.forEach(col => {
                let val = item[col.key];
                if (col.type === 'date' && val) {
                    val = new Date(val).toLocaleDateString('fa-IR');
                } else if (col.type === 'datetime' && val) {
                    val = new Date(val).toLocaleString('fa-IR', { 
                        year: 'numeric', month: '2-digit', day: '2-digit', 
                        hour: '2-digit', minute: '2-digit' 
                    });
                } else if (col.type === 'status' && !val) {
                    val = 'بازبینی';
                }
                row[col.label] = val;
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(excelRows);
        ws['!dir'] = 'rtl';
        if (!ws['!views']) ws['!views'] = [];
        ws['!views'][0] = { rightToLeft: true };

        const colWidths = columns.map(col => {
            const maxContentLength = Math.max(
                col.label.length,
                ...excelRows.map((row: any) => String(row[col.label] || "").length)
            );
            return { wch: Math.min(maxContentLength + 10, 60) };
        });
        ws['!cols'] = colWidths;

        const range = XLSX.utils.decode_range(ws['!ref'] || "A1");
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellRef]) continue;
                const cell = ws[cellRef];
                const style: any = {
                    font: { name: "Vazirmatn", sz: 10 },
                    alignment: { vertical: "center", horizontal: "center", wrapText: true },
                    border: {
                        top: { style: "thin", color: { rgb: "E2E8F0" } },
                        bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                        left: { style: "thin", color: { rgb: "E2E8F0" } },
                        right: { style: "thin", color: { rgb: "E2E8F0" } }
                    }
                };
                if (R === 0) {
                    style.fill = { fgColor: { rgb: "1E293B" } };
                    style.font = { name: "Vazirmatn", sz: 11, bold: true, color: { rgb: "FFFFFF" } };
                    style.alignment.wrapText = false;
                } else {
                    if (R % 2 === 0) {
                        style.fill = { fgColor: { rgb: "F8FAFC" } };
                    }
                }
                cell.s = style;
            }
        }

        const now = new Date();
        const dateStr = now.toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-');
        const timeStr = now.toLocaleTimeString('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(/:/g, '-');
        
        const nameMap: any = {
            'REPORTS': 'Inspection_Reports',
            'EQUIPMENT_HEALTH': 'Equipment_Health',
            'ACTIVITY': 'User_Activity_Performance',
            'LOGS': 'User_Login_Logs'
        };
        
        const baseName = nameMap[activeTab] || `Report_${activeTab}`;
        const fileName = `${baseName}_${dateStr}_${timeStr}.xlsx`;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, ws, "گزارش");
        XLSX.writeFile(workbook, fileName);
    };

    const toggleSelect = (id: any) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const selectAll = () => {
        if (selectedIds.size === filteredData.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredData.map(d => d[currentSchema.idField])));
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-50 shadow-sm flex items-center justify-between no-print">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        <ChevronRight className="rtl:rotate-180 dark:text-white" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <BarChart3 className="text-blue-600" />
                            گزارشات و داشبوردها
                        </h1>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-800 px-4 pt-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto hide-scrollbar no-print">
                <div className="flex gap-6 min-w-max">
                    {Object.keys(SCHEMA).map(tabKey => (
                        <button
                            key={tabKey}
                            onClick={() => setActiveTab(tabKey)}
                            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === tabKey ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            {SCHEMA[tabKey].label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters + Toolbar: یک بلوک یکپارچه sticky تا هنگام اسکرول زیر هدر نرود (همه تب‌ها) */}
            <div className="sticky top-[73px] z-30 bg-slate-50 dark:bg-slate-900 -mx-4 px-4 pt-4 pb-2 no-print shadow-sm">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex flex-col md:flex-row items-end gap-4">
                        <div className="flex-1 w-full space-y-2 relative">
                            <label className="text-[11px] font-black text-slate-400 mr-2 flex items-center gap-1.5 uppercase"><Calendar size={12} className="text-blue-500" /> از تاریخ</label>
                            <PersianDatePicker value={reportDateRange.start} onChange={handleStartDateChange} />
                        </div>
                        <div className="flex-1 w-full space-y-2 relative">
                            <label className="text-[11px] font-black text-slate-400 mr-2 flex items-center gap-1.5 uppercase"><Calendar size={12} className="text-blue-500" /> تا تاریخ</label>
                            <PersianDatePicker value={reportDateRange.end} onChange={handleEndDateChange} />
                        </div>
                        <div className="w-full md:w-auto z-10">
                            <button onClick={() => void loadData(activeTab, reportDateRange)} disabled={loading} className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-2xl text-sm flex items-center justify-center gap-2 h-[48px] w-full md:w-auto transition-all active:scale-95 disabled:opacity-50">
                                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Filter size={18} />}
                                <span>بروزرسانی</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 mt-2 shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="جستجو در کل..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-4 text-sm outline-none focus:border-blue-500 dark:text-white transition-all shadow-sm" />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {hasActiveFilters && (
                        <button onClick={clearAllFilters} className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-red-200 shadow-sm">
                            <FilterX size={18} />
                            <span className="hidden sm:inline">لغو فیلتر</span>
                        </button>
                    )}
                    {activeTab === 'REPORTS' && selectedIds.size > 0 && (
                        <>
                            {selectedIds.size === 1 && (
                                <button onClick={() => {
                                    const item = filteredData.find(i => i.id === Array.from(selectedIds)[0]);
                                    if(item) onViewReport(item);
                                }} className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95"><Eye size={18} /><span className="hidden sm:inline">مشاهده</span></button>
                            )}
                            <button onClick={() => openStatusModal(null, 'اتمام یافته')} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"><CheckCircle size={18} /><span className="hidden sm:inline">اتمام</span></button>
                            <button onClick={() => openStatusModal(null, 'ارسال به cmms')} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"><Send size={18} /><span className="hidden sm:inline">CMMS</span></button>
                        </>
                    )}
                    <button onClick={handlePrintPDF} className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-500/20 active:scale-95"><Printer size={18} /><span>چاپ / PDF</span></button>
                    <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95"><FileSpreadsheet size={18} /><span>اکسل</span></button>
                    {selectedIds.size > 0 && currentSchema.allowDelete && (
                        <button onClick={() => handleDelete(Array.from(selectedIds))} className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95"><Trash2 size={18} /><span>حذف ({selectedIds.size})</span></button>
                    )}
                </div>
            </div>
            </div>

            {statusMessage && (
                <div className={`mx-4 mb-4 p-4 rounded-xl flex items-center gap-3 text-sm font-bold no-print ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {statusMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {statusMessage.text}
                </div>
            )}

            <div className="flex-1 px-4 pb-4 overflow-hidden flex flex-col">
                {activeTab === 'ACTIVITY' ? renderActivityReport() : activeTab === 'EQUIPMENT_HEALTH' ? renderEquipmentHealth() : (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-visible flex-1 flex flex-col no-print">
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        {currentSchema.allowDelete && (
                                            <th className="p-4 w-10"><button onClick={selectAll} className="text-slate-400 hover:text-blue-500">{selectedIds.size === filteredData.length && filteredData.length > 0 ? <CheckCircle size={20} /> : <div className="w-5 h-5 border-2 border-slate-300 rounded"></div>}</button></th>
                                        )}
                                        {currentSchema.columns.map((col: any) => (
                                            <th key={col.key} className="p-2 whitespace-nowrap align-top">
                                                <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600" onClick={() => handleSort(col.key)}>
                                                            <span>{col.label}</span>
                                                            {sortConfig?.key === col.key ? (
                                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                                            ) : <ArrowUpDown size={14} className="opacity-30" />}
                                                        </div>
                                                        <div className="relative">
                                                            <div 
                                                                className={`w-1.5 h-1.5 rounded-full border cursor-pointer ${valueFilters[col.key]?.length ? 'animate-police-strobe border-none' : 'border-slate-400 hover:border-blue-400'}`}
                                                                onClick={(e) => { e.stopPropagation(); setActiveFilterCol(activeFilterCol === col.key ? null : col.key); }}
                                                            ></div>
                                                            {activeFilterCol === col.key && (
                                                                <div className="absolute top-5 left-0 w-48 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-slate-100 dark:border-slate-700 p-2 z-50 max-h-60 overflow-y-auto" onClick={e => e.stopPropagation()}>
                                                                    {/* Select All Option */}
                                                                    <div 
                                                                        className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer border-b border-slate-100 dark:border-slate-700 mb-1" 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const uniqueValues = getUniqueValues(col.key);
                                                                            const isAllSelected = (valueFilters[col.key]?.length || 0) === uniqueValues.length;
                                                                            setValueFilters(prev => ({
                                                                                ...prev,
                                                                                [col.key]: isAllSelected ? [] : uniqueValues as string[]
                                                                            }));
                                                                        }}
                                                                    >
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={(valueFilters[col.key]?.length || 0) === getUniqueValues(col.key).length}
                                                                            readOnly
                                                                            className="rounded text-blue-600 focus:ring-0 pointer-events-none"
                                                                        />
                                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-full text-right">انتخاب همه</span>
                                                                    </div>

                                                                    {getUniqueValues(col.key).map(val => (
                                                                        <div key={val as string} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer" onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setValueFilters(prev => {
                                                                                const current = prev[col.key] || [];
                                                                                const next = current.includes(val as string) ? current.filter(v => v !== val) : [...current, val as string];
                                                                                return { ...prev, [col.key]: next };
                                                                            });
                                                                        }}>
                                                                            <input type="checkbox" checked={valueFilters[col.key]?.includes(val as string)} readOnly className="rounded text-blue-600 focus:ring-0 pointer-events-none" />
                                                                            <span className="text-xs truncate text-slate-700 dark:text-slate-300 w-full text-right">{val as string || '(خالی)'}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="relative w-full">
                                                        <input 
                                                            type="text" 
                                                            value={columnFilters[col.key] || ''}
                                                            onChange={(e) => handleFilterChange(col.key, e.target.value)}
                                                            className="w-full text-xs py-1.5 pr-2 pl-7 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 font-normal outline-none focus:border-blue-500 transition-colors placeholder-transparent"
                                                        />
                                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {paginatedData.map((item, idx) => (
                                        <tr key={idx} 
                                            onClick={() => toggleSelect(item[currentSchema.idField])}
                                            className={`transition-colors cursor-pointer group border-b border-slate-100 dark:border-slate-700/50
                                                ${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}
                                                ${selectedIds.has(item[currentSchema.idField]) ? '!bg-blue-100 dark:!bg-blue-900/30 border-blue-200' : 'hover:bg-blue-50 dark:hover:bg-slate-700/50'}
                                            `}
                                        >
                                            {currentSchema.allowDelete && (
                                                <td className="p-4"><button onClick={(e) => { e.stopPropagation(); toggleSelect(item[currentSchema.idField]); }} className={`transition-colors ${selectedIds.has(item[currentSchema.idField]) ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`}>{selectedIds.has(item[currentSchema.idField]) ? <CheckCircle size={20} /> : <div className="w-5 h-5 border-2 border-slate-300 rounded"></div>}</button></td>
                                            )}
                                            {currentSchema.columns.map((col: any) => (
                                                <td key={col.key} className="p-4 text-slate-700 dark:text-slate-300">
                                                    {col.type === 'status' ? (
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${item[col.key] === 'اتمام یافته' ? 'bg-green-100 text-green-700' : item[col.key] === 'ارسال به cmms' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{item[col.key] || '---'}</span>
                                                    ) : col.type === 'date' || col.type === 'datetime' ? (
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 dir-ltr">
                                                            {(() => {
                                                                try {
                                                                    const date = new Date(item[col.key]);
                                                                    if (isNaN(date.getTime())) return '---';
                                                                    
                                                                    if (col.type === 'datetime') {
                                                                         const d = date.toLocaleDateString('fa-IR');
                                                                         const t = date.toLocaleTimeString('fa-IR', {hour: '2-digit', minute: '2-digit', second: '2-digit'});
                                                                         return `${t} | ${d}`;
                                                                    }
                                                                    
                                                                    return date.toLocaleDateString('fa-IR');
                                                                } catch (e) {
                                                                    return '---';
                                                                }
                                                            })()}
                                                        </span>
                                                    ) : (
                                                        <span className="truncate max-w-[200px] block" title={item[col.key]}>{item[col.key]}</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Footer */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">نمایش</span>
                                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white text-xs rounded-lg px-2 py-1 outline-none">
                                    <option value={10}>10</option><option value={50}>50</option><option value={100}>100</option><option value={200}>200</option>
                                </select>
                                <span className="text-xs text-slate-400 dark:text-slate-500 mx-2">|</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">مجموع: {filteredData.length} رکورد</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition text-slate-600 dark:text-slate-300" title="صفحه اول"><ChevronsRight className="w-4 h-4 rtl:rotate-180" /></button>
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition text-slate-600 dark:text-slate-300" title="صفحه قبل"><ChevronRight className="w-4 h-4 rtl:rotate-180" /></button>
                                <div className="flex items-center gap-2 px-2"><span className="text-sm text-slate-600 dark:text-slate-300">صفحه</span><input type="number" min={1} max={totalPages} value={currentPage} onChange={(e) => { const val = parseInt(e.target.value); if (!isNaN(val) && val >= 1 && val <= totalPages) { setCurrentPage(val); } }} className="w-12 text-center p-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-white" /><span className="text-sm text-slate-600 dark:text-slate-300">از {totalPages}</span></div>
                                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition text-slate-600 dark:text-slate-300" title="صفحه بعد"><ChevronLeft className="w-4 h-4 rtl:rotate-180" /></button>
                                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition text-slate-600 dark:text-slate-300" title="صفحه آخر"><ChevronsLeft className="w-4 h-4 rtl:rotate-180" /></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {confirmationModal.show && (
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={(e) => { if(e.target === e.currentTarget) setConfirmationModal({...confirmationModal, show: false}) }}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 border border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4"><AlertOctagon size={32} /></div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">{confirmationModal.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">{confirmationModal.message}</p>
                        <div className="flex gap-3">
                            <button onClick={performStatusChange} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors active:scale-95 flex items-center justify-center gap-2">{loading ? <RefreshCw className="animate-spin" size={18}/> : <CheckCircle size={18} />}<span>بله، تایید می‌کنم</span></button>
                            <button onClick={() => setConfirmationModal({...confirmationModal, show: false})} disabled={loading} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors active:scale-95">انصراف</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};