import React, { useState } from 'react';
import type { DailyScanResponse } from '../types';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Zap 
} from 'lucide-react';

interface VolumeAnalyticsPageProps {
  dailyScan: DailyScanResponse | null;
  loading?: boolean;
  onSelectStock: (symbol: string) => void;
}

export const VolumeAnalyticsPage: React.FC<VolumeAnalyticsPageProps> = ({
  dailyScan,
  loading: _loading,
  onSelectStock
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'VERY_HIGH' | 'HIGH' | 'DIVERGENCE'>('ALL');

  const allStocks = dailyScan?.all_results || [];

  // RVOL Leaderboard
  const rvolSorted = [...allStocks].sort((a, b) => (b.rvol || 0) - (a.rvol || 0));

  // Price-Volume Divergence Candidates:
  // e.g. Price down on High Volume (Distribution), or Price up on Low Volume (Weak rally)
  const divergences = allStocks.filter(s => {
    const isUp = (s.price_change_pct || 0) > 0;
    const rvol = s.rvol || 0;
    return (!isUp && rvol >= 1.25) || (isUp && rvol < 0.75);
  });

  const displayedStocks = activeFilter === 'VERY_HIGH' 
    ? rvolSorted.filter(s => s.volume_classification === 'VERY_HIGH_VOLUME')
    : activeFilter === 'HIGH'
    ? rvolSorted.filter(s => s.volume_classification === 'HIGH_VOLUME')
    : activeFilter === 'DIVERGENCE'
    ? divergences
    : rvolSorted;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-5 rounded-xl bg-[#121824] border border-[#232E47]">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <BarChart2 className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Page 5 — Institutional Volume &amp; RVOL Analytics Engine
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Quantitative Relative Volume (RVOL) benchmarked strictly against 5-session completed averages, volume trend trajectories, and price-volume divergence detection.
        </p>
      </div>

      {/* Top RVOL Leaders Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top RVOL Expansion */}
        <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47]">
          <div className="text-xs font-bold text-purple-400 flex items-center justify-between mb-3">
            <span>TOP 3 RELATIVE VOLUME (RVOL)</span>
            <Zap className="w-4 h-4" />
          </div>
          <div className="space-y-2.5">
            {rvolSorted.slice(0, 3).map((s, idx) => (
              <div 
                key={s.symbol}
                onClick={() => onSelectStock(s.symbol)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#1A2234] hover:bg-slate-700/50 cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-bold text-white text-xs">{idx + 1}. {s.symbol}</div>
                  <div className="text-[10px] text-slate-400">{s.company_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-purple-300 text-sm">
                    {s.rvol ? `${s.rvol.toFixed(2)}x` : '-'}
                  </div>
                  <div className={`text-[10px] font-mono ${(s.price_change_pct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(s.price_change_pct || 0) >= 0 ? '+' : ''}{(s.price_change_pct || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bullish Volume Confirmation */}
        <div className="p-4 rounded-xl bg-[#121824] border border-emerald-500/20 bg-emerald-500/[0.02]">
          <div className="text-xs font-bold text-emerald-400 flex items-center justify-between mb-3">
            <span>BULLISH VOLUME CONFIRMATION</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="space-y-2.5">
            {rvolSorted.filter(s => (s.price_change_pct || 0) > 0 && (s.rvol || 0) >= 1.0).slice(0, 3).map((s) => (
              <div 
                key={s.symbol}
                onClick={() => onSelectStock(s.symbol)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#1A2234] hover:bg-slate-700/50 cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-bold text-white text-xs">{s.symbol}</div>
                  <div className="text-[10px] text-slate-400">{s.score}/6 DMA &bull; Up on Volume</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-400 text-xs">
                    +{(s.price_change_pct || 0).toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    RVOL: {s.rvol?.toFixed(2)}x
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Distribution / Selling Pressure */}
        <div className="p-4 rounded-xl bg-[#121824] border border-rose-500/20 bg-rose-500/[0.02]">
          <div className="text-xs font-bold text-rose-400 flex items-center justify-between mb-3">
            <span>HIGH VOLUME SELLING (DISTRIBUTION)</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="space-y-2.5">
            {rvolSorted.filter(s => (s.price_change_pct || 0) < 0 && (s.rvol || 0) >= 1.0).slice(0, 3).map((s) => (
              <div 
                key={s.symbol}
                onClick={() => onSelectStock(s.symbol)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#1A2234] hover:bg-slate-700/50 cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-bold text-white text-xs">{s.symbol}</div>
                  <div className="text-[10px] text-rose-400/80">Heavy Sell Volume</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-rose-400 text-xs">
                    {(s.price_change_pct || 0).toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    RVOL: {s.rvol?.toFixed(2)}x
                  </div>
                </div>
              </div>
            ))}
            {rvolSorted.filter(s => (s.price_change_pct || 0) < 0 && (s.rvol || 0) >= 1.0).length === 0 && (
              <div className="text-xs text-slate-500 p-3 text-center">No heavy distribution detected.</div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-[#232E47] pb-2 text-xs">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeFilter === 'ALL' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          All 50 Stocks ({rvolSorted.length})
        </button>
        <button
          onClick={() => setActiveFilter('VERY_HIGH')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeFilter === 'VERY_HIGH' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          Very High Volume (&ge; 2.0x)
        </button>
        <button
          onClick={() => setActiveFilter('HIGH')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeFilter === 'HIGH' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          High Volume (1.25x - 2.0x)
        </button>
        <button
          onClick={() => setActiveFilter('DIVERGENCE')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeFilter === 'DIVERGENCE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          Price-Volume Divergence ({divergences.length})
        </button>
      </div>

      {/* Analytics Table */}
      <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#1A2234] text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Symbol</th>
                <th className="py-2.5 px-3">Company Name</th>
                <th className="py-2.5 px-3 text-right">Close</th>
                <th className="py-2.5 px-3 text-right">Chg %</th>
                <th className="py-2.5 px-3 text-right">Traded Volume</th>
                <th className="py-2.5 px-3 text-right">6-Day Avg</th>
                <th className="py-2.5 px-3 text-right">RVOL</th>
                <th className="py-2.5 px-3 text-right">Vol Chg %</th>
                <th className="py-2.5 px-3 text-center">Trend</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3">Confirmation Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232E47]/60">
              {displayedStocks.map((stock) => {
                const isPos = (stock.price_change_pct || 0) >= 0;
                const rvol = stock.rvol;
                const pv = stock.price_volume_confirmation;
                return (
                  <tr 
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-bold text-white">{stock.symbol}</td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-[170px] truncate">{stock.company_name}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">₹{stock.latest_close?.toFixed(2)}</td>
                    <td className={`py-2.5 px-3 text-right font-mono font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{(stock.price_change_pct || 0).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                      {(stock.volume || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {stock.six_session_avg_volume ? Math.round(stock.six_session_avg_volume).toLocaleString() : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-300">
                      {rvol ? `${rvol.toFixed(2)}x` : '-'}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono ${(stock.volume_change_pct || 0) >= 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {(stock.volume_change_pct || 0) >= 0 ? '+' : ''}{(stock.volume_change_pct || 0).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        stock.volume_trend === 'INCREASING' ? 'bg-emerald-500/15 text-emerald-400' :
                        stock.volume_trend === 'DECREASING' ? 'bg-rose-500/15 text-rose-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {stock.volume_trend || 'STEADY'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-medium text-slate-300">
                        {stock.volume_classification?.replace(/_/g, ' ') || 'NORMAL'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs font-semibold text-slate-200">{pv?.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
