export interface SummaryCard {
  label: string;
  value: string;
  desc: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ChartConfig {
  title: string;
  chartType: 'bar' | 'line' | 'pie';
  xAxisLabel: string;
  yAxisLabel: string;
  series: ChartDataPoint[];
}

export interface AnalysisResult {
  reportMarkdown: string;
  summaryCards: SummaryCard[];
  chartData: ChartConfig;
}

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  rawText: string;
  fileName?: string;
  rowCount: number;
  colCount: number;
}

export interface HistoricalItem {
  id: string;
  timestamp: string;
  fileName: string;
  csvData: string;
  result: AnalysisResult;
}
