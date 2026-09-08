import { UserRole } from '@/types';
import { clearMuseumSession, setMuseumSession, supabase } from './client';

const getClientIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (e) {
    console.warn('Failed to fetch IP address:', e);
    return null;
  }
};

export const authenticateUser = async (code: string, passwordInput: string) => {
  try {
    clearMuseumSession();

    const { data, error } = await supabase.rpc('museum_login', {
      p_code: code,
      p_password: passwordInput,
    });

    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row?.session_token) {
      return { success: false, message: 'نام کاربری یا رمز عبور اشتباه است.' };
    }

    setMuseumSession(row.session_token);

    const user = {
      name: row.name,
      code: row.code,
      org: row.org,
      avatar_url: row.avatar_url,
      role: row.role as UserRole,
    };

    getClientIP().then((ip) => {
      supabase
        .from('user_logs')
        .insert([
          {
            user_code: row.code,
            user_name: row.name,
            login_timestamp: new Date().toISOString(),
            ip_address: ip || 'Unknown',
          },
        ])
        .then(({ error: logError }) => {
          if (logError) console.warn('Login log failed:', logError.message);
        });
    });

    return {
      success: true,
      user,
      needsPasswordChange: Boolean(row.needs_password_change),
    };
  } catch (e) {
    clearMuseumSession();
    console.error('Auth error:', e);
    return { success: false, message: 'خطا در برقراری ارتباط با سرور.' };
  }
};

export const changeUserPassword = async (_code: string, newPassword: string) => {
  try {
    const { data, error } = await supabase.rpc('museum_change_password', {
      p_new_password: newPassword,
    });

    if (error || data !== true) {
      throw error || new Error('Password change rejected');
    }
    return { success: true };
  } catch (e: any) {
    console.error('Change password error:', e);
    return { success: false, message: e?.message || 'خطا در تغییر رمز عبور' };
  }
};

export const adminResetUserPassword = async (userCode: string) => {
  try {
    const { data, error } = await supabase.rpc('museum_admin_reset_password', {
      p_user_code: userCode,
    });

    if (error || data !== true) {
      throw error || new Error('Password reset rejected');
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e?.message || 'خطا در بازنشانی رمز عبور' };
  }
};

export const logoutMuseumSession = async () => {
  try {
    await supabase.rpc('museum_logout');
  } catch (e) {
    console.warn('Museum session logout failed:', e);
  } finally {
    clearMuseumSession();
  }
};

export const restoreMuseumSession = async () => {
  try {
    const { data, error } = await supabase.rpc('museum_current_user');
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) return null;
    return {
      name: row.name,
      code: row.code,
      org: row.org,
      avatar_url: row.avatar_url,
      role: row.role as UserRole,
      force_change_password: Boolean(row.force_change_password),
    };
  } catch {
    return null;
  }
};