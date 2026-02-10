import { FormEvent } from 'react';

interface ForcePasswordChangeViewProps {
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  passwordMessage: { type: 'success' | 'error'; text: string } | null;
  onSubmit: (event: FormEvent) => void;
}

export const ForcePasswordChangeView = ({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordMessage,
  onSubmit,
}: ForcePasswordChangeViewProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 w-full min-h-screen">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-xl font-black text-slate-800 dark:text-white mb-2">تغییر اجباری رمز عبور</h1>
            <p className="text-xs text-red-500 dark:text-red-400 font-bold">
              برای امنیت بیشتر لطفا رمز عبور خود را تغییر دهید
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600 outline-none text-left"
              placeholder="رمز عبور جدید"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600 outline-none text-left"
              placeholder="تکرار رمز عبور جدید"
            />
            {passwordMessage && <p className="text-xs text-red-500">{passwordMessage.text}</p>}
            <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl">
              ذخیره رمز عبور جدید
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
