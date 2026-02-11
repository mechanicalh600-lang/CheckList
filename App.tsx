import React, { useState, useEffect, useCallback } from 'react';
import { SnowEffect } from '@/components/SnowEffect';
import { AssetMaster, InspectionReportData, User } from '@/types';
import {
  getInspectionDetailsByIds,
  getMasterAssets,
  getMasterUsers,
  uploadProfileImage,
} from '@/services/supabaseClient';
import { exportInspectionHistoryToExcel } from '@/services/exportService';

// Imported Components
import { AppRouter } from '@/components/AppRouter';
import { LoginView } from '@/components/views/LoginView';
import { AutoLogoutModal } from '@/components/modals/AutoLogoutModal';
import { LogoutConfirmModal } from '@/components/modals/LogoutConfirmModal';
import { UserProfileModal } from '@/components/modals/UserProfileModal';
import { SystemSettingsModal } from '@/components/modals/SystemSettingsModal';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useHistory } from '@/hooks/useHistory';
import { useInspectionFlow } from '@/hooks/useInspectionFlow';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { useBackNavigation } from '@/hooks/useBackNavigation';

const APP_VERSION = '3.0.0';

enum AppView {
  LOGIN = 'LOGIN',
  FORCE_PASSWORD_CHANGE = 'FORCE_PASSWORD_CHANGE', 
  HOME = 'HOME',
  SCANNER = 'SCANNER',
  ACTIVITY_SELECT = 'ACTIVITY_SELECT',
  FORM = 'FORM',
  SUBMITTING = 'SUBMITTING',
  SUCCESS = 'SUCCESS',
  ASSET_SEARCH = 'ASSET_SEARCH',
  HISTORY = 'HISTORY',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  REPORTS_DASHBOARD = 'REPORTS_DASHBOARD',
}

const INSPECTION_VIEWS = {
  LOGIN: AppView.LOGIN,
  HOME: AppView.HOME,
  ACTIVITY_SELECT: AppView.ACTIVITY_SELECT,
  FORM: AppView.FORM,
  SUBMITTING: AppView.SUBMITTING,
  SUCCESS: AppView.SUCCESS,
} as const;

const AUTH_VIEWS = {
  LOGIN: AppView.LOGIN,
  HOME: AppView.HOME,
  FORCE_PASSWORD_CHANGE: AppView.FORCE_PASSWORD_CHANGE,
} as const;

const SESSION_VIEWS = {
  LOGIN: AppView.LOGIN,
} as const;

const BACK_NAVIGATION_VIEWS = {
  LOGIN: AppView.LOGIN,
  HOME: AppView.HOME,
  SCANNER: AppView.SCANNER,
  ASSET_SEARCH: AppView.ASSET_SEARCH,
  HISTORY: AppView.HISTORY,
  ADMIN_DASHBOARD: AppView.ADMIN_DASHBOARD,
  REPORTS_DASHBOARD: AppView.REPORTS_DASHBOARD,
  FORCE_PASSWORD_CHANGE: AppView.FORCE_PASSWORD_CHANGE,
  ACTIVITY_SELECT: AppView.ACTIVITY_SELECT,
  FORM: AppView.FORM,
  SUCCESS: AppView.SUCCESS,
  SUBMITTING: AppView.SUBMITTING,
} as const;

export interface InspectionModuleProps {
    currentUser?: User;
    onExit?: () => void;
}

export const App: React.FC<InspectionModuleProps> = ({ currentUser, onExit }) => {
  const [user, setUser] = useState<User | null>(currentUser || null);
  const [view, setView] = useState<AppView>(currentUser ? AppView.HOME : AppView.LOGIN);
  
  const [userAvatar, setUserAvatar] = useState<string | null>(null); 
  
  // Settings State
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);

  const {
    theme,
    setTheme,
    snowEnabled,
    setSnowEnabled,
    biometricEnabled,
    setBiometricEnabled,
    orgTitle,
    setOrgTitle,
    autoLogoutMinutes,
    setAutoLogoutMinutes,
  } = useAppSettings();

  const {
    inspectionHistory,
    isLoadingHistory,
    filterDateRange,
    setFilterDateRange,
    historyPage,
    setHistoryPage,
    historyItemsPerPage,
    setHistoryItemsPerPage,
    historyTotalPages,
    paginatedHistory,
    selectedHistoryIndices,
    setSelectedHistoryIndices,
    toggleHistorySelection,
    selectAllHistory,
    loadHistory,
    clearHistory,
  } = useHistory(user);

  // Master Data State
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [dbAssets, setDbAssets] = useState<AssetMaster[]>([]);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false); 

  const setAppView = useCallback((nextView: string) => {
    setView(nextView as AppView);
  }, []);

  const {
    currentEquipment,
    availableActivities,
    selectedActivity,
    checklistItems,
    loadingChecklist,
    analysisResult,
    generatedTrackingCode,
    submissionDateObject,
    reportInspector,
    searchTerm,
    loadingText,
    submitError,
    returnToAdmin,
    setReturnToAdmin,
    filteredAssets,
    setSearchTerm,
    handleScan,
    startInspection,
    handleUpdateItem,
    calculateProgress,
    getIncompleteCount,
    handleSubmit,
    handleShareReport,
    resetApp,
    clearInspectionFlow,
    getTraditionalName,
    handleViewReport,
  } = useInspectionFlow({
    user,
    dbAssets,
    loadHistory,
    filterDateRange,
    setView: setAppView,
    views: INSPECTION_VIEWS,
  });

  const isSuperAdmin = user?.role === 'super_admin';

  const fetchMasterData = async () => {
    const usersPromise = getMasterUsers();
    const assetsPromise = getMasterAssets();
    
    const [users, assets] = await Promise.all([usersPromise, assetsPromise]);
    setDbUsers(users);
    setDbAssets(assets);
    return { users, assets };
  };

  const {
    isLoadingData,
    setIsLoadingData,
    loginError,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordMessage,
    showOldPass,
    setShowOldPass,
    showNewPass,
    setShowNewPass,
    showConfirmPass,
    setShowConfirmPass,
    hasBiometricHardware,
    handleLogin,
    handleBiometricLogin,
    handleForcePasswordChange,
    handleChangePassword,
    clearAuthState,
  } = useAuth({
    user,
    setUser,
    currentUser,
    view,
    setView: setAppView,
    views: AUTH_VIEWS,
    biometricEnabled,
    fetchMasterData,
    loadHistory,
    filterDateRange,
  });

  const {
    showLogoutConfirm,
    showAutoLogoutNotification,
    openLogoutConfirm,
    closeLogoutConfirm,
    closeAutoLogoutNotification,
    handleLogout,
  } = useSession({
    user,
    currentUser,
    onExit,
    autoLogoutMinutes,
    setUser,
    setUserAvatar,
    clearHistory,
    clearInspectionFlow,
    clearAuthState,
    closeUserProfile: () => setShowUserProfile(false),
    closeSystemSettings: () => setShowSystemSettings(false),
    setView: setAppView,
    views: SESSION_VIEWS,
  });

  useBackNavigation({
    view,
    views: BACK_NAVIGATION_VIEWS,
    hasAvailableActivities: availableActivities.length > 0,
    submitError,
    returnToAdmin,
    setReturnToAdmin,
    resetApp,
    setView: setAppView,
    handleLogout,
    openLogoutConfirm,
    currentUser,
    onExit,
  });

  useEffect(() => {
    console.log(`App Version: V${APP_VERSION}`);
    setIsLoadingData(true);
    fetchMasterData().finally(() => setIsLoadingData(false));
  }, [setIsLoadingData]);

  useEffect(() => {
    if (user) {
        if (user.avatar_url) {
            setUserAvatar(`${user.avatar_url}?t=${new Date().getTime()}`);
        } else {
            setUserAvatar(null);
        }
    } else {
        setUserAvatar(null);
    }
  }, [user]);

  useEffect(() => {
      if (view !== AppView.HISTORY) {
          setSelectedHistoryIndices([]);
      }
  }, [view, setSelectedHistoryIndices]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
      const file = e.target.files[0];
      setIsUploadingAvatar(true);
      const publicUrl = await uploadProfileImage(user.code, file);
      setIsUploadingAvatar(false);

      if (publicUrl) {
          const newUrl = `${publicUrl}?t=${new Date().getTime()}`;
          setUserAvatar(newUrl);
          setUser(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
          alert("تصویر پروفایل با موفقیت بروزرسانی شد.");
      } else {
          alert("خطا در آپلود تصویر پروفایل.");
      }
    }
  };

  const handleExportExcel = async () => {
    let targetHistory = selectedHistoryIndices.length > 0 
        ? inspectionHistory.filter((_, idx) => selectedHistoryIndices.includes(idx))
        : inspectionHistory;
    
    if (targetHistory.length === 0) {
        alert("داده‌ای برای خروجی وجود ندارد.");
        return;
    }

    const missingDetailIds = targetHistory
      .filter((report) => (!report.items || report.items.length === 0) && report.id)
      .map((report) => report.id as string);

    if (missingDetailIds.length > 0) {
      const detailed = await getInspectionDetailsByIds(missingDetailIds);
      if (detailed.length > 0) {
        const detailsMap = new Map(detailed.map((report) => [report.id, report]));
        targetHistory = targetHistory.map((report) => detailsMap.get(report.id) || report);
      }
    }

    await exportInspectionHistoryToExcel(targetHistory);
  };


  const formatHistoryDate = (timestamp: number) => {
      return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
  };

  const getStatusColor = (status?: string) => {
      switch(status) {
          case 'ارسال به cmms': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'اتمام یافته': return 'bg-green-100 text-green-700 border-green-200';
          default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      }
  }

  const onViewChangeHandler = (viewName: string) => {
      if (viewName === 'ADMIN') setView(AppView.ADMIN_DASHBOARD);
      else if (viewName === 'REPORTS') setView(AppView.REPORTS_DASHBOARD);
  };

  const savedBiometricUserCode = localStorage.getItem('biometric_user');
  const hasSavedBiometricCredential = !!(
    savedBiometricUserCode &&
    (
      localStorage.getItem(`biometric_credential_id_${savedBiometricUserCode}`) ||
      savedBiometricUserCode
    )
  );

  const goHome = useCallback(() => {
    setView(AppView.HOME);
  }, []);

  const handleDashboardViewReport = useCallback(
    (report: InspectionReportData) => {
      void handleViewReport(report, true);
    },
    [handleViewReport]
  );

  const handleAdminBack = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [users, assets] = await Promise.all([getMasterUsers(), getMasterAssets()]);
      setDbUsers(users);
      setDbAssets(assets);
      setView(AppView.HOME);
    } finally {
      setIsLoadingData(false);
    }
  }, [setIsLoadingData]);

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans transition-colors duration-300 ${view === AppView.LOGIN ? 'h-[100dvh] overflow-hidden' : 'pb-24'}`}>
        <SnowEffect active={snowEnabled} />

        {view === AppView.LOGIN ? (
            <LoginView 
                onLogin={handleLogin}
                isLoading={isLoadingData}
                error={loginError}
                biometricEnabled={biometricEnabled}
                hasBiometricHardware={hasBiometricHardware}
                onBiometricLogin={handleBiometricLogin}
                hasSavedBiometric={hasSavedBiometricCredential}
                orgTitle={orgTitle}
            />
        ) : (
            <AppRouter
                view={view}
                views={BACK_NAVIGATION_VIEWS}
                navbar={{
                  user,
                  userAvatar,
                  isSuperAdmin,
                  onUserProfileClick: () => setShowUserProfile(true),
                  onSystemSettingsClick: () => setShowSystemSettings(true),
                  onViewChange: onViewChangeHandler,
                  onLogoutClick: openLogoutConfirm,
                }}
                forcePassword={{
                  newPassword,
                  setNewPassword,
                  confirmPassword,
                  setConfirmPassword,
                  passwordMessage,
                  onSubmit: handleForcePasswordChange,
                }}
                dashboard={{
                  onAdminBack: handleAdminBack,
                  userRole: user?.role || 'other',
                  onDashboardViewReport: handleDashboardViewReport,
                  onBackHome: goHome,
                }}
                home={{
                  isLoadingHistory,
                  inspectionHistory,
                  filterDateRange,
                  getTraditionalName,
                  getStatusColor,
                  formatHistoryDate,
                  onOpenScanner: () => setView(AppView.SCANNER),
                  onOpenAssetSearch: () => setView(AppView.ASSET_SEARCH),
                  onOpenHistory: () => setView(AppView.HISTORY),
                }}
                inspection={{
                  onScan: handleScan,
                  searchTerm,
                  setSearchTerm,
                  filteredAssets,
                  onBackToHome: goHome,
                  currentEquipment,
                  availableActivities,
                  startInspection,
                  selectedActivity,
                  checklistItems,
                  loadingChecklist,
                  calculateProgress,
                  getIncompleteCount,
                  onUpdateItem: handleUpdateItem,
                  onSubmitInspection: handleSubmit,
                  onBackToForm: () => setView(AppView.FORM),
                  submitError,
                  loadingText,
                }}
                success={{
                  reportInspector,
                  generatedTrackingCode,
                  user,
                  submissionDateObject,
                  currentEquipment,
                  checklistItems,
                  analysisResult,
                  returnToAdmin,
                  onShareReport: handleShareReport,
                  onCloseFromAdmin: () => {
                    setView(AppView.REPORTS_DASHBOARD);
                    setReturnToAdmin(false);
                  },
                  onResetApp: resetApp,
                }}
                history={{
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
                  onSelectAllHistory: selectAllHistory,
                  onExportExcel: handleExportExcel,
                  onRefreshHistory: () => {
                    if (user) void loadHistory(user, filterDateRange.start, filterDateRange.end);
                  },
                  onToggleHistorySelection: toggleHistorySelection,
                  getTraditionalName,
                  getStatusColor,
                }}
            />
        )}
        
        {showUserProfile && (
            <UserProfileModal
                user={user}
                userAvatar={userAvatar}
                isUploadingAvatar={isUploadingAvatar}
                onClose={() => setShowUserProfile(false)}
                onAvatarUpload={handleAvatarUpload}
                theme={theme}
                setTheme={setTheme}
                snowEnabled={snowEnabled}
                setSnowEnabled={setSnowEnabled}
                biometricEnabled={biometricEnabled}
                setBiometricEnabled={setBiometricEnabled}
                hasBiometricHardware={hasBiometricHardware}
                oldPassword={oldPassword}
                setOldPassword={setOldPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                showOldPass={showOldPass}
                setShowOldPass={setShowOldPass}
                showNewPass={showNewPass}
                setShowNewPass={setShowNewPass}
                showConfirmPass={showConfirmPass}
                setShowConfirmPass={setShowConfirmPass}
                passwordMessage={passwordMessage}
                onChangePassword={handleChangePassword}
            />
        )}

        {showSystemSettings && isSuperAdmin && (
            <SystemSettingsModal
                orgTitle={orgTitle}
                setOrgTitle={setOrgTitle}
                autoLogoutMinutes={autoLogoutMinutes}
                setAutoLogoutMinutes={setAutoLogoutMinutes}
                onClose={() => setShowSystemSettings(false)}
            />
        )}

        {showAutoLogoutNotification && (
            <AutoLogoutModal
                autoLogoutMinutes={autoLogoutMinutes}
                onClose={closeAutoLogoutNotification}
            />
        )}

        {showLogoutConfirm && (
            <LogoutConfirmModal
                isModuleMode={!!currentUser}
                onCancel={closeLogoutConfirm}
                onConfirm={handleLogout}
            />
        )}
    </div>
  );
};