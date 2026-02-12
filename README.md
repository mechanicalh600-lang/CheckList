# CheckList

اپلیکیشن تبدیل فرآیند چک‌لیست کاغذی به ثبت سیستمی با React + Vite + Supabase + Gemini.

## پیش‌نیاز

- Node.js 18+

## راه‌اندازی توسعه

1. وابستگی‌ها را نصب کنید:
   `npm install`
2. فایل محیطی ایجاد کنید (بر اساس `.env.example`) و مقدار `GEMINI_API_KEY` را تنظیم کنید.
3. اجرای برنامه:
   `npm run dev`

## دیپلوی روی GitHub Pages

### روش ۱: GitHub Actions (خودکار)

با هر push به شاخه `main`، به‌صورت خودکار دیپلوی می‌شود.

**مراحل:**

1. **ریپازیتوری را در GitHub بسازید** و کد را push کنید:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/CheckList.git
   git push -u origin main
   ```

2. **Secrets را در GitHub تنظیم کنید:**
   - مسیر: `Settings` → `Secrets and variables` → `Actions`
   - اضافه کنید:
     - `SUPABASE_URL`: آدرس پروژه Supabase
     - `SUPABASE_ANON_KEY`: کلید anon پروژه Supabase
     - `GEMINI_API_KEY`: کلید API گوگل (برای قابلیت هوشمند)

3. **GitHub Pages را فعال کنید:**
   - مسیر: `Settings` → `Pages`
   - بخش `Build and deployment` → `Source`: **GitHub Actions**

4. آدرس نهایی: `https://USERNAME.github.io/CheckList/`

### روش ۲: دیپلوی دستی با gh-pages

```bash
VITE_BASE_PATH=/CheckList/ npm run deploy
```

اسکریپت `deploy` ابتدا build می‌گیرد و سپس پوشه `dist` را به برنچ `gh-pages` push می‌کند.

## اسکریپت‌ها

- `npm run dev` اجرای توسعه
- `npm run build` ساخت نسخه production
- `npm run preview` پیش‌نمایش build
- `npm run deploy` دیپلوی دستی روی GitHub Pages
- `npm run typecheck` بررسی TypeScript
- `npm run lint` بررسی کد با ESLint
- `npm run format:check` بررسی فرمت
- `npm run format` فرمت‌گذاری فایل‌ها
- `npm run test` اجرای تست‌ها (Vitest)