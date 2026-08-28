import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const PROXY_PATHS = [
  "/api",
  "/auth",
  "/sessions",
  "/swarm/presets",
  "/swarm/runs",
  "/qveris",
  "/settings/llm",
  "/settings/data-sources",
  "/channels",
  "/mandate",
  "/live",
  "/upload",
  "/shadow-reports",
  "/scheduled-runs",
  "/options",
];

function terminalLoggerPlugin() {
  return {
    name: "vite-terminal-logger",
    configureServer(server: any) {
      server.middlewares.use("/api/terminal-log", (req: any, res: any) => {
        let body = "";
        req.on("data", (chunk: any) => {
          body += chunk;
        });
        req.on("end", () => {
          try {
            const data = JSON.parse(body);
            const time = new Date().toLocaleTimeString();
            const color =
              data.level === "TRADE"
                ? "\x1b[32m" // Green
                : data.level === "WARN"
                ? "\x1b[33m" // Yellow
                : data.level === "ERROR"
                ? "\x1b[31m" // Red
                : data.level === "AUTO_OPTIMIZE"
                ? "\x1b[35m" // Magenta
                : "\x1b[36m"; // Cyan
            const reset = "\x1b[0m";
            console.log(`[${time}] ${color}[${data.level || "INFO"}] [${data.category || "BOT"}]${reset} ${data.message}`);
          } catch {}
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ status: "ok" }));
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_URL || "http://127.0.0.1:8000";
  const apiProxy = { target: apiTarget, changeOrigin: true };
  const apiProxyWithHtmlFallback = {
    ...apiProxy,
    bypass(req: { headers: { accept?: string } }) {
      if (req.headers.accept?.includes("text/html")) {
        return "/index.html";
      }
    },
  };

  return {
    plugins: [react(), terminalLoggerPlugin()],
    resolve: {
      alias: { "@": path.resolve(import.meta.dirname, "./src") },
    },
    server: {
      port: 5899,
      proxy: {
        ...Object.fromEntries(PROXY_PATHS.map((p) => [p, apiProxy])),
        "/binance-testnet": {
          target: "https://testnet.binancefuture.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/binance-testnet/, ""),
        },
        "/binance-mainnet": {
          target: "https://fapi.binance.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/binance-mainnet/, ""),
        },
        // SPA RunDetail page — only the two-segment ``/runs/{id}``
        // form should fall back to ``index.html`` on browser navigation.
        // ``/runs/{id}/code`` and ``/runs/{id}/pine`` are API-only and
        // must keep proxying to the backend even when Accept is text/html.
        "^/runs/[^/]+/?$": apiProxyWithHtmlFallback,
        "/runs": apiProxy,
        "/correlation": apiProxyWithHtmlFallback,
        // /options is both the SPA Options Lab route and an API prefix
        // (/options/payoff, /options/chain) — same dual role as /correlation.
        // Overrides the plain PROXY_PATHS entry above.
        "/options": apiProxyWithHtmlFallback,
        "^/alpha(?:/|$)": apiProxy,
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            if (/node_modules\/(react|react-dom|react-router)\//.test(id)) return "vendor-react";
            if (/node_modules\/echarts\//.test(id)) return "vendor-charts";
            return undefined;
          },
        },
      },
    },
  };
});
