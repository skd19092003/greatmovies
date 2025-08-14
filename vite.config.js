import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // Only attempt to enable HTTPS locally when running `vite` (dev server)
  // and only if cert files exist. This avoids failures on CI/Vercel builds.
  let server = undefined;
  if (command === 'serve') {
    const keyPath = './.cert/key.pem';
    const certPath = './.cert/cert.pem';
    const hasCerts = fs.existsSync(keyPath) && fs.existsSync(certPath);
    server = {
      host: true,
      port: 3000,
      strictPort: true,
      ...(hasCerts
        ? {
            https: {
              key: fs.readFileSync(keyPath),
              cert: fs.readFileSync(certPath),
            },
            hmr: { protocol: 'wss' },
          }
        : {}),
    };
  }

  return {
    plugins: [react()],
    server,
    preview: {
      port: 3000,
      strictPort: true,
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      // Use default esbuild minifier on Vercel
    },
  };
})
