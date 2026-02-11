import { useEffect, useState, useCallback, useRef } from 'react';
import { getAppSettings, updateAppSetting } from '@/services/supabaseClient';

const ORG_TITLE_DEFAULT = 'شرکت توسعه معدنی و صنعتی صبانور';
const MIN_AUTO_LOGOUT_MINUTES = 1;

const clampAutoLogoutMinutes = (value: number) =>
  Number.isFinite(value) ? Math.max(MIN_AUTO_LOGOUT_MINUTES, Math.floor(value)) : MIN_AUTO_LOGOUT_MINUTES;

export const useAppSettings = () => {
  const getInitialTheme = (): string => {
    const savedTheme = localStorage.getItem('app_theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  };

  const getInitialBiometricEnabled = (): boolean => {
    const savedBiometric = localStorage.getItem('biometric_enabled');
    return savedBiometric === 'true';
  };

  const [theme, setTheme] = useState<string>(getInitialTheme);
  const [snowEnabled, setSnowEnabled] = useState<boolean>(localStorage.getItem('app_snow') === 'true');
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(getInitialBiometricEnabled);
  const [orgTitle, setOrgTitle] = useState<string>(
    localStorage.getItem('app_org_title') || ORG_TITLE_DEFAULT
  );
  const [autoLogoutMinutes, setAutoLogoutMinutes] = useState<number>(
    clampAutoLogoutMinutes(parseInt(localStorage.getItem('auto_logout_minutes') || '5', 10))
  );
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAppSettings().then((db) => {
      if (cancelled || !db) return;
      setOrgTitle(db.org_title || ORG_TITLE_DEFAULT);
      setAutoLogoutMinutes(clampAutoLogoutMinutes(db.auto_logout_minutes));
      localStorage.setItem('app_org_title', db.org_title || ORG_TITLE_DEFAULT);
      localStorage.setItem('auto_logout_minutes', String(db.auto_logout_minutes));
    }).finally(() => {
      if (!cancelled) setIsSettingsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const orgTitleSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyOrgTitle = useCallback((value: string) => {
    setOrgTitle(value);
    localStorage.setItem('app_org_title', value);
    if (orgTitleSaveTimeout.current) clearTimeout(orgTitleSaveTimeout.current);
    orgTitleSaveTimeout.current = setTimeout(() => {
      updateAppSetting('org_title', value);
      orgTitleSaveTimeout.current = null;
    }, 500);
  }, []);

  const applyAutoLogoutMinutes = useCallback(async (value: number) => {
    const clamped = clampAutoLogoutMinutes(value);
    setAutoLogoutMinutes(clamped);
    localStorage.setItem('auto_logout_minutes', String(clamped));
    await updateAppSetting('auto_logout_minutes', String(clamped));
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app_snow', String(snowEnabled));
  }, [snowEnabled]);

  useEffect(() => {
    localStorage.setItem('biometric_enabled', String(biometricEnabled));
  }, [biometricEnabled]);

  return {
    theme,
    setTheme,
    snowEnabled,
    setSnowEnabled,
    biometricEnabled,
    setBiometricEnabled,
    orgTitle,
    setOrgTitle: applyOrgTitle,
    autoLogoutMinutes,
    setAutoLogoutMinutes: applyAutoLogoutMinutes,
    isSettingsLoading,
  };
};
