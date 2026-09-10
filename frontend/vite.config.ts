import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env files from the frontend directory
  const env = loadEnv(mode, process.cwd(), "VITE_");

  // Backend address — override via VITE_BACKEND_HOST / VITE_BACKEND_PORT in .env
  const backendHost = env.VITE_BACKEND_HOST ?? "127.0.0.1";
  const backendPort = env.VITE_BACKEND_PORT ?? "8000";
  const backendOrigin = `http://${backendHost}:${backendPort}`;
  const wsOrigin     = `ws://${backendHost}:${backendPort}`;

  return {
    plugins: [react()],

    // ── Dev server ─────────────────────────────────────────────────────────
    server: {
      port: 5173,
      host: "0.0.0.0",
      strictPort: false, // Try next port if 5173 is busy
      proxy: {
        "/api": {
          target: backendOrigin,
          changeOrigin: true,
          rewrite: (path) => path,
        },
        "/ws": {
          target: wsOrigin,
          ws: true,
          changeOrigin: true,
        },
      },
    },

    // ── Production build ────────────────────────────────────────────────────
    build: {
      outDir: "dist",
      emptyOutDir: true,
      chunkSizeWarningLimit: 2500, // Suppress known large-chunk warning (MapLibre)
      rollupOptions: {
        output: {
          // Split vendor libraries for better caching
          manualChunks: {
            "vendor-react":    ["react", "react-dom"],
            "vendor-map":      ["maplibre-gl"],
            "vendor-charts":   ["react-apexcharts", "apexcharts"],
            "vendor-lucide":   ["lucide-react"],
          },
        },
      },
    },

    // ── Preview server (after build) ────────────────────────────────────────
    preview: {
      port: 5173,
      host: "0.0.0.0",
      proxy: {
        "/api": { target: backendOrigin, changeOrigin: true },
        "/ws":  { target: wsOrigin, ws: true, changeOrigin: true },
      },
    },
  };
});
