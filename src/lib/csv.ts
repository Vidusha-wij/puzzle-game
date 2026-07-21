// Minimal CSV builder + browser download.

function escapeCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  // Quote if it contains comma, quote, or newline; double up quotes.
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv<T>(
  rows: T[],
  columns: { header: string; get: (row: T) => unknown }[]
): string {
  const head = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCell(c.get(row))).join(","))
    .join("\r\n");
  // BOM so Excel opens UTF-8 correctly.
  return "﻿" + head + "\r\n" + body;
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
