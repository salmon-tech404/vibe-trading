import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import {
  CandlestickChart,
  Flame,
  Crosshair,
  Settings as SettingsIcon,
  BookOpen,
  Moon,
  Sun,
  Languages,
  Check,
  Zap,
  Menu,
  X,
  ShieldCheck,
  ChevronLeft,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDarkMode } from "@/hooks/useDarkMode";
import { safeGet, safeSet } from "@/lib/storage";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import i18n from "@/i18n";
import { useBinanceFuturesStore } from "@/lib/binanceFuturesStore";

interface NavItem {
  to: string;
  icon: typeof CandlestickChart;
  label: string;
  badge?: string;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export function Layout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { dark, toggle } = useDarkMode();
  const [collapsed, setCollapsed] = useState(() => safeGet("qa-sidebar") === "collapsed");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeMode } = useBinanceFuturesStore();

  const NAV_GROUPS: NavGroup[] = [
    {
      groupName: t("nav.tradingGroup"),
      items: [
        {
          to: "/",
          icon: CandlestickChart,
          label: t("nav.charts"),
          badge: t("nav.badgeLive"),
        },
        {
          to: "/screener",
          icon: Flame,
          label: t("nav.watchlist"),
          badge: t("nav.badgeRadar"),
        },
        {
          to: "/tracker",
          icon: Crosshair,
          label: t("nav.positions"),
          badge: t("nav.badgeTracker"),
        },
        {
          to: "/strategy-lab",
          icon: FlaskConical,
          label: t("nav.strategyLab", "Strategy Lab"),
          badge: t("nav.badgeLab", "LAB"),
        },
      ],
    },
    {
      groupName: t("nav.knowledgeGroup"),
      items: [
        {
          to: "/docs",
          icon: BookOpen,
          label: t("nav.docs"),
          badge: t("nav.badgeDocs"),
        },
      ],
    },
    {
      groupName: t("nav.systemGroup"),
      items: [
        {
          to: "/settings",
          icon: SettingsIcon,
          label: t("nav.settings"),
        },
      ],
    },
  ];

  useEffect(() => {
    safeSet("qa-sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  // Sync collapsed state across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "qa-sidebar") {
        setCollapsed(e.newValue === "collapsed");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden text-foreground antialiased select-none relative">
      {/* Skip to content link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg text-xs"
      >
        {t("layout.skipToMain")}
      </a>

      {/* ========================================================================= */}
      {/* 1. MOBILE TOP APP BAR (< md breakpoint) */}
      {/* ========================================================================= */}
      <header className="md:hidden h-12 border-b border-border/60 bg-card/90 backdrop-blur flex items-center justify-between px-3.5 shrink-0 z-40">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary/10 border border-primary/30 text-primary">
            <Zap className="w-3.5 h-3.5 text-primary fill-primary/30" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-foreground">Vibe-Trading</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggle}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            title={dark ? t("layout.light") : t("layout.dark")}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. RESPONSIVE SIDEBAR (DESKTOP & MOBILE DRAWER) */}
      {/* ========================================================================= */}
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-150"
        />
      )}

      <aside
        aria-label={t("layout.sidebar")}
        className={cn(
          "border-e border-border/60 bg-card/95 backdrop-blur flex flex-col shrink-0 transition-all duration-200 z-50",
          // Desktop styles
          "hidden md:flex",
          collapsed ? "w-12 max-md:w-12" : "w-64 max-md:w-12",
          // Mobile Drawer styles
          mobileMenuOpen && "fixed inset-y-0 left-0 w-64 flex z-50 shadow-2xl bg-card"
        )}
      >
        {/* Brand Header */}
        <div className="h-14 border-b border-border/60 flex items-center justify-between px-3 shrink-0">
          {(!collapsed || mobileMenuOpen) ? (
            <>
              <Link to="/" className="flex items-center gap-2.5 min-w-0" aria-label="Vibe-Trading">
                <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary shrink-0">
                  <Zap className="w-4 h-4 text-primary fill-primary/30" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold tracking-tight text-foreground leading-none">Vibe-Trading</span>
                  <span className="text-[10px] text-muted-foreground font-mono mt-0.5 font-normal">Alpha Terminal</span>
                </div>
              </Link>

              {!mobileMenuOpen && (
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition cursor-pointer shrink-0"
                  title={t("layout.collapse")}
                  aria-label={t("layout.collapse")}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="p-2 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition cursor-pointer flex items-center justify-center shrink-0 hover:scale-105"
                title={t("layout.expand")}
                aria-label={t("layout.expand")}
              >
                <Zap className="w-4 h-4 text-primary fill-primary/30" />
              </button>
            </div>
          )}
        </div>

        {/* Categorized Navigation Groups with enhanced spacing */}
        <nav aria-label={t("layout.mainNavigation")} className="flex-1 px-2.5 py-3.5 space-y-5 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.groupName} className="space-y-1">
              {(!collapsed || mobileMenuOpen) && (
                <div className="text-[11.5px] font-normal text-muted-foreground px-2.5 py-1">
                  {group.groupName}
                </div>
              )}

              <div className="space-y-0.5">
                {group.items.map(({ to, icon: Icon, label, badge }) => {
                  const isActive = to === "/" ? pathname === "/" || pathname === "/chart" : pathname.startsWith(to);

                  return (
                    <Link
                      key={to}
                      to={to}
                      title={collapsed && !mobileMenuOpen ? label : undefined}
                      className={cn(
                        "flex items-center rounded-xl text-xs transition-all group cursor-pointer",
                        collapsed && !mobileMenuOpen ? "justify-center p-2.5" : "justify-between px-3 py-2",
                        isActive
                          ? "bg-muted text-foreground font-medium border border-border/60 shadow-2xs"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-normal"
                      )}
                    >
                      <div className={cn("flex items-center min-w-0", collapsed && !mobileMenuOpen ? "justify-center" : "gap-2.5")}>
                        <Icon
                          className="w-4 h-4 shrink-0 transition-colors text-primary"
                        />
                        {(!collapsed || mobileMenuOpen) && <span className="truncate">{label}</span>}
                      </div>

                      {(!collapsed || mobileMenuOpen) && badge && (
                        <span
                          className={cn(
                            "px-1.5 py-0.2 text-[9px] font-mono font-medium rounded transition-colors",
                            isActive
                              ? "bg-foreground/10 text-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Environment Status Widget & Preferences */}
        <div className="p-2 border-t border-border/60 space-y-2 shrink-0 bg-card/60">
          {/* Active Mode Pill with Tooltip explanation */}
          {(!collapsed || mobileMenuOpen) ? (
            <div
              className="flex items-center justify-between px-2 py-1 rounded-lg border bg-background/70 text-[11px] font-mono"
              title={activeMode === "testnet" ? t("order.testnetTooltip") : t("order.mainnetTooltip")}
            >
              <div className="flex items-center gap-1.5">
                {activeMode === "testnet" ? (
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Zap className="w-3 h-3 text-rose-500 fill-rose-500" />
                )}
                <span className="font-medium text-foreground">
                  {activeMode === "testnet" ? t("order.testnetMode") : t("order.liveMode")}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t("bot.connected")}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <span
                className={`w-2 h-2 rounded-full cursor-help ${
                  activeMode === "testnet" ? "bg-emerald-500" : "bg-rose-500"
                }`}
                title={activeMode === "testnet" ? t("order.testnetTooltip") : t("order.mainnetTooltip")}
              />
            </div>
          )}

          {/* Theme & Language Bar */}
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={toggle}
              title={dark ? t("layout.light") : t("layout.dark")}
              aria-label={dark ? t("layout.light") : t("layout.dark")}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition flex-1 flex items-center justify-center cursor-pointer"
            >
              {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <LanguageDropdown />
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 3. MAIN VIEWPORT */}
      {/* ========================================================================= */}
      <main id="main" className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
}

function LanguageDropdown() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<{ left: number; bottom: number; minWidth: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent | TouchEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement | null;
        if (!target?.closest("[data-lang-menu]")) setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
    };
  }, [open]);

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        left: Math.max(8, rect.left),
        bottom: window.innerHeight - rect.top + 6,
        minWidth: 150,
      });
    }
    setOpen((prev) => !prev);
  };

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    safeSet("qa-lang", code);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        title={t("layout.language")}
        aria-label={t("layout.language")}
        aria-expanded={open ? "true" : "false"}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition flex items-center justify-center cursor-pointer"
      >
        <Languages className="w-3.5 h-3.5" />
      </button>

      {open && menuStyle && (
        <div
          data-lang-menu
          style={{
            position: "fixed",
            left: menuStyle.left,
            bottom: menuStyle.bottom,
            minWidth: menuStyle.minWidth,
            zIndex: 9999,
          }}
          className="rounded-xl border bg-popover text-popover-foreground shadow-xl p-1 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isCur = i18n.language.startsWith(lang.code);
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition ${
                  isCur
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground font-normal"
                }`}
              >
                <span>{lang.label}</span>
                {isCur && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
