import { useEffect } from 'react';

interface NavigationViews {
  LOGIN: string;
  HOME: string;
  SCANNER: string;
  ASSET_SEARCH: string;
  HISTORY: string;
  ADMIN_DASHBOARD: string;
  REPORTS_DASHBOARD: string;
  FORCE_PASSWORD_CHANGE: string;
  ACTIVITY_SELECT: string;
  FORM: string;
  SUCCESS: string;
  SUBMITTING: string;
}

interface UseBackNavigationArgs {
  view: string;
  views: NavigationViews;
  hasAvailableActivities: boolean;
  submitError: string | null;
  returnToAdmin: boolean;
  setReturnToAdmin: (value: boolean) => void;
  resetApp: () => void;
  setView: (view: string) => void;
  handleLogout: () => void;
  openLogoutConfirm: () => void;
  currentUser?: unknown;
  onExit?: () => void;
}

export const useBackNavigation = ({
  view,
  views,
  hasAvailableActivities,
  submitError,
  returnToAdmin,
  setReturnToAdmin,
  resetApp,
  setView,
  handleLogout,
  openLogoutConfirm,
  currentUser,
  onExit,
}: UseBackNavigationArgs) => {
  useEffect(() => {
    const handleBackButton = () => {
      if (view === views.LOGIN) return;

      if (view === views.HOME) {
        window.history.pushState(null, '', window.location.href);
        if (currentUser && onExit) onExit();
        else openLogoutConfirm();
        return;
      }

      window.history.pushState(null, '', window.location.href);
      switch (view) {
        case views.SCANNER:
        case views.ASSET_SEARCH:
        case views.HISTORY:
        case views.ADMIN_DASHBOARD:
        case views.REPORTS_DASHBOARD:
        case views.FORCE_PASSWORD_CHANGE:
          if (view === views.FORCE_PASSWORD_CHANGE) handleLogout();
          else setView(views.HOME);
          break;
        case views.ACTIVITY_SELECT:
          setView(views.HOME);
          break;
        case views.FORM:
          if (hasAvailableActivities) setView(views.ACTIVITY_SELECT);
          else setView(views.HOME);
          break;
        case views.SUCCESS:
          if (returnToAdmin) {
            setView(views.REPORTS_DASHBOARD);
            setReturnToAdmin(false);
          } else {
            resetApp();
          }
          break;
        case views.SUBMITTING:
          if (submitError) setView(views.FORM);
          break;
      }
    };

    if (view !== views.LOGIN) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handleBackButton);
    }

    return () => {
      if (view !== views.LOGIN) {
        window.removeEventListener('popstate', handleBackButton);
      }
    };
  }, [
    view,
    views,
    hasAvailableActivities,
    submitError,
    returnToAdmin,
    setReturnToAdmin,
    resetApp,
    setView,
    handleLogout,
    openLogoutConfirm,
    currentUser,
    onExit,
  ]);
};
