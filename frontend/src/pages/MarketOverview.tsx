import React from 'react';
import type { BackendHealth, DataStatusReport, DailyScanResponse, HeavyweightsReport, NavTab, MarketIntelligenceReport } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  ShieldCheck, 
  Crown, 
  Download, 
  RefreshCw
} from 'lucide-react';
import { getExcelDownloadUrl } from '../services/api';
import { MarketIntelligenceDashboard } from '../components/MarketIntelligenceDashboard';

interface MarketOverviewProps {
  health: BackendHealth | null;
  dataStatus: DataStatusReport | null;
  dailyScan: DailyScanResponse | null;
  heavyweights: HeavyweightsReport | null;
  intelligence?: MarketIntelligenceReport | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (tab: NavTab) => void;
  onSelectStock: (symbol: string) => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  health: _health,
  dataStatus,
  dailyScan,
  heavyweights,
  intelligence,
  loading,
  onRefresh,
  onNavigate,
  onSelectStock
}) => {
  const verifiedCount = dataStatus?.verified_stocks_count ?? dailyScan?.verified_constituents ?? 50;
  const coveragePct = Math.round((verifiedCount / 50) * 100);

  const count66 = dailyScan?.count_6_6 ?? 0;
  const count56 = dailyScan?.count_5_6 ?? 0;
  const freshCrossoversCount = dailyScan?.fresh_crossovers?.length ?? 0;

  const topSupporter = heavyweights?.top_supporter;
  const topDragger = heavyweights?.top_dragger;
  const combinedWeight = heavyweights?.combined_weightage_pct ?? 45.5;
  const combinedContrib = heavyweights?.combined_estimated_contribution_pts ?? 0.0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Session Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-[#121824] via-[#161F33] to-[#121824] border border-[#232E47] shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              NSE Settlement Session
            </span>
            <span className="text-xs text-slate-400">
              Completed Date: <strong className="text-slate-200">{dailyScan?.completed_session_date || 'Latest'}</strong>
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">&bull;</span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Source: <strong className="text-sky-400">NSE Official Bhavcopy &amp; Facts</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            NIFTY 50 Institutional DMA &amp; Volume Executive Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time quantitative screening across 6 Simple Moving Averages and 6-session volume benchmarks.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <a
            href={getExcelDownloadUrl()}
            download
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Daily Excel (12 Sheets)</span>
          </a>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-[#1A2234] hover:bg-slate-700/60 border border-[#232E47] text-slate-300 transition-colors"
            title="Refresh Scan Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: 6/6 Bullish */}
        <div 
          onClick={() => onNavigate('dma-scanner')}
          className="p-4 rounded-xl bg-[#121824] border border-[#232E47] hover:border-emerald-500/50 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-emerald-400">Category A: 6/6 Bullish</span>
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-white">{count66} <span className="text-xs text-slate-400 font-normal">/ 50 stocks</span></div>
          <div className="text-[11px] text-slate-400 mt-1">
            Price &gt; 5, 10, 20, 50, 100, 200 DMA
          </div>
        </div>

        {/* Metric 2: 5/6 Bullish Watchlist */}
        <div 
          onClick={() => onNavigate('dma-scanner')}
          className="p-4 rounded-xl bg-[#121824] border border-[#232E47] hover:border-amber-500/50 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-amber-400">Category B: 5/6 Watchlist</span>
            <span className="p-1 rounded bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-white">{count56} <span className="text-xs text-slate-400 font-normal">/ 50 stocks</span></div>
          <div className="text-[11px] text-slate-400 mt-1">
            Price above exactly 5 SMAs (1 hurdle)
          </div>
        </div>

        {/* Metric 3: Fresh Bullish Crossovers */}
        <div 
          onClick={() => onNavigate('dma-scanner')}
          className="p-4 rounded-xl bg-[#121824] border border-[#232E47] hover:border-sky-500/50 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-sky-400">Fresh Bullish Crossovers</span>
            <span className="p-1 rounded bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-white">{freshCrossoversCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Close[-2] &le; SMA[-2] &amp; Close[-1] &gt; SMA[-1]
          </div>
        </div>

        {/* Metric 4: Verified Data Coverage */}
        <div 
          onClick={() => onNavigate('data-quality')}
          className="p-4 rounded-xl bg-[#121824] border border-[#232E47] hover:border-purple-500/50 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-purple-400">Data Coverage (220+ Sess)</span>
            <span className="p-1 rounded bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-white">{coveragePct}% <span className="text-xs text-slate-400 font-normal">({verifiedCount}/50)</span></div>
          <div className="text-[11px] text-slate-400 mt-1">
            Unadjusted settlement prices verified
          </div>
        </div>
      </div>

      {/* Institutional Market Intelligence & Inflation Suite */}
      <MarketIntelligenceDashboard intelligence={intelligence || null} />

      {/* Heavyweight Impact Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Top 7 Combined Index Weight */}
        <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47] flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400">
            <Crown className="w-4 h-4" />
            <span>Top 7 Heavyweights Impact</span>
          </div>
          <div className="my-3">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-black text-white">{combinedWeight}%</span>
              <span className={`text-sm font-bold ${combinedContrib >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {combinedContrib >= 0 ? '+' : ''}{combinedContrib.toFixed(4)} pts est.
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              HDFCBANK, ICICIBANK, RELIANCE, BHARTIARTL, LT, SBIN, INFY
            </div>
          </div>
          <div className="text-[11px] text-slate-500 border-t border-[#232E47]/50 pt-2">
            {heavyweights?.concentration_analysis || 'Top 7 heavyweights determine over 45% of total index momentum.'}
          </div>
        </div>

        {/* Card 2: Primary Supporter */}
        <div className="p-4 rounded-xl bg-[#121824] border border-emerald-500/20 bg-emerald-500/[0.02]">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-emerald-400 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Leading Index Supporter</span>
            </span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Top Push</span>
          </div>
          {topSupporter ? (
            <div className="my-2 cursor-pointer" onClick={() => onSelectStock(topSupporter.symbol)}>
              <div className="text-xl font-bold text-white hover:text-emerald-400 transition-colors">
                {topSupporter.symbol} <span className="text-xs font-normal text-slate-400">({topSupporter.company_name})</span>
              </div>
              <div className="flex items-center space-x-3 mt-1 text-sm">
                <span className="text-emerald-400 font-semibold">+{topSupporter.price_change_pct.toFixed(2)}%</span>
                <span className="text-slate-400 text-xs">Contrib: +{topSupporter.contribution_pts.toFixed(4)} pts</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 my-4">Evaluating market sessions...</div>
          )}
          <div className="text-[11px] text-slate-500">
            Calculated as: Weightage (%) &times; Price Change (%) / 100
          </div>
        </div>

        {/* Card 3: Primary Dragger */}
        <div className="p-4 rounded-xl bg-[#121824] border border-rose-500/20 bg-rose-500/[0.02]">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-rose-400 flex items-center space-x-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Leading Index Dragger</span>
            </span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">Top Drag</span>
          </div>
          {topDragger ? (
            <div className="my-2 cursor-pointer" onClick={() => onSelectStock(topDragger.symbol)}>
              <div className="text-xl font-bold text-white hover:text-rose-400 transition-colors">
                {topDragger.symbol} <span className="text-xs font-normal text-slate-400">({topDragger.company_name})</span>
              </div>
              <div className="flex items-center space-x-3 mt-1 text-sm">
                <span className="text-rose-400 font-semibold">{topDragger.price_change_pct.toFixed(2)}%</span>
                <span className="text-slate-400 text-xs">Contrib: {topDragger.contribution_pts.toFixed(4)} pts</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 my-4">Evaluating market sessions...</div>
          )}
          <div className="text-[11px] text-slate-500">
            Calculated as: Weightage (%) &times; Price Change (%) / 100
          </div>
        </div>
      </div>

      {/* Combined Quantitative Signals Quick Table */}
      <div className="p-5 rounded-xl bg-[#121824] border border-[#232E47]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Combined DMA + Volume Market Signals</span>
              <span className="text-xs px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 font-semibold">
                Phase 7 Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Synthesis of 6-DMA technical alignment, price direction, and volume expansion confirmation.
            </p>
          </div>
          <button
            onClick={() => onNavigate('dma-scanner')}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1"
          >
            <span>View Full Scanner Table &rarr;</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#1A2234] text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Symbol</th>
                <th className="py-2.5 px-3">Company Name</th>
                <th className="py-2.5 px-3">Weight</th>
                <th className="py-2.5 px-3 text-right">Close</th>
                <th className="py-2.5 px-3 text-right">Chg %</th>
                <th className="py-2.5 px-3 text-center">DMA Score</th>
                <th className="py-2.5 px-3 text-right">RVOL</th>
                <th className="py-2.5 px-3">Volume Class</th>
                <th className="py-2.5 px-3">Combined Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232E47]/60">
              {(dailyScan?.all_results || []).slice(0, 10).map((r) => {
                const sig = r.combined_signal;
                return (
                  <tr 
                    key={r.symbol}
                    onClick={() => onSelectStock(r.symbol)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-bold text-white">{r.symbol}</td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-[180px] truncate">{r.company_name}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{r.weightage?.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">₹{r.latest_close?.toFixed(2)}</td>
                    <td className={`py-2.5 px-3 text-right font-mono font-semibold ${(r.price_change_pct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {(r.price_change_pct || 0) >= 0 ? '+' : ''}{(r.price_change_pct || 0).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                        r.score === 6 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        r.score === 5 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-700/40 text-slate-400'
                      }`}>
                        {r.score}/6
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                      {r.rvol ? `${r.rvol.toFixed(2)}x` : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        r.volume_classification === 'VERY_HIGH_VOLUME' ? 'bg-purple-500/20 text-purple-300' :
                        r.volume_classification === 'HIGH_VOLUME' ? 'bg-sky-500/20 text-sky-300' :
                        r.volume_classification === 'LOW_VOLUME' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {r.volume_classification?.replace('_', ' ') || 'NORMAL'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        sig?.signal === 'STRONG_BULLISH' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        sig?.signal === 'FRESH_BREAKOUT' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                        sig?.signal === 'BULLISH_WATCHLIST' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        sig?.signal === 'WEAKENING' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {sig?.label || 'NO SIGNAL'}
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
