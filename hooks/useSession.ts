import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { User } from '@/types';

interface SessionViews {
  LOGIN: string;
}

interface UseSessionArgs {
  user: User | null;
  currentUser?: User;
  onExit?: () => void;
  autoLogoutMinutes: number;
  setUser: Dispatch<SetStateAction<User | null>>;
  setUserAvatar: Dispatch<SetStateAction<string | null>>;
  clearHistory: () => void;
  clearInspectionFlow: () => void;
  clearAuthState: () => void;
  closeUserProfile: () => void;
  closeSystemSettings: () => void;
  setView: (view: string) => void;
  views: SessionViews;
}

export const useSession = ({
  user,
  currentUser,
  onExit,
  autoLogoutMinutes,
  setUser,
  setUserAvatar,
  clearHistory,
  clearInspectionFlow,
  clearAuthState,
  closeUserProfile,
  closeSystemSettings,
  setView,
  views,
}: UseSessionArgs) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAutoLogoutNotification, setShowAutoLogoutNotification] = useState(false);

  const handleLogout = useCallback(() => {
    if (currentUser && onExit) {
      onExit();
      return;
    }
    setUser(null);
    setUserAvatar(null);
    clearHistory();
    clearAuthState();
    closeUserProfile();
    closeSystemSettings();
    setShowLogoutConfirm(false);
    setShowAutoLogoutNotification(false);
    clearInspectionFlow();
    setView(views.LOGIN);
  }, [
    currentUser,
    onExit,
    setUser,
    setUserAvatar,
    clearHistory,
    clearAuthState,
    closeUserProfile,
    closeSystemSettings,
    clearInspectionFlow,
    setView,
    views.LOGIN,
  ]);

  useEffect(() => {
    if (!user) return;

    const timeoutDuration = autoLogoutMinutes * 60 * 1000;
    const checkInterval = 10000;
    let lastActivityTime = Date.now();

    const updateActivity = () => {
      lastActivityTime = Date.now();
    };

    const checkIdle = () => {
      const now = Date.now();
      if (now - lastActivityTime >= timeoutDuration) {
        handleLogout();
        setShowAutoLogoutNotification(true);
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'keydown'];
    events.forEach((event) => {
      document.addEventListener(event, updateActivity, { capture: true });
    });
    const intervalId = setInterval(checkIdle, checkInterval);

    return () => {
      clearInterval(intervalId);
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity, { capture: true });
      });
    };
  }, [user, handleLogout, autoLogoutMinutes]);

  const openLogoutConfirm = () => setShowLogoutConfirm(true);
  const closeLogoutConfirm = () => setShowLogoutConfirm(false);
  const closeAutoLogoutNotification = () => setShowAutoLogoutNotification(false);

  return {
    showLogoutConfirm,
    showAutoLogoutNotification,
    openLogoutConfirm,
    closeLogoutConfirm,
    closeAutoLogoutNotification,
    handleLogout,
  };
};
