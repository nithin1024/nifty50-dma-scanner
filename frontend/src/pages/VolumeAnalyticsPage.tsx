import React, { useState } from 'react';
import type { DailyScanResponse, LiveScanResponse } from '../types';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Zap,
  Layers
} from 'lucide-react';
import { VolumeTrendChart } from '../components/VolumeTrendChart';

interface VolumeAnalyticsPageProps {
  dailyScan: DailyScanResponse | null;
  liveScan?: LiveScanResponse | null;
  loading?: boolean;
  onSelectStock: (symbol: string) => void;
}

export const VolumeAnalyticsPage: React.FC<VolumeAnalyticsPageProps> = ({
  dailyScan,
  liveScan: _liveScan,
  loading: _loading,
  onSelectStock
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'VERY_HIGH' | 'HIGH' | 'DIVERGENCE'>('ALL');
  const [barChartMetric, setBarChartMetric] = useState<'RVOL' | 'VOLUME'>('RVOL');
  const [inspectedSymbol, setInspectedSymbol] = useState<string>('RELIANCE');

  const allStocks = dailyScan?.all_results || [];
  const inspectedStock = allStocks.find(s => s.symbol === inspectedSymbol) || allStocks[0];

  // RVOL Leaderboard
  const rvolSorted = [...allStocks].sort((a, b) => (b.rvol || 0) - (a.rvol || 0));

  // Volume Leaderboard
  const volumeSorted = [...allStocks].sort((a, b) => (b.volume || 0) - (a.volume || 0));

  // Price-Volume Divergence Candidates:
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

  // Counts for tier breakdown
  const veryHighCount = allStocks.filter(s => s.volume_classification === 'VERY_HIGH_VOLUME').length;
  const highCount = allStocks.filter(s => s.volume_classification === 'HIGH_VOLUME').length;
  const normalCount = allStocks.filter(s => s.volume_classification === 'NORMAL_VOLUME').length;
  const lowCount = allStocks.filter(s => s.volume_classification === 'LOW_VOLUME').length;
  const decliningCount = allStocks.filter(s => s.volume_classification === 'DECLINING_VOLUME').length;

  // Top stocks for bar graph
  const barChartStocks = barChartMetric === 'RVOL' 
    ? rvolSorted.slice(0, 12)
    : volumeSorted.slice(0, 12);

  const maxBarValue = barChartMetric === 'RVOL'
    ? Math.max(...barChartStocks.map(s => s.rvol || 0), 1)
    : Math.max(...barChartStocks.map(s => s.volume || 0), 1);

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
          Quantitative Relative Volume (RVOL) benchmarked strictly against 5-session completed averages, volume trend trajectories, and interactive volume bar graphs.
        </p>
      </div>

      {/* Volume Classification Distribution Bar Meter */}
      <div className="p-5 rounded-xl bg-[#121824] border border-[#232E47]">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>NIFTY 50 Volume Classification Distribution</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">Total: {allStocks.length} Constituents</span>
        </div>

        {/* Multi-Segment Distribution Bar */}
        <div className="w-full h-4 bg-[#0B0E14] rounded-full overflow-hidden flex border border-[#232E47] mb-3">
          <div 
            style={{ width: `${(veryHighCount / (allStocks.length || 1)) * 100}%` }}
            className="h-full bg-purple-500 transition-all"
            title={`Very High Volume: ${veryHighCount} stocks`}
          />
          <div 
            style={{ width: `${(highCount / (allStocks.length || 1)) * 100}%` }}
            className="h-full bg-sky-500 transition-all"
            title={`High Volume: ${highCount} stocks`}
          />
          <div 
            style={{ width: `${(normalCount / (allStocks.length || 1)) * 100}%` }}
            className="h-full bg-emerald-500 transition-all"
            title={`Normal Volume: ${normalCount} stocks`}
          />
          <div 
            style={{ width: `${(lowCount / (allStocks.length || 1)) * 100}%` }}
            className="h-full bg-amber-500 transition-all"
            title={`Low Volume: ${lowCount} stocks`}
          />
          <div 
            style={{ width: `${(decliningCount / (allStocks.length || 1)) * 100}%` }}
            className="h-full bg-rose-500 transition-all"
            title={`Declining Volume: ${decliningCount} stocks`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-[#1A2234]">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <div>
              <div className="text-[10px] text-slate-400">VERY HIGH (&ge;2.0x)</div>
              <strong className="text-purple-300 font-mono">{veryHighCount} stocks</strong>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-[#1A2234]">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <div>
              <div className="text-[10px] text-slate-400">HIGH (1.25x - 2.0x)</div>
              <strong className="text-sky-300 font-mono">{highCount} stocks</strong>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-[#1A2234]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div>
              <div className="text-[10px] text-slate-400">NORMAL (0.75x - 1.25x)</div>
              <strong className="text-emerald-300 font-mono">{normalCount} stocks</strong>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-[#1A2234]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div>
              <div className="text-[10px] text-slate-400">LOW (0.5x - 0.75x)</div>
              <strong className="text-amber-300 font-mono">{lowCount} stocks</strong>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-[#1A2234]">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div>
              <div className="text-[10px] text-slate-400">DECLINING (&lt;0.5x)</div>
              <strong className="text-rose-300 font-mono">{decliningCount} stocks</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Volume Bar Graph Section */}
      <div className="p-5 rounded-xl bg-[#121824] border border-[#232E47]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-purple-500/20 text-purple-400">
              <BarChart2 className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-white">
              Institutional Volume Bar Graph — Top 12 Leaders
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-[#0B0E14] p-0.5 rounded-lg border border-[#232E47] text-xs">
              <button
                onClick={() => setBarChartMetric('RVOL')}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  barChartMetric === 'RVOL' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Top RVOL Ratio
              </button>
              <button
                onClick={() => setBarChartMetric('VOLUME')}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  barChartMetric === 'VOLUME' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Top Traded Volume
              </button>
            </div>
          </div>
        </div>

        {/* Bar Graph Rows */}
        <div className="space-y-3">
          {barChartStocks.map((s, idx) => {
            const isPos = (s.price_change_pct || 0) >= 0;
            const currentVal = barChartMetric === 'RVOL' ? (s.rvol || 0) : (s.volume || 0);
            const barWidthPct = Math.min(100, Math.max(5, (currentVal / maxBarValue) * 100));

            // Avg volume marker
            const avgVol = s.six_session_avg_volume || 0;
            const avgPct = barChartMetric === 'VOLUME' && maxBarValue > 0
              ? Math.min(100, (avgVol / maxBarValue) * 100)
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
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      {s.company_name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ({s.score}/6 DMA)
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 font-mono">
                    <span className={`text-[11px] font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{(s.price_change_pct || 0).toFixed(2)}%
                    </span>
                    <span className="text-purple-300 font-bold">
                      {barChartMetric === 'RVOL' ? `${(s.rvol || 0).toFixed(2)}x RVOL` : `${((s.volume || 0) / 1000000).toFixed(2)}M Vol`}
                    </span>
                    {barChartMetric === 'VOLUME' && s.six_session_avg_volume && (
                      <span className="text-slate-500 text-[10px]">
                        (Avg: {(s.six_session_avg_volume / 1000000).toFixed(2)}M)
                      </span>
                    )}
                  </div>
                </div>

                {/* The Bar */}
                <div className="relative w-full h-4 bg-[#121824] rounded-full overflow-hidden border border-[#232E47]/60">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      (s.rvol || 0) >= 2.0
                        ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400'
                        : isPos
                        ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400'
                        : 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400'
                    }`}
                    style={{ width: `${barWidthPct}%` }}
                  />

                  {/* Benchmark line for Volume mode */}
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
          <span>Click on any stock row to open full technical DMA and Volume chart.</span>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-purple-500 rounded-sm inline-block"></span>
            <span className="text-purple-300 font-mono">Purple = RVOL &ge; 2.0x (Extreme Expansion)</span>
          </div>
        </div>
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
                  <div className="text-[10px] text-slate-400">{s.score}/6 DMA &bull; Down on Volume</div>
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

      {/* Selected Stock Dedicated Volume Trend Card */}
      {inspectedStock && (
        <VolumeTrendChart 
          title="Stock Volume Trend"
          symbol={inspectedStock.symbol}
          sessions={(inspectedStock.six_session_history || []).map(s => ({
            date: s.trading_date,
            volume: s.traded_volume,
            price_change_pct: s.price_change_pct,
            close_price: s.close_price
          }))}
          avgVolume={inspectedStock.six_session_avg_volume || undefined}
        />
      )}

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
                    onClick={() => {
                      setInspectedSymbol(stock.symbol);
                      onSelectStock(stock.symbol);
                    }}
                    className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      inspectedSymbol === stock.symbol ? 'bg-purple-500/10' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-white">{stock.symbol}</td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-[160px]">{stock.company_name}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">₹{stock.latest_close?.toFixed(2)}</td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{(stock.price_change_pct || 0).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200">{(stock.volume || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {stock.six_session_avg_volume ? Math.round(stock.six_session_avg_volume).toLocaleString() : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {rvol !== null && rvol !== undefined ? (
                        <span className={rvol >= 2.0 ? 'text-purple-400' : rvol >= 1.25 ? 'text-emerald-400' : 'text-slate-300'}>
                          {rvol.toFixed(2)}x
                        </span>
                      ) : '-'}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono ${(stock.volume_change_pct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stock.volume_change_pct !== null && stock.volume_change_pct !== undefined ? `${stock.volume_change_pct >= 0 ? '+' : ''}${stock.volume_change_pct.toFixed(2)}%` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        stock.volume_trend === 'INCREASING' ? 'bg-emerald-500/20 text-emerald-400' :
                        stock.volume_trend === 'DECREASING' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {stock.volume_trend || 'STEADY'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] text-slate-300">
                        {stock.volume_classification?.replace(/_/g, ' ') || 'NORMAL VOLUME'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[11px] font-semibold ${
                        pv?.signal === 'STRONG_ACCUMULATION' ? 'text-emerald-400' :
                        pv?.signal === 'DISTRIBUTION' ? 'text-rose-400' :
                        'text-slate-400'
                      }`}>
                        {pv?.label || 'Neutral'}
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
