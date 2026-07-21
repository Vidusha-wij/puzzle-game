"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchRegistrations } from "@/lib/leaderboard";
import { formatTime } from "@/lib/puzzle";
import { toCsv, downloadCsv } from "@/lib/csv";
import { Registration } from "@/lib/types";

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function AdminPage() {
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setRows(await fetchRegistrations());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = () => {
    const csv = toCsv(rows, [
      { header: "Name", get: (r) => r.name },
      { header: "Phone", get: (r) => r.phone },
      { header: "SLMC Number", get: (r) => r.slmc ?? "" },
      { header: "Completed", get: (r) => (r.time_ms != null ? "Yes" : "No") },
      { header: "Time", get: (r) => (r.time_ms != null ? formatTime(r.time_ms) : "") },
      { header: "Time (ms)", get: (r) => (r.time_ms != null ? r.time_ms : "") },
      { header: "Registered at", get: (r) => fmtDate(r.created_at) },
      { header: "Solved at", get: (r) => fmtDate(r.solved_at) },
    ]);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCsv(`celogen-jigsaw-registrations-${stamp}.csv`, csv);
  };

  const completed = rows.filter((r) => r.time_ms != null).length;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl p-6 sm:p-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-accent">Celogen</p>
          <h1 className="mt-1 text-3xl font-black">Registrations</h1>
          <p className="mt-1 text-slate-500">
            {loading ? "Loading…" : `${rows.length} total · ${completed} completed`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
          >
            ↻ Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="rounded-xl bg-accent px-5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:brightness-110 disabled:opacity-40"
          >
            ⭳ Download CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">SLMC</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Registered</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-semibold">{r.name}</td>
                <td className="px-4 py-3 font-mono text-slate-600">{r.phone}</td>
                <td className="px-4 py-3 font-mono text-slate-600">{r.slmc ?? "—"}</td>
                <td className="px-4 py-3 font-mono">
                  {r.time_ms != null ? (
                    <span className="text-accent">{formatTime(r.time_ms)}</span>
                  ) : (
                    <span className="text-slate-400">did not finish</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{fmtDate(r.created_at)}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No registrations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Every player who submits the form is recorded here — even if they don’t finish the puzzle.
      </p>
    </main>
  );
}
