import { Suspense, lazy, type ComponentType } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "@/components/layout/Layout";

const LiveChart = lazy(() => import("@/pages/LiveChart").then((m) => ({ default: m.LiveChart })));
const Screener = lazy(() => import("@/pages/Screener").then((m) => ({ default: m.Screener })));
const Tracker = lazy(() => import("@/pages/Tracker").then((m) => ({ default: m.Tracker })));
const Settings = lazy(() => import("@/pages/Settings").then((m) => ({ default: m.Settings })));
const Docs = lazy(() => import("@/pages/Docs").then((m) => ({ default: m.Docs })));
const StrategyLab = lazy(() => import("@/pages/StrategyLab").then((m) => ({ default: m.StrategyLab })));

function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center text-muted-foreground font-mono text-sm">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
        Đang tải hệ thống Vibe-Trading...
      </div>
    </div>
  );
}

function wrap(Component: ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: wrap(LiveChart) },
      { path: "/chart", element: wrap(LiveChart) },
      { path: "/screener", element: wrap(Screener) },
      { path: "/tracker", element: wrap(Tracker) },
      { path: "/strategy-lab", element: wrap(StrategyLab) },
      { path: "/settings", element: wrap(Settings) },
      { path: "/docs", element: wrap(Docs) },
      // Fallbacks
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
