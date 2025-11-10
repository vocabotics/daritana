import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip compression for production
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    // Brotli compression for production (better compression)
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    // Bundle size visualization
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Production optimizations
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',

    // Output directory
    outDir: 'dist',

    // Generate sourcemaps for error tracking (but not inline)
    sourcemap: true,

    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log in production
        drop_console: true,
        drop_debugger: true,
        // Remove dead code
        dead_code: true,
        // Remove unused code
        unused: true,
      },
      format: {
        // Remove comments
        comments: false,
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Manual chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],
          'chart-vendor': ['recharts', 'date-fns'],
          'form-vendor': ['react-hook-form', 'zod'],

          // Large features
          'architect-features': [
            './src/pages/architect/AuthorityTracking',
            './src/pages/architect/CCCTracking',
            './src/pages/architect/DLPManagement',
            './src/pages/architect/MeetingMinutes',
            './src/pages/architect/PaymentCertificates',
            './src/pages/architect/RetentionTracking',
            './src/pages/architect/SiteInstructionRegister',
          ],

          'enterprise-features': [
            './src/components/enterprise',
          ],
        },

        // Naming strategy for chunks
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg|webp)$/i.test(name ?? '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.css$/i.test(name ?? '')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },

    // CSS code splitting
    cssCodeSplit: true,

    // Report compressed size
    reportCompressedSize: true,

    // Asset inline limit (4kb)
    assetsInlineLimit: 4096,
  },

  // Development server (not used in production, but good to have)
  server: {
    port: 5174,
    strictPort: true,
    host: true,
  },

  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'axios',
    ],
  },

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
