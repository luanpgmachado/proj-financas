import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const DEFAULT_API_PROXY_TARGET = "http://localhost:8000";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawBaseUrl = env.VITE_API_BASE_URL || "";
  const proxyBase = rawBaseUrl.startsWith("/")
    ? rawBaseUrl.replace(/\/$/, "")
    : "";
  const proxyTarget = env.API_PROXY_TARGET || DEFAULT_API_PROXY_TARGET;

  return {
    plugins: [react()],
    server: proxyBase
      ? {
          proxy: {
            [proxyBase]: {
              target: proxyTarget,
              changeOrigin: true,
              rewrite: (path) => path.slice(proxyBase.length) || "/"
            }
          }
        }
      : undefined
  };
});
