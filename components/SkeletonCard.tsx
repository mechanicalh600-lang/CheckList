import React from 'react';

export const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-3">
        <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-3 w-full">
                <div className="skeleton w-10 h-10 rounded-full shrink-0"></div>
                <div className="space-y-2 w-full">
                    <div className="skeleton h-4 w-3/4"></div>
                    <div className="skeleton h-3 w-1/2"></div>
                </div>
            </div>
        </div>
        <div className="skeleton h-8 w-full rounded-lg"></div>
    </div>
);