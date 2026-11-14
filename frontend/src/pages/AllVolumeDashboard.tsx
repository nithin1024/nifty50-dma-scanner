import React, { useState, useMemo } from 'react';
import type { DailyScanResponse } from '../types';
import { 
  Activity, 
  Search, 
  ArrowUpDown 
} from 'lucide-react';

interface AllVolumeDashboardProps {
  dailyScan: DailyScanResponse | null;
  loading: boolean;
  onSelectStock: (symbol: string) => void;
}

type SortField = 'volume' | 'rvol' | 'weightage' | 'score' | 'price_change_pct' | 'latest_close';
type SortOrder = 'asc' | 'desc';

export const AllVolumeDashboard: React.FC<AllVolumeDashboardProps> = ({
  dailyScan,
  loading: _loading,
  onSelectStock
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [dmaFilter, setDmaFilter] = useState('ALL');
  const [volumeFilter, setVolumeFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('rvol');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const stocks = dailyScan?.all_results || [];

  // Distinct sectors
  const sectors = useMemo(() => {
    const set = new Set<string>();
    stocks.forEach(s => {
      if (s.sector) set.add(s.sector);
    });
    return Array.from(set).sort();
  }, [stocks]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        stock.symbol.toLowerCase().includes(q) || 
        stock.company_name.toLowerCase().includes(q);

      // Sector
      const matchesSector = sectorFilter === 'ALL' || stock.sector === sectorFilter;

      // DMA
      let matchesDma = true;
      if (dmaFilter === '6_6') matchesDma = stock.score === 6;
      else if (dmaFilter === '5_6') matchesDma = stock.score === 5;
      else if (dmaFilter === 'CROSSOVERS') matchesDma = (stock.fresh_crossovers?.length || 0) > 0;

      // Volume class
      let matchesVolume = true;
      if (volumeFilter !== 'ALL') {
        matchesVolume = stock.volume_classification === volumeFilter;
      }

      return matchesSearch && matchesSector && matchesDma && matchesVolume;
    }).sort((a, b) => {
      let valA: any = a[sortField] ?? 0;
      let valB: any = b[sortField] ?? 0;

      if (sortField === 'score') {
        valA = a.score;
        valB = b.score;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [stocks, searchQuery, sectorFilter, dmaFilter, volumeFilter, sortField, sortOrder]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 rounded-xl bg-[#121824] border border-[#232E47]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Page 3 — All 50 Stocks Volume &amp; RVOL Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time cumulative volume tracking, 6-session historical averages, RVOL, and price-volume confirmation across all 50 constituents.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>Showing <strong className="text-white">{filteredStocks.length}</strong> of 50 stocks</span>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search stock symbol or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A2234] border border-[#232E47] rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sector */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-[#1A2234] border border-[#232E47] rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Sectors</option>
            {sectors.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>

          {/* DMA Score Filter */}
          <select
            value={dmaFilter}
            onChange={(e) => setDmaFilter(e.target.value)}
            className="bg-[#1A2234] border border-[#232E47] rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All DMA Scores</option>
            <option value="6_6">Category A: 6/6 Bullish Only</option>
            <option value="5_6">Category B: 5/6 Watchlist Only</option>
            <option value="CROSSOVERS">Fresh Crossovers Only</option>
          </select>

          {/* Volume Classification Filter */}
          <select
            value={volumeFilter}
            onChange={(e) => setVolumeFilter(e.target.value)}
            className="bg-[#1A2234] border border-[#232E47] rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Volume Classes</option>
            <option value="VERY_HIGH_VOLUME">Very High Volume (RVOL &ge; 2.0x)</option>
            <option value="HIGH_VOLUME">High Volume (1.25x - 2.0x)</option>
            <option value="NORMAL_VOLUME">Normal Volume (0.75x - 1.25x)</option>
            <option value="LOW_VOLUME">Low Volume (0.50x - 0.75x)</option>
            <option value="DECLINING_VOLUME">Declining Volume (&lt; 0.50x)</option>
          </select>
        </div>
      </div>

      {/* Main Quantitative Table */}
      <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#1A2234] text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">Stock &amp; Sector</th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('weightage')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Weight %</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('latest_close')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>LTP</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('price_change_pct')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Chg %</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('volume')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Cumulative Vol</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">6-Day Avg Vol</th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('rvol')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>RVOL</span>
                    <ArrowUpDown className="w-3 h-3 text-sky-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Trend</th>
                <th className="py-3 px-3">Classification</th>
                <th 
                  className="py-3 px-3 text-center cursor-pointer hover:text-white"
                  onClick={() => handleSort('score')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>DMA Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Price-Volume Conviction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232E47]/60">
              {filteredStocks.map((stock) => {
                const isPositive = (stock.price_change_pct || 0) >= 0;
                const rvol = stock.rvol;
                const pv = stock.price_volume_confirmation;

                return (
                  <tr 
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    {/* Stock & Sector */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-white text-sm">{stock.symbol}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[170px]">{stock.company_name}</div>
                      <div className="text-[10px] text-slate-500">{stock.sector || stock.industry}</div>
                    </td>

                    {/* Weight % */}
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-300">
                      {stock.weightage ? `${stock.weightage.toFixed(2)}%` : '-'}
                    </td>

                    {/* LTP */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      ₹{stock.latest_close?.toFixed(2)}
                    </td>

                    {/* Price Change % */}
                    <td className={`py-3 px-3 text-right font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? '+' : ''}{(stock.price_change_pct || 0).toFixed(2)}%
                    </td>

                    {/* Cumulative Volume */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-100">
                      {(stock.volume || 0).toLocaleString()}
                    </td>

                    {/* 6-Day Avg Volume */}
                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      {stock.six_session_avg_volume ? Math.round(stock.six_session_avg_volume).toLocaleString() : '-'}
                    </td>

                    {/* RVOL */}
                    <td className="py-3 px-3 text-right font-mono">
                      {rvol !== null && rvol !== undefined ? (
                        <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                          rvol >= 2.0 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          rvol >= 1.25 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          rvol >= 0.75 ? 'bg-slate-700/40 text-slate-200' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {rvol.toFixed(2)}x
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Volume Trend */}
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        stock.volume_trend === 'INCREASING' ? 'bg-emerald-500/15 text-emerald-400' :
                        stock.volume_trend === 'DECREASING' ? 'bg-rose-500/15 text-rose-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {stock.volume_trend || 'STEADY'}
                      </span>
                    </td>

                    {/* Volume Classification */}
                    <td className="py-3 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        stock.volume_classification === 'VERY_HIGH_VOLUME' ? 'bg-purple-500/20 text-purple-300' :
                        stock.volume_classification === 'HIGH_VOLUME' ? 'bg-sky-500/20 text-sky-300' :
                        stock.volume_classification === 'LOW_VOLUME' ? 'bg-amber-500/20 text-amber-300' :
                        stock.volume_classification === 'DECLINING_VOLUME' ? 'bg-rose-500/20 text-rose-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {stock.volume_classification?.replace(/_/g, ' ') || 'NORMAL VOLUME'}
                      </span>
                    </td>

                    {/* DMA Score */}
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-1 rounded font-mono font-bold text-xs ${
                        stock.score === 6 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        stock.score === 5 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {stock.score}/6
                      </span>
                    </td>

                    {/* Price-Volume Conviction */}
                    <td className="py-3 px-3">
                      <div className="text-xs font-semibold text-slate-200">{pv?.label || 'Neutral'}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{pv?.detail}</div>
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
