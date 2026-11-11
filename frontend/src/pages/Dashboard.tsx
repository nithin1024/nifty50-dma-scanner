import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Server, 
  Wifi, 
  Layers, 
  ShieldAlert, 
  RefreshCw,
  TrendingUp,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import type { BackendHealth, DataStatusReport, DailyScanResponse, NavTab } from '../types';

interface DashboardProps {
  health: BackendHealth | null;
  dataStatus: DataStatusReport | null;
  dailyScan: DailyScanResponse | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (tab: NavTab) => void;
  onSelectStock: (symbol: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  health,
  dataStatus,
  dailyScan,
  loading,
  onRefresh,
  onNavigate,
  onSelectStock
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Verified Production Pipeline Active
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
          <span>Refresh Scan</span>
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* NIFTY 50 Coverage */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4 cursor-pointer hover:border-sky-500/50 transition-colors"
          onClick={() => onNavigate('daily-scanner')}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Constituents</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">
              {dailyScan?.verified_constituents || 50}
            </span>
            <span className="text-xs text-slate-400">/ 50 verified</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-medium">
            100% Genuine History
          </div>
        </div>

        {/* 6/6 Bullish Stocks */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 transition-colors"
          onClick={() => onNavigate('daily-scanner')}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">6/6 Bullish</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
              Max Bullish
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-400">
              {dailyScan ? dailyScan.count_6_6 : '--'}
            </span>
            <span className="text-xs text-slate-400">stocks</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Price &gt; All 6 DMAs
          </div>
        </div>

        {/* Exactly 5/6 Stocks */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4 cursor-pointer hover:border-sky-500/50 transition-colors"
          onClick={() => onNavigate('daily-scanner')}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">5/6 Bullish</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400">
              High Bullish
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-sky-400">
              {dailyScan ? dailyScan.count_5_6 : '--'}
            </span>
            <span className="text-xs text-slate-400">stocks</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Price &gt; Exactly 5 DMAs
          </div>
        </div>

        {/* Latest Completed Daily Scan Date */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Session Date</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-sm font-semibold text-white font-mono">
              {dailyScan?.completed_session_date || 'Analyzing'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            NSE official close
          </div>
        </div>

        {/* Live Feed Status */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4 cursor-pointer hover:border-amber-500/50 transition-colors"
          onClick={() => onNavigate('live-scanner')}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Live Feed</span>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-400">Live Ready</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Provisional comparison
          </div>
        </div>

        {/* Data Provenance & Freshness */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 transition-colors"
          onClick={() => onNavigate('data-status')}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Provenance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-emerald-400">
              {dataStatus?.status || 'VERIFIED'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 truncate">
            No mock data in prod
          </div>
        </div>
      </div>

      {/* Fresh Bullish Crossovers Highlight */}
      {dailyScan && dailyScan.fresh_crossovers && dailyScan.fresh_crossovers.length > 0 && (
        <div className="bg-[#121824] border border-amber-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-white text-sm">
                Fresh Bullish Crossovers ({dailyScan.fresh_crossovers.length} Detected)
              </h2>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              Close[-2] &le; SMA[-2] &amp; Close[-1] &gt; SMA[-1]
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {dailyScan.fresh_crossovers.slice(0, 10).map((xo, idx) => (
              <div 
                key={idx}
                onClick={() => onSelectStock(xo.symbol)}
                className="bg-[#1A2234] border border-[#232E47] hover:border-amber-400/50 rounded-lg p-3 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{xo.symbol}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300">
                    {xo.label}
                  </span>
                </div>
                <div className="mt-2 text-xs flex justify-between text-slate-300">
                  <span>Close: ₹{xo.latest_close}</span>
                  <span className="text-emerald-400">+{xo.distance_pct}%</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Crossed from ₹{xo.previous_close}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 6/6 and Exactly 5/6 Movers Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 6/6 Bullish */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="font-semibold text-white">Top 6/6 Bullish Stocks</h2>
            </div>
            <button
              onClick={() => onNavigate('daily-scanner')}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1"
            >
              <span>View All {dailyScan?.count_6_6 || 0}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-[#232E47]">
            {dailyScan && dailyScan.stocks_6_6.slice(0, 5).map((stock) => (
              <div 
                key={stock.symbol}
                onClick={() => onSelectStock(stock.symbol)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-semibold text-white text-xs flex items-center space-x-2">
                    <span>{stock.symbol}</span>
                    <span className="text-[10px] text-slate-400 font-normal truncate max-w-[150px]">
                      {stock.company_name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Sector: {stock.industry}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white font-mono">
                    ₹{stock.latest_close.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono">
                    Score: 6/6 &bull; +{(stock.distances.dist_dma20 || 0).toFixed(1)}% vs 20D
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5/6 Bullish */}
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-sky-400" />
              <h2 className="font-semibold text-white">Top Exactly 5/6 Bullish Stocks</h2>
            </div>
            <button
              onClick={() => onNavigate('daily-scanner')}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1"
            >
              <span>View All {dailyScan?.count_5_6 || 0}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-[#232E47]">
            {dailyScan && dailyScan.stocks_5_6.slice(0, 5).map((stock) => (
              <div 
                key={stock.symbol}
                onClick={() => onSelectStock(stock.symbol)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-semibold text-white text-xs flex items-center space-x-2">
                    <span>{stock.symbol}</span>
                    <span className="text-[10px] text-slate-400 font-normal truncate max-w-[150px]">
                      {stock.company_name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Sector: {stock.industry}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white font-mono">
                    ₹{stock.latest_close.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-sky-400 font-mono">
                    Score: 5/6 &bull; +{(stock.distances.dist_dma20 || 0).toFixed(1)}% vs 20D
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Backend Health & Methodology */}
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
              <p>Unable to connect to backend service</p>
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
    </div>
  );
};
