import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  Bot,
  ShieldCheck,
  Check,
  Zap,
  ShieldAlert,
  Coins,
  Trash2,
  User,
  SlidersHorizontal,
  Sliders,
  Palette,
  HelpCircle,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useBinanceFuturesStore } from "@/lib/binanceFuturesStore";
import { testFuturesConnection } from "@/lib/futuresApi";
import { useDarkMode } from "@/hooks/useDarkMode";
import { safeGet, safeSet, safeRemove } from "@/lib/storage";

type SettingsTab = "binance" | "llm" | "risk" | "profile" | "preferences";

interface ModelPreset {
  id: string;
  label: string;
  badge?: string;
}

interface ProviderPreset {
  id: string;
  label: string;
  defaultModel: string;
  models: ModelPreset[];
  iconColor: string;
  bgActive: string;
}

const POPULAR_PROVIDERS: ProviderPreset[] = [
  {
    id: "anthropic",
    label: "Anthropic Claude",
    defaultModel: "claude-3-7-sonnet-latest",
    models: [
      { id: "claude-3-7-sonnet-latest", label: "Claude 3.7 Sonnet", badge: "Hybrid Reasoning — Mới nhất" },
      { id: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet", badge: "Đỉnh cao phân tích & Code" },
      { id: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku", badge: "Siêu tốc độ & Tiết kiệm chi phí" },
      { id: "claude-3-opus-latest", label: "Claude 3 Opus", badge: "Mô hình tính toán phức tạp" },
    ],
    iconColor: "text-amber-500",
    bgActive: "border-amber-500/50 bg-amber-500/10",
  },
  {
    id: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", label: "GPT-4o (Omni)", badge: "Flagship Đa phương thức" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini", badge: "Nhanh & Tối ưu chi phí" },
      { id: "o3-mini", label: "o3-mini (Reasoning)", badge: "Lập luận định lượng & STEM" },
      { id: "o1", label: "o1 (High Reasoning)", badge: "Lập luận sâu chuyên gia" },
      { id: "o1-mini", label: "o1-mini", badge: "Toán học tốc độ cao" },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo", badge: "Chính xác cao" },
    ],
    iconColor: "text-emerald-500",
    bgActive: "border-emerald-500/50 bg-emerald-500/10",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
    models: [
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Tối ưu tốc độ thời gian thực" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", badge: "Lập luận định lượng sâu" },
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", badge: "Xử lý đa luồng song song" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", badge: "Ngữ cảnh siêu dài 2M tokens" },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", badge: "Nhẹ & Nhanh" },
    ],
    iconColor: "text-blue-500",
    bgActive: "border-blue-500/50 bg-blue-500/10",
  },
  {
    id: "deepseek",
    label: "DeepSeek AI",
    defaultModel: "deepseek-chat",
    models: [
      { id: "deepseek-chat", label: "DeepSeek V3 (Chat)", badge: "Tốc độ cao & Chi phí tối ưu" },
      { id: "deepseek-reasoner", label: "DeepSeek R1 (Reasoner)", badge: "Tư duy chuỗi & Toán học cao cấp" },
    ],
    iconColor: "text-cyan-500",
    bgActive: "border-cyan-500/50 bg-cyan-500/10",
  },
];

export function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>("binance");
  const { dark, toggle } = useDarkMode();

  // LLM Store states
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(false);
  const [savingBotLLM, setSavingBotLLM] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Provider Keys map stored in local storage
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>(() => ({
    gemini: safeGet("qa-llm-key-gemini") || "",
    openai: safeGet("qa-llm-key-openai") || "",
    anthropic: safeGet("qa-llm-key-anthropic") || "",
    deepseek: safeGet("qa-llm-key-deepseek") || "",
  }));

  // Selected Provider for Editing Key (Phase 1)
  const [editingProviderId, setEditingProviderId] = useState("anthropic");
  const [currentKeyInput, setCurrentKeyInput] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");

  // Selected Provider & Model for Trading Bot (Phase 2)
  const [botProvider, setBotProvider] = useState(() => safeGet("qa-bot-llm-provider") || "anthropic");
  const [botModel, setBotModel] = useState(() => safeGet("qa-bot-llm-model") || "claude-3-7-sonnet-latest");
  const [botTemperature, setBotTemperature] = useState(0.2);
  const [botTimeout, setBotTimeout] = useState(60);
  const [botReasoningEffort, setBotReasoningEffort] = useState("medium");
  const [botStrategyMode, setBotStrategyMode] = useState<"scalping" | "trend_swing">(
    () => (safeGet("qa-bot-strategy-mode") as any) || "scalping"
  );

  const [backendConfigured, setBackendConfigured] = useState(false);

  // Profile preferences
  const [traderName, setTraderName] = useState(() => safeGet("qa-trader-name") || "Alpha Trader");
  const [soundEnabled, setSoundEnabled] = useState(() => safeGet("qa-sound") !== "disabled");

  // Binance Futures Store states with independent environments
  const {
    activeMode,
    testnet,
    mainnet,
    marginPerTradeUsd,
    maxOpenPositions,
    defaultLeverage,
    minSetupScore,
    setActiveMode,
    setCredentials,
    clearCredentials,
    setAutoTradingConfig,
    syncAccountData,
  } = useBinanceFuturesStore();

  const currentModeConfig = activeMode === "testnet" ? testnet : mainnet;

  const [inputKey, setInputKey] = useState(currentModeConfig.apiKey);
  const [inputSecret, setInputSecret] = useState(currentModeConfig.apiSecret);
  const [showSecret, setShowSecret] = useState(false);
  const [testingBinance, setTestingBinance] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    balance: number;
    available: number;
    msg?: string;
  } | null>(null);

  // Risk parameters local state
  const [riskMargin, setRiskMargin] = useState(marginPerTradeUsd);
  const [riskLeverage, setRiskLeverage] = useState(defaultLeverage);
  const [riskMaxPos, setRiskMaxPos] = useState(maxOpenPositions);
  const [riskMinScore, setRiskMinScore] = useState(minSetupScore);

  // Sync inputs when activeMode switches
  useEffect(() => {
    const cfg = activeMode === "testnet" ? testnet : mainnet;
    setInputKey(cfg.apiKey);
    setInputSecret(cfg.apiSecret);
    setTestResult(null);
  }, [activeMode, testnet.apiKey, testnet.apiSecret, mainnet.apiKey, mainnet.apiSecret]);

  // Load current LLM settings
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await api.getLLMSettings();
        if (data.api_key_configured) {
          setBackendConfigured(true);
        }
        if (data.provider) {
          setEditingProviderId(data.provider);
          if (!safeGet("qa-bot-llm-provider")) {
            setBotProvider(data.provider);
          }
        }
        if (data.model_name && !safeGet("qa-bot-llm-model")) {
          setBotModel(data.model_name);
        }
        if (data.temperature !== undefined) {
          setBotTemperature(data.temperature);
        }
        if (data.timeout_seconds !== undefined) {
          setBotTimeout(data.timeout_seconds);
        }
        if (data.reasoning_effort) {
          setBotReasoningEffort(data.reasoning_effort);
        }
      } catch (err: any) {
        console.warn("Không thể tải cấu hình backend LLM:", err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const activeEditingPreset = useMemo(() => {
    return POPULAR_PROVIDERS.find((p) => p.id === editingProviderId) || POPULAR_PROVIDERS[0];
  }, [editingProviderId]);

  const activeBotPreset = useMemo(() => {
    return POPULAR_PROVIDERS.find((p) => p.id === botProvider) || POPULAR_PROVIDERS[0];
  }, [botProvider]);

  // Check if at least one API key is added
  const hasAnyKey = useMemo(() => {
    return (
      Boolean(providerKeys.anthropic?.trim()) ||
      Boolean(providerKeys.openai?.trim()) ||
      Boolean(providerKeys.gemini?.trim()) ||
      Boolean(providerKeys.deepseek?.trim()) ||
      backendConfigured
    );
  }, [providerKeys, backendConfigured]);

  const handleSelectEditingProvider = (preset: ProviderPreset) => {
    setEditingProviderId(preset.id);
    setCurrentKeyInput(providerKeys[preset.id] || "");
    setCustomBaseUrl("");
  };

  // Phase 1: Save API Key for a Provider
  const handleSaveProviderKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentKeyInput.trim()) {
      toast.error(`Vui lòng nhập API Key cho ${activeEditingPreset.label}.`);
      return;
    }
    setSavingKey(true);
    try {
      const trimmed = currentKeyInput.trim();
      safeSet(`qa-llm-key-${editingProviderId}`, trimmed);
      setProviderKeys((prev) => ({ ...prev, [editingProviderId]: trimmed }));

      // Sync with backend
      await api.updateLLMSettings({
        provider: editingProviderId,
        model_name: activeEditingPreset.defaultModel,
        base_url: customBaseUrl.trim() || "",
        api_key: trimmed,
        temperature: botTemperature,
        timeout_seconds: botTimeout,
        max_retries: 2,
        reasoning_effort: botReasoningEffort,
      });

      // If current botProvider has no key, switch botProvider to this newly configured provider
      if (!providerKeys[botProvider]?.trim()) {
        setBotProvider(editingProviderId);
        setBotModel(activeEditingPreset.defaultModel);
        safeSet("qa-bot-llm-provider", editingProviderId);
        safeSet("qa-bot-llm-model", activeEditingPreset.defaultModel);
      }

      setBackendConfigured(true);
      toast.success(`Đã lưu API Key của ${activeEditingPreset.label} thành công! Phần chọn mô hình Trading Bot đã sẵn sàng.`);
    } catch (err: any) {
      toast.error("Lỗi khi lưu API Key: " + err.message);
    } finally {
      setSavingKey(false);
    }
  };

  // Phase 1: Clear API Key for a Provider
  const handleClearProviderKey = async (provId: string) => {
    safeRemove(`qa-llm-key-${provId}`);
    setProviderKeys((prev) => ({ ...prev, [provId]: "" }));
    if (editingProviderId === provId) {
      setCurrentKeyInput("");
    }
    try {
      await api.updateLLMSettings({
        provider: provId,
        model_name: POPULAR_PROVIDERS.find((p) => p.id === provId)?.defaultModel || "",
        base_url: "",
        clear_api_key: true,
        temperature: 0.2,
        timeout_seconds: 60,
        max_retries: 2,
      });
    } catch {
      // ignore
    }
    toast.info(`Đã xóa API Key của ${POPULAR_PROVIDERS.find((p) => p.id === provId)?.label || provId}.`);
  };

  // Phase 2: Save Active Model Selection for Trading Bot
  const handleSaveBotLLM = async (e: FormEvent) => {
    e.preventDefault();
    setSavingBotLLM(true);
    try {
      safeSet("qa-bot-llm-provider", botProvider);
      safeSet("qa-bot-llm-model", botModel);
      safeSet("qa-bot-strategy-mode", botStrategyMode);
      safeSet("qa-bot-llm-temperature", String(botTemperature));
      safeSet("qa-bot-llm-reasoning", botReasoningEffort);

      const activeKey = providerKeys[botProvider] || undefined;
      await api.updateLLMSettings({
        provider: botProvider,
        model_name: botModel,
        base_url: "",
        api_key: activeKey,
        temperature: botTemperature,
        timeout_seconds: botTimeout,
        max_retries: 2,
        reasoning_effort: botReasoningEffort,
      });

      const stratLabel = botStrategyMode === "scalping" ? "Scalping (Lướt Sóng)" : "Multi-TP Trend (Xu Hướng)";
      toast.success(`Đã kích hoạt mô hình ${botModel} & Chiến lược ${stratLabel} cho Trading Bot!`);
      window.dispatchEvent(new Event("qa-bot-llm-updated"));
    } catch (err: any) {
      toast.error("Lỗi khi kích hoạt mô hình: " + err.message);
    } finally {
      setSavingBotLLM(false);
    }
  };

  // Binance Futures Connection Test & Save
  const handleTestAndSaveBinance = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim() || !inputSecret.trim()) {
      toast.error(`Vui lòng nhập đầy đủ API Key và API Secret cho môi trường ${activeMode.toUpperCase()}.`);
      return;
    }

    setTestingBinance(true);
    setTestResult(null);
    const isTest = activeMode === "testnet";

    try {
      const res = await testFuturesConnection(inputKey, inputSecret, isTest);
      setCredentials(inputKey, inputSecret, activeMode);
      setTestResult({
        success: true,
        balance: res.totalBalance,
        available: res.availableBalance,
      });
      await syncAccountData();
      toast.success(
        `Kết nối Binance Futures ${isTest ? "Testnet (Demo)" : "Mainnet (Tiền thật)"} thành công! Số dư: $${res.totalBalance.toFixed(2)} USDT`
      );
    } catch (err: any) {
      setTestResult({
        success: false,
        balance: 0,
        available: 0,
        msg: err.message,
      });
      toast.error(`Lỗi kết nối Binance ${activeMode.toUpperCase()}: ${err.message}`);
    } finally {
      setTestingBinance(false);
    }
  };

  const handleClearBinance = () => {
    clearCredentials(activeMode);
    setInputKey("");
    setInputSecret("");
    setTestResult(null);
    toast.info(`Đã xóa thông tin API Key của môi trường ${activeMode.toUpperCase()}.`);
  };

  const handleSaveRisk = (e: FormEvent) => {
    e.preventDefault();
    setAutoTradingConfig({
      marginPerTradeUsd: riskMargin,
      defaultLeverage: riskLeverage,
      maxOpenPositions: riskMaxPos,
      minSetupScore: riskMinScore,
    });
    toast.success("Đã cập nhật thông số quản lý rủi ro và Bot Sentinel!");
  };

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    safeSet("qa-trader-name", traderName);
    safeSet("qa-sound", soundEnabled ? "enabled" : "disabled");
    toast.success("Đã lưu thông tin hồ sơ và tùy chọn!");
  };

  const TABS: { id: SettingsTab; label: string; icon: typeof Coins; desc: string }[] = useMemo(() => [
    {
      id: "binance",
      label: t("settings.binanceTab"),
      icon: Coins,
      desc: t("settings.binanceDesc"),
    },
    {
      id: "llm",
      label: t("settings.llmTab"),
      icon: Bot,
      desc: t("settings.llmDesc"),
    },
    {
      id: "risk",
      label: t("settings.riskTab"),
      icon: Sliders,
      desc: t("settings.riskDesc"),
    },
    {
      id: "profile",
      label: t("settings.profileTab"),
      icon: User,
      desc: t("settings.profileDesc"),
    },
    {
      id: "preferences",
      label: t("settings.preferencesTab"),
      icon: Palette,
      desc: t("settings.preferencesDesc"),
    },
  ], [t]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground font-mono text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-primary" />
        Đang nạp cấu hình hệ thống...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          {t("settings.title")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1 font-normal">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Main Settings Container with Category Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Categorized Navigation Tabs */}
        <div className="lg:col-span-4 space-y-1.5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-3 py-1">
            {t("settings.categories")}
          </div>

          <div className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                    isActive
                      ? "bg-card border-primary/40 shadow-xs text-foreground"
                      : "bg-card/40 border-border/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className={`text-xs ${isActive ? "font-semibold text-foreground" : "font-medium"}`}>
                        {tab.label}
                      </div>
                      <div className="text-[10.5px] text-muted-foreground font-normal truncate mt-0.5">
                        {tab.desc}
                      </div>
                    </div>
                  </div>
                  {isActive && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Quick Help Card */}
          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 text-xs space-y-2 mt-4">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              <span>{t("settings.needHelp")}</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-normal leading-relaxed">
              {t("settings.helpDesc")}
            </p>
          </div>
        </div>

        {/* Right Column: Tab Content Panel */}
        <div className="lg:col-span-8 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: BINANCE FUTURES API */}
          {/* ========================================================================= */}
          {activeTab === "binance" && (
            <div className="p-5 rounded-2xl border bg-card/80 backdrop-blur space-y-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                      <span>BINANCE USD-M FUTURES API</span>
                      {currentModeConfig.isConfigured && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                          activeMode === "testnet"
                            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
                            : "bg-rose-500/15 border border-rose-500/30 text-rose-500"
                        }`}>
                          {t("bot.connected")} ({activeMode.toUpperCase()})
                        </span>
                      )}
                    </h2>
                    <p className="text-[11px] text-muted-foreground font-normal">
                      {activeMode === "testnet"
                        ? t("order.testnetTooltip")
                        : t("order.mainnetTooltip")}
                    </p>
                  </div>
                </div>

                {/* 2 PROMINENT BUTTONS: TESTNET VS LIVE WITH TOOLTIPS */}
                {/* 2 PROMINENT BUTTONS: TESTNET VS LIVE WITH TOOLTIPS */}
                <div className="grid grid-cols-2 w-[280px] bg-muted/80 p-1 rounded-xl border text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveMode("testnet")}
                    title={t("order.testnetTooltip")}
                    className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg transition-colors cursor-pointer select-none ${
                      activeMode === "testnet"
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>{t("order.testnetMode")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode("mainnet")}
                    title={t("order.mainnetTooltip")}
                    className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg transition-colors cursor-pointer select-none ${
                      activeMode === "mainnet"
                        ? "bg-rose-500 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span>{t("order.liveMode")}</span>
                  </button>
                </div>
              </div>

              {/* Security Alert Banner */}
              <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                activeMode === "testnet"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-500"
              }`}>
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold">
                    {activeMode === "testnet"
                      ? "Môi Trường Testnet Sandbox (An Toàn 100%):"
                      : "Môi Trường Mainnet (Tiền Thật — Lưu Ý Bảo Mật):"}
                  </span>
                  <p className="text-muted-foreground text-[11px] font-normal leading-relaxed">
                    {activeMode === "testnet"
                      ? "Lấy API Key miễn phí từ testnet.binancefuture.com để thử nghiệm toàn bộ tính năng mà không có bất kỳ rủi ro nào."
                      : "Khi tạo API Key trên Binance.com, chỉ tích chọn Enable Futures. TUYỆT ĐỐI KHÔNG BẬT Enable Withdrawals (Rút tiền)."}
                  </p>
                </div>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handleTestAndSaveBinance} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* API Key */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Binance {activeMode === "testnet" ? "Testnet" : "Mainnet"} API Key
                    </label>
                    <input
                      type="text"
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder={
                        activeMode === "testnet"
                          ? "Nhập API Key từ testnet.binancefuture.com..."
                          : "Nhập API Key từ binance.com (Mainnet)..."
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-mono focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  {/* API Secret */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Binance {activeMode === "testnet" ? "Testnet" : "Mainnet"} API Secret
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-mono cursor-pointer"
                      >
                        {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showSecret ? "Ẩn" : "Hiện"}
                      </button>
                    </div>
                    <input
                      type={showSecret ? "text" : "password"}
                      value={inputSecret}
                      onChange={(e) => setInputSecret(e.target.value)}
                      placeholder={
                        activeMode === "testnet"
                          ? "Nhập API Secret từ testnet.binancefuture.com..."
                          : "Nhập API Secret từ binance.com (Mainnet)..."
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-mono focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                {/* Test Status & Balance Strip */}
                {(testResult || currentModeConfig.isConfigured) && (
                  <div className="p-3.5 rounded-xl border bg-background flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>
                        Trạng thái: <b className="text-emerald-500 font-semibold">Đã xác thực hợp lệ</b> ({activeMode.toUpperCase()})
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span>
                        Số Dư Ví: <b className="text-foreground font-semibold">${(testResult?.balance ?? currentModeConfig.liveBalance).toFixed(2)} USDT</b>
                      </span>
                      <span>
                        Khả Dụng: <b className="text-emerald-500 font-semibold">${(testResult?.available ?? currentModeConfig.availableBalance).toFixed(2)} USDT</b>
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-between">
                  {currentModeConfig.isConfigured ? (
                    <button
                      type="button"
                      onClick={handleClearBinance}
                      className="px-3 py-1.5 rounded-lg border text-xs text-rose-500 hover:bg-rose-500/10 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa Key Môi Trường {activeMode.toUpperCase()}</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    type="submit"
                    disabled={testingBinance}
                    className={`px-5 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                      activeMode === "testnet"
                        ? "bg-emerald-500 text-white shadow-emerald-500/20"
                        : "bg-amber-500 text-slate-950 shadow-amber-500/20"
                    }`}
                  >
                    {testingBinance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    <span>Lưu & Kiểm Tra Key {activeMode.toUpperCase()}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: AI & LLM MODELS (UNIFIED COMPACT UI) */}
          {/* ========================================================================= */}
          {activeTab === "llm" && (
            <div className="p-5 rounded-2xl border bg-card/80 backdrop-blur space-y-5 shadow-xs">
              {/* Card Header */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {t("settings.llmTitle")}
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-normal">
                    {t("settings.llmSubtitle")}
                  </p>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* PHẦN 1: QUẢN LÝ KHÓA API NHÀ CUNG CẤP */}
              {/* ===================================================================== */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t("settings.manageApiKeys")}</span>
                  </div>
                  <span className="text-[10.5px] font-mono text-muted-foreground">
                    {Object.values(providerKeys).filter(Boolean).length} / {POPULAR_PROVIDERS.length} {t("settings.configured")}
                  </span>
                </div>

                {/* 4 Provider Selector Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {POPULAR_PROVIDERS.map((preset) => {
                    const isSelected = editingProviderId === preset.id;
                    const hasKey = Boolean(providerKeys[preset.id]?.trim());

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectEditingProvider(preset)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 border-primary text-primary font-semibold shadow-xs"
                            : "bg-background/80 hover:bg-muted/60 border-border/70 text-muted-foreground"
                        }`}
                      >
                        <span className="text-xs font-semibold">{preset.label}</span>
                        {hasKey && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Dropdown Chọn Model Mặc Định */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    {t("settings.defaultModelFor")} {activeEditingPreset.label}
                  </label>
                  <select
                    value={activeEditingPreset.defaultModel}
                    onChange={(e) => {
                      setBotModel(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-mono outline-none focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
                  >
                    {activeEditingPreset.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} {m.badge ? `— (${m.badge})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ô Nhập API Key */}
                <form onSubmit={handleSaveProviderKey} className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        {activeEditingPreset.label} API Key
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer font-mono"
                      >
                        {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showApiKey ? t("common.hide", "Ẩn") : t("common.show", "Hiện")}</span>
                      </button>
                    </div>
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={currentKeyInput}
                      onChange={(e) => setCurrentKeyInput(e.target.value)}
                      placeholder={`Nhập ${activeEditingPreset.label} API Key...`}
                      className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-mono focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {providerKeys[editingProviderId]?.trim() ? (
                      <button
                        type="button"
                        onClick={() => handleClearProviderKey(editingProviderId)}
                        className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t("settings.deleteKey")}</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <button
                      type="submit"
                      disabled={savingKey}
                      className="px-4 py-2 rounded-xl bg-foreground text-background hover:opacity-90 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {savingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{t("settings.saveApiKey")}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Đường Kẻ Phân Cách Tinh Tế */}
              <div className="border-t border-border/70 my-2" />

              {/* ===================================================================== */}
              {/* PHẦN 2: CHỌN LLM & CHIẾN LƯỢC DÀNH CHO TRADING BOT */}
              {/* (Tự động mờ / Inactive khi chưa có bất kỳ API Key nào) */}
              {/* ===================================================================== */}
              <div className={`space-y-3.5 transition-all duration-300 ${!hasAnyKey ? "opacity-40 pointer-events-none select-none" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                    <span>{t("settings.selectBotLlm")}</span>
                  </div>
                  {hasAnyKey && (
                    <span className="text-[10.5px] font-mono text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {t("settings.ready")}
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveBotLLM} className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* CỘT TRÁI (col-span-12 lg:col-span-6): DROPDOWN CHỌN LLM & RADIO BUTTONS MODEL */}
                    <div className="lg:col-span-6 space-y-3">
                      {/* Dropdown Chọn Nhà Cung Cấp LLM */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                          <span>Chọn Nhà Cung Cấp LLM (Provider):</span>
                        </label>
                        <select
                          value={botProvider}
                          onChange={(e) => {
                            const provId = e.target.value;
                            setBotProvider(provId);
                            const preset = POPULAR_PROVIDERS.find((p) => p.id === provId);
                            if (preset) {
                              setBotModel(preset.defaultModel);
                            }
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-medium text-foreground outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                          {POPULAR_PROVIDERS.map((p) => {
                            const hasKey = Boolean(providerKeys[p.id]?.trim());
                            return (
                              <option key={p.id} value={p.id} disabled={!hasKey}>
                                {p.label} {hasKey ? "✓ (Đã có Key)" : "— (Chưa có Key)"}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Danh Sách Model Dạng Radio Button */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-medium text-muted-foreground">
                            <span>Danh Sách Mô Hình (Model) của {activeBotPreset.label}:</span>
                          </label>
                          <span className="text-[10px] font-mono text-primary font-bold">
                            {activeBotPreset.models.length} Models
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {activeBotPreset.models.map((m) => {
                            const isSelected = botModel === m.id;

                            return (
                              <label
                                key={m.id}
                                onClick={() => setBotModel(m.id)}
                                className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                                  isSelected
                                    ? "bg-primary/10 border-primary/60 text-primary font-semibold ring-1 ring-primary/30 shadow-xs"
                                    : "bg-background/70 hover:bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {/* Lucide Radio Circle Indicator */}
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/60"
                                  }`}>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                                  </div>
                                  <div className="truncate">
                                    <span className="text-xs font-mono">{m.label}</span>
                                    {m.badge && (
                                      <span className="text-[10px] text-muted-foreground font-sans font-normal ml-1.5">
                                        — {m.badge}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* CỘT PHẢI (col-span-12 lg:col-span-6): CHỌN CHIẾN LƯỢC TRADING & GIẢI THÍCH */}
                    <div className="lg:col-span-6 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t("settings.selectBotStrategy")}</span>
                        </label>
                        <p className="text-[10.5px] text-muted-foreground">
                          Chọn phương pháp quản trị vị thế và thuật toán phân tích vào/ra lệnh:
                        </p>
                      </div>

                      {/* 2 Big Strategy Cards */}
                      <div className="space-y-2">
                        {/* Scalping Card */}
                        <div
                          onClick={() => setBotStrategyMode("scalping")}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2.5 ${
                            botStrategyMode === "scalping"
                              ? "bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30 text-foreground shadow-xs"
                              : "bg-background/70 hover:bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-foreground flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                <span>Chiến Lược Scalping (Scalping Lướt Sóng Siêu Tốc)</span>
                              </span>
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30 font-semibold font-mono">
                                Fast In/Out
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              Mô tả ngắn: Fast In/Out - 1 Target Exit.
                            </p>
                          </div>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            botStrategyMode === "scalping" ? "border-amber-500 bg-amber-500 text-white" : "border-muted-foreground/60"
                          }`}>
                            {botStrategyMode === "scalping" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>

                        {/* Multi-TP Trend Card */}
                        <div
                          onClick={() => setBotStrategyMode("trend_swing")}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2.5 ${
                            botStrategyMode === "trend_swing"
                              ? "bg-primary/10 border-primary/60 ring-1 ring-primary/30 text-foreground shadow-xs"
                              : "bg-background/70 hover:bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-foreground flex items-center gap-1">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                                <span>Chiến Lược Multi-TP (Multi-TP Theo Xu Hướng / Trend Swing)</span>
                              </span>
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-primary/15 text-primary border border-primary/30 font-semibold font-mono">
                                Multi-Target
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              Mô tả ngắn: Multi-Target TP & Trailing Stop.
                            </p>
                          </div>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            botStrategyMode === "trend_swing" ? "border-primary bg-primary text-white" : "border-muted-foreground/60"
                          }`}>
                            {botStrategyMode === "trend_swing" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>

                      {/* Real-time Dynamic Explanation Box */}
                      <div className="p-3 rounded-xl border bg-muted/40 border-border/60 text-xs space-y-1">
                        <span className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Dòng giải thích nguyên lý hoạt động:</span>
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {botStrategyMode === "scalping"
                            ? "Chốt lời nhanh 1 mục tiêu (1.0×ATR), đóng lệnh dứt khoát trong 5–15 phút để bảo toàn lợi nhuận và xoay vòng vốn nhanh."
                            : "Chốt lời 3 nấc TP1 (50%), TP2 (30%), TP3 (20%), tự động kích hoạt dời Stop Loss về hòa vốn khi chạm TP1 và gồng lãi theo sóng xu hướng."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar Bottom Strip */}
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/60">
                    <div className="text-[11px] font-mono flex flex-wrap items-center gap-3">
                      <span>
                        {t("settings.activeModelLabel")} <b className="text-primary font-semibold">{botModel}</b>
                      </span>
                      <span>
                        {t("settings.activeStrategyLabel")} <b className="text-amber-500 font-semibold">
                          {botStrategyMode === "scalping" ? "Scalping Lướt Sóng" : "Multi-TP Xu Hướng"}
                        </b>
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={savingBotLLM}
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
                    >
                      {savingBotLLM ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      <span>{t("settings.activateBotStrategyAndModel")}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: RISK MANAGEMENT & BOT SENTINEL */}
          {/* ========================================================================= */}
          {activeTab === "risk" && (
            <div className="p-5 rounded-2xl border bg-card/80 backdrop-blur space-y-5 shadow-xs">
              <div className="border-b pb-4">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  <span>QUẢN TRỊ RỦI RO & THÔNG SỐ BOT SENTINEL</span>
                </h2>
                <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                  Thiết lập các ngưỡng quản lý vốn mặc định cho 1-Click Execution và Bot Auto-Trading tự động.
                </p>
              </div>

              <form onSubmit={handleSaveRisk} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Margin per trade */}
                  <div className="space-y-1.5 p-3.5 rounded-xl border bg-background">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>Vốn Cố Định / Lệnh (Margin USD)</span>
                      <span className="text-[11px] text-primary font-mono">${riskMargin} USDT</span>
                    </label>
                    <p className="text-[10.5px] text-muted-foreground font-normal">
                      Số tiền Margin trích từ ví để mở mỗi vị thế mới.
                    </p>
                    <input
                      type="number"
                      min="5"
                      max="10000"
                      value={riskMargin}
                      onChange={(e) => setRiskMargin(parseFloat(e.target.value) || 10)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border bg-background font-mono outline-none"
                    />
                  </div>

                  {/* Default Leverage */}
                  <div className="space-y-1.5 p-3.5 rounded-xl border bg-background">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>Đòn Bẩy Mặc Định</span>
                      <span className="text-[11px] text-primary font-mono">{riskLeverage}x</span>
                    </label>
                    <p className="text-[10.5px] text-muted-foreground font-normal">
                      Đòn bẩy Isolated Margin áp dụng cho lệnh tự động.
                    </p>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={riskLeverage}
                      onChange={(e) => setRiskLeverage(parseInt(e.target.value, 10) || 10)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border bg-background font-mono outline-none"
                    />
                  </div>

                  {/* Max Open Positions */}
                  <div className="space-y-1.5 p-3.5 rounded-xl border bg-background">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>Số Vị Thế Tối Đa Cùng Lúc</span>
                      <span className="text-[11px] text-primary font-mono">{riskMaxPos} vị thế</span>
                    </label>
                    <p className="text-[10.5px] text-muted-foreground font-normal">
                      Bot sẽ không vào thêm lệnh mới nếu đã chạm ngưỡng này.
                    </p>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={riskMaxPos}
                      onChange={(e) => setRiskMaxPos(parseInt(e.target.value, 10) || 2)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border bg-background font-mono outline-none"
                    />
                  </div>

                  {/* Minimum Setup Score */}
                  <div className="space-y-1.5 p-3.5 rounded-xl border bg-background">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>Điểm Setup Tối Thiểu (Score 0-100)</span>
                      <span className="text-[11px] text-primary font-mono">≥ {riskMinScore}đ</span>
                    </label>
                    <p className="text-[10.5px] text-muted-foreground font-normal">
                      Ngưỡng điểm chất lượng tín hiệu tối thiểu để Bot kích hoạt lệnh.
                    </p>
                    <input
                      type="number"
                      min="60"
                      max="95"
                      value={riskMinScore}
                      onChange={(e) => setRiskMinScore(parseInt(e.target.value, 10) || 80)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border bg-background font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Cấu Hình Quản Trị Rủi Ro</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: TRADER PROFILE */}
          {/* ========================================================================= */}
          {activeTab === "profile" && (
            <div className="p-5 rounded-2xl border bg-card/80 backdrop-blur space-y-5 shadow-xs">
              <div className="border-b pb-4">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span>HỒ SƠ & THÔNG TIN TRADER</span>
                </h2>
                <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                  Tùy chỉnh định danh hiển thị trên báo cáo hiệu suất và nhật ký giao dịch.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Tên / Biệt Hiệu Trader</label>
                  <input
                    type="text"
                    value={traderName}
                    onChange={(e) => setTraderName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-medium outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="p-3.5 rounded-xl border bg-background text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hạng Tài Khoản:</span>
                    <span className="font-semibold text-primary font-mono">QUANT PRO VIP</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Thuật Toán Tín Hiệu:</span>
                    <span className="font-semibold text-foreground font-mono">4-Tier Exit Engine v2.4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Engine Status:</span>
                    <span className="font-semibold text-emerald-500 font-mono">Operational (0ms latency)</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Hồ Sơ</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: PREFERENCES */}
          {/* ========================================================================= */}
          {activeTab === "preferences" && (
            <div className="p-5 rounded-2xl border bg-card/80 backdrop-blur space-y-5 shadow-xs">
              <div className="border-b pb-4">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <span>TÙY CHỌN GIAO DIỆN & HỆ THỐNG</span>
                </h2>
                <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                  Tùy chỉnh trải nghiệm hình ảnh, âm thanh và phương thức hiển thị dữ liệu.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Theme Selector */}
                <div className="p-3.5 rounded-xl border bg-background flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">Giao Diện Hệ Thống</div>
                    <div className="text-[11px] text-muted-foreground font-normal">Chuyển đổi giữa chế độ Dark Mode và Light Mode.</div>
                  </div>
                  <button
                    type="button"
                    onClick={toggle}
                    className="px-3.5 py-1.5 rounded-lg border bg-muted/60 hover:bg-muted font-medium transition cursor-pointer"
                  >
                    {dark ? "Chế Độ Tối (Binance Dark)" : "Chế Độ Sáng (Clean Light)"}
                  </button>
                </div>

                {/* Sound Notification */}
                <div className="p-3.5 rounded-xl border bg-background flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">Âm Thanh Cảnh Báo Tín Hiệu</div>
                    <div className="text-[11px] text-muted-foreground font-normal">Phát chuông thông báo khi phát hiện Setup ≥ 80 điểm.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      safeSet("qa-sound", next ? "enabled" : "disabled");
                      toast.success(next ? "Đã bật âm thanh cảnh báo." : "Đã tắt âm thanh cảnh báo.");
                    }}
                    className={`px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                      soundEnabled ? "bg-primary text-primary-foreground" : "border bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {soundEnabled ? "Đang Bật" : "Đang Tắt"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
