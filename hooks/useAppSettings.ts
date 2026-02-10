import { useEffect, useState } from 'react';

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
    // Default is disabled unless explicitly enabled by user.
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

  const applyAutoLogoutMinutes = (value: number) => {
    setAutoLogoutMinutes(clampAutoLogoutMinutes(value));
  };

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

  useEffect(() => {
    localStorage.setItem('app_org_title', orgTitle);
  }, [orgTitle]);

  useEffect(() => {
    localStorage.setItem('auto_logout_minutes', String(autoLogoutMinutes));
  }, [autoLogoutMinutes]);

  return {
    theme,
    setTheme,
    snowEnabled,
    setSnowEnabled,
    biometricEnabled,
    setBiometricEnabled,
    orgTitle,
    setOrgTitle,
    autoLogoutMinutes,
    setAutoLogoutMinutes: applyAutoLogoutMinutes,
  };
};
