# 🚀 Vibe-Trading: Hệ Thống AI Agent Nghiên Cứu & Giao Dịch Định Lượng Toàn Diện

<p align="center">
  <img src="assets/icon.png" width="120" alt="Vibe-Trading Logo"/>
</p>

<p align="center">
  <b>Nền tảng AI Agent tài chính tự hành: Tích hợp nghiên cứu chuyên sâu, định giá doanh nghiệp, kiểm thử chiến lược (Backtesting), phân tích định lượng (Quantlib) và kết nối sàn giao dịch.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11%2B-3776AB?style=flat&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/MCP-74%2B%20Tools-purple?style=flat" alt="MCP Server">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
</p>

---

## 📑 Mục Lục
1. [Giới Thiệu Tổng Quan](#-giới-thiệu-tổng-quan)
2. [Các Tính Năng Nổi Bật](#-các-tính-năng-nổi-bật)
3. [Kiến Trúc Hệ Thống & Tech Stack](#-kiến-trúc-hệ-thống--tech-stack)
4. [Yêu Cầu Hệ Thống (Prerequisites)](#-yêu-cầu-hệ-thống-prerequisites)
5. [Hướng Dẫn Cài Đặt Chi Tiết](#-hướng-dẫn-cài-đặt-chi-tiết)
   - [Cách 1: Khởi chạy nhanh trên Windows (Khuyên Dùng)](#cách-1-khởi-chạy-nhanh-trên-windows-khuyên-dùng)
   - [Cách 2: Cài đặt thủ công (Windows / macOS / Linux)](#cách-2-cài-đặt-thủ-công-windows--macos--linux)
   - [Cách 3: Chạy bằng Docker & Docker-Compose](#cách-3-chạy-bằng-docker--docker-compose)
6. [Cấu Hình Biến Môi Trường (.env)](#-cấu-hình-biến-môi-trường-env)
7. [Hướng Dẫn Sử Dụng](#-hướng-dẫn-sử-dụng)
   - [Giao diện Web UI](#1-giao-diện-web-ui)
   - [Giao diện Dòng Lệnh (CLI)](#2-giao-diện-dòng-lệnh-cli)
   - [Tích hợp MCP Server (Cursor, Claude Desktop, Antigravity)](#3-tích-hợp-mcp-server-model-context-protocol)
8. [Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
9. [Miễn Trừ Trách Nhiệm (Disclaimer)](#-miễn-trừ-trách-nhiệm-disclaimer)

---

## 🌟 Giới Thiệu Tổng Quan

**Vibe-Trading** là một hệ sinh thái mã nguồn mở kết hợp giữa trí tuệ nhân tạo thế hệ mới (LLM Agents & Multi-Agent Swarm) và kỹ thuật tài chính định lượng chuyên nghiệp (Quantitative Finance).

Hệ thống cho phép bạn tương tác bằng ngôn ngữ tự nhiên để:
- Thu thập và phân tích dữ liệu đa thị trường theo thời gian thực (Cổ phiếu Mỹ, Tiền mã hoá Crypto, Việt Nam HOSE, Trung Quốc A-Share, Hồng Kông HKEX, Hàn Quốc KRX, Canada TSX, Forex/Vàng).
- Thực hiện định giá chuyên sâu (DCF, Multiples/Comps, 3-Statement Modeling).
- Tự động phát hiện và kiểm thử các chiến lược giao dịch (Alpha 101 Factor Zoo, Backtesting Tearsheet với báo cáo trực quan).
- Tùy chọn Options Lab: Mô phỏng Payoff, ma trận độ nhạy Spot × IV, tính toán Greeks (Delta, Gamma, Vega, Theta).
- Giao dịch mô phỏng (Shadow Account) và kết nối API các sàn môi giới (Live Broker Connectors).

---

## ⚡ Các Tính Năng Nổi Bật

### 1. 🤖 Multi-Agent Swarm (Đội Ngũ AI Chuyên Biệt)
- Phối hợp nhiều Agent độc lập (Macro Analyst, Fundamental Screener, Quant Researcher, Risk Manager, Portfolio Optimizer).
- Luồng phối hợp xây dựng trên **LangGraph**, đảm bảo truy xuất dữ liệu có bằng chứng (Grounding Ledger) và chống ảo giác (Hallucination Guardrails).

### 2. 🌐 Hỗ Trợ Đa Thị Trường & Nguồn Dữ Liệu Miễn Phí
- **Cổ phiếu Mỹ (US Equities):** Yahoo Finance, SEC 13F (Institutional Holdings), ETF Look-Through, Báo cáo tài chính FMP/SEC EDGAR.
- **Tiền mã hoá (Crypto):** Hơn 100+ sàn giao dịch qua CCXT (Binance, OKX, Bybit, KuCoin), Orderbook L2 depth, Chỉ số Fear & Greed.
- **Thị trường Việt Nam (HOSE):** Hỗ trợ mã chứng khoán `.VN` với luật khớp lệnh và dữ liệu riêng biệt.
- **Thị trường Quốc tế khác:** Trung Quốc A-share (Tushare, BaoStock, AkShare), Hàn Quốc KRX (PyKRX), Canada TSX, MetaTrader 5 (Forex, Vàng, Hàng hoá).
- **Thị trường dự đoán (Prediction Markets):** Polymarket, Kalshi xác suất ngụ ý.

### 3. 📐 Quantlib (Thư Viện Tài Chính Định Lượng Tích Hợp)
- Hơn 250+ hàm tính toán tài chính chuẩn mực đã được kiểm thử:
  - **Định giá (Valuation):** DCF (Discounted Cash Flow), P/E, EV/EBITDA comps, XIRR, TVPI, DPI.
  - **Quản trị rủi ro:** VaR (Value at Risk), CVaR, Extreme Value Theory (EVT), Maximum Drawdown.
  - **Kinh lượng học (Econometrics):** Kiểm định ADF (Stationarity), Cointegration (Pair Trading), GARCH, Granger Causality.
  - **Chỉ báo kỹ thuật:** RSI, MACD, Bollinger Bands, EMA, SMA, ATR, Volume Profile, SMC (Smart Money Concepts), Harmonic Patterns.

### 4. 📊 Backtesting Chuyên Nghiệp & Tearsheet Trực Quan
- Mô phỏng thực tế chi phí trượt giá (Slippage), phí hoa hồng, thuế giao dịch, độ trễ khớp lệnh (Execution Latency).
- Giao diện trực quan hoá: **Heatmap lợi nhuận theo tháng**, biểu đồ biến động tài sản ròng so với Benchmark (S&P 500, VN-Index), bảng phân rã Top Drawdowns, ma trận tương quan IC (Information Coefficient).

### 5. 🔌 Giao Thức MCP Server (Model Context Protocol)
- Tích hợp sẵn MCP Server cung cấp hơn **74 công cụ định lượng & tài chính** sẵn sàng kết nối trực tiếp với **Claude Desktop**, **Cursor IDE**, **Antigravity**, **OpenBB**.

### 6. 📱 Đa Kênh Thông Báo Tự Động (IM Channels)
- Đẩy tín hiệu và báo cáo định kỳ đến Telegram, Discord, Slack, Feishu, WeChat, DingTalk, WhatsApp, MS Teams.

---

## 🏗 Kiến Trúc Hệ Thống & Tech Stack

```
Vibe-Trading/
├── frontend/               # React 19 + Vite + Tailwind CSS + ECharts UI
│   ├── src/pages/          # Research, Swarm, Backtesting, Options Lab, Dashboard
│   └── src/components/     # UI Components, Charts, Data Tables
│
├── agent/                  # Python Backend & AI Core
│   ├── api_server.py       # FastAPI Server (REST API, SSE Stream, WebSockets)
│   ├── mcp_server.py       # FastMCP Server (74+ Quantitative Tools)
│   ├── src/
│   │   ├── agent/          # LLM Orchestrator & Multi-Provider Engine
│   │   ├── swarm/          # Multi-Agent Workflow (LangGraph)
│   │   ├── quantlib/       # 250+ Quantitative Finance Math Functions
│   │   ├── factors/        # Alpha Zoo 101 & Factor Discovery
│   │   ├── trading/        # Backtest Engine & Broker Adapters
│   │   └── shadow_account/ # Paper Trading & Audit Ledger
│   └── backtest/           # Backtesting Runners & Strategies
│
└── start_all.bat           # File khởi chạy toàn bộ 1-click (Windows)
```

- **Backend:** Python 3.11+, FastAPI, LangChain, LangGraph, DuckDB, Pandas, NumPy, SciPy, Scikit-Learn, FastMCP.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, ECharts, Recharts, KaTeX, i18next (Đa ngôn ngữ).
- **Databases & Cache:** DuckDB, SQLite (Lưu trữ phiên và nhật ký kiểm toán hash-chained an toàn).

---

## 💻 Yêu Cầu Hệ Thống (Prerequisites)

Trước khi cài đặt, vui lòng đảm bảo máy tính đã cài đặt:
1. **Python:** Phiên bản `3.11` hoặc `3.12` ([Tải Python](https://www.python.org/downloads/)) *(Lưu ý: Nhớ tick chọn "Add Python to PATH" khi cài đặt trên Windows)*.
2. **Node.js:** Phiên bản `>= 20.x` hoặc `22.x` ([Tải Node.js LTS](https://nodejs.org/)).
3. **Git:** ([Tải Git](https://git-scm.com/)).
4. *(Tùy chọn)* **API Key của ít nhất 1 nhà cung cấp LLM:** OpenRouter (khuyên dùng để thử nghiệm nhiều model), OpenAI, Anthropic, Gemini, hoặc DeepSeek.

---

## 🛠 Hướng Dẫn Cài Đặt Chi Tiết

### Cách 1: Khởi Chạy Nhanh Trên Windows (Khuyên Dùng)

Dự án đã chuẩn bị sẵn các tệp kịch bản khởi chạy tự động:

1. **Chuẩn bị môi trường Python:**
   Mở terminal tại thư mục gốc của dự án và chạy:
   ```cmd
   python -m venv .venv
   call .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Cấu hình API Key:**
   Tạo file `.env` (hoặc `agent\.env`) từ file mẫu:
   ```cmd
   copy .env.example .env
   ```
   Mở file `.env` và điền API Key LLM của bạn (ví dụ: `OPENROUTER_API_KEY` hoặc `OPENAI_API_KEY`).

3. **Khởi chạy hệ thống 1-Click:**
   Nhấp đúp chuột vào file:
   👉 **`start_all.bat`**

   Hệ thống sẽ tự động mở đồng thời Backend và Frontend:
   - **Backend API:** `http://127.0.0.1:8000` (Tài liệu API: `http://127.0.0.1:8000/docs`)
   - **Frontend Web UI:** `http://localhost:5899` (hoặc `http://localhost:5173`)

---

### Cách 2: Cài Đặt Thủ Công (Windows / macOS / Linux)

#### Bước 1: Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/Vibe-Trading.git
cd Vibe-Trading
```

#### Bước 2: Cài Đặt & Chạy Backend
1. Tạo và kích hoạt môi trường ảo:
   ```bash
   # Linux / macOS:
   python3 -m venv .venv
   source .venv/bin/activate

   # Windows (PowerShell):
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

2. Cài đặt các thư viện phụ thuộc:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. Thiết lập biến môi trường:
   ```bash
   cp .env.example agent/.env
   # Chỉnh sửa agent/.env với API key của bạn
   ```

4. Khởi động Backend Server:
   ```bash
   # Thiết lập PYTHONPATH và chạy
   # Linux / macOS:
   export PYTHONPATH=agent
   python agent/api_server.py

   # Windows (CMD / PowerShell):
   set PYTHONPATH=agent
   python agent/api_server.py
   ```
   *Backend sẽ lắng nghe tại `http://127.0.0.1:8000`.*

#### Bước 3: Cài Đặt & Chạy Frontend Web UI
Mở một cửa sổ Terminal mới:
```bash
cd frontend
npm install
npm run dev
```
*Truy cập Web UI tại địa chỉ hiển thị trên terminal (mặc định: `http://localhost:5899` hoặc `http://localhost:5173`).*

---

### Cách 3: Chạy Bằng Docker & Docker-Compose

Nếu bạn muốn chạy ứng dụng độc lập trong môi trường container:

1. Tạo file `.env` cấu hình API key.
2. Khởi chạy bằng Docker Compose:
   ```bash
   docker-compose up --build
   ```
3. Truy cập giao diện tại `http://localhost:5899`.

---

## ⚙ Cấu Hình Biến Môi Trường (.env)

Tệp `.env` hoặc `agent/.env` cho phép bạn tùy chỉnh nhà cung cấp AI và kết nối dữ liệu:

```ini
# ============================================================================
# CẤU HÌNH LLM (Chọn 1 trong các nhà cung cấp bên dưới)
# ============================================================================

# 1. OpenRouter (Khuyên dùng - hỗ trợ DeepSeek, Claude 3.7, GPT-4o)
LANGCHAIN_PROVIDER=openrouter
LANGCHAIN_MODEL_NAME=deepseek/deepseek-v4-pro
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx

# 2. OpenAI Trực Tiếp
# LANGCHAIN_PROVIDER=openai
# LANGCHAIN_MODEL_NAME=gpt-4o
# OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx

# 3. Anthropic Claude Trực Tiếp
# LANGCHAIN_PROVIDER=anthropic
# LANGCHAIN_MODEL_NAME=claude-3-7-sonnet-20250219
# ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx

# 4. Google Gemini
# LANGCHAIN_PROVIDER=gemini
# LANGCHAIN_MODEL_NAME=gemini-2.5-flash
# GEMINI_API_KEY=xxxxxxxxxxxxxxxxxxxx

# 5. Ollama (Chạy LLM Local Offline)
# LANGCHAIN_PROVIDER=ollama
# LANGCHAIN_MODEL_NAME=llama3.3:latest
# OLLAMA_BASE_URL=http://localhost:11434/v1

# ============================================================================
# CỔNG SERVER & DỮ LIỆU THỊ TRƯỜNG (Tùy chọn)
# ============================================================================
VIBE_TRADING_PORT=8000
VIBE_TRADING_HOST=127.0.0.1
# TUSHARE_TOKEN=your_token_if_trading_ashares
# FMP_API_KEY=your_fmp_key
```

---

## 📖 Hướng Dẫn Sử Dụng

### 1. Giao Diện Web UI
- **Research & Chat:** Đặt câu hỏi nghiên cứu cổ phiếu, ví dụ:
  - *"Phân tích định giá DCF cho mã cổ phiếu AAPL kèm dự phóng doanh thu 5 năm."*
  - *"So sánh chỉ số tài chính giữa NVDA, AMD và INTC."*
  - *"Tình hình dòng tiền và phân tích cơ bản của cổ phiếu VNM trên sàn HOSE."*
- **Swarm Studio:** Kích hoạt nhóm chuyên gia AI đa luồng tự động tổng hợp báo cáo chuyên sâu.
- **Backtesting & Strategy:** Thiết lập tham số chiến lược (vốn ban đầu, kỳ rebalance, stop loss, take profit) và chạy kiểm thử với biểu đồ hiệu suất trực quan.
- **Options Lab:** Khám phá chiến lược quyền chọn (Straddle, Iron Condor, Bull Call Spread) và quan sát ma trận P&L.

---

### 2. Giao Diện Dòng Lệnh (CLI)
Sau khi cài đặt gói hoặc thiết lập môi trường, bạn có thể thực hiện nhanh qua CLI:
```bash
# Khởi động CLI tương tác
python agent/cli/main.py

# Hoặc thực hiện nhanh các lệnh đặc tả:
/dcf AAPL.US         # Chạy mô hình định giá chiết khấu dòng tiền
/comps NVDA.US       # Phân tích định giá so sánh P/E, EV/EBITDA
/screen              # Bộ lọc cổ phiếu theo tiêu chí cơ bản & kỹ thuật
```

---

### 3. Tích Hợp MCP Server (Model Context Protocol)

Vibe-Trading hỗ trợ MCP Server chuẩn mực, cho phép **Cursor**, **Claude Desktop**, hoặc **Antigravity** gọi trực tiếp hơn 74 công cụ tài chính định lượng của dự án.

#### Cấu hình cho Claude Desktop hoặc Cursor (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "vibe-trading": {
      "command": "python",
      "args": [
        "C:/path/to/Vibe-Trading/agent/mcp_server.py"
      ],
      "env": {
        "PYTHONPATH": "C:/path/to/Vibe-Trading/agent",
        "LANGCHAIN_PROVIDER": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-your-key"
      }
    }
  }
}
```

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
Vibe-Trading/
├── .gitignore                   # Danh sách loại trừ file nhạy cảm & cache khi push Git
├── requirements.txt             # Danh sách thư viện Python cốt lõi
├── pyproject.toml               # Cấu hình gói và metadata dự án
├── start_all.bat                # Kịch bản khởi chạy đồng thời Backend + Frontend (Windows)
├── start_backend.bat            # Kịch bản khởi chạy Backend
├── start_frontend.bat           # Kịch bản khởi chạy Frontend
├── docker-compose.yml           # Cấu hình container hóa Docker Compose
├── Dockerfile                   # Dockerfile cho ứng dụng
├── agent/                       # Module Backend & AI Core
│   ├── api_server.py            # FastAPI REST & Streaming Server
│   ├── mcp_server.py            # Model Context Protocol Server (74 Tools)
│   ├── requirements.txt         # Dependencies nội bộ của Agent
│   ├── .env.example             # File mẫu biến môi trường chi tiết
│   ├── src/                     # Mã nguồn logic cốt lõi
│   │   ├── agent/               # Agent LLM engine, prompt templates & tools
│   │   ├── quantlib/            # Thư viện 250+ thuật toán tài chính định lượng
│   │   ├── swarm/               # Luồng tương tác Multi-Agent (LangGraph)
│   │   ├── factors/             # Thư viện nhân tố Alpha Zoo 101
│   │   ├── trading/             # Bộ máy giả lập khớp lệnh & quản lý danh mục
│   │   └── shadow_account/      # Hệ thống giao dịch mô phỏng & xuất báo cáo PDF
│   └── tests/                   # Bộ test unit & integration
├── frontend/                    # Ứng dụng giao diện Web UI
│   ├── package.json             # Cấu hình dependencies Node.js
│   ├── vite.config.ts           # Cấu hình build Vite
│   ├── src/                     # Mã nguồn React 19 + TypeScript
│   │   ├── pages/               # Các trang giao diện (Chat, Backtest, Swarm, Options)
│   │   └── components/          # Các components UI, biểu đồ ECharts/Recharts
│   └── tailwind.config.ts       # Cấu hình giao diện Tailwind CSS
└── assets/                      # Hình ảnh, biểu tượng logo & tư liệu trực quan
```

---

## 🛡 Hướng Dẫn Push Lên GitHub Cá Nhân

Khi đẩy mã nguồn lên GitHub của bạn:
1. Đảm bảo bạn đã kiểm tra `.gitignore` để không bị lộ API key hoặc file dữ liệu lớn.
2. Khởi tạo và đẩy lên GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: Initial commit of Vibe-Trading workspace"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```

---

## ⚠️ Miễn Trừ Trách Nhiệm (Disclaimer)

- **Mục đích giáo dục & nghiên cứu:** Dự án này được thiết kế phục vụ mục đích nghiên cứu công nghệ AI, tài chính định lượng và giáo dục.
- **Không phải lời khuyên tài chính:** Mọi kết quả phân tích, định giá hoặc tín hiệu tạo ra từ AI không cấu thành lời khuyên đầu tư tài chính. Người dùng tự chịu trách nhiệm đối với bất kỳ quyết định giao dịch nào trên thị trường thực tế.
- **Bảo mật API Key:** Tuyệt đối không commit công khai file `.env` hoặc để lộ các API Key riêng tư lên mạng xã hội hoặc repository công khai.

---

<p align="center">
  Được phát triển với ❤️ cho cộng đồng Trading & AI Quantitative Finance.
</p>
