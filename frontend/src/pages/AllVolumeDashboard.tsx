import React, { useState, useMemo } from 'react';
import type { DailyScanResponse, LiveScanResponse } from '../types';
import { 
  Activity, 
  Search, 
  ArrowUpDown, 
  RefreshCw, 
  BarChart2,
  Radio
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AllVolumeDashboardProps {
  dailyScan: DailyScanResponse | null;
  liveScan: LiveScanResponse | null;
  loading: boolean;
  onSelectStock: (symbol: string) => void;
  onRefreshLive?: () => Promise<void>;
}

type SortField = 'volume' | 'rvol' | 'weightage' | 'score' | 'price_change_pct' | 'price';
type SortOrder = 'asc' | 'desc';

interface UnifiedStockVolume {
  symbol: string;
  company_name: string;
  sector: string;
  weightage: number;
  price: number;
  price_change_pct: number;
  volume: number;
  six_session_avg_volume: number | null;
  rvol: number | null;
  volume_trend: string;
  volume_classification: string;
  score: number;
  price_volume_confirmation?: { signal: string; label: string; detail?: string };
  isLive: boolean;
  update_timestamp?: string;
}

export const AllVolumeDashboard: React.FC<AllVolumeDashboardProps> = ({
  dailyScan,
  liveScan,
  loading: _loading,
  onSelectStock,
  onRefreshLive
}) => {
  const { t } = useLanguage();
  const [feedMode, setFeedMode] = useState<'LIVE' | 'COMPLETED'>('LIVE');
  const [showTopChart, setShowTopChart] = useState<boolean>(true);
  const [chartMetric, setChartMetric] = useState<'VOLUME' | 'RVOL'>('VOLUME');
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [dmaFilter, setDmaFilter] = useState('ALL');
  const [volumeFilter, setVolumeFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [refreshing, setRefreshing] = useState(false);

  // Normalize stocks based on feed mode
  const unifiedStocks: UnifiedStockVolume[] = useMemo(() => {
    if (feedMode === 'LIVE' && liveScan && liveScan.all_results && liveScan.all_results.length > 0) {
      return liveScan.all_results.map(s => ({
        symbol: s.symbol,
        company_name: s.company_name,
        sector: s.sector || s.industry || 'Unknown',
        weightage: s.weightage,
        price: s.live_price,
        price_change_pct: s.price_change_pct || 0,
        volume: s.cumulative_volume || 0,
        six_session_avg_volume: s.six_session_avg_volume || null,
        rvol: s.rvol || null,
        volume_trend: s.volume_trend || 'STEADY',
        volume_classification: s.volume_classification || 'NORMAL_VOLUME',
        score: s.live_score,
        price_volume_confirmation: s.price_volume_confirmation,
        isLive: true,
        update_timestamp: s.update_timestamp
      }));
    }

    const completed = dailyScan?.all_results || [];
    return completed.map(s => ({
      symbol: s.symbol,
      company_name: s.company_name,
      sector: s.sector || s.industry || 'Unknown',
      weightage: s.weightage,
      price: s.latest_close,
      price_change_pct: s.price_change_pct || 0,
      volume: s.volume || 0,
      six_session_avg_volume: s.six_session_avg_volume || null,
      rvol: s.rvol || null,
      volume_trend: s.volume_trend || 'STEADY',
      volume_classification: s.volume_classification || 'NORMAL_VOLUME',
      score: s.score,
      price_volume_confirmation: s.price_volume_confirmation,
      isLive: false,
      update_timestamp: s.latest_trading_date
    }));
  }, [feedMode, liveScan, dailyScan]);

  // Distinct sectors
  const sectors = useMemo(() => {
    const set = new Set<string>();
    unifiedStocks.forEach(s => {
      if (s.sector) set.add(s.sector);
    });
    return Array.from(set).sort();
  }, [unifiedStocks]);

  const maxVolume = useMemo(() => {
    return Math.max(...unifiedStocks.map(s => s.volume), 1);
  }, [unifiedStocks]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleRefreshClick = async () => {
    if (!onRefreshLive) return;
    setRefreshing(true);
    try {
      await onRefreshLive();
    } finally {
      setRefreshing(false);
    }
  };

  // Filtered and sorted stocks
  const filteredStocks = useMemo(() => {
    return unifiedStocks.filter(stock => {
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

      // Volume class
      let matchesVolume = true;
      if (volumeFilter !== 'ALL') {
        matchesVolume = stock.volume_classification === volumeFilter;
      }

      return matchesSearch && matchesSector && matchesDma && matchesVolume;
    }).sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [unifiedStocks, searchQuery, sectorFilter, dmaFilter, volumeFilter, sortField, sortOrder]);

  // Top 10 stocks for the bar chart
  const topStocksForChart = useMemo(() => {
    const copy = [...unifiedStocks];
    if (chartMetric === 'VOLUME') {
      return copy.sort((a, b) => b.volume - a.volume).slice(0, 10);
    } else {
      return copy.sort((a, b) => (b.rvol || 0) - (a.rvol || 0)).slice(0, 10);
    }
  }, [unifiedStocks, chartMetric]);

  const chartMaxVal = useMemo(() => {
    if (chartMetric === 'VOLUME') {
      return Math.max(...topStocksForChart.map(s => s.volume), 1);
    }
    return Math.max(...topStocksForChart.map(s => s.rvol || 0), 1);
  }, [topStocksForChart, chartMetric]);

  return (
    <div className="space-y-5">
      {/* Page Header with Mode Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl bg-[#121824] border border-[#232E47]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {t('Page 3 — All 50 Stocks Live Traded Volume & Bar Graph Engine')}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t('Real-time live volume streaming, 6-session volume benchmarks, RVOL metrics, and interactive volume bar graphs for all 50 NIFTY constituents.')}
          </p>
        </div>

        {/* Live Controls & Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Feed Mode Switcher */}
          <div className="flex items-center bg-[#0B0E14] p-1 rounded-lg border border-[#232E47] text-xs">
            <button
              onClick={() => setFeedMode('LIVE')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                feedMode === 'LIVE'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{t('Live Volume Feed')}</span>
            </button>
            <button
              onClick={() => setFeedMode('COMPLETED')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                feedMode === 'COMPLETED'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('Completed Daily')}
            </button>
          </div>

          {/* Refresh Button */}
          {onRefreshLive && (
            <button
              onClick={handleRefreshClick}
              disabled={refreshing}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#1A2234] hover:bg-slate-700/60 text-slate-200 text-xs font-semibold border border-[#232E47] transition-all disabled:opacity-50"
              title="Refresh live volume from exchange feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? t('Refreshing...') : t('Refresh Feed')}</span>
            </button>
          )}

          {/* Toggle Top Bar Chart */}
          <button
            onClick={() => setShowTopChart(!showTopChart)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              showTopChart 
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
                : 'bg-[#1A2234] text-slate-400 border-[#232E47]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{showTopChart ? t('Hide Bar Graph') : t('Show Bar Graph')}</span>
          </button>
        </div>
      </div>

      {/* Live Feed Status Banner */}
      <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-[#0E131F] border border-[#232E47] text-xs">
        <div className="flex items-center space-x-2">
          <Radio className={`w-4 h-4 ${feedMode === 'LIVE' ? 'text-emerald-400 animate-pulse' : 'text-sky-400'}`} />
          <span className="text-slate-400">DATA SOURCE:</span>
          <span className="font-bold text-white font-mono">
            {feedMode === 'LIVE' 
              ? (liveScan?.feed_status || 'UPSTOX V3 STREAMING FEED')
              : 'COMPLETED DAILY BHAVCOPY / NSE HISTORICAL'}
          </span>
        </div>
        <div className="text-slate-400 text-[11px] font-mono">
          Last Synced: {liveScan?.feed_timestamp ? new Date(liveScan.feed_timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Top 10 Stocks Volume Bar Graph Section */}
      {showTopChart && (
        <div className="p-5 rounded-xl bg-[#121824] border border-[#232E47]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-2 mb-4">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded bg-purple-500/20 text-purple-400">
                <BarChart2 className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-white">
                {chartMetric === 'VOLUME' ? t('Top 10 Most Active Stocks — Traded Volume Bar Graph') : t('Top 10 Most Active Stocks — Relative Volume (RVOL) Leaderboard')}
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex bg-[#0B0E14] p-0.5 rounded-lg border border-[#232E47] text-[11px]">
                <button
                  onClick={() => setChartMetric('VOLUME')}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    chartMetric === 'VOLUME' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('By Volume')}
                </button>
                <button
                  onClick={() => setChartMetric('RVOL')}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    chartMetric === 'RVOL' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('By RVOL')}
                </button>
              </div>
            </div>
          </div>

          {/* Bar Graph Rows */}
          <div className="space-y-3">
            {topStocksForChart.map((s, idx) => {
              const isPos = s.price_change_pct >= 0;
              const barVal = chartMetric === 'VOLUME' ? s.volume : (s.rvol || 0);
              const barWidthPct = Math.min(100, Math.max(5, (barVal / chartMaxVal) * 100));

              // Benchmark marker calculation for volume mode
              const avgVol = s.six_session_avg_volume || 0;
              const avgPct = chartMetric === 'VOLUME' && chartMaxVal > 0 
                ? Math.min(100, (avgVol / chartMaxVal) * 100) 
                : null;

              return (
                <div 
                  key={s.symbol}
                  onClick={() => onSelectStock(s.symbol)}
                  className="group p-2.5 rounded-lg bg-[#0B0E14]/70 hover:bg-[#1A2234] border border-[#232E47]/50 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-500 text-[10px] w-4">{idx + 1}.</span>
                      <strong className="text-white font-bold group-hover:text-sky-400 transition-colors">
                        {s.symbol}
                      </strong>
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {s.company_name}
                      </span>
                      <span className="text-[10px] text-slate-500">({s.weightage.toFixed(2)}%)</span>
                    </div>

                    <div className="flex items-center space-x-3 font-mono">
                      <span className={`text-[11px] font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPos ? '+' : ''}{s.price_change_pct.toFixed(2)}%
                      </span>
                      <span className="text-slate-200 font-bold">
                        {chartMetric === 'VOLUME' ? `${(s.volume / 1000000).toFixed(2)}M` : `${s.rvol?.toFixed(2)}x RVOL`}
                      </span>
                      {chartMetric === 'VOLUME' && s.six_session_avg_volume && (
                        <span className="text-slate-500 text-[10px]">
                          (Avg: {(s.six_session_avg_volume / 1000000).toFixed(2)}M)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Bar Canvas */}
                  <div className="relative w-full h-4 bg-[#121824] rounded-full overflow-hidden border border-[#232E47]/60">
                    {/* The Volume Bar */}
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPos
                          ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400'
                          : 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400'
                      }`}
                      style={{ width: `${barWidthPct}%` }}
                    />

                    {/* Benchmark Average Line Marker */}
                    {avgPct !== null && avgPct > 0 && (
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-sm"
                        style={{ left: `${avgPct}%` }}
                        title={`6-Session Avg: ${(avgVol / 1000000).toFixed(2)}M`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2 border-t border-[#232E47]/40">
            <span>Bars indicate traded volume intensity. Color: Emerald = Up session, Rose = Down session.</span>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm inline-block"></span>
              <span className="text-amber-400 font-mono">Amber Marker = 6-Session Average Benchmark</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('Search stock symbol or name...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#121824] border border-[#232E47] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Sector Filter */}
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#121824] border border-[#232E47] text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
        >
          <option value="ALL">{t('All Sectors')} ({unifiedStocks.length})</option>
          {sectors.map(sec => (
            <option key={sec} value={sec}>{sec}</option>
          ))}
        </select>

        {/* DMA Score Filter */}
        <select
          value={dmaFilter}
          onChange={(e) => setDmaFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#121824] border border-[#232E47] text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
        >
          <option value="ALL">{t('All DMA Scores')}</option>
          <option value="6_6">{t('6/6 Bullish Alignment')}</option>
          <option value="5_6">{t('5/6 Bullish Alignment')}</option>
        </select>

        {/* Volume Classification Filter */}
        <select
          value={volumeFilter}
          onChange={(e) => setVolumeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#121824] border border-[#232E47] text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
        >
          <option value="ALL">{t('All Volume Tiers')}</option>
          <option value="VERY_HIGH_VOLUME">{t('Very High Volume (>= 2.0x RVOL)')}</option>
          <option value="HIGH_VOLUME">{t('High Volume (1.25x - 2.0x RVOL)')}</option>
          <option value="NORMAL_VOLUME">{t('Normal Volume')}</option>
          <option value="LOW_VOLUME">{t('Low Volume')}</option>
          <option value="DECLINING_VOLUME">{t('Declining Volume')}</option>
        </select>
      </div>

      {/* Main Table with Inline Bar Meters */}
      <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-[#232E47]/70 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{filteredStocks.length}</strong> of 50 constituents
            {feedMode === 'LIVE' && <span className="text-emerald-400 font-bold ml-1.5">(Live Intraday Mode)</span>}
          </div>
          <div className="text-[11px] text-slate-500">
            Click any column header to sort &bull; Click row to view stock chart
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#1A2234] text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">{t('Stock & Sector')}</th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('weightage')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>{t('Weight')}</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>{feedMode === 'LIVE' ? t('Live LTP') : t('Close')}</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('price_change_pct')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>{t('Change %')}</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                {/* Volume with Visual Meter */}
                <th 
                  className="py-3 px-3 cursor-pointer hover:text-white min-w-[200px]"
                  onClick={() => handleSort('volume')}
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>{feedMode === 'LIVE' ? t('Live Cumulative Vol') : t('Traded Volume')}</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-[9px] text-purple-400 lowercase font-normal">(bar meter)</span>
                      <ArrowUpDown className="w-3 h-3 text-purple-400" />
                    </div>
                  </div>
                </th>
                <th className="py-3 px-3 text-right">{t('6-Day Avg Vol')}</th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('rvol')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>{t('RVOL')}</span>
                    <ArrowUpDown className="w-3 h-3 text-sky-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">{t('Trend')}</th>
                <th className="py-3 px-3">{t('Classification')}</th>
                <th 
                  className="py-3 px-3 text-center cursor-pointer hover:text-white"
                  onClick={() => handleSort('score')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>{t('DMA Score')}</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">{t('Price-Volume Signal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232E47]/60">
              {filteredStocks.map((stock) => {
                const isPositive = stock.price_change_pct >= 0;
                const rvol = stock.rvol;
                const pv = stock.price_volume_confirmation;
                const volPct = Math.min(100, Math.max(3, (stock.volume / maxVolume) * 100));

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
                      <div className="text-[10px] text-slate-500">{stock.sector}</div>
                    </td>

                    {/* Weight % */}
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-300">
                      {stock.weightage ? `${stock.weightage.toFixed(2)}%` : '-'}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      ₹{stock.price.toFixed(2)}
                    </td>

                    {/* Price Change % */}
                    <td className={`py-3 px-3 text-right font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? '+' : ''}{stock.price_change_pct.toFixed(2)}%
                    </td>

                    {/* Traded Volume + Embedded Bar Meter */}
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-between text-xs font-mono mb-1">
                        <span className="font-semibold text-slate-100">
                          {stock.volume.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {(stock.volume / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      {/* Mini Bar Meter */}
                      <div className="w-full h-1.5 bg-[#0B0E14] rounded-full overflow-hidden border border-[#232E47]/60">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            (rvol || 0) >= 2.0 
                              ? 'bg-gradient-to-r from-purple-500 to-purple-400'
                              : isPositive 
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' 
                              : 'bg-gradient-to-r from-rose-600 to-rose-400'
                          }`}
                          style={{ width: `${volPct}%` }}
                        />
                      </div>
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
