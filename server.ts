import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Lazy initializer for GoogleGenAI
let aiInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "請在環境變數或 .env 檔案中設定 GEMINI_API_KEY，然後重新嘗試分析。"
      );
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// System Instruction for AI analyst
const SYSTEM_INSTRUCTION = 
  "你是一位世界級的數據分析科學家與 business intelligence 商業洞察專家。你的任務是深度分析使用者貼上的 CSV 數據。\n" +
  "請仔細讀取所有列、行，分析數值的趨勢、異常值、潛在商業規律與痛點。\n" +
  "你必須產出兩部分內容：\n" +
  "1. 一份繁體中文 (Taiwan, zh-TW) 的 Markdown 專業分析報告，排版極致美觀、段落對稱明晰，包含宏觀總覽、核心指標解讀、痛點異常分析，以及 3-4 條極具實操價值的行動指南。\n" +
  "2. 提取最關鍵的 4 個數據指標（如總計、平均值等）以及最適合畫成圖表的一組核心趨勢/分佈數列。\n" +
  "請完全依照要求的 JSON Schema 回傳，不需添加額外問候語，也不要在 markdown 報告中提及 JSON 的存在。";

// 數據分析 API 路由
app.post("/api/analyze", async (req, res) => {
  try {
    const { csvData, customInstructions } = req.body;

    if (!csvData || typeof csvData !== "string" || csvData.trim() === "") {
      return res.status(400).json({ error: "請提供有效的 CSV 格式數據。" });
    }

    const ai = getGenAI();

    // Combine standard instructions with potential user custom instructions
    const userPrompt = `這裡是我提供的 CSV 數據：\n\n\`\`\`csv\n${csvData}\n\`\`\`\n\n${
      customInstructions ? `特別分析指令：${customInstructions}\n` : ""
    }\n請為我進行數據分析與洞察。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reportMarkdown: {
              type: Type.STRING,
              description: "使用繁體中文編寫的完整 Markdown 格式數據分析與商務建議報告。"
            },
            summaryCards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: "量化物理指標名稱（如：『總銷售量』或『平均交易額』）" },
                  value: { type: Type.STRING, description: "包含單位的格式化指標數值（如：『$125,000』或『88.42%』）" },
                  desc: { type: Type.STRING, description: "針對此指標的脈絡概述或相對比率（如：『較平均高出 12%』）" },
                  trend: { type: Type.STRING, description: "趨勢，必須是 'up'、'down' 或 'neutral'" }
                },
                required: ["label", "value", "desc", "trend"]
              },
              description: "提取出與該數據最相關、最亮眼的 4 個 KPI 數據摘要指標卡片（例如營業額、毛利率、轉換率、最暢銷品等）"
            },
            chartData: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "建議繪製的關鍵數據趨勢/分配圖圖表名稱" },
                chartType: { type: Type.STRING, description: "最適用的圖表類型，值必須為 'bar'、'line' 或 'pie'" },
                xAxisLabel: { type: Type.STRING, description: "X 軸代表的項目物理量名稱（如：『月份』或『產品類別』）" },
                yAxisLabel: { type: Type.STRING, description: "Y 軸代表的數值單位物理量（如：『元』或『件』）" },
                series: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: "單個數據點的項目名稱（如『1月』或『運動鞋』）" },
                      value: { type: Type.NUMBER, description: "數據點數值（必須是純數字，如 125000）" }
                    },
                    required: ["name", "value"]
                  }
                }
              },
              required: ["title", "chartType", "xAxisLabel", "yAxisLabel", "series"],
              description: "一組最能代表數據大盤趨勢的統計數據系列，便於前端動態繪製折線、條形或圓餅圖"
            }
          },
          required: ["reportMarkdown", "summaryCards", "chartData"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("AI 回傳了空的分析結果，請稍後再試。");
    }

    // Parse safety check
    const insights = JSON.parse(jsonText.trim());
    return res.json(insights);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return res.status(500).json({
      error: error.message || "伺服器內部錯誤，無法生成數據分析報告。"
    });
  }
});

// Configure Vite middleware in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
