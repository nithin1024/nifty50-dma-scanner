import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Server, 
  Wifi, 
  Layers, 
  ShieldAlert, 
  RefreshCw
} from 'lucide-react';
import type { BackendHealth, DataStatusReport } from '../types';

interface DashboardProps {
  health: BackendHealth | null;
  dataStatus: DataStatusReport | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  health,
  dataStatus,
  loading,
  onRefresh,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner / Disclaimer */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Level 1: Project Foundation Active
            </span>
            <span className="text-xs text-slate-400">Strict Real Data Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            NIFTY 50 DMA Scanner Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Screening all 50 constituent stocks across 6 Daily Simple Moving Averages (5, 10, 20, 50, 100, 200 DMA). 
            Technical screening only — never financial advice. Zero synthetic or fake market data.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* NIFTY 50 Coverage */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Constituents</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">50</span>
            <span className="text-xs text-slate-400">stocks</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400/90 font-medium">
            Pending Level 2 ingestion
          </div>
        </div>

        {/* 6/6 Bullish Stocks */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">6/6 Bullish</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
              Max Bullish
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-400">--</span>
            <span className="text-xs text-slate-400">stocks</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Price &gt; All 6 DMAs
          </div>
        </div>

        {/* Exactly 5/6 Stocks */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">5/6 Bullish</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400">
              High Bullish
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-sky-400">--</span>
            <span className="text-xs text-slate-400">stocks</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Price &gt; Exactly 5 DMAs
          </div>
        </div>

        {/* Latest Completed Daily Scan Date */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Daily Scan</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-sm font-semibold text-white">Pending Scan</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Awaiting completed session
          </div>
        </div>

        {/* Live Feed Status */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Live Feed</span>
            <Wifi className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-sm font-semibold text-amber-300">Standby (L8)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Upstox V3 Auth at Level 8
          </div>
        </div>

        {/* Data Provenance & Freshness */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Provenance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-emerald-400">
              {dataStatus?.status || 'INITIALIZING'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 truncate">
            No mock data in prod
          </div>
        </div>
      </div>

      {/* Backend Health & Architectural Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend Node Telemetry */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-sky-400" />
              <h2 className="font-semibold text-white">FastAPI Backend Telemetry</h2>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live HTTP Ping
            </span>
          </div>

          {health ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[#232E47]/60">
                <span className="text-slate-400">API Service Name</span>
                <span className="text-white font-medium">{health.app_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#232E47]/60">
                <span className="text-slate-400">System Status</span>
                <span className="text-emerald-400 font-semibold">{health.status}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#232E47]/60">
                <span className="text-slate-400">Environment</span>
                <span className="text-white font-mono uppercase text-xs px-2 py-0.5 rounded bg-slate-800">
                  {health.app_env}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#232E47]/60">
                <span className="text-slate-400">Backend Version</span>
                <span className="text-white font-mono text-xs">{health.version}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#232E47]/60">
                <span className="text-slate-400">Data Pipeline State</span>
                <span className="text-amber-300 text-xs font-medium">{health.data_provider_status}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Server UTC Time</span>
                <span className="text-slate-300 font-mono text-xs">
                  {new Date(health.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-rose-400">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p>Unable to connect to backend service at /api/v1/health</p>
            </div>
          )}
        </div>

        {/* DMA Engine Methodology Card */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">6-DMA Mathematical Specification</h2>
            <span className="text-xs font-mono text-slate-400">Pure SMA (not EMA)</span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Formula: <code className="text-sky-300 bg-slate-800 px-1.5 py-0.5 rounded">SMA(n) = &Sigma;(Last n valid completed closes) / n</code>.
            Comparisons are performed with full floating-point precision; rounding occurs solely for UI presentation.
          </p>

          <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
            {[5, 10, 20, 50, 100, 200].map((period) => (
              <div key={period} className="bg-[#1A2234] border border-[#232E47] rounded-lg p-2.5">
                <div className="font-bold text-white">{period} DMA</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{period} sessions</div>
              </div>
            ))}
          </div>

          <div className="bg-[#1A2234] border border-[#232E47] rounded-lg p-3 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center text-emerald-400 font-semibold space-x-1">
              <span>&bull; 6/6 Bullish:</span>
              <span className="text-slate-300 font-normal">Price strictly greater than all 6 SMAs.</span>
            </div>
            <div className="flex items-center text-sky-400 font-semibold space-x-1">
              <span>&bull; Exactly 5/6:</span>
              <span className="text-slate-300 font-normal">Price strictly greater than exactly 5 of 6 SMAs.</span>
            </div>
            <div className="flex items-center text-amber-400 font-semibold space-x-1">
              <span>&bull; Fresh Crossover:</span>
              <span className="text-slate-300 font-normal">Close[-2] &le; SMA[-2] AND Close[-1] &gt; SMA[-1].</span>
            </div>
          </div>
        </div>
      </div>

      {/* 11-Level Development Roadmap Tracker */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-white">Project Level Sequence & Approval Gates</h2>
            <p className="text-xs text-slate-400">Strict one-level-at-a-time milestone delivery</p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
            Level 1 Completed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          {[
            { lvl: 1, name: 'Project Foundation', status: 'COMPLETED', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' },
            { lvl: 2, name: 'NIFTY 50 Constituents', status: 'PENDING APPROVAL', color: 'text-sky-400 border-sky-500/30 bg-sky-500/5' },
            { lvl: 3, name: 'Historical Market Data', status: 'UPCOMING', color: 'text-slate-400 border-slate-700 bg-slate-800/30' },
            { lvl: 4, name: 'DMA Calculation Engine', status: 'UPCOMING', color: 'text-slate-400 border-slate-700 bg-slate-800/30' },
            { lvl: 5, name: 'Daily Scanner (6/6 & 5/6)', status: 'UPCOMING', color: 'text-slate-400 border-slate-700 bg-slate-800/30' },
            { lvl: 6, name: 'Fresh Bullish Crossovers', status: 'UPCOMING', color: 'text-slate-400 border-slate-700 bg-slate-800/30' },
            { lvl: 7, name: 'PostgreSQL Persistence', status: 'UPCOMING', color: 'text-slate-400 border-slate-700 bg-slate-800/30' },
            { lvl: 8, name: 'Upstox V3 Integration', status: 'UPCOMING', color: 'text-slate-400 border-slate-700 bg-slate-800/30' },
            { lvl: 9, name: 'Live Intraday Scanner', status: 'UPCOMING', color: 'text-slate-400 border-slate-700 bg-slate-800/30' },
            { lvl: 10, name: 'End-to-End Validation', status: 'UPCOMING', color: 'text-slate-400 border-slate-700 bg-slate-800/30' },
            { lvl: 11, name: 'Public Deployment', status: 'UPCOMING', color: 'text-slate-400 border-slate-700 bg-slate-800/30' },
          ].map((item) => (
            <div key={item.lvl} className={`p-3 rounded-lg border ${item.color}`}>
              <div className="font-semibold text-white">Level {item.lvl}</div>
              <div className="text-slate-300 font-medium mt-0.5">{item.name}</div>
              <div className="mt-1 font-mono text-[10px] uppercase">{item.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
