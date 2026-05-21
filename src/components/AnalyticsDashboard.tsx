import React, { useState } from "react";
import { AnalysisResult, SummaryCard, ChartDataPoint } from "../types";
import { motion } from "motion/react";
import Markdown from "react-markdown";
import { 
  TrendingUp, TrendingDown, Minus, Copy, Check, BarChart2, FileText, 
  Sparkles, Download, RefreshCw, AlertCircle 
} from "lucide-react";

interface AnalyticsDashboardProps {
  result: AnalysisResult;
  onReset: () => void;
  fileName?: string;
}

export default function AnalyticsDashboard({ result, onReset, fileName }: AnalyticsDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<ChartDataPoint | null>(null);

  const { reportMarkdown, summaryCards, chartData } = result;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("無法複製文字:", err);
    }
  };

  // SVG Chart Helper calculations (Responsiveness)
  const renderSVGChart = () => {
    if (!chartData || !chartData.series || chartData.series.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-100 rounded-xl bg-gray-50/50">
          <AlertCircle className="w-6 h-6 text-gray-400 mb-1" />
          <span className="text-xs text-gray-400">目前無圖表資料可供繪製</span>
        </div>
      );
    }

    const { series, chartType, title, xAxisLabel, yAxisLabel } = chartData;
    const values = series.map((s) => s.value);
    const maxValue = Math.max(...values, 1) * 1.15; // Give 15% top padding
    const minValue = 0;

    // Fixed Dimensions for internal SVG coordinate system (highly responsive due to viewBox)
    const svgWidth = 800;
    const svgHeight = 350;
    const paddingLeft = 70;
    const paddingRight = 40;
    const paddingTop = 40;
    const paddingBottom = 50;

    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    // Helper functions to convert numerical state to coordinate
    const getX = (index: number) => {
      if (series.length <= 1) return paddingLeft + chartWidth / 2;
      return paddingLeft + (index / (series.length - 1)) * chartWidth;
    };

    const getY = (value: number) => {
      const ratio = (value - minValue) / (maxValue - minValue);
      return svgHeight - paddingBottom - ratio * chartHeight;
    };

    // Rendering individual chart styles
    if (chartType === "line") {
      // Create SVG Path
      let pathD = "";
      let areaD = "";

      series.forEach((s, idx) => {
        const x = getX(idx);
        const y = getY(s.value);
        if (idx === 0) {
          pathD = `M ${x} ${y}`;
          areaD = `M ${x} ${svgHeight - paddingBottom} L ${x} ${y}`;
        } else {
          pathD += ` L ${x} ${y}`;
          areaD += ` L ${x} ${y}`;
        }
        if (idx === series.length - 1) {
          areaD += ` L ${x} ${svgHeight - paddingBottom} Z`;
        }
      });

      return (
        <div className="relative w-full overflow-hidden">
          <svg className="w-full h-auto" viewBox={`0 0 ${svgWidth} ${svgHeight}`} id="svg-line-chart">
            {/* Gradients */}
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0055ff" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#0055ff" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Y Axis Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const val = minValue + ratio * (maxValue - minValue);
              const y = getY(val);
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#f3f4f6"
                    strokeWidth="1"
                    strokeDasharray={i === 0 ? "0" : "4 4"}
                  />
                  <text
                    x={paddingLeft - 12}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-gray-400 font-mono"
                  >
                    {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Area under line */}
            {series.length > 1 && (
              <path d={areaD} fill="url(#lineGrad)" className="transition-all duration-700" />
            )}

            {/* Line Path */}
            {series.length > 1 && (
               <path
                d={pathD}
                fill="none"
                stroke="#0055ff"
                strokeWidth="4"
                strokeLinecap="square"
                strokeLinejoin="miter"
                className="transition-all duration-700"
              />
            )}

            {/* Interactive Data Dots */}
            {series.map((s, idx) => {
              const x = getX(idx);
              const y = getY(s.value);
              const isHovered = hoveredDataPoint?.name === s.name;
              return (
                <g key={idx} className="cursor-pointer">
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? "8" : "5"}
                    fill={isHovered ? "#0055ff" : "#ffffff"}
                    stroke="#1a1a1a"
                    strokeWidth={isHovered ? "4" : "2.5"}
                    onMouseEnter={() => setHoveredDataPoint(s)}
                    onMouseLeave={() => setHoveredDataPoint(null)}
                    className="transition-all duration-200"
                  />
                  <text
                    x={x}
                    y={y - 12}
                    textAnchor="middle"
                    className={`text-[10px] font-bold fill-indigo-600 transition-opacity duration-200 ${
                      isHovered ? "opacity-100" : "opacity-0 md:hover:opacity-100"
                    }`}
                  >
                    {s.value.toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* X Axis Labels */}
            {series.map((s, idx) => {
              const x = getX(idx);
              return (
                <text
                  key={idx}
                  x={x}
                  y={svgHeight - paddingBottom + 20}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-400 font-medium truncate"
                >
                  {s.name}
                </text>
              );
            })}

            {/* Axis labels */}
            <text x={paddingLeft} y={paddingTop - 15} className="text-[10px] fill-gray-500 font-semibold">
              {yAxisLabel ? `(${yAxisLabel})` : ""}
            </text>
          </svg>
        </div>
      );
    } else if (chartType === "pie") {
      // Render Doughnut Chart
      let total = values.reduce((sum, v) => sum + v, 0);
      if (total === 0) total = 1;

      let accumulatedAngle = 0;
      const rx = svgWidth / 2 - 120;
      const ry = svgHeight / 2;
      const radius = 95;

      const colors = [
        "#1a1a1a", // Ink Dark
        "#0055ff", // Accent Blue
        "#10b981", // Emerald Green
        "#f59e0b", // Amber Yellow
        "#ef4444", // Red
        "#8b5cf6"  // Purple
      ];

      return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
          <div className="md:col-span-3 flex justify-center">
            <svg className="w-full max-w-[280px] h-auto" viewBox={`0 0 250 250`} id="svg-pie-chart">
              <g transform="translate(125, 125)">
                {series.map((s, idx) => {
                  const percentage = s.value / total;
                  const angle = percentage * 360;

                  // Polar coordinates helper
                  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
                    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
                    return {
                      x: centerX + radius * Math.cos(angleInRadians),
                      y: centerY + radius * Math.sin(angleInRadians)
                    };
                  };

                  const dArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
                    const start = polarToCartesian(x, y, radius, endAngle);
                    const end = polarToCartesian(x, y, radius, startAngle);
                    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
                    return [
                      "M", start.x, start.y,
                      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
                    ].join(" ");
                  };

                  const startAng = accumulatedAngle;
                  const endAng = accumulatedAngle + angle;
                  accumulatedAngle += angle;

                  // Render donut path
                  const isHovered = hoveredDataPoint?.name === s.name;
                  const currentRadius = isHovered ? radius + 5 : radius;
                  const pathString = dArc(0, 0, currentRadius, startAng, endAng);

                  // Middle of the angle for labels
                  return (
                    <path
                      key={idx}
                      d={`${pathString} L 0 0 Z`}
                      fill={colors[idx % colors.length]}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="cursor-pointer transition-all duration-300 hover:opacity-95"
                      onMouseEnter={() => setHoveredDataPoint(s)}
                      onMouseLeave={() => setHoveredDataPoint(null)}
                    />
                  );
                })}
                {/* Center hole for Donut feel */}
                <circle cx="0" cy="0" r="55" fill="#ffffff" />
                <text x="0" y="-2" textAnchor="middle" className="text-[10px] font-bold fill-gray-400">總計數據</text>
                <text x="0" y="16" textAnchor="middle" className="text-sm font-extrabold fill-gray-800">
                  {total >= 1000000 ? `${(total/1000000).toFixed(1)}M` : total.toLocaleString()}
                </text>
              </g>
            </svg>
          </div>

          {/* List of segment details */}
          <div className="md:col-span-2 space-y-2">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">佔比細節清單</h4>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {series.map((s, idx) => {
                const pct = ((s.value / total) * 100).toFixed(1);
                const isHovered = hoveredDataPoint?.name === s.name;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredDataPoint(s)}
                    onMouseLeave={() => setHoveredDataPoint(null)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                      isHovered ? "bg-indigo-50/50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colors[idx % colors.length] }}
                      />
                      <span className="font-medium text-gray-700 truncate max-w-[120px]">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-semibold text-gray-800">{s.value.toLocaleString()}</span>
                      <span className="text-gray-400 text-[10px] font-normal">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    } else {
      // Render Bar Chart (Default)
      const barPadding = 12;
      const totalBarWidth = chartWidth / series.length;
      const barWidth = Math.max(totalBarWidth - barPadding * 2, 8);

      return (
        <div className="relative w-full overflow-hidden">
          <svg className="w-full h-auto" viewBox={`0 0 ${svgWidth} ${svgHeight}`} id="svg-bar-chart">
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#333333" />
              </linearGradient>
              <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0055ff" />
                <stop offset="100%" stopColor="#0044cc" />
              </linearGradient>
            </defs>

            {/* Y Axis Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const val = minValue + ratio * (maxValue - minValue);
              const y = getY(val);
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#f3f4f6"
                    strokeWidth="1"
                    strokeDasharray={i === 0 ? "0" : "4 4"}
                  />
                  <text
                    x={paddingLeft - 12}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-gray-400 font-mono"
                  >
                    {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Individual Bars */}
            {series.map((s, idx) => {
              const barCenterX = paddingLeft + idx * totalBarWidth + totalBarWidth / 2;
              const x = barCenterX - barWidth / 2;
              const y = getY(s.value);
              const barHeight = Math.max(svgHeight - paddingBottom - y, 2);
              const isHovered = hoveredDataPoint?.name === s.name;

              return (
                <g key={idx} className="cursor-pointer">
                  {/* Glowing hover background */}
                  <rect
                    x={x - 4}
                    y={y - 4}
                    width={barWidth + 8}
                    height={barHeight + 4}
                    fill="#e0e7ff"
                    opacity={isHovered ? 0.35 : 0}
                    rx="6"
                    className="transition-opacity duration-200"
                  />
                  {/* Concrete Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={isHovered ? "url(#barGradHover)" : "url(#barGrad)"}
                    rx="4"
                    onMouseEnter={() => setHoveredDataPoint(s)}
                    onMouseLeave={() => setHoveredDataPoint(null)}
                    className="transition-all duration-300"
                  />
                  {/* Text value on top */}
                  <text
                    x={barCenterX}
                    y={y - 8}
                    textAnchor="middle"
                    className={`text-[10px] font-bold fill-indigo-600 transition-opacity duration-200 ${
                      isHovered ? "opacity-100" : "opacity-0 md:hover:opacity-100"
                    }`}
                  >
                    {s.value.toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* X Axis Labels */}
            {series.map((s, idx) => {
              const barCenterX = paddingLeft + idx * totalBarWidth + totalBarWidth / 2;
              return (
                <text
                  key={idx}
                  x={barCenterX}
                  y={svgHeight - paddingBottom + 20}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-400 font-medium truncate max-w-[80px]"
                >
                  {s.name}
                </text>
              );
            })}

            {/* Axis titles */}
            <text x={paddingLeft} y={paddingTop - 15} className="text-[10px] fill-gray-500 font-semibold">
              {yAxisLabel ? `(${yAxisLabel})` : ""}
            </text>
          </svg>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6" id="analytics-dashboard-section">
      {/* 標題與上傳按鈕 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border-2 border-ink p-6 relative">
        <div className="absolute right-4 top-2 font-mono text-5xl font-black text-ink/5 select-none pointer-events-none">
          02
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-ink text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-sm select-none">
              分析完成 / STATUS: SECURED
            </span>
            {fileName && (
              <span className="text-xs text-ink/70 font-mono font-bold truncate max-w-[200px]">
                FILE: {fileName}
              </span>
            )}
          </div>
          <h2 className="text-base font-black text-ink mt-1.5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-custom animate-spin-slow" />
            <span className="uppercase tracking-tight">AI 多維數據智能分析觀測面板</span>
          </h2>
        </div>

        <button
          onClick={onReset}
          className="px-5 py-3 border-2 border-ink hover:bg-bg-custom text-xs font-black text-ink hover:text-accent-custom transition-all font-mono uppercase tracking-widest cursor-pointer bg-white"
        >
          重新分析新數據
        </button>
      </div>

      {/* 關鍵 KPI 摘要卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-grid">
        {summaryCards.map((card, i) => {
          const isUp = card.trend === "up";
          const isDown = card.trend === "down";

          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              key={i}
              className="bg-white border-2 border-ink p-5 transition-colors relative flex flex-col justify-between hover:bg-bg-custom group font-sans"
            >
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-ink/75 uppercase tracking-wider font-mono">{card.label}</span>
                  <span
                    className={`w-6 h-6 border-2 border-ink font-bold flex items-center justify-center text-xs rounded-sm ${
                      isUp
                        ? "bg-emerald-50 text-emerald-800"
                        : isDown
                        ? "bg-rose-50 text-rose-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : isDown ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                  </span>
                </div>
                <div className="text-xl font-black text-ink font-mono tracking-tighter pt-1.5 leading-none">
                  {card.value}
                </div>
              </div>
              <p className="text-[10px] text-ink/80 mt-4 border-t border-dashed border-ink/40 pt-2 flex items-center gap-1 font-sans">
                <span className={`w-1.5 h-1.5 rounded-full ${isUp ? "bg-emerald-600" : isDown ? "bg-rose-600" : "bg-ink"}`} />
                {card.desc}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* 數據圖表與分析報告排版 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 左側：精美 AI SVG 視覺化圖表 */}
        <div className="lg:col-span-3 bg-white border-2 border-ink p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b-2 border-ink pb-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4.5 h-4.5 text-ink" />
                <h3 className="text-xs font-black text-ink uppercase tracking-wider font-mono">{chartData?.title || "大盤趨勢分佈"}</h3>
              </div>
              <span className="text-[10px] bg-ink text-white px-2.5 py-0.5 font-bold font-mono uppercase tracking-widest border-2 border-ink">
                {chartData?.chartType || "bar"}
              </span>
            </div>
            <p className="text-[10px] text-ink/75 font-mono font-semibold uppercase tracking-wider mt-2">
              AUTO-RECOMMENDED CHART AXIS : {chartData?.xAxisLabel || "DIMENSION_X"}
            </p>
          </div>

          <div className="py-2">
            {renderSVGChart()}
          </div>

          <div className="border-t-2 border-ink pt-3 flex justify-between items-center text-[10px] text-ink/75 font-mono">
            <span>[ HOVER GRAPH NODES FOR DATAPOINTS ]</span>
            <span>VECTOR COMPLIANT SCALE</span>
          </div>
        </div>

        {/* 右側：一鍵複製的 Markdown 分析報告 */}
        <div className="lg:col-span-2 bg-white border-2 border-ink p-6 space-y-4 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b-2 border-ink pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-ink" />
              <h3 className="text-xs font-black text-ink uppercase tracking-wider font-mono">深度洞察與建議報告</h3>
            </div>
            
            <button
              onClick={handleCopy}
              id="copy-report-btn"
              className={`p-2 border-2 text-xs font-black flex items-center gap-1 transition-all cursor-pointer bg-white ${
                copied
                  ? "bg-bg-custom border-ink text-ink"
                  : "border-ink hover:bg-bg-custom text-ink"
              }`}
              title="複製分析報告"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="font-mono text-[10px] uppercase tracking-wider font-bold">{copied ? "已複製" : "一鍵複製"}</span>
            </button>
          </div>

          {/* Markdown Content Container */}
          <div className="prose h-[280px] overflow-y-auto pr-1 text-xs text-ink leading-relaxed font-sans scrollbar-thin scrollbar-thumb-ink/40">
            <div className="space-y-3 prose-strong:font-bold prose-headings:font-bold prose-p:text-ink">
              <Markdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-sm font-black text-ink border-b-2 border-ink pb-1 mt-4 mb-2 first:mt-0 uppercase tracking-wider font-mono" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xs font-bold text-ink border-l-4 border-ink pl-2 mt-4 mb-1.5" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-xs font-bold text-ink mt-3 mb-1 font-mono uppercase" {...props} />,
                  p: ({node, ...props}) => <p className="mb-2 text-ink/90 leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside pl-4 mb-2 space-y-1 text-ink/90" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside pl-4 mb-2 space-y-1 text-ink/90" {...props} />,
                  li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
                  table: ({node, ...props}) => (
                    <div className="overflow-x-auto my-3 border-2 border-ink">
                      <table className="w-full text-left border-collapse text-[11px]" {...props} />
                    </div>
                  ),
                  thead: ({node, ...props}) => <thead className="bg-bg-custom border-b-2 border-ink" {...props} />,
                  th: ({node, ...props}) => <th className="px-3 py-1.5 font-bold text-ink border-r border-ink last:border-r-0 font-mono" {...props} />,
                  td: ({node, ...props}) => <td className="px-3 py-1.5 border-b border-ink border-r border-ink last:border-r-0 font-mono text-ink/80" {...props} />,
                  code: ({node, ...props}) => <code className="bg-bg-custom text-accent-custom px-1.5 py-0.5 rounded-sm font-mono text-[10px] border border-ink" {...props} />,
                }}
              >
                {reportMarkdown}
              </Markdown>
            </div>
          </div>

          <div className="border-t-2 border-ink pt-3 text-[10px] text-ink/70 font-mono text-center uppercase tracking-wider">
            Powered by Google Gemini 1.5 Pro AI System Core
          </div>
        </div>
      </div>
    </div>
  );
}
