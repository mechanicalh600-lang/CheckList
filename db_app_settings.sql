-- تنظیمات سراسری اپلیکیشن (برای همه کاربران)
-- Execute once in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- مقادیر پیش‌فرض
INSERT INTO app_settings (key, value) VALUES
  ('org_title', 'شرکت توسعه معدنی و صنعتی صبانور'),
  ('auto_logout_minutes', '5')
ON CONFLICT (key) DO NOTHING;

-- دسترسی خواندن برای همه، نوشتن برای همه (محافظت از طریق UI - فقط super_admin می‌بیند)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read app_settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Allow update app_settings" ON app_settings FOR UPDATE USING (true);
CREATE POLICY "Allow insert app_settings" ON app_settings FOR INSERT WITH CHECK (true);
