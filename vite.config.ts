import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    // Fallback to process.env for Liara/CI where vars are injected at build time (no .env file)
    const basePath = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || '/';
    const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    return {
        base: basePath,
        define: {
            'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
            'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
            'process.env.API_KEY': JSON.stringify(geminiKey)
        },
        server: {
          port: 3000,
          host: '0.0.0.0',
          watch: {
            ignored: ['**/.liara_*', '**/.liara_*/**', '**/*.zip', '**/liara/**'],
          },
        },
        plugins: [react()],
        build: {
          target: 'es2015', // Ensure compatibility with older mobile browsers to prevent white screen
          outDir: 'dist',
          chunkSizeWarningLimit: 950,
          // Strip console.log/warn in production builds (keeps console.error for debugging)
          minify: 'esbuild',
          esbuild: {
            pure: mode === 'production' ? ['console.log', 'console.warn'] : [],
            drop: mode === 'production' ? ['debugger'] : [],
          },
          rollupOptions: {
            output: {
              manualChunks(id) {
                if (!id.includes('node_modules')) return;

                // Core React runtime and router-level shared deps.
                if (
                  id.includes('/react/') ||
                  id.includes('/react-dom/') ||
                  id.includes('/scheduler/')
                ) {
                  return 'react-vendor';
                }

                // Supabase client stack.
                if (
                  id.includes('/@supabase/supabase-js/') ||
                  id.includes('/@supabase/realtime-js/') ||
                  id.includes('/@supabase/postgrest-js/') ||
                  id.includes('/@supabase/storage-js/') ||
                  id.includes('/@supabase/functions-js/')
                ) {
                  return 'supabase-vendor';
                }

                // AI SDK and related stack.
                if (id.includes('/@google/genai/')) {
                  return 'ai-vendor';
                }

                // XLSX export bundle is large and rarely needed.
                if (id.includes('/xlsx-js-style/')) {
                  return 'xlsx-vendor';
                }
                if (id.includes('/cfb/') || id.includes('/ssf/')) {
                  return 'xlsx-support-vendor';
                }

                // Persian date picker dependencies.
                if (
                  id.includes('/react-multi-date-picker/') ||
                  id.includes('/react-date-object/') ||
                  id.includes('/react-element-popper/')
                ) {
                  return 'date-vendor';
                }

                // QR scan parser.
                if (id.includes('/jsqr/')) {
                  return 'qr-vendor';
                }

                // Remaining third-party packages.
                return 'vendor';
              },
            },
          },
        },
        resolve: {
          alias: {
            '@': path.resolve('.'),
          }
        }
    }
});