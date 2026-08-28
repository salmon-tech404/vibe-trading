import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { Layout } from "../Layout";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      "app.version": "v0.1.14",
      "nav.charts": "Charts",
      "nav.watchlist": "Watchlist",
      "nav.positions": "Positions",
      "nav.docs": "Docs",
      "nav.settings": "Settings",
      "nav.tradingGroup": "Trading & Radar",
      "nav.knowledgeGroup": "Documentation",
      "nav.systemGroup": "System",
      "nav.badgeLive": "LIVE",
      "nav.badgeRadar": "RADAR",
      "nav.badgeTracker": "TRACKER",
      "nav.badgeDocs": "DOCS",
      "order.testnetMode": "Testnet Mode",
      "order.liveMode": "Live Trading",
      "order.testnetTooltip": "Simulated trading environment with test funds on Binance Futures",
      "order.mainnetTooltip": "Real funds trading on Binance Futures mainnet",
      "bot.connected": "Connected",
      "layout.cancel": "Cancel",
      "layout.collapse": "Collapse",
      "layout.confirm": "Confirm",
      "layout.dark": "Dark",
      "layout.delete": "Delete",
      "layout.expand": "Expand",
      "layout.language": "Language",
      "layout.light": "Light",
      "layout.mainNavigation": "Main navigation",
      "layout.sidebar": "Vibe-Trading sidebar",
      "layout.skipToMain": "Skip to main content",
    })[key] ?? key,
    i18n: {
      language: "en",
      languages: ["en", "vi"],
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    },
  }),
}));

vi.mock("@/hooks/useDarkMode", () => ({
  useDarkMode: () => ({ dark: false, toggle: vi.fn() }),
}));

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<div>Charts content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("Layout accessibility", () => {
  it("labels landmarks, brand, main content, and navigation links", () => {
    renderLayout();

    expect(screen.getByRole("complementary", { name: "Vibe-Trading sidebar" })).toHaveClass("max-md:w-12");
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Vibe-Trading/i })[0]).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Charts/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Watchlist/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Positions/i })).toBeInTheDocument();
    expect(screen.getByText("Skip to main content")).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
    expect(screen.getByRole("main").parentElement).toHaveClass("relative");
  });

  it("does not crash when localStorage access is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(() => renderLayout()).not.toThrow();
  });

  it("uses button disclosure semantics for the language switcher", () => {
    renderLayout();

    const languageButton = screen.getByRole("button", { name: "Language" });
    expect(languageButton).toHaveAttribute("aria-expanded", "false");
    expect(languageButton).not.toHaveAttribute("aria-haspopup");
  });

  it("synchronizes the sidebar preference from another tab", () => {
    window.localStorage.setItem("qa-sidebar", "expanded");
    renderLayout();
    const sidebar = screen.getByRole("complementary", { name: "Vibe-Trading sidebar" });
    expect(sidebar).toHaveClass("w-64");

    window.localStorage.setItem("qa-sidebar", "collapsed");
    fireEvent(window, new StorageEvent("storage", { key: "qa-sidebar", newValue: "collapsed" }));

    expect(sidebar).toHaveClass("w-12");
  });
});
