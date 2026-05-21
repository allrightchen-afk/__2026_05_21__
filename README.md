# AI 數據分析與洞察工具 (AI Data Analysis & Insights Tool)

這是一個強大的數據分析與洞察工具。使用者只需貼上 CSV 格式的數據報表，系統即會透過 Gemini AI 即時進行深度分析，並自動生成排版美觀的 Markdown 洞察報告、關鍵 KPI 指標卡片以及動態趨勢圖表。

## 核心功能

- 📊 **CSV 數據解析**：快速讀取與結構化使用者提供的 CSV 資料。
- 🤖 **Gemini 智慧分析**：運用 Google Gemini 模型，自動解讀數值趨勢、偵測異常值與發掘潛在商業規律。
- 📈 **關鍵指標提取**：自動歸納出最核心的 4 個數據摘要指標（KPI 卡片）。
- 📉 **動態視覺圖表**：智慧推薦並繪製最適合該數據集的趨勢圖表（折線圖、條形圖或圓餅圖）。
- 📝 **專業 Markdown 報告**：產出排版明晰、極具實操價值的商業分析報告與行動指南。

## 本地開發與運行

### 前提條件

- **Node.js** (建議 v18 以上版本)

### 步驟說明

1. **安裝依賴套件**：
   ```bash
   npm install
   ```

2. **設定環境變數**：
   - 複製 `.env.example` 並命名為 `.env`（或 `.env.local`）
   - 在其中填入您的 Gemini API Key：
     ```env
     GEMINI_API_KEY="您的_GEMINI_API_KEY"
     ```

3. **啟動開發伺服器**：
   ```bash
   npm run dev
   ```
   啟動後，可在瀏覽器中開啟 `http://localhost:3000` 進行使用。

## 專案架構

- **前端**：React + TypeScript + Vite + Tailwind CSS + Lucide Icons + Motion (Framer Motion)
- **後端**：Express + `@google/genai` (Node.js SDK)

