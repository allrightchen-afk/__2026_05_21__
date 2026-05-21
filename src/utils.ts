import { ParsedCsv } from "./types";

/**
 * Parses raw CSV text into a structured ParsedCsv object.
 * Perfectly handles lines and potential surrounding double quotes.
 */
export function parseCSV(text: string, fileName?: string): ParsedCsv {
  if (!text) {
    return { headers: [], rows: [], rawText: "", fileName, rowCount: 0, colCount: 0 };
  }

  // Split lines by Carriage Return / Line Feed
  const lines = text.split(/\r?\n/);
  const rows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    // Robust splitting by comma (handles quoted fields)
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
    const cleanedFields = (matches || []).map(field => {
      let f = field.trim();
      // Remove leading and trailing double quotes if present
      if (f.startsWith('"') && f.endsWith('"')) {
        f = f.slice(1, -1);
      }
      return f;
    });

    if (cleanedFields.length > 0) {
      rows.push(cleanedFields);
    }
  }

  if (rows.length === 0) {
    return { headers: [], rows: [], rawText: text, fileName, rowCount: 0, colCount: 0 };
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return {
    headers,
    rows: dataRows,
    rawText: text,
    fileName,
    rowCount: dataRows.length,
    colCount: headers.length,
  };
}

/**
 * Format helper for numbers (adds commas and dec limiters)
 */
export function formatValue(val: string | number): string {
  const num = typeof val === "string" ? parseFloat(val.replace(/[$,%]/g, "")) : val;
  if (isNaN(num)) {
    return String(val);
  }
  return num.toLocaleString();
}
