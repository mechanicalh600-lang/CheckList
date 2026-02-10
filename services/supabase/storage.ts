import { supabase } from './client';

const MAX_IMAGE_SIZE = 1 * 1024 * 1024;
const MAX_VIDEO_SIZE = 15 * 1024 * 1024;

export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
): Promise<string | null> => {
  const isVideo = file.type.startsWith('video');
  const limit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

  if (file.size > limit) {
    alert(`حجم فایل بیش از حد مجاز است. (حداکثر ${isVideo ? '15' : '1'} مگابایت)`);
    return null;
  }

  try {
    const { error } = await supabase.storage.from(bucket).upload(path, file);

    if (error) {
      console.error('Upload error:', JSON.stringify(error));
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    return publicUrl;
  } catch (e) {
    console.error('Upload exception:', e);
    return null;
  }
};

export const uploadProfileImage = async (userCode: string, file: File): Promise<string | null> => {
  try {
    if (file.size > MAX_IMAGE_SIZE) {
      alert('حجم تصویر پروفایل نباید بیشتر از 1 مگابایت باشد.');
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userCode}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const publicUrl = await uploadFile('avatars', filePath, file);
    if (!publicUrl) return null;

    const { error: updateError } = await supabase
      .from('defined_users')
      .update({ avatar_url: publicUrl })
      .eq('code', userCode);

    if (updateError) {
      console.error('Update user error:', updateError);
      return null;
    }

    return publicUrl;
  } catch (e) {
    console.error('Profile upload exception:', e);
    return null;
  }
};
