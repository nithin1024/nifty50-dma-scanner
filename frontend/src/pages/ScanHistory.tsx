import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { fetchScanHistory } from '../services/api';
import type { ScanHistoryRecord } from '../types';

export const ScanHistory: React.FC = () => {
  const [history, setHistory] = useState<ScanHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchScanHistory()
      .then(res => setHistory(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Scan Archive</h1>
          <p className="text-sm text-slate-400 mt-1">
            Historical audit records of daily completed session scans persisted in the relational database.
          </p>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#121824] border border-[#232E47] text-xs text-slate-400">
          <Calendar className="w-4 h-4 text-sky-400" />
          <span>Relational Audit Trail</span>
        </div>
      </div>

      <div className="bg-[#121824] border border-[#232E47] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1A2234] text-slate-300 uppercase font-mono border-b border-[#232E47]">
              <tr>
                <th className="py-3 px-4">Scan ID</th>
                <th className="py-3 px-4">Completed Session Date</th>
                <th className="py-3 px-4">Scan Timestamp (UTC)</th>
                <th className="py-3 px-4 text-center">Verified Constituents</th>
                <th className="py-3 px-4 text-center">6/6 Bullish Count</th>
                <th className="py-3 px-4 text-center">5/6 Bullish Count</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232E47]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading historical scan records...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No historical scans recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">#{record.id}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {record.completed_session_date}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {new Date(record.scan_timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-400">
                      {record.verified_count} / {record.total_constituents}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                      {record.count_6_6}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-sky-400">
                      {record.count_5_6}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ARCHIVED</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
