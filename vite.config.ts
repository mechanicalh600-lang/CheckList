import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load all env vars from the workspace root.
    const env = loadEnv(mode, process.cwd(), '');
    const basePath = env.VITE_BASE_PATH || '/';

    return {
        base: basePath,
        define: {
            // This makes the environment variables available on the client-side `process.env` object.
            'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
            'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
            // The Gemini service uses `process.env.API_KEY` as per guidelines.
            // For local development, we map the GEMINI_API_KEY from the .env file to it.
            // In the deployed environment, the platform is expected to provide `process.env.API_KEY`.
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        server: {
          port: 3000,
          host: '0.0.0.0',
        },
        plugins: [react()],
        build: {
          target: 'es2015', // Ensure compatibility with older mobile browsers to prevent white screen
          outDir: 'dist',
          chunkSizeWarningLimit: 950,
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