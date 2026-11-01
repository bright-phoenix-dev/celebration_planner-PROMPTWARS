import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer, type PreviewServer } from 'vite';
import handler from './api/ideas';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env['GEMINI_API_KEY']) {
    process.env['GEMINI_API_KEY'] = env['GEMINI_API_KEY'];
  }
  if (env['GEMINI_MODEL']) {
    process.env['GEMINI_MODEL'] = env['GEMINI_MODEL'];
  }

  const apiPlugin = (): Plugin => ({
    name: 'api-serverless-middleware',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/ai/ideas', (req, res) => {
        void handler(req, res);
      });
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use('/api/ai/ideas', (req, res) => {
        void handler(req, res);
      });
    },
  });

  return {
    plugins: [react(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
    },
    preview: {
      port: 3000,
    },
  };
});
