import React, { useState, useRef } from "react";
import { PRESETS, PresetData } from "../presets";
import { parseCSV } from "../utils";
import { ParsedCsv } from "../types";
import { motion } from "motion/react";
import { Upload, FileText, Database, ChevronRight, Sparkles, HelpCircle } from "lucide-react";

interface CsvUploaderProps {
  onDataParsed: (parsed: ParsedCsv) => void;
  onAnalyze: (csvText: string, customInstructions: string) => Promise<void>;
  isLoading: boolean;
}

export default function CsvUploader({ onDataParsed, onAnalyze, isLoading }: CsvUploaderProps) {
  const [csvInput, setCsvInput] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [currPreset, setCurrPreset] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse in real-time to show visual feedback
  const parsedData = parseCSV(csvInput);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCsvInput(text);
    setCurrPreset(null); // Reset preset selection because user edited it
    onDataParsed(parseCSV(text));
  };

  const handleSelectPreset = (index: number) => {
    const preset = PRESETS[index];
    setCsvInput(preset.csv);
    setCustomPrompt(preset.customPrompt || "");
    setCurrPreset(index);
    onDataParsed(parseCSV(preset.csv, preset.title));
  };

  // File Upload Handlers
  const processFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || "";
      setCsvInput(text);
      setCurrPreset(null);
      onDataParsed(parseCSV(text, file.name));
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvInput.trim()) return;
    onAnalyze(csvInput, customPrompt);
  };

  return (
    <div className="space-y-6" id="csv-uploader-section">
      {/* 預設範本快速選擇 */}
      <div className="bg-white border-2 border-ink p-6 relative overflow-hidden">
        <div className="absolute right-4 top-2 font-mono text-5xl font-black text-ink/10 select-none pointer-events-none">
          01
        </div>
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-ink animate-pulse" />
          <h2 className="text-xs font-black text-ink uppercase tracking-widest font-mono">快速開始 / 選擇精美測試數據範本</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESETS.map((preset, i) => (
            <button
              key={i}
              type="button"
              id={`preset-button-${i}`}
              onClick={() => handleSelectPreset(i)}
              className={`p-4 text-left border-2 transition-all duration-200 group relative select-none ${
                currPreset === i
                  ? "border-accent-custom bg-accent-custom/5 text-ink ring-1 ring-accent-custom"
                  : "border-ink hover:border-accent-custom hover:bg-bg-custom"
              }`}
            >
              <div className="font-bold text-xs text-ink flex items-center justify-between">
                <span>{preset.title}</span>
                <ChevronRight className="w-3.5 h-3.5 text-ink group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-ink/75 mt-1.5 line-clamp-2 leading-relaxed">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 主要上傳與貼上編輯區 */}
        <div className="bg-white border-2 border-ink p-6 space-y-5">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-black text-ink uppercase tracking-widest font-mono">
              CSV 數據報表輸入與編輯區 <span className="text-rose-600 font-bold">*</span>
            </label>
            <div className="flex items-center gap-1.5 text-xs text-ink/75 font-mono">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>[ 標準雙維度逗號分隔格式 ]</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {/* 大文字輸入方塊 */}
              <textarea
                value={csvInput}
                onChange={handleTextChange}
                placeholder="貼上您的 CSV 資料，或者將 CSV 檔案拖曳至右側框中...&#10;例如：&#10;月份,銷售額,客戶數&#10;1月,120000,560&#10;2月,145000,610"
                id="csv-textarea"
                rows={11}
                className="w-full p-4 text-xs font-mono border-2 border-ink focus:outline-none focus:ring-1 focus:ring-accent-custom focus:border-accent-custom placeholder-gray-400 leading-relaxed bg-white text-ink"
              />
            </div>

            {/* 檔案拖曳與附加上傳 */}
            <div className="flex flex-col gap-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 border-2 border-dashed flex flex-col items-center justify-center p-5 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-accent-custom bg-accent-custom/5"
                    : "border-ink hover:border-accent-custom bg-bg-custom"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.txt"
                  className="hidden"
                  id="csv-file-input"
                />
                <Upload className="w-8 h-8 text-ink mb-2.5" />
                <span className="text-xs font-bold text-ink">拖曳 CSV 檔案至此</span>
                <span className="text-[10px] text-ink/70 mt-1">或點擊此處手動上傳</span>
                <span className="text-[10px] bg-ink text-white px-2.5 py-0.5 rounded-sm mt-3 font-mono font-bold uppercase tracking-widest">
                  CSV / TXT
                </span>
              </div>

              {/* 進階焦點指令 */}
              <div className="bg-bg-custom p-4 border-2 border-ink flex flex-col justify-between">
                <div>
                  <div className="text-xs font-black text-ink flex items-center gap-1.5 mb-1.5 font-mono uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-accent-custom" />
                    <span>進階分析焦點（選填）</span>
                  </div>
                  <p className="text-[10px] text-ink/70 leading-relaxed mb-3">
                    引導 AI 的研究重點，例如：特定產品分析
                  </p>
                </div>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  id="custom-prompt-input"
                  placeholder="例如：請指引第二季度衰退最嚴重指標..."
                  className="w-full text-xs px-3 py-2 border-2 border-ink focus:ring-1 focus:ring-accent-custom focus:border-accent-custom focus:outline-none bg-white font-sans text-ink font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 偵測到的 CSV 資料格預覽 */}
        {parsedData.headers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-ink p-6 space-y-3"
            id="csv-preview-card"
          >
            <div className="flex justify-between items-center border-b-2 border-ink pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-ink" />
                <h3 className="text-xs font-black text-ink uppercase tracking-wider font-mono">
                  即時數據欄位樣品預覽 (已偵測到 {parsedData.rowCount} 列 × {parsedData.colCount} 欄)
                </h3>
              </div>
              <span className="text-[10px] text-ink/70 font-mono">[ PREVIEWING SAMPLE ]</span>
            </div>

            <div className="overflow-x-auto border-2 border-ink">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-custom border-b-2 border-ink">
                    {parsedData.headers.map((h, i) => (
                      <th key={i} className="px-4 py-2 text-[11px] font-bold text-ink uppercase tracking-wider font-mono border-r-2 border-ink last:border-r-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink bg-white">
                  {parsedData.rows.slice(0, 5).map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-bg-custom transition-colors">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-2 text-xs font-mono text-ink/90 truncate max-w-[150px] border-r border-ink last:border-r-0">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* 送出按鈕區 */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            id="start-analysis-btn"
            disabled={isLoading || !csvInput.trim()}
            className={`px-8 py-4 text-xs font-black uppercase tracking-widest flex items-center gap-2.5 transition-all border-2 border-ink select-none ${
              isLoading || !csvInput.trim()
                ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                : "bg-ink hover:bg-accent-custom text-white active:translate-y-0.5 cursor-pointer"
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>AI 深度洞察產出中...請稍候</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>開始 AI 分析</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
