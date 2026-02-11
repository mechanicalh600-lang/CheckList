import React from 'react';
import { Camera, CloudSnow, Eye, EyeOff, Fingerprint, Loader2, Moon, Sun, User as UserIcon, X } from 'lucide-react';
import { User } from '@/types';

interface PasswordMessage {
  type: 'success' | 'error';
  text: string;
}

interface UserProfileModalProps {
  user: User | null;
  userAvatar: string | null;
  isUploadingAvatar: boolean;
  onClose: () => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  theme: string;
  setTheme: (value: string) => void;
  snowEnabled: boolean;
  setSnowEnabled: (value: boolean) => void;
  biometricEnabled: boolean;
  setBiometricEnabled: (value: boolean) => void;
  hasBiometricHardware: boolean;
  oldPassword: string;
  setOldPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  showOldPass: boolean;
  setShowOldPass: (value: boolean) => void;
  showNewPass: boolean;
  setShowNewPass: (value: boolean) => void;
  showConfirmPass: boolean;
  setShowConfirmPass: (value: boolean) => void;
  passwordMessage: PasswordMessage | null;
  onChangePassword: (e: React.FormEvent) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  userAvatar,
  isUploadingAvatar,
  onClose,
  onAvatarUpload,
  theme,
  setTheme,
  snowEnabled,
  setSnowEnabled,
  biometricEnabled,
  setBiometricEnabled,
  hasBiometricHardware,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showOldPass,
  setShowOldPass,
  showNewPass,
  setShowNewPass,
  showConfirmPass,
  setShowConfirmPass,
  passwordMessage,
  onChangePassword,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in-up"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full sm:w-96 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-base dark:text-white">تنظیمات کاربری</h3>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} className="text-slate-500 dark:text-slate-300" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative group border-2 border-slate-200 dark:border-slate-700 shrink-0">
            {userAvatar ? (
              <img src={userAvatar} className="w-full h-full object-cover object-center" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-600 text-slate-400">
                <UserIcon size={28} />
              </div>
            )}
            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
              {isUploadingAvatar ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarUpload}
                disabled={isUploadingAvatar}
              />
            </label>
          </div>
          <div>
            <h3 className="font-bold text-sm dark:text-white">{user?.name}</h3>
            <p className="text-[10px] text-slate-500 mt-1">
              {user?.code} | {user?.org}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400">ظاهر برنامه</span>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-white"
                >
                  {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
                  <span>تم فعلی: {theme === 'light' ? 'روشن' : 'تیره'}</span>
                </button>
                <button
                  onClick={() => setSnowEnabled(!snowEnabled)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    snowEnabled ? 'bg-blue-100 text-blue-600' : 'bg-white dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  <CloudSnow size={16} />
                </button>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400">ورود سریع</span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-white">
                  <Fingerprint size={16} />
                  <span>بیومتریک</span>
                </div>
                <button
                  onClick={() => setBiometricEnabled(!biometricEnabled)}
                  disabled={!hasBiometricHardware}
                  className={`w-8 h-5 rounded-full transition-colors relative ${
                    biometricEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                  } ${!hasBiometricHardware ? 'opacity-50' : ''}`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                      biometricEnabled ? 'left-1' : 'right-1'
                    }`}
                  ></div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 mb-1">تغییر رمز عبور</h4>
            <form onSubmit={onChangePassword} className="space-y-2">
              <div className="relative w-full">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  placeholder="رمز فعلی"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-2 pl-8 rounded-lg text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none placeholder:text-right text-left dir-ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showOldPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="flex gap-2">
                <div className="relative w-full">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="رمز جدید"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2 pl-8 rounded-lg text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none placeholder:text-right text-left dir-ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="relative w-full">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    placeholder="تکرار رمز"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 pl-8 rounded-lg text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none placeholder:text-right text-left dir-ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              {passwordMessage && (
                <p className={`text-[10px] ${passwordMessage.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                  {passwordMessage.text}
                </p>
              )}
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
              >
                ذخیره رمز جدید
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
