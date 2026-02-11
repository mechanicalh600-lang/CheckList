import { UserRole } from '@/types';
import { supabase } from './client';

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
    const { data, error } = await supabase.from('defined_users').select('*').eq('code', code).single();

    if (error || !data) {
      return { success: false, message: 'نام کاربری یافت نشد.' };
    }

    const currentDbPassword = data.password;
    const defaultPassword = data.code;

    const isValid = currentDbPassword
      ? currentDbPassword === passwordInput
      : defaultPassword === passwordInput;

    if (!isValid) {
      return { success: false, message: 'رمز عبور اشتباه است.' };
    }

    const needsPasswordChange = data.force_change_password || !currentDbPassword;

    getClientIP().then((ip) => {
      supabase
        .from('user_logs')
        .insert([
          {
            user_code: data.code,
            user_name: data.name,
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
      user: {
        name: data.name,
        code: data.code,
        org: data.org,
        avatar_url: data.avatar_url,
        role: data.role as UserRole,
      },
      needsPasswordChange,
    };
  } catch (e) {
    console.error('Auth error:', e);
    return { success: false, message: 'خطا در برقراری ارتباط با سرور.' };
  }
};

export const changeUserPassword = async (code: string, newPassword: string) => {
  try {
    const { error } = await supabase
      .from('defined_users')
      .update({
        password: newPassword,
        force_change_password: false,
      })
      .eq('code', code);

    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    console.error('Change password error:', e);
    return { success: false, message: e.message };
  }
};

export const adminResetUserPassword = async (userCode: string) => {
  try {
    const { error } = await supabase
      .from('defined_users')
      .update({
        password: null,
        force_change_password: true,
      })
      .eq('code', userCode);

    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};
