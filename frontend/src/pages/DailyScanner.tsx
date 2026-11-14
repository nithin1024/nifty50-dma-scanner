import React, { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import type { DailyScanResponse, StockScanResult } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface DailyScannerProps {
  dailyScan: DailyScanResponse | null;
  loading: boolean;
  onSelectStock: (symbol: string) => void;
}

export const DailyScanner: React.FC<DailyScannerProps> = ({
  dailyScan,
  loading: _loading,
  onSelectStock
}) => {
  const { t } = useLanguage();
  const [filterMode, setFilterMode] = useState<'all' | '6_6' | '5_6' | 'crossovers' | 'transitions' | 'approaching'>('6_6');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStocks = useMemo(() => {
    if (!dailyScan) return [];
    let list: StockScanResult[] = dailyScan.all_results;

    if (filterMode === '6_6') {
      list = dailyScan.stocks_6_6;
    } else if (filterMode === '5_6') {
      list = dailyScan.stocks_5_6;
    } else if (filterMode === 'crossovers') {
      list = dailyScan.all_results.filter(s => (s.fresh_crossovers?.length || 0) > 0);
    } else if (filterMode === 'transitions') {
      list = dailyScan.all_results.filter(s => s.transition_type && s.transition_type !== 'STABLE');
    } else if (filterMode === 'approaching') {
      list = dailyScan.all_results.filter(s => (s.approaching_crossovers?.length || 0) > 0);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#121824] border border-[#232E47]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{t('Page 2 — Daily DMA Scanner')}</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Completed Session: {dailyScan?.completed_session_date || 'Analyzing'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('Official completed NSE closing prices compared against 6 Simple Moving Averages: 5, 10, 20, 50, 100, and 200 DMA.')}
          </p>
        </div>

        {/* Quick Filter Counts */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setFilterMode('6_6')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              filterMode === '6_6' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-[#1A2234] text-slate-400'
            }`}
          >
            {t('6/6 Bullish')} ({dailyScan?.count_6_6 || 0})
          </button>
          <button
            onClick={() => setFilterMode('5_6')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              filterMode === '5_6' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-[#1A2234] text-slate-400'
            }`}
          >
            {t('5/6 Watchlist')} ({dailyScan?.count_5_6 || 0})
          </button>
          <button
            onClick={() => setFilterMode('crossovers')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              filterMode === 'crossovers' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'bg-[#1A2234] text-slate-400'
            }`}
          >
            {t('Fresh Crossovers')} ({dailyScan?.fresh_crossovers?.length || 0})
          </button>
          <button
            onClick={() => setFilterMode('approaching')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              filterMode === 'approaching' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'bg-[#1A2234] text-slate-400'
            }`}
          >
            {t('Approaching ≤1%')} ({dailyScan?.approaching_crossovers?.length || 0})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              filterMode === 'all' ? 'bg-slate-700 text-white' : 'bg-[#1A2234] text-slate-400'
            }`}
          >
            {t('All 50')}
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder={t('Filter by stock symbol or company name...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#121824] border border-[#232E47] rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Main Stock Table */}
      <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#1A2234] text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">{t('Symbol & Company')}</th>
                <th className="py-3 px-3 text-right">{t('Close')}</th>
                <th className="py-3 px-3 text-right">{t('Chg %')}</th>
                <th className="py-3 px-3 text-center">{t('Score')}</th>
                {/* 6 DMAs */}
                <th className="py-3 px-2 text-right">5 DMA</th>
                <th className="py-3 px-2 text-right">10 DMA</th>
                <th className="py-3 px-2 text-right">20 DMA</th>
                <th className="py-3 px-2 text-right">50 DMA</th>
                <th className="py-3 px-2 text-right">100 DMA</th>
                <th className="py-3 px-2 text-right">200 DMA</th>
                <th className="py-3 px-3">{t('Failed DMA Hurdle / Support')}</th>
                <th className="py-3 px-3 text-right">{t('RVOL')}</th>
                <th className="py-3 px-3">{t('Combined Signal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232E47]/60">
              {filteredStocks.map((stock) => {
                const smas = stock.smas || {};
                const dists = stock.distances || {};
                const isPos = (stock.price_change_pct || 0) >= 0;

                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-white text-sm">{stock.symbol}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[170px]">{stock.company_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Weight: {stock.weightage?.toFixed(2)}%</div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      ₹{stock.latest_close?.toFixed(2)}
                    </td>

                    <td className={`py-3 px-3 text-right font-mono font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{(stock.price_change_pct || 0).toFixed(2)}%
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                        stock.score === 6 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        stock.score === 5 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {stock.score}/6
                      </span>
                    </td>

                    {/* 5, 10, 20, 50, 100, 200 DMAs */}
                    {[5, 10, 20, 50, 100, 200].map(p => {
                      const smaVal = smas[`dma${p}`];
                      const isAbove = smaVal !== null && smaVal !== undefined && stock.latest_close > smaVal;
                      return (
                        <td key={p} className="py-3 px-2 text-right font-mono">
                          <div className={`text-xs ${isAbove ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                            {smaVal ? `₹${smaVal.toFixed(1)}` : '-'}
                          </div>
                          <div className={`text-[10px] ${isAbove ? 'text-emerald-500/80' : 'text-rose-400'}`}>
                            {dists[`dist_dma${p}`] !== null && dists[`dist_dma${p}`] !== undefined ? `${dists[`dist_dma${p}`]! >= 0 ? '+' : ''}${dists[`dist_dma${p}`]!.toFixed(1)}%` : ''}
                          </div>
                        </td>
                      );
                    })}

                    {/* Failed DMA Hurdle / Support */}
                    <td className="py-3 px-3">
                      {stock.is_5_6 ? (
                        <div className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                          <span>Hurdle: {stock.failed_dma_label}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Gap: {stock.failed_dma_distance_pct?.toFixed(2)}% | Supp: {stock.closest_support_dma || '-'}
                          </span>
                        </div>
                      ) : stock.is_6_6 ? (
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>All 6 Cleared (Supp: {stock.closest_support_dma || 'None'})</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          {stock.score}/6 SMAs cleared
                        </span>
                      )}
                    </td>

                    {/* RVOL */}
                    <td className="py-3 px-3 text-right font-mono text-purple-300 font-bold">
                      {stock.rvol ? `${stock.rvol.toFixed(2)}x` : '-'}
                    </td>

                    {/* Combined Signal */}
                    <td className="py-3 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        stock.combined_signal?.signal === 'STRONG_BULLISH' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        stock.combined_signal?.signal === 'FRESH_BREAKOUT' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                        stock.combined_signal?.signal === 'BULLISH_WATCHLIST' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        stock.combined_signal?.signal === 'WEAKENING' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {t(stock.combined_signal?.label || 'NEUTRAL')}
                      </span>
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
