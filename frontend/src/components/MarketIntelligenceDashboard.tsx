import React, { useState } from 'react';
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
  Search
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

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
  const [activeTab, setActiveTab] = useState<'ALL' | 'MACRO' | 'FLOWS' | 'INFLATION' | 'GLOSSARY'>('ALL');
  const [glossarySearch, setGlossarySearch] = useState('');

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
      item.remember_this.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q)
    );
  });

  // Max inflation value for horizontal bar graph scaling (peak is 10.14%)
  const maxInflation = 12.0;
  const rbiCeilingPct = (cpi_inflation_breakdown.rbi_tolerance_ceiling_pct / maxInflation) * 100;

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
              {t('FII/DII Cash Activity, Nifty Index-Futures Shorts, Crude Geopolitics & India CPI Inflation Breakdown')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Section Filter Pills */}
          <div className="flex bg-[#0B0E14] p-0.5 rounded-lg border border-[#232E47] text-xs">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                activeTab === 'ALL' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('All Intelligence')}
            </button>
            <button
              onClick={() => setActiveTab('FLOWS')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                activeTab === 'FLOWS' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('FII / DII')}
            </button>
            <button
              onClick={() => setActiveTab('INFLATION')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                activeTab === 'INFLATION' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('CPI Inflation')}
            </button>
            <button
              onClick={() => setActiveTab('GLOSSARY')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                activeTab === 'GLOSSARY' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('Macro Glossary (21)')}
            </button>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-[#1A2234] hover:bg-slate-700 text-slate-400 hover:text-white border border-[#232E47] transition-all"
            title={collapsed ? 'Expand intelligence suite' : 'Collapse intelligence suite'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-5 space-y-6">
          {/* SECTION 1: MARKET CLOSING LEVELS & MACRO PULSE (Images 1) */}
          {(activeTab === 'ALL' || activeTab === 'MACRO') && (
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

              {/* Read Between the Lines Note */}
              <div className="mt-3 p-3 rounded-lg bg-[#171F32]/60 border border-[#232E47] text-xs text-slate-300">
                <span className="font-bold text-sky-400">Read between the lines: </span>
                {market_closing_levels.market_read_between_lines}
              </div>
            </div>
          )}

          {/* SECTION 2 & 3: FII / DII CASH ACTIVITY & DERIVATIVE SHORTS (Images 2 & 3) */}
          {(activeTab === 'ALL' || activeTab === 'FLOWS') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* FII/DII Cash Activity Card (Image 2) */}
              <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47]">
                <div className="flex items-center justify-between pb-3 border-b border-[#232E47]/70 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>{t('2. FII / DII Cash Activity — Latest Session')}</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {fii_dii_cash_activity.session_date}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                    Net: +₹{fii_dii_cash_activity.net_institutional_crores.toLocaleString()} Cr
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* FII Net Buying */}
                  <div className="p-3.5 rounded-lg bg-[#121824] border border-emerald-500/30">
                    <span className="text-[10px] text-slate-400 font-medium uppercase block">{t('FII Net Buying')}</span>
                    <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                      +₹{fii_dii_cash_activity.fii_net_crores.toLocaleString()} Cr
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 block mt-1">
                      {t('Strong Foreign Buying')}
                    </span>
                  </div>

                  {/* DII Net Selling */}
                  <div className="p-3.5 rounded-lg bg-[#121824] border border-rose-500/30">
                    <span className="text-[10px] text-slate-400 font-medium uppercase block">{t('DII Net Selling')}</span>
                    <div className="text-xl font-black text-rose-400 font-mono mt-0.5">
                      -₹{Math.abs(fii_dii_cash_activity.dii_net_crores).toLocaleString()} Cr
                    </div>
                    <span className="text-[10px] font-bold text-rose-400 block mt-1">
                      {t('Domestic Institutional Selling')}
                    </span>
                  </div>
                </div>

                {/* Historical FII Flow Trend Table */}
                <div className="text-xs">
                  <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex justify-between">
                    <span>RECENT FII CASH ACCUMULATION TREND</span>
                    <span className="text-slate-500">Moneycontrol Verified</span>
                  </div>
                  <div className="space-y-1.5 font-mono">
                    {fii_dii_cash_activity.recent_fii_history.map(item => (
                      <div key={item.date} className="flex justify-between items-center p-2 rounded bg-[#171F32] border border-[#232E47]/60">
                        <span className="text-slate-300">{item.date}</span>
                        <span className="font-bold text-emerald-400">
                          +₹{item.fii_net_cr.toLocaleString()} Cr
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* FII Index Futures Shorts & Derivatives (Image 3) */}
              <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47]">
                <div className="flex items-center justify-between pb-3 border-b border-[#232E47]/70 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <TrendingDown className="w-4 h-4 text-purple-400" />
                      <span>{t('3. FII Nifty Shorts — Index Futures Positioning')}</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {fii_derivatives_positioning.session_date}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold font-mono">
                    {t('Short-Covering Fuel')}
                  </span>
                </div>

                {/* Net Position Display */}
                <div className="p-4 rounded-xl bg-[#121824] border border-rose-500/30 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium uppercase block">
                        FII Net Index-Futures Position
                      </span>
                      <div className="text-2xl font-black text-rose-400 font-mono mt-0.5">
                        {fii_derivatives_positioning.net_index_futures_contracts.toLocaleString()} contracts
                      </div>
                    </div>
                    {/* Badge */}
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30 inline-block">
                        {t('Net Bearish Exposure Reduced')}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        {fii_derivatives_positioning.change_description}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Short Covering Deleveraging Visual */}
                <div className="p-3.5 rounded-lg bg-[#171F32] border border-[#232E47]/70 text-xs text-slate-300">
                  <div className="flex justify-between items-center mb-1 text-[11px] font-mono">
                    <span className="text-slate-400">Peak Shorts: 225,000+</span>
                    <span className="text-emerald-400 font-bold">&darr; Dropped to 70,413</span>
                  </div>
                  {/* Progress bar showing reduction */}
                  <div className="w-full h-2.5 bg-[#0B0E14] rounded-full overflow-hidden border border-[#232E47] mb-2">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full"
                      style={{ width: `${(1 - (70413 / 225000)) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {fii_derivatives_positioning.trend_analysis}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: INDIA CPI INFLATION CATEGORY BREAKDOWN (Images 4 & 5) */}
          {(activeTab === 'ALL' || activeTab === 'INFLATION') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47]">
              {/* Inflation Title & RBI Ceiling Banner */}
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
                  <span className="text-[11px] text-slate-500 font-mono">
                    Source: {cpi_inflation_breakdown.source}
                  </span>
                </div>
              </div>

              {/* Highlights Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-5 text-[11px]">
                <div className="p-2.5 rounded-lg bg-[#121824] border border-rose-500/30 text-rose-300">
                  <strong className="block text-white">{t('RBI Ceiling Breached')}</strong>
                  Headline inflation crossed upper band of 6.00%
                </div>
                <div className="p-2.5 rounded-lg bg-[#121824] border border-rose-500/30 text-rose-300">
                  <strong className="block text-white">{t('6 States > 7%')}</strong>
                  Six major states recorded inflation above 7.0%
                </div>
                <div className="p-2.5 rounded-lg bg-[#121824] border border-amber-500/30 text-amber-300">
                  <strong className="block text-white">{t('Onion Surge +116%')}</strong>
                  Vegetable and essential food items spike
                </div>
                <div className="p-2.5 rounded-lg bg-[#121824] border border-purple-500/30 text-purple-300">
                  <strong className="block text-white">{t('Double-Digit Pockets')}</strong>
                  Personal Care (10.14%) &amp; Restaurants (10.06%)
                </div>
              </div>

              {/* Horizontal Bar Chart (Exact replica of Images 4 & 5) */}
              <div className="relative pt-2 pb-4">
                {/* Vertical RBI 6% Ceiling Threshold Line */}
                <div 
                  className="absolute top-0 bottom-6 border-r-2 border-dashed border-rose-500 z-20 pointer-events-none"
                  style={{ left: `calc(${rbiCeilingPct}% + 180px)` }}
                >
                  <span className="absolute -top-3 -translate-x-1/2 px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[9px] font-bold shadow-md whitespace-nowrap">
                    {t('RBI Ceiling (6.0%)')}
                  </span>
                </div>

                {/* 12 Category Bars */}
                <div className="space-y-2.5">
                  {cpi_inflation_breakdown.categories.map((item, idx) => {
                    const widthPct = Math.min(100, Math.max(3, (item.yoy_inflation_pct / maxInflation) * 100));
                    const isBreach = item.breaches_rbi_ceiling;

                    return (
                      <div key={idx} className="flex items-center text-xs group">
                        {/* Category Name Label (Left column) */}
                        <div className="w-[180px] pr-3 text-right font-medium text-slate-300 text-[11px] truncate group-hover:text-white" title={item.category}>
                          {item.category}
                        </div>

                        {/* Bar Track & Fill */}
                        <div className="flex-1 relative h-6 bg-[#121824] rounded-md overflow-hidden border border-[#232E47]/70 flex items-center">
                          <div 
                            className={`h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2.5 ${
                              isBreach
                                ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 shadow-sm'
                                : item.yoy_inflation_pct >= 4.0
                                ? 'bg-gradient-to-r from-sky-600 to-sky-400'
                                : 'bg-gradient-to-r from-slate-600 to-slate-400'
                            }`}
                            style={{ width: `${widthPct}%` }}
                          >
                            {/* Inside Bar Value */}
                            <span className="font-mono font-bold text-white text-[11px] drop-shadow-sm">
                              {item.yoy_inflation_pct.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        {/* Severity Tag */}
                        <div className="w-20 pl-3 text-left">
                          {isBreach ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold uppercase font-mono">
                              &gt; 6% Ceiling
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">
                              Within Band
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bar Graph Legend */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-[#232E47]/50 mt-2 gap-2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500 inline-block"></span>
                    <span>{t('Above 6.0% RBI Tolerance Band')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-sky-500 inline-block"></span>
                    <span>{t('4.0% - 6.0% Target Band')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-slate-500 inline-block"></span>
                    <span>{t('Sub-4.0% Low Inflation')}</span>
                  </div>
                </div>
                <div className="text-slate-500 font-mono">
                  Scale: 0% to 12.0% YoY
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: MACROECONOMIC & NATIONAL ACCOUNTS GLOSSARY (21 Core Terms from Cheat Sheet) */}
          {(activeTab === 'ALL' || activeTab === 'GLOSSARY') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47]">
              {/* Header with Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-3 mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-sky-500/20 text-sky-400">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {t('5. Macroeconomic Intelligence & National Accounts Cheat Sheet (21 Core Terms)')}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Essential institutional national accounts terminology, definitions, and key takeaways (GDP, GVA, PFCE, GFCF, Output Gap, etc.)
                  </p>
                </div>

                {/* Instant Search Bar */}
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={t('Search 21 macro terms (GDP, GVA, Nominal, Real, PFCE, Deflator...)...')}
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#121824] border border-[#232E47] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#1A2234] text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[130px]">{t('Term')}</th>
                      <th className="py-2.5 px-3">{t('One-Sentence Definition')}</th>
                      <th className="py-2.5 px-3 min-w-[180px]">{t('Remember This')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232E47]/60">
                    {filteredGlossary.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white font-mono text-xs">{item.term}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              {item.group}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {item.definition}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 font-medium text-[11px] border border-purple-500/20 inline-block">
                            {item.remember_this}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredGlossary.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-500 italic">
                          No macroeconomic terms match &quot;{glossarySearch}&quot;.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-3 border-t border-[#232E47]/40 mt-3 font-mono">
                <span>Showing {filteredGlossary.length} of {macro_glossary.length} core macroeconomic definitions</span>
                <span>Institutional Reference Guide</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
