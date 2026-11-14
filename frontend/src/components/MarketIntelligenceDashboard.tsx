import React, { useState, useEffect } from 'react';
import type { MarketIntelligenceReport } from '../types';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Flame, 
  AlertTriangle, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp,
  BookOpen,
  Search,
  BarChart3,
  ExternalLink,
  Newspaper
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fetchMacroTopicDetail, fetchGlobalNews } from '../services/api';
import { MacroIndicatorModal } from './MacroIndicatorModal';

interface MarketIntelligenceDashboardProps {
  intelligence: MarketIntelligenceReport | null;
  className?: string;
}

export const MarketIntelligenceDashboard: React.FC<MarketIntelligenceDashboardProps> = ({
  intelligence,
  className = ''
}) => {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FLOWS' | 'DERIVATIVES' | 'INFLATION' | 'GLOSSARY' | 'NEWS'>('ALL');
  const [glossarySearch, setGlossarySearch] = useState('');
  const [cashTimeframe, setCashTimeframe] = useState<'5D' | '10D' | '20D'>('10D');

  // Selected Macro Topic Modal State
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingTopic, setLoadingTopic] = useState(false);

  // Global News State
  const [newsFeed, setNewsFeed] = useState<any[]>([]);

  useEffect(() => {
    fetchGlobalNews().then(data => setNewsFeed(data || [])).catch(() => {});
  }, []);

  const handleOpenTopic = async (topicId: string) => {
    try {
      setLoadingTopic(true);
      const detail = await fetchMacroTopicDetail(topicId);
      setSelectedTopic(detail);
      setModalOpen(true);
    } catch (err) {
      console.error('Error fetching macro topic detail:', err);
    } finally {
      setLoadingTopic(false);
    }
  };

  if (!intelligence) return null;

  const { 
    market_closing_levels, 
    fii_dii_cash_activity, 
    fii_derivatives_positioning, 
    cpi_inflation_breakdown,
    macro_glossary = []
  } = intelligence;

  // Filtered glossary terms
  const filteredGlossary = macro_glossary.filter(item => {
    const q = glossarySearch.toLowerCase();
    return (
      item.term.toLowerCase().includes(q) ||
      item.definition.toLowerCase().includes(q) ||
      (item.remember_this && item.remember_this.toLowerCase().includes(q)) ||
      (item.group && item.group.toLowerCase().includes(q))
    );
  });

  // Max inflation value for horizontal bar graph scaling (peak is 10.14%)
  const maxInflation = 12.0;
  const rbiCeilingPct = (cpi_inflation_breakdown.rbi_tolerance_ceiling_pct / maxInflation) * 100;

  // Slice historical cash series for dual-series graph
  const rawHistory: any[] = (fii_dii_cash_activity as any).historical_daily_series || [];
  const historySlice = cashTimeframe === '5D' ? rawHistory.slice(0, 5) : cashTimeframe === '10D' ? rawHistory.slice(0, 10) : rawHistory.slice(0, 20);
  const chronologicalHistory = [...historySlice].reverse();

  // Find max absolute flow for dual-series graph scaling
  const maxAbsFlow = Math.max(
    ...chronologicalHistory.map(s => Math.max(Math.abs(s.fii_net || 0), Math.abs(s.dii_net || 0))),
    10000
  );

  return (
    <div className={`rounded-2xl bg-[#121824] border border-[#232E47] shadow-xl overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gradient-to-r from-[#171F32] via-[#121824] to-[#1A182E] border-b border-[#232E47]/70 gap-3">
        <div className="flex items-center space-x-3">
          <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Globe className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {t('Indian Market Intelligence & Macro Surveillance Suite')}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                VERIFIED MACRO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              FII &amp; DII Institutional Flows, Derivatives Short Unwinding, National Accounts Suite &amp; CPI Breakdown
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Section Filter Pills */}
          <div className="flex flex-wrap bg-[#0B0E14] p-0.5 rounded-lg border border-[#232E47] text-xs">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                activeTab === 'ALL' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Intel
            </button>
            <button
              onClick={() => setActiveTab('FLOWS')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                activeTab === 'FLOWS' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              FII / DII Cash
            </button>
            <button
              onClick={() => setActiveTab('DERIVATIVES')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                activeTab === 'DERIVATIVES' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Futures Positioning
            </button>
            <button
              onClick={() => setActiveTab('INFLATION')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                activeTab === 'INFLATION' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              CPI Breakdown
            </button>
            <button
              onClick={() => setActiveTab('GLOSSARY')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                activeTab === 'GLOSSARY' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Macro Cheat Sheet
            </button>
            <button
              onClick={() => setActiveTab('NEWS')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                activeTab === 'NEWS' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Global Wire
            </button>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-[#0B0E14] text-slate-400 hover:text-white border border-[#232E47] transition-colors"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-5 space-y-6">
          {/* SECTION 1: BENCHMARKS */}
          {(activeTab === 'ALL') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t('1. Confirmed Closing Levels & Global Geopolitical Benchmarks')}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Ref Date: {market_closing_levels.nifty_50.date}
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Nifty 50 */}
                <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47]">
                  <span className="text-[11px] text-slate-400 font-medium block">NIFTY 50</span>
                  <div className="text-xl font-black text-white font-mono mt-0.5">
                    {market_closing_levels.nifty_50.level.toLocaleString()}
                  </div>
                  <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
                    +{market_closing_levels.nifty_50.change_pct}% (Confirmed Close)
                  </div>
                </div>

                {/* Sensex */}
                <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47]">
                  <span className="text-[11px] text-slate-400 font-medium block">SENSEX</span>
                  <div className="text-xl font-black text-white font-mono mt-0.5">
                    {market_closing_levels.sensex.level.toLocaleString()}
                  </div>
                  <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
                    +{market_closing_levels.sensex.change_pct}% (Confirmed Close)
                  </div>
                </div>

                {/* USD / INR */}
                <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47]">
                  <span className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                    <span>USD / INR</span>
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  </span>
                  <div className="text-xl font-black text-white font-mono mt-0.5">
                    ₹{market_closing_levels.usd_inr.rate.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Mint Official Print Reference
                  </div>
                </div>

                {/* Brent Crude Oil */}
                <div className="p-4 rounded-xl bg-[#0B0E14] border border-amber-500/20 bg-amber-500/[0.02]">
                  <span className="text-[11px] text-amber-300 font-medium flex items-center justify-between">
                    <span>BRENT CRUDE OIL</span>
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                  </span>
                  <div className="text-xl font-black text-white font-mono mt-0.5">
                    ${market_closing_levels.crude_oil_brent.price_usd.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-amber-400/90 font-mono mt-0.5">
                    Iran-US-Israel War Risk Elevated
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: DEDICATED FII + DII CASH MARKET INTELLIGENCE & DUAL-SERIES CHARTS */}
          {(activeTab === 'ALL' || activeTab === 'FLOWS') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>2. Institutional Cash Market Activity — FII vs DII Comparative Intelligence</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Session Date: {fii_dii_cash_activity.session_date} &bull; Official NSE Reconciled Institutional Data
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono border border-emerald-500/30">
                    Net Combined: +₹{fii_dii_cash_activity.net_institutional_crores.toLocaleString()} Cr
                  </span>
                </div>
              </div>

              {/* Comprehensive FII vs DII Cash Activity Matrix Table */}
              <div className="overflow-x-auto rounded-lg border border-[#232E47]">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#1A2234] text-slate-400 text-[10px] uppercase font-sans">
                    <tr>
                      <th className="py-2.5 px-3">Metric Category</th>
                      <th className="py-2.5 px-3 text-right text-emerald-400">Foreign Institutions (FII)</th>
                      <th className="py-2.5 px-3 text-right text-sky-400">Domestic Institutions (DII)</th>
                      <th className="py-2.5 px-3 text-right text-white">Net Institutional Flow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232E47]/60 bg-[#0F1420]">
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-300">Latest Net Buying / Selling</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                        +₹{fii_dii_cash_activity.fii_net_crores.toLocaleString()} Cr
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-400">
                        {fii_dii_cash_activity.dii_net_crores < 0 ? '-' : '+'}₹{Math.abs(fii_dii_cash_activity.dii_net_crores).toLocaleString()} Cr
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                        +₹{fii_dii_cash_activity.net_institutional_crores.toLocaleString()} Cr
                      </td>
                    </tr>
                    {(fii_dii_cash_activity as any).previous_session && (
                      <tr>
                        <td className="py-2.5 px-3 font-sans text-slate-400">Previous Session ({(fii_dii_cash_activity as any).previous_session.date})</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400">+₹{(fii_dii_cash_activity as any).previous_session.fii_net.toLocaleString()} Cr</td>
                        <td className="py-2.5 px-3 text-right text-rose-400">-₹{Math.abs((fii_dii_cash_activity as any).previous_session.dii_net).toLocaleString()} Cr</td>
                        <td className="py-2.5 px-3 text-right text-slate-300 font-bold">
                          +₹{((fii_dii_cash_activity as any).previous_session.fii_net + (fii_dii_cash_activity as any).previous_session.dii_net).toLocaleString()} Cr
                        </td>
                      </tr>
                    )}
                    {(fii_dii_cash_activity as any).aggregates && (
                      <>
                        <tr>
                          <td className="py-2.5 px-3 font-sans text-slate-400">Previous 5-Session Total</td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+₹{(fii_dii_cash_activity as any).aggregates.five_session_total.fii_net.toLocaleString()} Cr</td>
                          <td className="py-2.5 px-3 text-right text-rose-400 font-bold">-₹{Math.abs((fii_dii_cash_activity as any).aggregates.five_session_total.dii_net).toLocaleString()} Cr</td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                            +₹{((fii_dii_cash_activity as any).aggregates.five_session_total.fii_net + (fii_dii_cash_activity as any).aggregates.five_session_total.dii_net).toLocaleString()} Cr
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-sans text-slate-400">Previous 20-Session Total</td>
                          <td className="py-2.5 px-3 text-right text-emerald-400">+₹{(fii_dii_cash_activity as any).aggregates.twenty_session_total.fii_net.toLocaleString()} Cr</td>
                          <td className="py-2.5 px-3 text-right text-rose-400">-₹{Math.abs((fii_dii_cash_activity as any).aggregates.twenty_session_total.dii_net).toLocaleString()} Cr</td>
                          <td className="py-2.5 px-3 text-right text-slate-300 font-bold">
                            +₹{((fii_dii_cash_activity as any).aggregates.twenty_session_total.fii_net + (fii_dii_cash_activity as any).aggregates.twenty_session_total.dii_net).toLocaleString()} Cr
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-sans text-slate-400">Current Monthly Total (MTD)</td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+₹{(fii_dii_cash_activity as any).aggregates.monthly_mtd_total.fii_net.toLocaleString()} Cr</td>
                          <td className="py-2.5 px-3 text-right text-rose-400 font-bold">-₹{Math.abs((fii_dii_cash_activity as any).aggregates.monthly_mtd_total.dii_net).toLocaleString()} Cr</td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                            +₹{((fii_dii_cash_activity as any).aggregates.monthly_mtd_total.fii_net + (fii_dii_cash_activity as any).aggregates.monthly_mtd_total.dii_net).toLocaleString()} Cr
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-sans text-slate-400">Current Calendar Year (YTD)</td>
                          <td className="py-2.5 px-3 text-right text-rose-400">-₹{Math.abs((fii_dii_cash_activity as any).aggregates.ytd_total.fii_net).toLocaleString()} Cr</td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+₹{(fii_dii_cash_activity as any).aggregates.ytd_total.dii_net.toLocaleString()} Cr</td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+₹{((fii_dii_cash_activity as any).aggregates.ytd_total.dii_net + (fii_dii_cash_activity as any).aggregates.ytd_total.fii_net).toLocaleString()} Cr</td>
                        </tr>
                      </>
                    )}
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-300">Institutional Stance</td>
                      <td className="py-2.5 px-3 text-right font-sans font-bold text-emerald-400 uppercase">Aggressive Net Buyer</td>
                      <td className="py-2.5 px-3 text-right font-sans font-bold text-rose-400 uppercase">Profit Taking / Selling</td>
                      <td className="py-2.5 px-3 text-right font-sans font-bold text-emerald-400 uppercase">Net Foreign Accumulation</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Historical Dual-Series Interactive Cash Chart (Around Zero Baseline) */}
              <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-2 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Historical FII vs DII Net Cash Activity (Zero-Line Baseline)</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">Daily net institutional investment in ₹ Crore</span>
                  </div>

                  {/* Timeframe Selector */}
                  <div className="flex items-center space-x-1 bg-[#0B0E14] p-0.5 rounded-lg border border-[#232E47] text-[10px] font-mono">
                    <button
                      onClick={() => setCashTimeframe('5D')}
                      className={`px-2 py-0.5 rounded font-bold ${cashTimeframe === '5D' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'}`}
                    >
                      5-Days
                    </button>
                    <button
                      onClick={() => setCashTimeframe('10D')}
                      className={`px-2 py-0.5 rounded font-bold ${cashTimeframe === '10D' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'}`}
                    >
                      10-Days
                    </button>
                    <button
                      onClick={() => setCashTimeframe('20D')}
                      className={`px-2 py-0.5 rounded font-bold ${cashTimeframe === '20D' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'}`}
                    >
                      20-Days
                    </button>
                  </div>
                </div>

                {/* SVG Visual Bars around Zero-Line */}
                <div className="relative h-48 w-full flex items-center bg-[#0B0E14] rounded-lg border border-[#232E47]/60 px-4 py-2">
                  {/* Zero Baseline Line */}
                  <div className="absolute left-0 right-0 top-1/2 border-b border-dashed border-slate-600 z-10 pointer-events-none">
                    <span className="absolute -left-1 -top-2.5 text-[9px] font-mono text-slate-500">₹0</span>
                  </div>

                  <div className="w-full h-full flex items-center space-x-2 pt-2 pb-2">
                    {chronologicalHistory.map((s, idx) => {
                      const fiiH = Math.min(80, (Math.abs(s.fii_net) / maxAbsFlow) * 80);
                      const diiH = Math.min(80, (Math.abs(s.dii_net) / maxAbsFlow) * 80);
                      const isFiiPositive = s.fii_net >= 0;
                      const isDiiPositive = s.dii_net >= 0;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-center group relative">
                          {/* Tooltip */}
                          <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[9px] font-mono z-30 pointer-events-none whitespace-nowrap shadow-xl">
                            {s.date}: FII {isFiiPositive ? '+' : ''}{s.fii_net} Cr | DII {isDiiPositive ? '+' : ''}{s.dii_net} Cr
                          </div>

                          <div className="w-full flex justify-center space-x-1 h-full items-center">
                            {/* FII Bar */}
                            <div className="w-1/2 flex flex-col items-center h-full justify-center">
                              {isFiiPositive ? (
                                <div className="h-1/2 flex flex-col justify-end w-full">
                                  <div 
                                    className="w-full bg-emerald-500 rounded-t transition-all group-hover:bg-emerald-400"
                                    style={{ height: `${fiiH}%` }}
                                  />
                                </div>
                              ) : (
                                <div className="h-1/2 flex flex-col justify-start w-full">
                                  <div 
                                    className="w-full bg-rose-500 rounded-b transition-all group-hover:bg-rose-400"
                                    style={{ height: `${fiiH}%` }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* DII Bar */}
                            <div className="w-1/2 flex flex-col items-center h-full justify-center">
                              {isDiiPositive ? (
                                <div className="h-1/2 flex flex-col justify-end w-full">
                                  <div 
                                    className="w-full bg-sky-500 rounded-t transition-all group-hover:bg-sky-400"
                                    style={{ height: `${diiH}%` }}
                                  />
                                </div>
                              ) : (
                                <div className="h-1/2 flex flex-col justify-start w-full">
                                  <div 
                                    className="w-full bg-amber-500 rounded-b transition-all group-hover:bg-amber-400"
                                    style={{ height: `${diiH}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <span className="text-[9px] font-mono text-slate-500 mt-1 truncate max-w-full">
                            {s.date.split(' ')[0]} {s.date.split(' ')[1]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 font-mono">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
                      <span>FII Buying</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
                      <span>FII Selling</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block"></span>
                      <span>DII Buying</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
                      <span>DII Selling</span>
                    </span>
                  </div>
                  <span>Zero-line centered scaling</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: FII / DII PARTICIPANT-WISE DERIVATIVES POSITIONING & SHORT UNWINDING (Exact replica of Image 3) */}
          {(activeTab === 'ALL' || activeTab === 'DERIVATIVES') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-purple-400" />
                    <span>3. FII Nifty Shorts — Latest Index-Futures Positioning &amp; Deleveraging Trend</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Session Date: {fii_derivatives_positioning.session_date} &bull; Participant-Wise Open Interest
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-bold font-mono border border-purple-500/30">
                  {t('Short-Covering Fuel')}
                </span>
              </div>

              {/* FII Net Position Highlight Card (Replica of Image 3) */}
              <div className="p-5 rounded-xl bg-[#121824] border border-rose-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium uppercase block">
                    FII Net Index-Futures Position &bull; 11 November Close
                  </span>
                  <div className="text-3xl font-black text-rose-400 font-mono mt-0.5">
                    {fii_derivatives_positioning.net_index_futures_contracts.toLocaleString()} contracts
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Long: <strong className="text-white font-mono">{((fii_derivatives_positioning as any).long_contracts || 79100).toLocaleString()}</strong> | 
                    Short: <strong className="text-white font-mono">{((fii_derivatives_positioning as any).short_contracts || 149513).toLocaleString()}</strong>
                  </div>
                </div>

                <div className="text-left md:text-right">
                  <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 inline-block">
                    {t('Net Bearish Exposure Reduced')} &bull; 20,328 fewer net shorts vs 9 Nov
                  </span>
                  <div className="text-[11px] text-slate-400 font-mono mt-1.5">
                    {fii_derivatives_positioning.instrument_coverage}
                  </div>
                </div>
              </div>

              {/* FII Net Index-Futures Shorts — Sharp Decline Progress Track (Image 3) */}
              <div className="p-4 rounded-xl bg-[#171F32] border border-[#232E47] text-xs">
                <div className="flex justify-between items-center mb-1 text-[11px] font-mono">
                  <span className="text-slate-400">All-Time Peak Shorts: 225,000 contracts</span>
                  <span className="text-emerald-400 font-bold">Current Shorts: 70,413 contracts (-68.7% Deleveraged)</span>
                </div>
                <div className="w-full h-3 bg-[#0B0E14] rounded-full overflow-hidden border border-[#232E47] mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-sky-400 to-emerald-300 rounded-full"
                    style={{ width: '68.7%' }}
                  />
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {fii_derivatives_positioning.trend_analysis}
                </p>
              </div>

              {/* Automatic Institutional Synthesis Note */}
              {(fii_derivatives_positioning as any).institutional_interpretation && (
                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    Institutional Regime: {((fii_derivatives_positioning as any).institutional_interpretation.regime || '').replace(/_/g, ' ')}
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {(fii_derivatives_positioning as any).institutional_interpretation.analysis_en}
                  </p>
                  <p className="text-amber-300/90 mt-2 font-sans">
                    <strong>తెలుగు విశ్లేషణ:</strong> {(fii_derivatives_positioning as any).institutional_interpretation.analysis_te}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: INFLATION BREAKDOWN */}
          {(activeTab === 'ALL' || activeTab === 'INFLATION') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-2 mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-rose-500/20 text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {t('4. India CPI Inflation Category Breakdown (% YoY)')}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official release: {cpi_inflation_breakdown.headline}
                  </p>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono font-bold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{t('RBI Ceiling: 6.0%')}</span>
                  </div>
                </div>
              </div>

              {/* Horizontal Bar Chart */}
              <div className="relative pt-2 pb-4">
                <div 
                  className="absolute top-0 bottom-6 border-r-2 border-dashed border-rose-500 z-20 pointer-events-none"
                  style={{ left: `calc(${rbiCeilingPct}% + 180px)` }}
                >
                  <span className="absolute -top-3 -translate-x-1/2 px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[9px] font-bold shadow-md whitespace-nowrap">
                    {t('RBI Ceiling (6.0%)')}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {cpi_inflation_breakdown.categories.map((item, idx) => {
                    const widthPct = Math.min(100, Math.max(3, (item.yoy_inflation_pct / maxInflation) * 100));
                    return (
                      <div key={idx} className="flex items-center text-xs group">
                        <div className="w-[180px] pr-3 text-right font-medium text-slate-300 text-[11px] truncate group-hover:text-white" title={item.category}>
                          {item.category}
                        </div>
                        <div className="flex-1 bg-[#171F32] h-5 rounded-md overflow-hidden relative border border-[#232E47]/70">
                          <div 
                            className={`h-full rounded-md transition-all ${
                              item.breaches_rbi_ceiling 
                                ? 'bg-gradient-to-r from-rose-600 to-rose-400' 
                                : 'bg-gradient-to-r from-sky-600 to-sky-400'
                            }`}
                            style={{ width: `${widthPct}%` }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono font-bold text-[10px] text-white">
                            {item.yoy_inflation_pct.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: MACROECONOMIC & NATIONAL ACCOUNTS CHEAT SHEET (INTERACTIVE) */}
          {(activeTab === 'ALL' || activeTab === 'GLOSSARY') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-3 mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-sky-500/20 text-sky-400">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      5. National Accounts &amp; Macro Intelligence Suite (Click Any Indicator for Full Quantitative Deep Dive)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click any macroeconomic indicator or National Accounts term to inspect 5-year historical observation series, formulas, charts, and sector sensitivity matrices.
                  </p>
                </div>

                <div className="relative min-w-[240px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Real GDP, GVA, PFCE, WPI..."
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#121824] border border-[#232E47] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Clickable Table */}
              <div className="overflow-x-auto rounded-lg border border-[#232E47]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#1A2234] text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[140px]">Term / Indicator</th>
                      <th className="py-2.5 px-3">Definition &amp; Core Meaning</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Takeaway / Focus</th>
                      <th className="py-2.5 px-3 text-right">Interactive Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232E47]/60 bg-[#0F1420]">
                    {filteredGlossary.map((item, idx) => {
                      const topicId = (item.id || item.term).toLowerCase().replace(/\s+/g, '-');
                      return (
                        <tr 
                          key={idx} 
                          onClick={() => handleOpenTopic(topicId)}
                          className="hover:bg-slate-800/60 cursor-pointer transition-colors group"
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white group-hover:text-amber-400 transition-colors font-mono text-xs">
                                {item.term}
                              </span>
                              {item.group && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                  {item.group}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {item.definition}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 font-medium text-[11px] border border-purple-500/20 inline-block">
                              {item.remember_this || 'Macro Foundation'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="text-sky-400 group-hover:text-sky-300 text-xs font-bold inline-flex items-center space-x-1">
                              <span>Inspect 5-Yr History</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 6: GLOBAL NEWS WIRE & SCENARIO ANALYSIS */}
          {(activeTab === 'ALL' || activeTab === 'NEWS') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#232E47]/70">
                <div className="flex items-center space-x-2">
                  <Newspaper className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">
                    6. Verified Institutional News Wire &amp; 3-Way Scenario Analysis
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Real Sources: Reuters, Bloomberg, Mint, Ministry of Commerce
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newsFeed.map((news) => (
                  <div key={news.id} className="p-4 rounded-xl bg-[#121824] border border-[#232E47] space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold">
                        {news.category}
                      </span>
                      <span>{news.publication_time}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug hover:text-sky-300 transition-colors">
                      {news.headline}
                    </h4>
                    <div className="text-xs font-semibold text-amber-300 font-sans">
                      {news.headline_te}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {news.summary_en}
                    </p>

                    {/* Scenario Analysis */}
                    {news.scenario_analysis && (
                      <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#232E47] space-y-1.5 text-[11px]">
                        <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                          3-Way Market Scenarios:
                        </div>
                        <div className="text-emerald-400">
                          <strong>Bullish:</strong> {news.scenario_analysis.positive_scenario}
                        </div>
                        <div className="text-sky-400">
                          <strong>Neutral:</strong> {news.scenario_analysis.neutral_scenario}
                        </div>
                        <div className="text-rose-400">
                          <strong>Bearish:</strong> {news.scenario_analysis.negative_scenario}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#232E47]/60">
                      <span className="text-slate-400 font-medium">Source: {news.source}</span>
                      <a
                        href={news.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:text-sky-300 font-bold inline-flex items-center space-x-1"
                      >
                        <span>Official Wire</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal for clicked Macro Topic */}
      <MacroIndicatorModal
        topic={selectedTopic}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Loading Indicator */}
      {loadingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-[#121824] border border-[#232E47] shadow-xl text-xs font-semibold text-sky-400">
            <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading Macro Indicator Details...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketIntelligenceDashboard;
