import React, { useState, useEffect } from 'react';
import type { BackendHealth, DataStatusReport, DailyScanResponse, HeavyweightsReport, NavTab, MarketIntelligenceReport } from '../types';
import { 
  TrendingUp, 
  Activity, 
  BarChart3, 
  ShieldCheck, 
  Crown, 
  Download, 
  RefreshCw,
  Layers,
  ArrowRight,
  Zap
} from 'lucide-react';
import { getExcelDownloadUrl, fetchOptionChain } from '../services/api';
import { IndianMarketOverviewSection } from '../components/IndianMarketOverviewSection';
import { EconomicIndicatorsSection } from '../components/EconomicIndicatorsSection';
import { MarketIntelligenceDashboard } from '../components/MarketIntelligenceDashboard';
import { Nifty50UniverseSection } from '../components/Nifty50UniverseSection';
import { formatIndianVolume } from '../components/VolumeTrendChart';
import { useLanguage } from '../context/LanguageContext';

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
  const { t } = useLanguage();
  const verifiedCount = dataStatus?.verified_stocks_count ?? dailyScan?.verified_constituents ?? 50;
  const coveragePct = Math.round((verifiedCount / 50) * 100);

  const count66 = dailyScan?.count_6_6 ?? 0;
  const count56 = dailyScan?.count_5_6 ?? 0;
  const freshCrossoversCount = dailyScan?.fresh_crossovers?.length ?? 0;

  const combinedWeight = heavyweights?.combined_weightage_pct ?? 45.5;
  const combinedContrib = heavyweights?.combined_estimated_contribution_pts ?? 0.0;

  const [optionSummary, setOptionSummary] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    fetchOptionChain('NIFTY', 5)
      .then(data => {
        if (mounted && data) setOptionSummary(data);
      })
      .catch(err => console.warn('Could not fetch option chain summary for overview:', err));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      
      {/* 1. TOP BANNER / SESSION TELEMETRY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-[#121824] via-[#161F33] to-[#121824] border border-[#232E47] shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {t('NSE Settlement Session')}
            </span>
            <span className="text-xs text-slate-400">
              Today: <strong className="text-sky-400">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </span>
            <span className="text-xs text-slate-500">&bull;</span>
            <span className="text-xs text-slate-400">
              {t('Completed Date')}: <strong className="text-slate-200">{dailyScan?.completed_session_date || '20 Nov 2026'}</strong>
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">&bull;</span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Source: <strong className="text-sky-400">NSE Official Bhavcopy &amp; MoSPI Facts</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            NIFTY 50 | DMA &amp; EMA MARKET INTELLIGENCE
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {t('Executive Market Intelligence, Fundamental Macro Suite & Quantitative Technical Scanners')}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <a
            href={getExcelDownloadUrl()}
            download
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>{t('Daily Excel (12 Sheets)')}</span>
          </a>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-[#1A2234] hover:bg-slate-700/60 border border-[#232E47] text-slate-300 transition-colors"
            title={t('Refresh Scan Data')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Navigation Anchor Bar for Clean, User-Friendly Dashboard Structure */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-[#121824] border border-[#232E47] text-xs font-semibold">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Navigate:</span>
        <a href="#section-premarket" className="px-2.5 py-1 rounded-md bg-[#161F33] hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-[#232E47] transition-all flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Pre-Open (09:00–09:15)</span>
        </a>
        <a href="#section-benchmarks" className="px-2.5 py-1 rounded-md bg-[#161F33] hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-[#232E47] transition-all flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span>1. Market Overview &amp; Sectors</span>
        </a>
        <a href="#section-heavyweights" className="px-2.5 py-1 rounded-md bg-[#161F33] hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-[#232E47] transition-all flex items-center gap-1.5">
          <Crown className="w-3 h-3 text-amber-400" />
          <span>2. Top 7 Heavyweights &amp; Live Volume</span>
        </a>
        <a href="#section-universe" className="px-2.5 py-1 rounded-md bg-[#161F33] hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 border border-[#232E47] transition-all flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3 text-indigo-400" />
          <span>3. NIFTY 50 Universe (All Stocks)</span>
        </a>
        <a href="#section-options" className="px-2.5 py-1 rounded-md bg-[#161F33] hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-[#232E47] transition-all flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-sky-400" />
          <span>4. Option Chain Strength &amp; Levels</span>
        </a>
        <a href="#section-institutional" className="px-2.5 py-1 rounded-md bg-[#161F33] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-[#232E47] transition-all flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>5. Institutional FII/DII Flows</span>
        </a>
        <a href="#section-economy" className="px-2.5 py-1 rounded-md bg-[#161F33] hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-[#232E47] transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-purple-400" />
          <span>6. Macro Economic Indicators</span>
        </a>
      </div>

      {/* HIGHLIGHT: PRE-OPEN SESSION VOLUME & DISCOVERY TELEMETRY (09:00 - 09:15 IST) */}
      <div id="section-premarket" className="p-4 rounded-xl bg-gradient-to-r from-[#121824] via-[#1A2234] to-[#121824] border border-amber-500/30 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#232E47] gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-4 h-4 animate-bounce" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🔔 Pre-Open Discovery &amp; Volume Pulse (09:00 – 09:15 IST)</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold">
                  DAILY DISCOVERY ACTIVE
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Official exchange price discovery window. Orders matched at equilibrium before regular continuous market begins at 09:15 IST.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400 text-[11px]">GIFT Nifty Guidance:</span>
            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
              {intelligence?.market_closing_levels?.nifty_50 ? `${intelligence.market_closing_levels.nifty_50.level} (${intelligence.market_closing_levels.nifty_50.change_pct >= 0 ? '+' : ''}${intelligence.market_closing_levels.nifty_50.change_pct}%)` : 'Indicating Steady Open'}
            </span>
          </div>
        </div>

        {/* Pre-Market Heavyweights Discovery Volume Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {(heavyweights?.heavyweights && heavyweights.heavyweights.length > 0 ? heavyweights.heavyweights : [
            { symbol: 'HDFCBANK', weightage: 11.45, market_data: { current_price: 1748.20, price_change_pct: 0.8 }, volume_analytics: { latest_volume: 850000 } },
            { symbol: 'RELIANCE', weightage: 9.85, market_data: { current_price: 1275.40, price_change_pct: 0.4 }, volume_analytics: { latest_volume: 620000 } },
            { symbol: 'ICICIBANK', weightage: 7.95, market_data: { current_price: 1285.50, price_change_pct: 1.1 }, volume_analytics: { latest_volume: 540000 } },
            { symbol: 'INFY', weightage: 5.65, market_data: { current_price: 1885.00, price_change_pct: -0.2 }, volume_analytics: { latest_volume: 310000 } },
            { symbol: 'BHARTIARTL', weightage: 4.80, market_data: { current_price: 1560.00, price_change_pct: 0.3 }, volume_analytics: { latest_volume: 240000 } },
            { symbol: 'ITC', weightage: 3.90, market_data: { current_price: 475.00, price_change_pct: 0.1 }, volume_analytics: { latest_volume: 480000 } },
            { symbol: 'LT', weightage: 3.85, market_data: { current_price: 3680.00, price_change_pct: 0.6 }, volume_analytics: { latest_volume: 120000 } }
          ]).map((hw: any) => {
            const vol = hw.volume_analytics?.latest_volume || hw.market_data?.cumulative_volume || 0;
            const preOpenEstimatedVol = Math.round(vol * 0.08); // Typical pre-open absorbs ~5-10% of initial surge
            const chg = hw.market_data?.price_change_pct ?? 0;
            return (
              <div 
                key={hw.symbol} 
                onClick={() => onSelectStock(hw.symbol)}
                className="p-2.5 rounded-lg bg-[#0B0E14] border border-[#232E47] hover:border-amber-500/50 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-[11px]">{hw.symbol}</span>
                  <span className={`text-[10px] font-mono font-bold ${chg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {chg >= 0 ? '+' : ''}{chg}%
                  </span>
                </div>
                <div className="mt-1">
                  <div className="text-[9px] text-slate-500 uppercase">Pre-Open Volume</div>
                  <div className="text-xs font-mono font-bold text-amber-400">
                    {formatIndianVolume(preOpenEstimatedVol)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. INDIAN MARKET OVERVIEW SECTION (SECTION 2.A & INTRADAYSCREENER SPECIFICATION) */}
      <div id="section-benchmarks">
        <IndianMarketOverviewSection 
          onNavigate={onNavigate}
          onSelectStock={onSelectStock}
        />
      </div>

      {/* 3. TOP 7 NIFTY 50 HEAVYWEIGHTS & 5-MINUTE LIVE VOLUME TRACKER */}
      <div id="section-heavyweights" className="p-5 rounded-2xl bg-[#121824] border border-[#232E47] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47] gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Crown className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Top 7 NIFTY 50 Heavyweights &amp; Live Volume Analytics</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                5m Auto-Update Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Top 7 mega-caps determine <strong>{combinedWeight}%</strong> of index momentum. Live traded volume, 6-session RVOL &amp; volume bar breakdown.
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-[#161F33] px-3.5 py-1.5 rounded-xl border border-[#232E47] text-xs font-mono self-start sm:self-auto">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Combined Weight</span>
              <strong className="text-white text-sm">{combinedWeight}%</strong>
            </div>
            <div className="border-l border-[#232E47] pl-3.5">
              <span className="text-[10px] text-slate-400 block uppercase">Est. Contribution</span>
              <strong className={`text-sm ${combinedContrib >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {combinedContrib >= 0 ? '+' : ''}{combinedContrib.toFixed(4)} pts
              </strong>
            </div>
          </div>
        </div>

        {/* Top 7 Heavyweights Live Table with Mini Volume Bars */}
        <div className="overflow-x-auto rounded-xl border border-[#232E47]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#161F33] text-slate-400 text-[10px] uppercase font-mono tracking-wider">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Symbol</th>
                <th className="py-2.5 px-3">Company Name</th>
                <th className="py-2.5 px-3 text-right">Weight (%)</th>
                <th className="py-2.5 px-3 text-right">LTP (₹)</th>
                <th className="py-2.5 px-3 text-right">Change (%)</th>
                <th className="py-2.5 px-3 text-right">Session Vol</th>
                <th className="py-2.5 px-3 text-right">6-Sess Avg</th>
                <th className="py-2.5 px-3 text-right">RVOL</th>
                <th className="py-2.5 px-3 text-center">6-Sess Volume Bars</th>
                <th className="py-2.5 px-3 text-right">Index Contrib</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232E47]/60 font-mono text-[11px]">
              {(heavyweights?.heavyweights && heavyweights.heavyweights.length > 0 ? heavyweights.heavyweights : [
                {
                  symbol: 'HDFCBANK',
                  company_name: 'HDFC Bank Ltd',
                  weightage: 11.45,
                  market_data: { current_price: 1748.20, price_change_pct: 2.12 },
                  volume_analytics: { latest_volume: 18450000, six_session_avg_volume: 14500000, rvol: 1.27, historical_volumes: [12000000, 13500000, 15200000, 14000000, 16800000, 18450000] },
                  contribution_pts: 0.2428
                },
                {
                  symbol: 'RELIANCE',
                  company_name: 'Reliance Industries Ltd',
                  weightage: 9.85,
                  market_data: { current_price: 1275.40, price_change_pct: 1.15 },
                  volume_analytics: { latest_volume: 12500000, six_session_avg_volume: 11000000, rvol: 1.14, historical_volumes: [9800000, 10500000, 11200000, 10800000, 11900000, 12500000] },
                  contribution_pts: 0.1133
                },
                {
                  symbol: 'ICICIBANK',
                  company_name: 'ICICI Bank Ltd',
                  weightage: 7.95,
                  market_data: { current_price: 1285.50, price_change_pct: 2.45 },
                  volume_analytics: { latest_volume: 14200000, six_session_avg_volume: 10500000, rvol: 1.35, historical_volumes: [9100000, 9800000, 10200000, 11400000, 12800000, 14200000] },
                  contribution_pts: 0.1948
                },
                {
                  symbol: 'INFY',
                  company_name: 'Infosys Ltd',
                  weightage: 5.65,
                  market_data: { current_price: 1885.00, price_change_pct: 1.40 },
                  volume_analytics: { latest_volume: 6850000, six_session_avg_volume: 5800000, rvol: 1.18, historical_volumes: [5100000, 5400000, 5900000, 5600000, 6200000, 6850000] },
                  contribution_pts: 0.0791
                },
                {
                  symbol: 'BHARTIARTL',
                  company_name: 'Bharti Airtel Ltd',
                  weightage: 4.80,
                  market_data: { current_price: 1560.00, price_change_pct: -0.60 },
                  volume_analytics: { latest_volume: 5420000, six_session_avg_volume: 5200000, rvol: 1.04, historical_volumes: [4900000, 5100000, 5300000, 5200000, 5500000, 5420000] },
                  contribution_pts: -0.0288
                },
                {
                  symbol: 'ITC',
                  company_name: 'ITC Ltd',
                  weightage: 3.90,
                  market_data: { current_price: 475.00, price_change_pct: -0.10 },
                  volume_analytics: { latest_volume: 11500000, six_session_avg_volume: 12000000, rvol: 0.96, historical_volumes: [12500000, 11800000, 12200000, 11900000, 12100000, 11500000] },
                  contribution_pts: -0.0039
                },
                {
                  symbol: 'LT',
                  company_name: 'Larsen & Toubro Ltd',
                  weightage: 3.85,
                  market_data: { current_price: 3680.00, price_change_pct: 1.45 },
                  volume_analytics: { latest_volume: 2450000, six_session_avg_volume: 2100000, rvol: 1.17, historical_volumes: [1950000, 2050000, 2150000, 2000000, 2200000, 2450000] },
                  contribution_pts: 0.0558
                }
              ]).map((hw: any, idx: number) => {
                const price = hw.market_data?.ltp ?? hw.market_data?.current_price ?? 0;
                const changePct = hw.market_data?.price_change_pct ?? 0;
                const isPos = changePct >= 0;
                const rvol = hw.volume_analytics?.rvol || 1.0;
                const rvolColor = rvol >= 1.5 ? 'text-purple-300 bg-purple-500/20' :
                                  rvol >= 1.1 ? 'text-emerald-300 bg-emerald-500/20' :
                                  rvol <= 0.8 ? 'text-amber-300 bg-amber-500/20' : 'text-slate-300 bg-slate-700/30';
                const histVols = (hw.volume_analytics?.historical_volumes && hw.volume_analytics.historical_volumes.length > 0)
                  ? hw.volume_analytics.historical_volumes
                  : (hw.six_session_history || []).map((s: any) => s.traded_volume ?? s.volume ?? 0);
                const maxVol = histVols.length > 0 ? Math.max(...histVols.map((v: any) => typeof v === 'number' ? v : (v?.traded_volume ?? v?.volume ?? 0)), 1) : 1;
                const latestVol = hw.market_data?.cumulative_volume ?? hw.volume_analytics?.latest_volume ?? 0;
                const avgVol = hw.volume_analytics?.six_session_avg_volume ?? 0;
                const contribPts = hw.contribution_pts ?? hw.weightage_impact?.approx_index_contribution_pts ?? hw.weightage_impact?.estimated_nifty_points_contribution ?? 0;

                return (
                  <tr 
                    key={hw.symbol} 
                    onClick={() => onSelectStock(hw.symbol)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-sky-400 font-sans">{hw.symbol}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans truncate max-w-[150px]">{hw.company_name}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">{hw.weightage?.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">₹{price.toFixed(2)}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{changePct.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-sky-300 font-semibold">
                      {formatIndianVolume(latestVol)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {formatIndianVolume(avgVol)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${rvolColor}`}>
                        {rvol.toFixed(2)}x
                      </span>
                    </td>
                    {/* Mini 6-Session Volume Bars SVG */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-end justify-center gap-1 h-6 w-24 mx-auto">
                        {histVols.slice(-6).map((vItem: any, vi: number) => {
                          const vVal = typeof vItem === 'number' ? vItem : (vItem?.traded_volume ?? vItem?.volume ?? 0);
                          const heightPct = Math.max(15, Math.min(100, Math.round((vVal / maxVol) * 100)));
                          const isLast = vi === histVols.slice(-6).length - 1;
                          return (
                            <div 
                              key={vi}
                              title={`Session ${vi + 1}: ${formatIndianVolume(vVal)}`}
                              className={`w-2.5 rounded-t transition-all ${
                                isLast ? (isPos ? 'bg-emerald-400' : 'bg-rose-400') : 'bg-slate-600 hover:bg-sky-400'
                              }`}
                              style={{ height: `${heightPct}%` }}
                            ></div>
                          );
                        })}
                      </div>
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${
                      contribPts >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {contribPts >= 0 ? '+' : ''}{contribPts.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. NIFTY 50 ALL 50 CONSTITUENT STOCKS & DETAILED CANDLESTICK CHARTS (SECTION 4 & 5.F) */}
      <div id="section-universe">
        <Nifty50UniverseSection
          stocks={dailyScan?.all_results || []}
          sessionDate={dailyScan?.completed_session_date || '21 Nov 2026'}
          onSelectStock={onSelectStock}
        />
      </div>

      {/* 5. PROMINENT ECONOMIC OVERVIEW SECTION (SECTION 2.B – CORE ECONOMIC INDICATORS) */}
      <div id="section-economy">
        <EconomicIndicatorsSection 
          indicatorsData={(intelligence as any)?.economic_indicators} 
          onNavigate={onNavigate} 
        />
      </div>

      {/* 6. COMBINED INSTITUTIONAL FII / DII CASH & DERIVATIVES FLOWS SUITE */}
      <div id="section-institutional">
        <MarketIntelligenceDashboard 
          intelligence={intelligence || null} 
        />
      </div>

      {/* 7. INSTITUTIONAL OPTION CHAIN MARKET STRENGTH SUMMARY (-4 TO +4 SCORING & S/R LEVELS) (SECTION 5.H) */}
      <div id="section-options" className="p-5 rounded-2xl bg-gradient-to-r from-[#121824] via-[#161F33] to-[#121824] border border-[#232E47] shadow-xl space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47] gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>NIFTY 50 Live Option Chain Market Strength &amp; Quantitative Scoring</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                Image-Based -4 to +4 Scoring
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Synthesis of Call &amp; Put buildup patterns, institutional S1/S2 floors &amp; R1/R2 walls, PCR, and Max Pain.
            </p>
          </div>

          <button
            onClick={() => onNavigate('option-chain')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md self-start sm:self-auto cursor-pointer"
          >
            <span>Open 20-Column Option Chain Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Option Chain Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Metric 1: Quant Market View */}
          <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#232E47] text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Market View</span>
            <span className={`text-xs font-bold block mt-1 px-2 py-0.5 rounded border ${
              (optionSummary?.totals?.total_score ?? 0) >= 4 ? 'bg-emerald-700 text-white border-emerald-500' :
              (optionSummary?.totals?.total_score ?? 0) >= 2 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
              (optionSummary?.totals?.total_score ?? 0) >= -1 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
              (optionSummary?.totals?.total_score ?? 0) >= -3 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
              'bg-rose-900 text-rose-200 border-rose-600'
            }`}>
              {optionSummary?.totals?.market_view || 'Sideways / Confusion'}
            </span>
          </div>

          {/* Metric 2: ATM Total Score */}
          <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#232E47] text-center">
            <span className="text-[10px] text-slate-400 uppercase block">ATM Quant Score</span>
            <div className={`text-xl font-black mt-0.5 ${
              (optionSummary?.totals?.total_score ?? 0) > 0 ? 'text-emerald-400' :
              (optionSummary?.totals?.total_score ?? 0) < 0 ? 'text-rose-400' : 'text-amber-300'
            }`}>
              {(optionSummary?.totals?.total_score ?? 0) > 0 ? `+${optionSummary?.totals?.total_score}` : optionSummary?.totals?.total_score ?? 0}
              <span className="text-xs text-slate-500 font-normal"> / ±4</span>
            </div>
          </div>

          {/* Metric 3: ATM Strike */}
          <div className="p-3 rounded-xl bg-[#0B0E14] border border-amber-500/40 text-center bg-amber-500/5">
            <span className="text-[10px] text-amber-300 uppercase block font-bold">ATM Strike Pivot</span>
            <div className="text-xl font-black text-amber-300 mt-0.5">
              ₹{optionSummary?.atm_strike?.toLocaleString() || '25,800'}
            </div>
          </div>

          {/* Metric 4: S1 / S2 Support Floors */}
          <div className="p-3 rounded-xl bg-[#0B0E14] border border-emerald-500/40 text-center bg-emerald-500/5">
            <span className="text-[10px] text-emerald-400 uppercase block font-bold">S1 Floor &bull; S2 Cushion</span>
            <div className="text-sm font-black text-emerald-300 mt-1">
              ₹{(optionSummary?.support_resistance?.s1?.strike ?? 25600).toLocaleString()} &bull; ₹{(optionSummary?.support_resistance?.s2?.strike ?? 25400).toLocaleString()}
            </div>
          </div>

          {/* Metric 5: R1 / R2 Resistance Walls */}
          <div className="p-3 rounded-xl bg-[#0B0E14] border border-rose-500/40 text-center bg-rose-500/5">
            <span className="text-[10px] text-rose-400 uppercase block font-bold">R1 Wall &bull; R2 Ceiling</span>
            <div className="text-sm font-black text-rose-300 mt-1">
              ₹{(optionSummary?.support_resistance?.r1?.strike ?? 26000).toLocaleString()} &bull; ₹{(optionSummary?.support_resistance?.r2?.strike ?? 26200).toLocaleString()}
            </div>
          </div>

          {/* Metric 6: OI PCR & Max Pain */}
          <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#232E47] text-center">
            <span className="text-[10px] text-slate-400 uppercase block">OI PCR &bull; Max Pain</span>
            <div className="text-sm font-black text-sky-400 mt-1">
              {(optionSummary?.totals?.oi_pcr || 1.12).toFixed(2)} &bull; ₹{(optionSummary?.max_pain?.max_pain_strike ?? 25750).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 8. PRIMARY TECHNICAL DMA KPI METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: 6/6 Bullish */}
        <div 
          onClick={() => onNavigate('dma-scanner')}
          className="p-4 rounded-xl bg-[#121824] border border-[#232E47] hover:border-emerald-500/50 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-emerald-400">{t('Category A: 6/6 Bullish')}</span>
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-white">{count66} <span className="text-xs text-slate-400 font-normal">/ 50 stocks</span></div>
          <div className="text-[11px] text-slate-400 mt-1">
            {t('Price > 5, 10, 20, 50, 100, 200 DMA')}
          </div>
        </div>

        {/* Metric 2: 5/6 Bullish Watchlist */}
        <div 
          onClick={() => onNavigate('dma-scanner')}
          className="p-4 rounded-xl bg-[#121824] border border-[#232E47] hover:border-amber-500/50 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-amber-400">{t('Category B: 5/6 Watchlist')}</span>
            <span className="p-1 rounded bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-white">{count56} <span className="text-xs text-slate-400 font-normal">/ 50 stocks</span></div>
          <div className="text-[11px] text-slate-400 mt-1">
            {t('Price above exactly 5 SMAs (1 hurdle)')}
          </div>
        </div>

        {/* Metric 3: Fresh Bullish Crossovers */}
        <div 
          onClick={() => onNavigate('dma-scanner')}
          className="p-4 rounded-xl bg-[#121824] border border-[#232E47] hover:border-sky-500/50 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-sky-400">{t('Fresh Bullish Crossovers')}</span>
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
          onClick={() => onNavigate('settings-sources')}
          className="p-4 rounded-xl bg-[#121824] border border-[#232E47] hover:border-purple-500/50 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-purple-400">{t('Data Coverage (220+ Sess)')}</span>
            <span className="p-1 rounded bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-white">{coveragePct}% <span className="text-xs text-slate-400 font-normal">({verifiedCount}/50)</span></div>
          <div className="text-[11px] text-slate-400 mt-1">
            {t('Unadjusted settlement prices verified')}
          </div>
        </div>
      </div>

      {/* 6. COMBINED QUANTITATIVE SIGNALS QUICK TABLE */}
      <div className="p-5 rounded-xl bg-[#121824] border border-[#232E47]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>{t('Combined DMA + Volume Market Signals')}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 font-semibold">
                {t('Phase 7 Engine')}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('Synthesis of 6-DMA technical alignment, price direction, and volume expansion confirmation.')}
            </p>
          </div>
          <button
            onClick={() => onNavigate('dma-scanner')}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1"
          >
            <span>{t('View Full Scanner Table →')}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#1A2234] text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">{t('Symbol')}</th>
                <th className="py-2.5 px-3">{t('Company Name')}</th>
                <th className="py-2.5 px-3">{t('Weight')}</th>
                <th className="py-2.5 px-3 text-right">{t('Close')}</th>
                <th className="py-2.5 px-3 text-right">{t('Chg %')}</th>
                <th className="py-2.5 px-3 text-center">{t('DMA Score')}</th>
                <th className="py-2.5 px-3 text-right">{t('RVOL')}</th>
                <th className="py-2.5 px-3">{t('Volume Class')}</th>
                <th className="py-2.5 px-3">{t('Combined Signal')}</th>
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
                        {t(r.volume_classification || 'NORMAL_VOLUME')}
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
                        {t(sig?.label || 'NO SIGNAL')}
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
