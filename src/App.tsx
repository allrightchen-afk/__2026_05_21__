import React, { useState } from "react";
import { ParsedCsv, AnalysisResult, HistoricalItem } from "./types";
import CsvUploader from "./components/CsvUploader";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, AlertCircle, FileSpreadsheet, ShieldCheck, 
  HelpCircle, Clock, Database, ArrowLeft, Trash2 
} from "lucide-react";

export default function App() {
  const [parsedCsv, setParsedCsv] = useState<ParsedCsv | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoricalItem[]>([]);

  // Fun helper messages during the loading state
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    "正在讀取高密度的 CSV 數據主幹...",
    "正在清理空單元格、梳理多維欄位...",
    "正在分析各數據群的分佈矩陣、識別數值離群值...",
    "正在調用 Google Gemini 大模型進行多維度商業邏輯洞察...",
    "資深數據分析師正在為您草擬深入的行動方針...",
    "正在整理可視化系列圖表及 KPI 數據摘要卡片..."
  ];

  const handleAnalyze = async (csvText: string, customInstructions: string) => {
    setIsLoading(true);
    setError(null);
    setLoadingStep(0);

    // Periodically update loading tips
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 4500);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          csvData: csvText,
          customInstructions,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `數據分析失敗 (HTTP ${response.status})`);
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);

      // Save to local session history
      const newItem: HistoricalItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        fileName: parsedCsv?.fileName || "貼上的報表",
        csvData: csvText,
        result,
      };
      setHistory(prev => [newItem, ...prev]);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "處理數據分析時遇到了預期外的通訊問題。");
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoricalItem) => {
    setAnalysisResult(item.result);
    // Mimic CSV parser State loading
    const lines = item.csvData.split("\n");
    setParsedCsv({
      headers: lines[0]?.split(",") || [],
      rows: lines.slice(1).map(l => l.split(",")).filter(r => r.length > 0 && r[0] !== ""),
      rawText: item.csvData,
      fileName: item.fileName,
      rowCount: lines.length - 1,
      colCount: lines[0]?.split(",").length || 0
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setParsedCsv(null);
    setError(null);
  };

  return (
    <div className="min-h-screen text-gray-700 font-sans flex flex-col justify-between" id="app-root-container">
      {/* 導航列 */}
      <header className="bg-white border-b-2 border-ink sticky top-0 z-50 py-3.5">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-ink flex items-center justify-center text-white font-mono font-black text-lg border border-ink select-none">
              AI
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-ink flex items-center">
                <span>AI 數據分析與洞察工具</span>
                <span className="bg-ink text-white px-2 py-0.5 text-[10px] font-bold rounded-sm ml-2">V2.4 PRO</span>
              </h1>
              <p className="text-[10px] text-ink/70 font-mono tracking-wider font-semibold">
                CSV MULTIDIMENSIONAL INSIGHT ENGINE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="font-mono text-[11px] font-black tracking-widest text-ink border-2 border-ink px-3 py-1 bg-white select-none">
              SYSTEM STATUS: OPTIMIZED
            </div>
          </div>
        </div>
      </header>

      {/* 主體內容容器 */}
      <main className="max-w-6xl w-full mx-auto px-4 py-8 flex-1 space-y-6">
        {/* 錯誤警告區 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white border-2 border-rose-600 flex gap-3 text-xs text-rose-700 items-start"
            id="error-alert-box"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-black text-rose-800">分析過程發生異常：</span>
              <p className="leading-relaxed font-sans font-medium">{error}</p>
              <button 
                onClick={() => setError(null)} 
                className="text-rose-800 underline font-black mt-1 hover:text-rose-950 block cursor-pointer"
              >
                隱藏此訊息
              </button>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {isLoading ? (
            /* Loading 動畫與深度分析計時讀取畫面 */
            <motion.div
              key="loading-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white border-2 border-ink p-12 text-center flex flex-col items-center justify-center min-h-[450px] space-y-6"
            >
              {/* Spinner */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-ink animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-ink animate-pulse" />
                </div>
              </div>

              <div className="space-y-1 max-w-md">
                <h3 className="text-base font-black text-ink uppercase tracking-tight">
                  AI 正在深度觀測您的數據表格
                </h3>
                <p className="text-xs text-gray-500 font-bold font-mono">
                  MODELING RECURRENT LOGISTICS & METRICS MATRIX
                </p>
              </div>

              {/* Progress tips block */}
              <motion.div
                key={loadingStep}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-5 py-3 bg-ink text-white font-mono text-xs font-bold flex items-center gap-2.5 border-2 border-ink"
              >
                <Clock className="w-4 h-4 text-white animate-spin" />
                <span>{loadingMessages[loadingStep]}</span>
              </motion.div>
            </motion.div>
          ) : analysisResult ? (
            /* Analysis Output Dashboard */
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AnalyticsDashboard
                result={analysisResult}
                onReset={handleReset}
                fileName={parsedCsv?.fileName}
              />
            </motion.div>
          ) : (
            /* Input spreadsheet upload form */
            <motion.div
              key="uploader-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* 功能介紹小飾板 */}
              <div className="bg-ink text-white p-6 sm:p-8 relative overflow-hidden border-2 border-ink">
                <div className="absolute right-0 bottom-0 top-0 opacity-5 flex items-center select-none pointer-events-none">
                  <Database className="w-85 h-85 -mr-16 -mb-16 text-white" />
                </div>
                <div className="relative z-10 max-w-xl space-y-3">
                  <span className="bg-white text-ink text-[10px] font-black px-2.5 py-1 uppercase tracking-widest font-mono">
                    CSV ANALYSIS LOGISTICS
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-none">
                    將您的冰冷數據轉換為極速商業決策報告
                  </h2>
                  <p className="text-xs text-gray-300 leading-relaxed font-normal">
                    本系統支援標準雙維度 CSV 報表格式。請於下方直接貼上行列數據或拖曳檔案，Google Gemini 大模型引擎將即刻產出專業繁體中文洞察報告、指標卡及動態分佈圖。
                  </p>
                </div>
              </div>

              {/* 主要 Uploader */}
              <CsvUploader
                onDataParsed={setParsedCsv}
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 歷史紀錄 session 備分區 (僅於有歷史點閱且非讀取中顯示) */}
        {!isLoading && history.length > 0 && (
          <div className="bg-white border-2 border-ink p-6 space-y-4" id="historical-section">
            <div className="flex justify-between items-center border-b-2 border-ink pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-ink" />
                <h3 className="text-xs font-black text-ink uppercase tracking-wider font-mono">本階段歷史紀錄 LOGS ({history.length})</h3>
              </div>
              <button
                onClick={handleClearHistory}
                className="text-[10px] text-ink hover:text-rose-600 transition-colors flex items-center gap-1 font-bold font-mono tracking-widest uppercase cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>[ CLEAR ALL ]</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectHistory(item)}
                  className="p-4 border-2 border-ink hover:border-accent-custom hover:bg-bg-custom text-left text-xs transition-all flex flex-col justify-between group relative select-none bg-white font-mono"
                >
                  <div>
                    <div className="font-bold text-ink truncate pr-4 group-hover:text-accent-custom">
                      {item.fileName}
                    </div>
                    <div className="text-[10px] text-ink/65 mt-1 font-mono">TIMESTAMP: {item.timestamp}</div>
                  </div>
                  <div className="text-[10px] text-ink font-bold mt-4 flex items-center gap-0.5 group-hover:text-accent-custom group-hover:underline">
                    <span>LOAD INSIGHT REPORT</span>
                    <ArrowLeft className="w-3 h-3 rotate-180" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 頁尾 */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12 text-center text-xs text-gray-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>© 2026 AI 數據分析與洞察工具 · 輕量級安全極速架構</span>
          <span>基於 Google Gemini 語言智慧核心技術支援</span>
        </div>
      </footer>
    </div>
  );
}
