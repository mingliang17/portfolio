// vite.config.mjs
import { defineConfig } from "file:///C:/Users/Mingliang/dev/portfolio/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Mingliang/dev/portfolio/node_modules/@vitejs/plugin-react/dist/index.js";
import { visualizer } from "file:///C:/Users/Mingliang/dev/portfolio/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import viteCompression from "file:///C:/Users/Mingliang/dev/portfolio/node_modules/vite-plugin-compression/dist/index.mjs";
import { ViteImageOptimizer } from "file:///C:/Users/Mingliang/dev/portfolio/node_modules/vite-plugin-image-optimizer/dist/index.js";
import tailwindcss from "file:///C:/Users/Mingliang/dev/portfolio/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\Mingliang\\dev\\portfolio";
var vite_config_default = defineConfig({
  base: "/portfolio/",
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src")
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    // Gzip compression for all assets
    viteCompression({
      algorithm: "gzip",
      ext: ".gz"
    }),
    // Brotli compression (better than gzip)
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br"
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
      filename: "./dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    // Output directory
    outDir: "dist",
    // Asset size warnings
    chunkSizeWarningLimit: 1e3,
    // Minification
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        // Remove console.logs in production
        drop_debugger: true
      }
    },
    // Code splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "three-vendor": ["three", "@react-three/fiber", "@react-three/drei"],
          // Component chunks
          "components": [
            "./src/components/3d/Developer.jsx",
            "./src/components/3d/Earth.jsx"
          ],
          // Section chunks (lazy loaded)
          "sections": [
            "./src/sections/Carousel.jsx",
            "./src/sections/MyMap.jsx"
          ]
        },
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
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
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js"
      }
    },
    // Source maps (disable in production for smaller builds)
    sourcemap: false,
    // Asset inlining (inline small assets as base64)
    assetsInlineLimit: 4096,
    // 4kb
    // CSS code splitting
    cssCodeSplit: true
  },
  // Optimization options
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "three",
      "@react-three/fiber",
      "@react-three/drei"
    ],
    exclude: ["@react-three/cannon"]
    // Example: exclude unused deps
  },
  // Server config (for development)
  server: {
    port: 3e3,
    open: true,
    cors: true
  },
  // Preview config (for production preview)
  preview: {
    port: 5173,
    open: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTWluZ2xpYW5nXFxcXGRldlxcXFxwb3J0Zm9saW9cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXE1pbmdsaWFuZ1xcXFxkZXZcXFxccG9ydGZvbGlvXFxcXHZpdGUuY29uZmlnLm1qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvTWluZ2xpYW5nL2Rldi9wb3J0Zm9saW8vdml0ZS5jb25maWcubWpzXCI7Ly8gdml0ZS5jb25maWcuanMgLSBPUFRJTUlaRUQgRk9SIFBFUkZPUk1BTkNFXHJcblxyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gJ3JvbGx1cC1wbHVnaW4tdmlzdWFsaXplcic7XHJcbmltcG9ydCB2aXRlQ29tcHJlc3Npb24gZnJvbSAndml0ZS1wbHVnaW4tY29tcHJlc3Npb24nO1xyXG5pbXBvcnQgeyBWaXRlSW1hZ2VPcHRpbWl6ZXIgfSBmcm9tICd2aXRlLXBsdWdpbi1pbWFnZS1vcHRpbWl6ZXInO1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIGJhc2U6ICcvcG9ydGZvbGlvLycsXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgdGFpbHdpbmRjc3MoKSxcclxuICAgIFxyXG4gICAgLy8gR3ppcCBjb21wcmVzc2lvbiBmb3IgYWxsIGFzc2V0c1xyXG4gICAgdml0ZUNvbXByZXNzaW9uKHtcclxuICAgICAgYWxnb3JpdGhtOiAnZ3ppcCcsXHJcbiAgICAgIGV4dDogJy5neicsXHJcbiAgICB9KSxcclxuICAgIFxyXG4gICAgLy8gQnJvdGxpIGNvbXByZXNzaW9uIChiZXR0ZXIgdGhhbiBnemlwKVxyXG4gICAgdml0ZUNvbXByZXNzaW9uKHtcclxuICAgICAgYWxnb3JpdGhtOiAnYnJvdGxpQ29tcHJlc3MnLFxyXG4gICAgICBleHQ6ICcuYnInLFxyXG4gICAgfSksXHJcbiAgICBcclxuICAgIC8vIEltYWdlIG9wdGltaXphdGlvbiAoU2tpcCBmaXJzdClcclxuICAgIC8vIFZpdGVJbWFnZU9wdGltaXplcih7XHJcbiAgICAvLyAgIHBuZzoge1xyXG4gICAgLy8gICAgIHF1YWxpdHk6IDgwLFxyXG4gICAgLy8gICB9LFxyXG4gICAgLy8gICBqcGVnOiB7XHJcbiAgICAvLyAgICAgcXVhbGl0eTogODAsXHJcbiAgICAvLyAgIH0sXHJcbiAgICAvLyAgIGpwZzoge1xyXG4gICAgLy8gICAgIHF1YWxpdHk6IDgwLFxyXG4gICAgLy8gICB9LFxyXG4gICAgLy8gICB3ZWJwOiB7XHJcbiAgICAvLyAgICAgcXVhbGl0eTogODAsXHJcbiAgICAvLyAgIH0sXHJcbiAgICAvLyB9KSxcclxuICAgIFxyXG4gICAgLy8gQnVuZGxlIGFuYWx5emVyIChydW4gYnVpbGQgdG8gc2VlIHJlcG9ydClcclxuICAgIHZpc3VhbGl6ZXIoe1xyXG4gICAgICBmaWxlbmFtZTogJy4vZGlzdC9zdGF0cy5odG1sJyxcclxuICAgICAgb3BlbjogZmFsc2UsXHJcbiAgICAgIGd6aXBTaXplOiB0cnVlLFxyXG4gICAgICBicm90bGlTaXplOiB0cnVlLFxyXG4gICAgfSksXHJcbiAgXSxcclxuICBcclxuICBidWlsZDoge1xyXG4gICAgLy8gT3V0cHV0IGRpcmVjdG9yeVxyXG4gICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICBcclxuICAgIC8vIEFzc2V0IHNpemUgd2FybmluZ3NcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcclxuICAgIFxyXG4gICAgLy8gTWluaWZpY2F0aW9uXHJcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxyXG4gICAgdGVyc2VyT3B0aW9uczoge1xyXG4gICAgICBjb21wcmVzczoge1xyXG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSwgLy8gUmVtb3ZlIGNvbnNvbGUubG9ncyBpbiBwcm9kdWN0aW9uXHJcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBcclxuICAgIC8vIENvZGUgc3BsaXR0aW5nIHN0cmF0ZWd5XHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgLy8gVmVuZG9yIGNodW5rc1xyXG4gICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcclxuICAgICAgICAgICd0aHJlZS12ZW5kb3InOiBbJ3RocmVlJywgJ0ByZWFjdC10aHJlZS9maWJlcicsICdAcmVhY3QtdGhyZWUvZHJlaSddLFxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBDb21wb25lbnQgY2h1bmtzXHJcbiAgICAgICAgICAnY29tcG9uZW50cyc6IFtcclxuICAgICAgICAgICAgJy4vc3JjL2NvbXBvbmVudHMvM2QvRGV2ZWxvcGVyLmpzeCcsXHJcbiAgICAgICAgICAgICcuL3NyYy9jb21wb25lbnRzLzNkL0VhcnRoLmpzeCcsXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBTZWN0aW9uIGNodW5rcyAobGF6eSBsb2FkZWQpXHJcbiAgICAgICAgICAnc2VjdGlvbnMnOiBbXHJcbiAgICAgICAgICAgICcuL3NyYy9zZWN0aW9ucy9DYXJvdXNlbC5qc3gnLFxyXG4gICAgICAgICAgICAnLi9zcmMvc2VjdGlvbnMvTXlNYXAuanN4JyxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICAvLyBBc3NldCBmaWxlIG5hbWluZ1xyXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAoYXNzZXRJbmZvKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBpbmZvID0gYXNzZXRJbmZvLm5hbWUuc3BsaXQoJy4nKTtcclxuICAgICAgICAgIGNvbnN0IGV4dCA9IGluZm9baW5mby5sZW5ndGggLSAxXTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgaWYgKC9cXC4ocG5nfGpwZT9nfHN2Z3xnaWZ8dGlmZnxibXB8aWNvfHdlYnApJC9pLnRlc3QoYXNzZXRJbmZvLm5hbWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBgYXNzZXRzL2ltYWdlcy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdYDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgaWYgKC9cXC4od29mZjI/fHR0ZnxvdGZ8ZW90KSQvaS50ZXN0KGFzc2V0SW5mby5uYW1lKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYGFzc2V0cy9mb250cy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdYDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgaWYgKC9cXC4oZ2xifGZieHxvYmopJC9pLnRlc3QoYXNzZXRJbmZvLm5hbWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBgYXNzZXRzL21vZGVscy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdYDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgcmV0dXJuIGBhc3NldHMvW25hbWVdLVtoYXNoXVtleHRuYW1lXWA7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICAvLyBDaHVuayBmaWxlIG5hbWluZ1xyXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgLy8gU291cmNlIG1hcHMgKGRpc2FibGUgaW4gcHJvZHVjdGlvbiBmb3Igc21hbGxlciBidWlsZHMpXHJcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxyXG4gICAgXHJcbiAgICAvLyBBc3NldCBpbmxpbmluZyAoaW5saW5lIHNtYWxsIGFzc2V0cyBhcyBiYXNlNjQpXHJcbiAgICBhc3NldHNJbmxpbmVMaW1pdDogNDA5NiwgLy8gNGtiXHJcbiAgICBcclxuICAgIC8vIENTUyBjb2RlIHNwbGl0dGluZ1xyXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxyXG4gIH0sXHJcbiAgXHJcbiAgLy8gT3B0aW1pemF0aW9uIG9wdGlvbnNcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGluY2x1ZGU6IFtcclxuICAgICAgJ3JlYWN0JyxcclxuICAgICAgJ3JlYWN0LWRvbScsXHJcbiAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcclxuICAgICAgJ3RocmVlJyxcclxuICAgICAgJ0ByZWFjdC10aHJlZS9maWJlcicsXHJcbiAgICAgICdAcmVhY3QtdGhyZWUvZHJlaScsXHJcbiAgICBdLFxyXG4gICAgZXhjbHVkZTogWydAcmVhY3QtdGhyZWUvY2Fubm9uJ10sIC8vIEV4YW1wbGU6IGV4Y2x1ZGUgdW51c2VkIGRlcHNcclxuICB9LFxyXG4gIFxyXG4gIC8vIFNlcnZlciBjb25maWcgKGZvciBkZXZlbG9wbWVudClcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IDMwMDAsXHJcbiAgICBvcGVuOiB0cnVlLFxyXG4gICAgY29yczogdHJ1ZSxcclxuICB9LFxyXG4gIFxyXG4gIC8vIFByZXZpZXcgY29uZmlnIChmb3IgcHJvZHVjdGlvbiBwcmV2aWV3KVxyXG4gIHByZXZpZXc6IHtcclxuICAgIHBvcnQ6IDUxNzMsXHJcbiAgICBvcGVuOiB0cnVlLFxyXG4gIH0sXHJcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFFQSxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFdBQVc7QUFDbEIsU0FBUyxrQkFBa0I7QUFDM0IsT0FBTyxxQkFBcUI7QUFDNUIsU0FBUywwQkFBMEI7QUFDbkMsT0FBTyxpQkFBaUI7QUFDeEIsT0FBTyxVQUFVO0FBUmpCLElBQU0sbUNBQW1DO0FBVXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxFQUNOLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxJQUNwQztBQUFBLEVBQ0Y7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQTtBQUFBLElBR1osZ0JBQWdCO0FBQUEsTUFDZCxXQUFXO0FBQUEsTUFDWCxLQUFLO0FBQUEsSUFDUCxDQUFDO0FBQUE7QUFBQSxJQUdELGdCQUFnQjtBQUFBLE1BQ2QsV0FBVztBQUFBLE1BQ1gsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFtQkQsV0FBVztBQUFBLE1BQ1QsVUFBVTtBQUFBLE1BQ1YsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsWUFBWTtBQUFBLElBQ2QsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLE9BQU87QUFBQTtBQUFBLElBRUwsUUFBUTtBQUFBO0FBQUEsSUFHUix1QkFBdUI7QUFBQTtBQUFBLElBR3ZCLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxRQUNSLGNBQWM7QUFBQTtBQUFBLFFBQ2QsZUFBZTtBQUFBLE1BQ2pCO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFHQSxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUE7QUFBQSxVQUVaLGdCQUFnQixDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxVQUN6RCxnQkFBZ0IsQ0FBQyxTQUFTLHNCQUFzQixtQkFBbUI7QUFBQTtBQUFBLFVBR25FLGNBQWM7QUFBQSxZQUNaO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQTtBQUFBLFVBR0EsWUFBWTtBQUFBLFlBQ1Y7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQTtBQUFBLFFBR0EsZ0JBQWdCLENBQUMsY0FBYztBQUM3QixnQkFBTSxPQUFPLFVBQVUsS0FBSyxNQUFNLEdBQUc7QUFDckMsZ0JBQU0sTUFBTSxLQUFLLEtBQUssU0FBUyxDQUFDO0FBRWhDLGNBQUksNENBQTRDLEtBQUssVUFBVSxJQUFJLEdBQUc7QUFDcEUsbUJBQU87QUFBQSxVQUNUO0FBRUEsY0FBSSwyQkFBMkIsS0FBSyxVQUFVLElBQUksR0FBRztBQUNuRCxtQkFBTztBQUFBLFVBQ1Q7QUFFQSxjQUFJLG9CQUFvQixLQUFLLFVBQVUsSUFBSSxHQUFHO0FBQzVDLG1CQUFPO0FBQUEsVUFDVDtBQUVBLGlCQUFPO0FBQUEsUUFDVDtBQUFBO0FBQUEsUUFHQSxnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBR0EsV0FBVztBQUFBO0FBQUEsSUFHWCxtQkFBbUI7QUFBQTtBQUFBO0FBQUEsSUFHbkIsY0FBYztBQUFBLEVBQ2hCO0FBQUE7QUFBQSxFQUdBLGNBQWM7QUFBQSxJQUNaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTLENBQUMscUJBQXFCO0FBQUE7QUFBQSxFQUNqQztBQUFBO0FBQUEsRUFHQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBO0FBQUEsRUFHQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
