import React, { useState, useEffect } from 'react';
import { PieChart, BarChart } from 'lucide-react';
import { InspectionForm } from '@/types';
import { getTopFailures } from '@/services/supabaseClient';

interface AnalyticsDashboardProps {
    history: InspectionForm[];
    filterDateRange: { start: string; end: string };
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ history, filterDateRange }) => {
    const [topFailures, setTopFailures] = useState<any[]>([]);
    const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
    const [isLoadingFailures, setIsLoadingFailures] = useState(false);

    useEffect(() => {
        const fetchFailures = async () => {
            setIsLoadingFailures(true);
            try {
                const startDate = filterDateRange.start ? new Date(filterDateRange.start).toISOString() : undefined;
                const endDate = filterDateRange.end ? new Date(filterDateRange.end + 'T23:59:59').toISOString() : undefined;
                const data = await getTopFailures(startDate, endDate);
                setTopFailures(data);
            } catch (e) {
                console.error("Failed to fetch top failures", e);
            } finally {
                setIsLoadingFailures(false);
            }
        };
        fetchFailures();
    }, [filterDateRange]);

    const getFailCount = (report: InspectionForm) => {
        if (typeof report.failCount === 'number') return report.failCount;
        return report.items.filter((item) => item.status === InspectionStatus.FAIL).length;
    };

    const totalInspections = history.length;
    const failedInspections = history.filter((report) => getFailCount(report) > 0).length;
    const healthyInspections = totalInspections - failedInspections;
    
    const failPercent = totalInspections ? (failedInspections / totalInspections) * 100 : 0;
    const passPercent = totalInspections ? (healthyInspections / totalInspections) * 100 : 0;

    const handleTextInteraction = (index: number, type: 'click' | 'enter' | 'leave') => {
        if (type === 'enter') {
            setAnimatingIndex(index);
        } else if (type === 'leave') {
            setAnimatingIndex(null);
        } else if (type === 'click') {
            if (animatingIndex === index) {
                setAnimatingIndex(null);
            } else {
                setAnimatingIndex(index);
            }
        }
    };

    return (
        <div className="mb-6 space-y-4 animate-fade-in-up">
            <style>{`
                @keyframes scroll-text-rtl {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(100%); }
                }
                .scrolling-text {
                    animation: scroll-text-rtl 10s linear 1 forwards; 
                    white-space: nowrap;
                    display: inline-block;
                    min-width: 100%;
                }
                .hover-scroll::-webkit-scrollbar {
                    width: 4px;
                }
                .hover-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .hover-scroll::-webkit-scrollbar-thumb {
                    background-color: transparent;
                    border-radius: 4px;
                }
                .hover-scroll:hover::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                }
                .dark .hover-scroll:hover::-webkit-scrollbar-thumb {
                    background-color: #475569;
                }
            `}</style>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="text-blue-600 dark:text-blue-400"><PieChart size={18}/></div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">عملکرد ماه جاری</h3>
                    </div>
                    
                    <div className="flex items-center justify-around">
                        <div className="relative w-36 h-36 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 shadow-inner transition-all duration-500 ease-out hover:scale-110 hover:rotate-12 hover:shadow-2xl group cursor-pointer"
                             style={{
                                 background: `conic-gradient(
                                    #dc2626 0% ${failPercent}%, 
                                    #059669 ${failPercent}%, ${failPercent + passPercent}%, 
                                    #f1f5f9 ${failPercent + passPercent}% 100%
                                 )`
                             }}>
                             <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex flex-col items-center justify-center shadow-md z-10 transition-all duration-500 ease-out group-hover:-rotate-12">
                                 <span className="text-xl font-black text-slate-700 dark:text-white">{totalInspections}</span>
                                 <span className="text-[10px] text-slate-400">بازرسی کل</span>
                             </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 text-xs">
                             <div className="flex items-center gap-2">
                                 <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-sm"></span>
                                 <div className="flex flex-col">
                                     <span className="text-slate-600 dark:text-slate-300 font-bold">{healthyInspections}</span>
                                     <span className="text-[9px] text-slate-400">تجهیز سالم</span>
                                 </div>
                             </div>
                             <div className="flex items-center gap-2">
                                 <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm"></span>
                                 <div className="flex flex-col">
                                     <span className="text-slate-600 dark:text-slate-300 font-bold">{failedInspections}</span>
                                     <span className="text-[9px] text-slate-400">نیازمند تعمیر</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                    <div className="flex items-center gap-2 mb-4 shrink-0">
                        <div className="text-red-600 dark:text-red-400"><BarChart size={18}/></div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">بیشترین خرابی‌های ماه جاری</h3>
                    </div>
                    
                    <div className="space-y-3 h-48 overflow-y-auto pr-2 relative hover-scroll">
                        {isLoadingFailures ? (
                            <div className="space-y-3">
                                <div className="skeleton h-6 w-full"></div>
                                <div className="skeleton h-6 w-full"></div>
                                <div className="skeleton h-6 w-full"></div>
                            </div>
                        ) : topFailures.length > 0 ? (
                            <div className="space-y-3 pb-2">
                                {topFailures.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs w-full overflow-hidden">
                                        <span className="font-bold text-slate-400 w-4 shrink-0">{idx + 1}.</span>
                                        <div 
                                            className="flex-1 overflow-hidden relative cursor-pointer" 
                                            onClick={() => handleTextInteraction(idx, 'click')}
                                            onMouseEnter={() => handleTextInteraction(idx, 'enter')}
                                            onMouseLeave={() => handleTextInteraction(idx, 'leave')}
                                        >
                                            <div className="flex justify-between mb-1">
                                                <div 
                                                    className={`font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 ${animatingIndex === idx ? 'scrolling-text' : 'truncate'}`}
                                                    onAnimationEnd={(e) => {
                                                        e.stopPropagation();
                                                        setAnimatingIndex(null); 
                                                    }}
                                                >
                                                    <span>{item.task}</span>
                                                    <span className="text-[10px] text-blue-500 dark:text-blue-400 font-normal whitespace-pre">
                                                        ({item.equipmentLocalName || item.equipmentName})
                                                    </span>
                                                </div>
                                                <span className="text-red-500 font-bold shrink-0 mr-2 z-10 bg-white dark:bg-slate-800 pl-1">{item.count}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full bg-gradient-to-l ${
                                                        idx === 0 ? 'from-red-600 to-red-200' : 
                                                        idx === 1 ? 'from-red-500 to-red-100' : 
                                                        idx === 2 ? 'from-red-400 to-orange-100' :
                                                        'from-red-300 to-slate-100'
                                                    }`} 
                                                    style={{ width: `${Math.min((item.count / topFailures[0].count) * 100, 100)}%` }}>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                                 داده‌ای برای نمایش وجود ندارد
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};