import { Dispatch, FormEvent, SetStateAction, useEffect, useRef, useState } from 'react';
import { authenticateUser, changeUserPassword } from '../services/supabaseClient';
import { User } from '../types';

interface AuthViews {
  LOGIN: string;
  HOME: string;
  FORCE_PASSWORD_CHANGE: string;
}

interface UseAuthArgs {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  currentUser?: User;
  view: string;
  setView: (view: string) => void;
  views: AuthViews;
  biometricEnabled: boolean;
  fetchMasterData: () => Promise<{ users: User[]; assets: any[] }>;
  loadHistory: (currentUser: User, start?: string, end?: string) => Promise<void>;
  filterDateRange: { start: string; end: string };
}

const createWebAuthnChallenge = (): Uint8Array => {
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  return challenge;
};

const toBase64Url = (bytes: Uint8Array): string => {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const fromBase64Url = (value: string): Uint8Array => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const decodeUserHandle = (buffer: ArrayBuffer | null): string | null => {
  if (!buffer) return null;
  try {
    const bytes = new Uint8Array(buffer);
    if (!bytes.length) return null;
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
};

const getCredentialStorageKey = (userCode: string) => `biometric_credential_id_${userCode}`;

export const useAuth = ({
  user,
  setUser,
  currentUser,
  view,
  setView,
  views,
  biometricEnabled,
  fetchMasterData,
  loadHistory,
  filterDateRange,
}: UseAuthArgs) => {
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);
  const enrollAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    const detectBiometricHardware = async () => {
      if (!window.PublicKeyCredential) {
        setHasBiometricHardware(false);
        return;
      }
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        // Some mobile browsers return false here but still support passkeys.
        setHasBiometricHardware(available || !!window.PublicKeyCredential);
      } catch {
        setHasBiometricHardware(true);
      }
    };

    void detectBiometricHardware();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      if (view === views.LOGIN) {
        setView(views.HOME);
      }
    }
  }, [currentUser, setUser, view, views.LOGIN, views.HOME, setView]);

  const registerBiometricCredential = async (targetUser: User) => {
    if (!window.PublicKeyCredential || !window.isSecureContext) {
      return false;
    }

    const existingCredential = localStorage.getItem(getCredentialStorageKey(targetUser.code));
    if (existingCredential) {
      return true;
    }

    try {
      const userId = new TextEncoder().encode(targetUser.code);
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: createWebAuthnChallenge(),
          rp: {
            name: 'RaiNo Checklist',
          },
          user: {
            id: userId,
            name: targetUser.code,
            displayName: targetUser.name || targetUser.code,
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          timeout: 60000,
          attestation: 'none',
          authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
          },
        },
      })) as PublicKeyCredential | null;

      if (!credential || !credential.rawId) {
        return false;
      }

      const rawId = new Uint8Array(credential.rawId);
      localStorage.setItem(getCredentialStorageKey(targetUser.code), toBase64Url(rawId));
      localStorage.setItem('biometric_user', targetUser.code);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const enrollIfNeeded = async () => {
      if (!biometricEnabled || !user || !hasBiometricHardware) return;
      if (!window.isSecureContext || !window.PublicKeyCredential) return;

      const storageKey = getCredentialStorageKey(user.code);
      if (localStorage.getItem(storageKey)) return;

      if (enrollAttemptRef.current === user.code) return;
      enrollAttemptRef.current = user.code;
      await registerBiometricCredential(user);
    };

    void enrollIfNeeded();
  }, [biometricEnabled, user, hasBiometricHardware]);

  const handleLogin = async (usernameInput: string, passwordInput: string) => {
    setLoginError('');
    setIsLoadingData(true);
    const startTime = Date.now();

    try {
      const authResult = await authenticateUser(usernameInput, passwordInput);

      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
      }

      if (authResult.success && authResult.user) {
        await fetchMasterData();
        setUser(authResult.user);
        if (biometricEnabled) {
          localStorage.setItem('biometric_user', authResult.user.code);
          if (hasBiometricHardware) {
            const enrolled = await registerBiometricCredential(authResult.user);
            if (!enrolled) {
              console.warn('Biometric credential enrollment skipped or failed.');
            }
          }
        }
        if (authResult.needsPasswordChange) {
          setView(views.FORCE_PASSWORD_CHANGE);
          setPasswordMessage(null);
        } else {
          setView(views.HOME);
        }
      } else {
        setLoginError(authResult.message || 'نام کاربری یا رمز عبور اشتباه است.');
      }
    } catch {
      setLoginError('خطا در برقراری ارتباط با سرور');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsLoadingData(true);
    setLoginError('');
    const startTime = Date.now();

    try {
      if (!window.PublicKeyCredential || !window.isSecureContext) {
        setLoginError('ورود بیومتریک فقط در محیط امن (HTTPS یا localhost) قابل استفاده است.');
        return;
      }

      const savedUserCode = localStorage.getItem('biometric_user') || '';
      const credentialIdB64 = savedUserCode
        ? localStorage.getItem(getCredentialStorageKey(savedUserCode))
        : null;

      let assertion: Credential | null = null;
      if (credentialIdB64) {
        try {
          assertion = await navigator.credentials.get({
            publicKey: {
              challenge: createWebAuthnChallenge(),
              userVerification: 'preferred',
              allowCredentials: [
                {
                  id: fromBase64Url(credentialIdB64),
                  type: 'public-key',
                },
              ],
              timeout: 60000,
            },
          });
        } catch {
          assertion = null;
        }
      }

      if (!assertion) {
        // Fallback for devices that use discoverable credentials (passkeys).
        assertion = await navigator.credentials.get({
          publicKey: {
            challenge: createWebAuthnChallenge(),
            userVerification: 'preferred',
            timeout: 60000,
          },
        });
      }

      const assertionResponse = (assertion as PublicKeyCredential | null)?.response as
        | AuthenticatorAssertionResponse
        | undefined;
      const userHandleCode = decodeUserHandle(assertionResponse?.userHandle ?? null);
      const resolvedUserCode = userHandleCode || savedUserCode;

      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
      }

      const { users } = await fetchMasterData();
      const data = users.find((u) => u.code === resolvedUserCode);
      if (data) {
        localStorage.setItem('biometric_user', data.code);
        setUser(data);
        setView(views.HOME);
      } else {
        setLoginError('کاربر متناظر با ورود بیومتریک یافت نشد. یک‌بار ورود عادی انجام دهید.');
      }
    } catch (e: any) {
      if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
        setLoginError('عملیات لغو شد یا مجوز صادر نشد');
      } else {
        setLoginError('احراز هویت انجام نشد. ابتدا یک‌بار ورود عادی انجام دهید و بیومتریک را فعال کنید.');
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleForcePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPasswordMessage(null);
    if (newPassword.length < 4) {
      setPasswordMessage({ type: 'error', text: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'تکرار رمز عبور مطابقت ندارد' });
      return;
    }
    setIsLoadingData(true);
    const result = await changeUserPassword(user.code, newPassword);
    setIsLoadingData(false);
    if (result.success) {
      setPasswordMessage({ type: 'success', text: 'رمز عبور با موفقیت ثبت شد' });
      setTimeout(() => {
        setView(views.HOME);
        void loadHistory(user, filterDateRange.start, filterDateRange.end);
        setPasswordMessage(null);
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } else {
      setPasswordMessage({ type: 'error', text: `خطا در تغییر رمز: ${result.message}` });
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPasswordMessage(null);
    const authCheck = await authenticateUser(user.code, oldPassword);
    if (!authCheck.success) {
      setPasswordMessage({ type: 'error', text: 'رمز عبور فعلی اشتباه است' });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMessage({ type: 'error', text: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'تکرار رمز عبور مطابقت ندارد' });
      return;
    }
    const result = await changeUserPassword(user.code, newPassword);
    if (result.success) {
      setPasswordMessage({ type: 'success', text: 'رمز عبور با موفقیت تغییر کرد' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordMessage(null);
      }, 1500);
    } else {
      setPasswordMessage({ type: 'error', text: 'خطا در برقراری ارتباط با دیتابیس' });
    }
  };

  const clearAuthState = () => {
    setLoginError('');
    setPasswordMessage(null);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOldPass(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
  };

  return {
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
  };
};
