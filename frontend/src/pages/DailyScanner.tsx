import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Check, X, ArrowUpRight } from 'lucide-react';
import type { DailyScanResponse, StockScanResult } from '../types';

interface DailyScannerProps {
  dailyScan: DailyScanResponse | null;
  loading: boolean;
  onSelectStock: (symbol: string) => void;
}

export const DailyScanner: React.FC<DailyScannerProps> = ({
  dailyScan,
  loading,
  onSelectStock
}) => {
  const [filterMode, setFilterMode] = useState<'all' | '6_6' | '5_6'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStocks = useMemo(() => {
    if (!dailyScan) return [];
    let list: StockScanResult[] = dailyScan.all_results;

    if (filterMode === '6_6') {
      list = dailyScan.stocks_6_6;
    } else if (filterMode === '5_6') {
      list = dailyScan.stocks_5_6;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        s => s.symbol.toLowerCase().includes(q) || s.company_name.toLowerCase().includes(q)
      );
    }

    // Sort by score desc, then dist_dma20 desc
    return [...list].sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      const distA = a.distances.dist_dma20 ?? -999;
      const distB = b.distances.dist_dma20 ?? -999;
      return distB - distA;
    });
  }, [dailyScan, filterMode, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white">Daily DMA Scanner</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Completed Session: {dailyScan?.completed_session_date || 'Analyzing'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Official completed NSE closing prices compared with 6 Daily Simple Moving Averages.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbol (e.g. RELIANCE)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#121824] border border-[#232E47] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-56"
            />
          </div>

          <div className="flex items-center bg-[#121824] border border-[#232E47] rounded-lg p-1">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterMode === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All 50 ({dailyScan?.total_constituents || 50})
            </button>
            <button
              onClick={() => setFilterMode('6_6')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterMode === '6_6'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              6/6 Bullish ({dailyScan?.count_6_6 || 0})
            </button>
            <button
              onClick={() => setFilterMode('5_6')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterMode === '5_6'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-sky-400'
              }`}
            >
              5/6 Bullish ({dailyScan?.count_5_6 || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Main Results Table */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1A2234] text-slate-300 uppercase font-mono border-b border-[#232E47]">
              <tr>
                <th className="py-3 px-4">Stock Symbol</th>
                <th className="py-3 px-4">Close (₹)</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-3 text-center">5 DMA</th>
                <th className="py-3 px-3 text-center">10 DMA</th>
                <th className="py-3 px-3 text-center">20 DMA</th>
                <th className="py-3 px-3 text-center">50 DMA</th>
                <th className="py-3 px-3 text-center">100 DMA</th>
                <th className="py-3 px-3 text-center">200 DMA</th>
                <th className="py-3 px-4 text-right">vs 20D Dist</th>
                <th className="py-3 px-4 text-center">Fresh Crossover</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232E47]">
              {loading && !dailyScan ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    Loading genuine NIFTY 50 DMA calculations...
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    No stocks match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => {
                  const hasFreshXo = stock.fresh_crossovers && stock.fresh_crossovers.length > 0;
                  return (
                    <tr 
                      key={stock.symbol}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Symbol & Company */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">{stock.symbol}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {stock.company_name}
                        </div>
                      </td>

                      {/* Close Price */}
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        ₹{stock.latest_close.toFixed(2)}
                      </td>

                      {/* DMA Score Badge */}
                      <td className="py-3 px-4 text-center">
                        <span 
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${
                            stock.score === 6
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : stock.score === 5
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {stock.score}/6
                        </span>
                      </td>

                      {/* DMA Indicators (5, 10, 20, 50, 100, 200) */}
                      {[5, 10, 20, 50, 100, 200].map((period) => {
                        const isAbove = stock.comparisons[`above_dma${period}`];
                        const smaVal = stock.smas[`dma${period}`];
                        return (
                          <td key={period} className="py-3 px-3 text-center font-mono">
                            <div className="flex flex-col items-center">
                              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                                isAbove 
                                  ? 'bg-emerald-500/20 text-emerald-400 font-bold' 
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {isAbove ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              </span>
                              <span className="text-[9px] text-slate-400 mt-0.5">
                                {smaVal ? smaVal.toFixed(0) : '-'}
                              </span>
                            </div>
                          </td>
                        );
                      })}

                      {/* Distance vs 20 DMA */}
                      <td className="py-3 px-4 text-right font-mono text-xs">
                        {stock.distances.dist_dma20 !== null ? (
                          <span className={stock.distances.dist_dma20 >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {stock.distances.dist_dma20 >= 0 ? '+' : ''}
                            {stock.distances.dist_dma20.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Fresh Crossovers Tag */}
                      <td className="py-3 px-4 text-center">
                        {hasFreshXo ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{stock.fresh_crossovers.map(x => `${x.period}D`).join(', ')}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Deep Dive Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onSelectStock(stock.symbol)}
                          className="px-2.5 py-1 rounded bg-[#1A2234] hover:bg-sky-600/30 text-sky-400 text-xs font-medium border border-[#232E47] hover:border-sky-500/50 transition-colors inline-flex items-center space-x-1"
                        >
                          <span>Chart</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
