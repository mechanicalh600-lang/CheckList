import React, { useEffect, useRef, useState } from 'react';
import { User as UserIcon, Lock, Eye, EyeOff, AlertTriangle, Loader2, ArrowRight, Fingerprint } from 'lucide-react';
import { CompanyLogo } from '../Logo';

interface LoginViewProps {
    onLogin: (username: string, password: string) => void;
    isLoading: boolean;
    error: string;
    biometricEnabled: boolean;
    hasBiometricHardware: boolean;
    onBiometricLogin: () => void;
    hasSavedBiometric: boolean;
    orgTitle?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ 
    onLogin, isLoading, error, biometricEnabled, hasBiometricHardware, onBiometricLogin, hasSavedBiometric, orgTitle 
}) => {
    const LOGIN_FRAME_BUILD_MS = 1600;
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isFrameBuilding, setIsFrameBuilding] = useState(false);
    const loginDelayTimeoutRef = useRef<number | null>(null);
    const isBusy = isLoading || isFrameBuilding;

    useEffect(() => {
        return () => {
            if (loginDelayTimeoutRef.current !== null) {
                window.clearTimeout(loginDelayTimeoutRef.current);
            }
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isBusy) return;

        const submittedUsername = username.trim();
        const submittedPassword = password;
        setIsFrameBuilding(true);
        loginDelayTimeoutRef.current = window.setTimeout(() => {
            setIsFrameBuilding(false);
            onLogin(submittedUsername, submittedPassword);
            loginDelayTimeoutRef.current = null;
        }, LOGIN_FRAME_BUILD_MS);
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-[100dvh] relative z-10 p-4 overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
            
            <div className="w-full max-w-sm animate-fade-in-up z-10 flex flex-col justify-center h-full sm:h-auto">
                <div className="text-center mb-2 sm:mb-6 space-y-1 sm:space-y-2">
                    <h1 className="font-black text-lg sm:text-xl text-red-900 dark:text-red-500 tracking-tight drop-shadow-sm">
                    {orgTitle || 'شرکت توسعه معدنی و صنعتی صبانور'}
                    </h1>
                    <p className="font-bold text-sm sm:text-base text-slate-600 dark:text-slate-300">
                    سامانه هوشمند نگهداری و تعمیرات
                    </p>
                </div>

                <div className="flex justify-center items-center mb-4 sm:mb-6">
                    <CompanyLogo className="h-28 w-28 sm:h-40 sm:w-40 transition-all duration-300" />
                </div>

                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
                    {isBusy && (
                        <div className={`login-border-snake ${isFrameBuilding ? 'is-building' : 'is-running'}`} aria-hidden="true">
                            <svg className="snake-border-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <rect className="snake-border-track" x="1.5" y="1.5" width="97" height="97" rx="8" ry="8" pathLength="100" />
                                <rect className="snake-border-progress" x="1.5" y="1.5" width="97" height="97" rx="8" ry="8" pathLength="100" />
                            </svg>
                        </div>
                    )}

                    <div className="text-center mb-4 sm:mb-6 relative z-10">
                        <h1 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white mb-1 sm:mb-2">ورود به حساب کاربری</h1>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">لطفا کد پرسنلی و رمز عبور خود را وارد کنید</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 relative z-10">
                        <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 pr-2">کد پرسنلی</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-red-500 transition-colors"><UserIcon size={18} /></div>
                            <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isBusy}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl sm:rounded-2xl py-2.5 sm:py-3 pr-10 pl-4 outline-none focus:border-red-500 focus:bg-white dark:focus:bg-slate-800/80 transition-all text-left dir-ltr placeholder:text-right shadow-sm text-sm"
                            placeholder="مثال: 1234"
                            />
                        </div>
                        </div>

                        <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 pr-2">رمز عبور</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-red-500 transition-colors"><Lock size={18} /></div>
                            <input 
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isBusy}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl sm:rounded-2xl py-2.5 sm:py-3 pr-10 pl-10 outline-none focus:border-red-500 focus:bg-white dark:focus:bg-slate-800/80 transition-all text-left dir-ltr placeholder:text-right shadow-sm text-sm"
                            placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors outline-none"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        </div>

                        {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] sm:text-xs p-2.5 sm:p-3 rounded-xl flex items-center gap-2 font-bold animate-pulse">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                        )}
                        
                        {isBusy && (
                            <div className="flex items-center justify-center gap-2.5 py-2 sm:py-4">
                                <div className="w-2 h-2 rounded-full bg-red-400 animate-dot-morph" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-white border border-slate-200 dark:border-none animate-dot-morph" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-dot-morph" style={{ animationDelay: '300ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-dot-morph" style={{ animationDelay: '450ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-dot-morph" style={{ animationDelay: '600ms' }}></div>
                            </div>
                        )}

                        <button 
                        type="submit" 
                        disabled={isBusy}
                        className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-lg shadow-red-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                        {isBusy ? <Loader2 className="animate-spin" size={20}/> : (
                            <>
                            <span>ورود به سیستم</span>
                            <ArrowRight className="group-hover:-translate-x-1 transition-transform" size={18} />
                            </>
                        )}
                        </button>

                        {biometricEnabled && hasBiometricHardware && hasSavedBiometric && (
                            <button 
                                type="button" 
                                onClick={onBiometricLogin}
                                disabled={isBusy}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold py-3 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                            >
                                <Fingerprint size={20} className="text-red-600 dark:text-red-500" />
                                <span>ورود بیومتریک</span>
                            </button>
                        )}
                    </form>
                </div>

                <div className="mt-4 sm:mt-8 text-center space-y-1 sm:space-y-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 opacity-80 dir-ltr">
                        نسخه 2.9.2
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase opacity-70" style={{ fontFamily: 'sans-serif' }}>
                        DESIGNED & DEVELOPED BY H.PARSA
                    </p>
                </div>
            </div>
        </div>
    );
};