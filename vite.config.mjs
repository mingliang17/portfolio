// vite.config.js - OPTIMIZED FOR PERFORMANCE

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig({
  base: '/portfolio/',
  
  plugins: [
    react(),
    
    // Gzip compression for all assets
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    
    // Brotli compression (better than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    
    // Image optimization (Skip first)
    // ViteImageOptimizer({
    //   png: {
    //     quality: 80,
    //   },
    //   jpeg: {
    //     quality: 80,
    //   },
    //   jpg: {
    //     quality: 80,
    //   },
    //   webp: {
    //     quality: 80,
    //   },
    // }),
    
    // Bundle analyzer (run build to see report)
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  
  build: {
    // Output directory
    outDir: 'dist',
    
    // Asset size warnings
    chunkSizeWarningLimit: 1000,
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    
    // Code splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          
          // Component chunks
          'components': [
            './src/components/3d/Developer.jsx',
            './src/components/3d/Earth.jsx',
          ],
          
          // Section chunks (lazy loaded)
          'sections': [
            './src/sections/Carousel.jsx',
            './src/sections/MyMap.jsx',
          ],
        },
        
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          
          if (/\.(woff2?|ttf|otf|eot)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          
          if (/\.(glb|fbx|obj)$/i.test(assetInfo.name)) {
            return `assets/models/[name]-[hash][extname]`;
          }
          
          return `assets/[name]-[hash][extname]`;
        },
        
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    // Source maps (disable in production for smaller builds)
    sourcemap: false,
    
    // Asset inlining (inline small assets as base64)
    assetsInlineLimit: 4096, // 4kb
    
    // CSS code splitting
    cssCodeSplit: true,
  },
  
  // Optimization options
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
    ],
    exclude: ['@react-three/cannon'], // Example: exclude unused deps
  },
  
  // Server config (for development)
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  
  // Preview config (for production preview)
  preview: {
    port: 5173,
    open: true,
  },
});