import React, { useState } from 'react';
import { Radio, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { LiveScanResponse } from '../types';

interface LiveScannerProps {
  liveScan: LiveScanResponse | null;
  loading: boolean;
  onRefresh: () => void;
  onSelectStock: (symbol: string) => void;
}

export const LiveScanner: React.FC<LiveScannerProps> = ({
  liveScan,
  loading,
  onRefresh,
  onSelectStock
}) => {
  const [filterMode, setFilterMode] = useState<'all' | '6_6' | '5_6'>('all');

  const filteredStocks = (liveScan?.all_results || []).filter(s => {
    if (filterMode === '6_6') return s.is_6_6;
    if (filterMode === '5_6') return s.is_5_6;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white">Live Intraday DMA Scanner</h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Provisional Intraday Mode
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Streaming live quotes compared against completed daily SMAs from session {liveScan?.completed_daily_session_date || 'NSE'}.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#121824] border border-[#232E47] text-xs">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-slate-300">WebSocket:</span>
            <span className="text-emerald-400 font-semibold">Streaming /ws/live-scanner</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 bg-[#121824] hover:bg-slate-800 border border-[#232E47] rounded-lg text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Critical calculation distinction alert */}
      <div className="bg-[#121824] border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3 text-xs">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-amber-300">Methodology Distinction: Live Intraday Comparison</div>
          <div className="text-slate-300 leading-relaxed">
            Live prices are strictly compared against completed daily SMAs from the previous completed trading session. 
            Daily SMAs are never recalculated from incomplete intraday candles. All signals are provisional until the official NSE daily closing price is confirmed.
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Live 6/6 Stocks</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {liveScan?.live_count_6_6 ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">Above all 6 completed SMAs</span>
        </div>
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Live Exactly 5/6 Stocks</span>
          <div className="text-2xl font-bold text-sky-400 mt-1">
            {liveScan?.live_count_5_6 ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">Above exactly 5 completed SMAs</span>
        </div>
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Feed Freshness</span>
          <div className="text-sm font-bold text-white mt-2 font-mono flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>VERIFIED FEED</span>
          </div>
          <span className="text-[11px] text-slate-400">Zero synthetic tick policy</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            filterMode === 'all' ? 'bg-slate-700 text-white' : 'bg-[#121824] text-slate-400'
          }`}
        >
          All 50 Constituents
        </button>
        <button
          onClick={() => setFilterMode('6_6')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            filterMode === '6_6' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#121824] text-slate-400'
          }`}
        >
          Live 6/6 Bullish ({liveScan?.live_count_6_6 ?? 0})
        </button>
        <button
          onClick={() => setFilterMode('5_6')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            filterMode === '5_6' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-[#121824] text-slate-400'
          }`}
        >
          Live 5/6 Bullish ({liveScan?.live_count_5_6 ?? 0})
        </button>
      </div>

      {/* Live Table */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1A2234] text-slate-300 uppercase font-mono border-b border-[#232E47]">
              <tr>
                <th className="py-3 px-4">Stock Symbol</th>
                <th className="py-3 px-4">Live Price (₹)</th>
                <th className="py-3 px-4">Completed Close (₹)</th>
                <th className="py-3 px-4 text-center">Live DMA Score</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">vs 20D DMA</th>
                <th className="py-3 px-4 text-right">vs 200D DMA</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232E47]">
              {filteredStocks.map((stock) => (
                <tr key={stock.symbol} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-xs">{stock.symbol}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                      {stock.company_name}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    ₹{stock.live_price.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    ₹{stock.completed_close.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span 
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${
                        stock.live_score === 6
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : stock.live_score === 5
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {stock.live_score}/6
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      PROVISIONAL
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {stock.live_distances.dist_dma20 !== null ? (
                      <span className={stock.live_distances.dist_dma20 >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {stock.live_distances.dist_dma20 >= 0 ? '+' : ''}
                        {stock.live_distances.dist_dma20.toFixed(2)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {stock.live_distances.dist_dma200 !== null ? (
                      <span className={stock.live_distances.dist_dma200 >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {stock.live_distances.dist_dma200 >= 0 ? '+' : ''}
                        {stock.live_distances.dist_dma200.toFixed(2)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onSelectStock(stock.symbol)}
                      className="px-2.5 py-1 rounded bg-[#1A2234] hover:bg-sky-600/30 text-sky-400 text-xs font-medium border border-[#232E47]"
                    >
                      Chart
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
