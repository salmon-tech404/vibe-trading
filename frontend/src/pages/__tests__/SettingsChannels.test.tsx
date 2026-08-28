import { fireEvent, render, screen } from "@testing-library/react";
import { Settings } from "../Settings";

const apiMock = vi.hoisted(() => ({
  getLLMSettings: vi.fn(),
  getDataSourceSettings: vi.fn(),
  getChannelStatus: vi.fn(),
  listLLMModels: vi.fn(),
  startChannels: vi.fn(),
  stopChannels: vi.fn(),
  updateLLMSettings: vi.fn(),
  updateDataSourceSettings: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: apiMock,
    isAuthRequiredError: vi.fn(() => false),
  };
});

vi.mock("@/lib/apiAuth", () => ({
  getApiAuthKey: vi.fn(() => ""),
  setApiAuthKey: vi.fn(),
}));

function llmSettings() {
  return {
    provider: "gemini",
    model_name: "gemini-2.5-flash",
    base_url: "",
    api_key_env: "GEMINI_API_KEY",
    api_key_configured: false,
    api_key_required: true,
    temperature: 0.2,
    timeout_seconds: 60,
    max_retries: 2,
    reasoning_effort: "medium",
    sse_timeout_seconds: 300,
    env_path: "agent/.env",
    providers: [
      {
        name: "gemini",
        label: "Google Gemini",
        api_key_env: "GEMINI_API_KEY",
        base_url_env: "GEMINI_BASE_URL",
        default_model: "gemini-2.5-flash",
        default_base_url: "",
        api_key_required: true,
        auth_type: "api_key",
      },
    ],
  };
}

describe("Settings Component", () => {
  beforeEach(() => {
    apiMock.getLLMSettings.mockResolvedValue(llmSettings());
    apiMock.getDataSourceSettings.mockResolvedValue({ env_path: "agent/.env" });
    apiMock.getChannelStatus.mockResolvedValue({ running: false, channels: {} });
    apiMock.listLLMModels.mockResolvedValue({
      provider: "gemini",
      models: ["gemini-2.5-flash", "gemini-2.5-pro"],
      source: "default",
    });
  });

  it("renders Settings header and category tabs", async () => {
    render(<Settings />);

    expect(await screen.findByText("System Settings")).toBeInTheDocument();
    expect(screen.getByText("Configuration Categories")).toBeInTheDocument();
    expect(screen.getByText("Binance Futures API")).toBeInTheDocument();
    expect(screen.getByText("AI & LLM Models")).toBeInTheDocument();
    expect(screen.getByText("Risk & Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Trader Profile")).toBeInTheDocument();
    expect(screen.getByText("Interface & Preferences")).toBeInTheDocument();
  });

  it("allows switching between environment modes (Testnet / Live)", async () => {
    render(<Settings />);

    await screen.findByText("System Settings");
    const testnetBtn = screen.getByTitle("Simulated trading environment with test funds on Binance Futures");
    const liveBtn = screen.getByTitle("Real funds trading on Binance Futures mainnet");

    expect(testnetBtn).toBeInTheDocument();
    expect(liveBtn).toBeInTheDocument();

    fireEvent.click(liveBtn);
    expect(liveBtn).toHaveClass("bg-rose-500");

    fireEvent.click(testnetBtn);
    expect(testnetBtn).toHaveClass("bg-emerald-500");
  });

  it("switches to AI & LLM tab and displays AI providers", async () => {
    render(<Settings />);

    const llmTab = await screen.findByText("AI & LLM Models");
    fireEvent.click(llmTab.closest("button")!);

    expect(screen.getByText("Google Gemini")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("DeepSeek AI")).toBeInTheDocument();
    expect(screen.getByText("Anthropic Claude")).toBeInTheDocument();
  });

  it("switches to Risk & Portfolio tab", async () => {
    render(<Settings />);

    const riskTab = await screen.findByText("Risk & Portfolio");
    fireEvent.click(riskTab.closest("button")!);

    expect(screen.getAllByText(/Margin/i).length).toBeGreaterThan(0);
  });

  it("switches to Trader Profile tab", async () => {
    render(<Settings />);

    const profileTab = await screen.findByText("Trader Profile");
    fireEvent.click(profileTab.closest("button")!);

    expect(screen.getByDisplayValue("Alpha Trader")).toBeInTheDocument();
  });
});
