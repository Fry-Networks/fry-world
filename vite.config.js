import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import inject from '@rollup/plugin-inject';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import resolve from '@rollup/plugin-node-resolve';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: "./",
    define: {
      'process.env.SOME_KEY': JSON.stringify(env.SOME_KEY),
      'global': 'globalThis',
    },
    build: {
      rollupOptions: {
        plugins: [
          inject({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser'
          }),
          nodePolyfills()
        ]
      }
    },
    optimizeDeps: {
      include: ['@emotion/styled'],
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: 'globalThis'
        },
        // Enable esbuild polyfill plugins
        plugins: [
          NodeGlobalsPolyfillPlugin({
            buffer: true,
            process: true
          }),
          NodeModulesPolyfillPlugin()
        ]
      }
    },
    resolve: {
      alias: {
        crypto: 'crypto-browserify',
        stream: 'stream-browserify',
        assert: 'assert',
        http: 'stream-http',
        https: 'https-browserify',
        os: 'os-browserify/browser',
        url: 'url',
        process: 'process'
      }
    },
    plugins: [
      react(),
      resolve({
        browser: true,
        preferBuiltins: false
      })
    ]
  };
});
