import React from 'react';
import { User as UserIcon, Settings, BarChart2, ShieldCheck, LogOut } from 'lucide-react';
import { CompanyLogo } from './Logo';
import { User } from '../types';

interface NavbarProps {
    user: User | null;
    userAvatar: string | null;
    onUserProfileClick: () => void;
    onSystemSettingsClick: () => void;
    onViewChange: (viewName: string) => void;
    onLogoutClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, userAvatar, onUserProfileClick, onSystemSettingsClick, onViewChange, onLogoutClick }) => {
    return (
        <div className="bg-cyan-50 dark:bg-cyan-950 p-4 sticky top-0 z-20 border-b border-cyan-100 dark:border-cyan-900">
            <div className="flex justify-between items-center relative">
                {/* User Info - Click opens User Profile */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-600 shadow-sm relative group cursor-pointer flex items-center justify-center" onClick={onUserProfileClick} title="پروفایل کاربری">
                        {userAvatar ? (
                            <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover object-center" />
                        ) : (
                            <div className="w-full h-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-300">
                                <UserIcon size={24} />
                            </div>
                        )}
                         <div className="absolute inset-0 bg-black/10 hidden group-hover:flex items-center justify-center transition-all rounded-full">
                             <UserIcon size={16} className="text-white opacity-80" />
                         </div>
                    </div>
                    <div className="cursor-pointer" onClick={onUserProfileClick}>
                        <h2 className="font-bold text-slate-800 dark:text-white text-sm hidden sm:block">{user?.name}</h2>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 opacity-80 hidden sm:block">{user?.org}</p>
                    </div>
                </div>
                
                {/* Logo */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 opacity-100 group/logo">
                    <div className="rounded-2xl p-1.5 transition-all duration-300 group-hover/logo:bg-white/50 dark:group-hover/logo:bg-slate-800/40 group-hover/logo:shadow-lg group-hover/logo:shadow-cyan-500/20">
                        <CompanyLogo className="h-14 w-14 transition-transform duration-500 ease-out group-hover/logo:scale-110 group-hover/logo:-rotate-6" />
                    </div>
                    <div className="hidden sm:flex items-baseline gap-1 transition-transform duration-500 group-hover/logo:translate-y-[-1px]">
                        <span className="text-2xl font-black text-[#7f1d1d] dark:text-red-500 tracking-tight">رای‌نو</span>
                        <span className="text-[10px] font-bold text-[#7f1d1d] dark:text-red-500 opacity-80">(ماژول چک لیست)</span>
                    </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                    {(user?.role === 'super_admin' || user?.role === 'admin') && (
                        <button onClick={() => onViewChange('REPORTS')} className="text-blue-600 hover:bg-blue-100/50 p-2.5 rounded-xl transition-colors" title="پنل گزارشات">
                            <BarChart2 size={20} />
                        </button>
                    )}
                    {(user?.role === 'super_admin') && (
                        <>
                            <button onClick={() => onViewChange('ADMIN')} className="text-red-600 hover:bg-red-100/50 p-2.5 rounded-xl transition-colors" title="پنل مدیریت داده‌ها">
                                <ShieldCheck size={20} />
                            </button>
                            <button onClick={onSystemSettingsClick} className="text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 p-2.5 rounded-xl transition-colors" title="تنظیمات سیستم">
                                <Settings size={20} />
                            </button>
                        </>
                    )}
                    <button onClick={onLogoutClick} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2.5 rounded-xl transition-colors" title="خروج از حساب">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};