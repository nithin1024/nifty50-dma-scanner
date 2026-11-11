import React from 'react';
import { ShieldCheck, AlertOctagon, Database } from 'lucide-react';
import type { DataStatusReport } from '../types';

interface DataStatusProps {
  dataStatus: DataStatusReport | null;
}

export const DataStatus: React.FC<DataStatusProps> = ({ dataStatus }) => {
  const statusLevels = [
    { code: 'VERIFIED', label: 'Verified', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', desc: 'Source verified, all OHLC & session continuity checks passed.' },
    { code: 'DELAYED', label: 'Delayed', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', desc: 'Data exists but exceeds freshness threshold (e.g. feed lag).' },
    { code: 'UNAVAILABLE', label: 'Unavailable', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10', desc: 'Data could not be retrieved from official provider. Never treated as 0/6.' },
    { code: 'INSUFFICIENT_HISTORY', label: 'Insufficient History', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10', desc: 'Fewer than 200 valid completed sessions available for 200 DMA.' },
    { code: 'VALIDATION_FAILED', label: 'Validation Failed', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10', desc: 'Failed consistency checks (e.g. high < low, negative prices).' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Provenance &amp; Verification Health</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real data integrity audit, exchange connectivity provenance, and quality thresholds.
          </p>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#121824] border border-[#232E47] text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">Policy:</span>
          <span className="text-emerald-400 font-semibold">Zero Synthetic Data</span>
        </div>
      </div>

      {/* Live status response from Backend */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-sky-400" />
            <h2 className="font-semibold text-white">Current Pipeline Status (API /data-status)</h2>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded">
            Live Endpoint Response
          </span>
        </div>

        {dataStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#1A2234] border border-[#232E47] rounded-lg p-3 space-y-1">
              <span className="text-slate-400">Designated Provider</span>
              <div className="font-semibold text-white">{dataStatus.provider}</div>
            </div>
            <div className="bg-[#1A2234] border border-[#232E47] rounded-lg p-3 space-y-1">
              <span className="text-slate-400">Pipeline State</span>
              <div className="font-semibold text-amber-300">{dataStatus.status}</div>
            </div>
            <div className="bg-[#1A2234] border border-[#232E47] rounded-lg p-3 space-y-1">
              <span className="text-slate-400">Active Level</span>
              <div className="font-semibold text-sky-400">{dataStatus.current_level}</div>
            </div>
            <div className="bg-[#1A2234] border border-[#232E47] rounded-lg p-3 space-y-1">
              <span className="text-slate-400">Verified Constituents</span>
              <div className="font-semibold text-white">{dataStatus.verified_stocks_count} / 50 stocks</div>
            </div>
            <div className="md:col-span-2 bg-[#1A2234] border border-[#232E47] rounded-lg p-3 space-y-1">
              <span className="text-slate-400">Engineering Note</span>
              <div className="text-slate-200">{dataStatus.notes}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-400 italic">Querying /api/v1/data-status...</div>
        )}
      </div>

      {/* Provenance Classification Standards */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5">
        <h2 className="font-semibold text-white mb-3">Data Quality Classification Standards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {statusLevels.map((lvl) => (
            <div key={lvl.code} className={`p-3.5 rounded-lg border ${lvl.color}`}>
              <div className="font-bold text-white uppercase text-[11px] tracking-wide">{lvl.label}</div>
              <p className="mt-1.5 text-slate-300 leading-relaxed">{lvl.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Integrity Principles */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 text-xs text-slate-300 space-y-3">
        <h2 className="font-semibold text-white text-sm flex items-center space-x-2">
          <AlertOctagon className="w-4 h-4 text-emerald-400" />
          <span>Core Market Data Accuracy Commandments</span>
        </h2>
        <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-1">
          <li>Never invent market prices or generate fake DMA values.</li>
          <li>Never use sample or random data in production mode.</li>
          <li>Never treat unavailable data as a genuine 0/6 result.</li>
          <li>Never treat weekends or official exchange holidays as missing sessions.</li>
          <li>Store provider, retrieval timestamp, data quality status, and corporate-action adjustment policy for every record.</li>
        </ul>
      </div>
    </div>
  );
};
