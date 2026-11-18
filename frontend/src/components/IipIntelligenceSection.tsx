import React, { useState, useEffect } from 'react';
import { Factory, TrendingUp, TrendingDown, AlertTriangle, BookOpen, BarChart3, Activity, Zap, ArrowRight } from 'lucide-react';

const API_BASE = '/api/v1';

interface IipSummary {
  period: string;
  release_date: string;
  index_level: number;
  previous_index_level: number;
  actual_growth_yoy: number;
  forecast_growth_yoy: number;
  previous_growth_yoy: number;
  revised_previous_growth: number;
  revision_delta: number;
  surprise_percentage_pts: number;
  growth_change_pts: number;
  surprise_verdict: string;
  momentum_verdict: string;
  status: string;
  base_year_info: Record<string, string>;
}

interface ProducingSector {
  id: string;
  name: string;
  telugu_name: string;
  weightage_pct: number;
  current_index: number;
  previous_index: number;
  yoy_growth_pct: number;
  previous_growth_pct: number;
  mom_change_pct: number;
  status: string;
  top_subsectors: string[];
}

interface UseBasedCategory {
  category: string;
  telugu_name: string;
  weightage_pct: number;
  current_index: number;
  yoy_growth_pct: number;
  previous_growth_pct: number;
  status: string;
  examples: string[];
  macro_signal: string;
}

interface IipDashboard {
  timestamp: string;
  summary: IipSummary;
  four_producing_sectors: ProducingSector[];
  six_use_based_categories: UseBasedCategory[];
  educational_framework: Record<string, any>;
  sector_mapping: Record<string, any>;
  cross_confirmation: Record<string, any>;
  production_to_earnings: Record<string, any>;
  historical_5year: Record<string, any>;
  alerts: Array<{ id: string; type: string; severity: string; title: string; detail: string; timestamp: string; badge: string }>;
  base_year_info: Record<string, string>;
}

const statusColor = (s: string) => {
  switch (s) {
    case 'ACCELERATING': case 'SURGING': case 'EXPANDING': return 'text-emerald-400';
    case 'DECELERATING': case 'SOFTENING': return 'text-amber-400';
    case 'STABLE': case 'STEADY': return 'text-sky-400';
    case 'CONTRACTING': return 'text-rose-400';
    default: return 'text-slate-400';
  }
};

const statusBg = (s: string) => {
  switch (s) {
    case 'ACCELERATING': case 'SURGING': case 'EXPANDING': return 'bg-emerald-500/15 border-emerald-500/30';
    case 'DECELERATING': case 'SOFTENING': return 'bg-amber-500/15 border-amber-500/30';
    case 'STABLE': case 'STEADY': return 'bg-sky-500/15 border-sky-500/30';
    case 'CONTRACTING': return 'bg-rose-500/15 border-rose-500/30';
    default: return 'bg-slate-700/30 border-slate-600/30';
  }
};

export const IipIntelligenceSection: React.FC = () => {
  const [dashboard, setDashboard] = useState<IipDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sectors' | 'use-based' | 'educational' | 'cross-confirm' | 'earnings-flow' | 'history' | 'alerts'>('overview');

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/market-intelligence/iip/dashboard`)
      .then(r => r.json())
      .then(setDashboard)
      .catch(err => console.error('IIP fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
        <span className="ml-3 text-slate-400 text-sm">Loading IIP Intelligence...</span>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="text-center py-12 text-rose-400">Failed to load IIP Intelligence data.</div>;
  }

  const { summary, four_producing_sectors, six_use_based_categories, educational_framework, cross_confirmation, production_to_earnings, historical_5year, alerts } = dashboard;

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'sectors' as const, label: '4 Producing Sectors', icon: <Factory className="w-3.5 h-3.5" /> },
    { id: 'use-based' as const, label: '6 Use-Based', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'educational' as const, label: 'Educational Guide', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'cross-confirm' as const, label: 'Cross-Confirmation', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'earnings-flow' as const, label: 'Production→Earnings', icon: <ArrowRight className="w-3.5 h-3.5" /> },
    { id: 'history' as const, label: '5-Year History', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'alerts' as const, label: `Alerts (${alerts.length})`, icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Factory className="w-6 h-6 text-amber-400" />
          IIP INTELLIGENCE — INDEX OF INDUSTRIAL PRODUCTION
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          4 Producing Sectors • 6 Use-Based Categories • Cross-Confirmation Matrix • Production-to-Earnings Flow • {summary.base_year_info?.base_year || '2022-23'} Base Year
        </p>
      </div>

      {/* Headline Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="rounded-xl bg-[#121824] border border-[#232E47] p-3">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">IIP Index Level</div>
          <div className="text-xl font-bold text-white mt-1 font-mono">{summary.index_level}</div>
          <div className="text-[10px] text-slate-500">Prev: {summary.previous_index_level}</div>
        </div>
        <div className={`rounded-xl border p-3 ${summary.surprise_verdict === 'BEAT' ? 'bg-emerald-500/10 border-emerald-500/30' : summary.surprise_verdict === 'MISS' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[#121824] border-[#232E47]'}`}>
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Actual Growth YoY</div>
          <div className={`text-xl font-bold mt-1 font-mono ${summary.actual_growth_yoy > summary.forecast_growth_yoy ? 'text-emerald-400' : 'text-rose-400'}`}>
            +{summary.actual_growth_yoy}%
          </div>
          <div className="text-[10px] text-slate-500">Forecast: {summary.forecast_growth_yoy}%</div>
        </div>
        <div className="rounded-xl bg-[#121824] border border-[#232E47] p-3">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Surprise</div>
          <div className={`text-xl font-bold mt-1 font-mono ${summary.surprise_percentage_pts > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {summary.surprise_percentage_pts > 0 ? '+' : ''}{summary.surprise_percentage_pts} pts
          </div>
          <div className={`text-[10px] font-bold ${summary.surprise_verdict === 'BEAT' ? 'text-emerald-400' : 'text-rose-400'}`}>{summary.surprise_verdict}</div>
        </div>
        <div className="rounded-xl bg-[#121824] border border-[#232E47] p-3">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Momentum</div>
          <div className={`text-lg font-bold mt-1 ${summary.momentum_verdict === 'ACCELERATING' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {summary.momentum_verdict === 'ACCELERATING' ? <TrendingUp className="w-5 h-5 inline" /> : <TrendingDown className="w-5 h-5 inline" />}
            <span className="ml-1 text-sm">{summary.momentum_verdict}</span>
          </div>
        </div>
        <div className="rounded-xl bg-[#121824] border border-[#232E47] p-3">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Revised Previous</div>
          <div className="text-xl font-bold text-sky-400 mt-1 font-mono">{summary.revised_previous_growth}%</div>
          <div className="text-[10px] text-slate-500">Was: {summary.previous_growth_yoy}% (Δ{summary.revision_delta > 0 ? '+' : ''}{summary.revision_delta})</div>
        </div>
        <div className="rounded-xl bg-[#121824] border border-[#232E47] p-3">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Period</div>
          <div className="text-sm font-bold text-white mt-1">{summary.period}</div>
          <div className="text-[10px] text-slate-500">{summary.release_date?.split(' ')[0]}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 border-b border-[#232E47] pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-colors ${
              activeTab === tab.id ? 'bg-sky-500/20 text-sky-300 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 4 Producing Sectors Mini */}
          <div className="rounded-xl bg-[#121824] border border-[#232E47] p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Factory className="w-4 h-4 text-amber-400" /> 4 Producing Sectors</h3>
            <div className="space-y-2">
              {four_producing_sectors.map(s => (
                <div key={s.id} className={`flex items-center justify-between p-2 rounded-lg border ${statusBg(s.status)}`}>
                  <div>
                    <div className="text-xs font-bold text-white">{s.name}</div>
                    <div className="text-[10px] text-slate-500">Weight: {s.weightage_pct}%</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold font-mono text-sm ${statusColor(s.status)}`}>+{s.yoy_growth_pct}%</div>
                    <div className={`text-[10px] font-semibold ${statusColor(s.status)}`}>{s.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* 6 Use-Based Categories Mini */}
          <div className="rounded-xl bg-[#121824] border border-[#232E47] p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400" /> 6 Use-Based Categories</h3>
            <div className="space-y-2">
              {six_use_based_categories.map(c => (
                <div key={c.category} className={`flex items-center justify-between p-2 rounded-lg border ${statusBg(c.status)}`}>
                  <div>
                    <div className="text-xs font-bold text-white">{c.category}</div>
                    <div className="text-[10px] text-slate-500">Weight: {c.weightage_pct}%</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold font-mono text-sm ${statusColor(c.status)}`}>+{c.yoy_growth_pct}%</div>
                    <div className={`text-[10px] font-semibold ${statusColor(c.status)}`}>{c.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sectors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {four_producing_sectors.map(sector => (
            <div key={sector.id} className={`rounded-xl border p-5 ${statusBg(sector.status)}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{sector.name}</h3>
                  <div className="text-[10px] text-slate-400 mt-0.5">{sector.telugu_name}</div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${statusColor(sector.status)} bg-black/20`}>
                  {sector.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center mb-3">
                <div>
                  <div className="text-[10px] text-slate-500">Weightage</div>
                  <div className="font-bold font-mono text-white">{sector.weightage_pct}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">YoY Growth</div>
                  <div className={`font-bold font-mono ${statusColor(sector.status)}`}>+{sector.yoy_growth_pct}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">MoM Change</div>
                  <div className="font-bold font-mono text-sky-400">{sector.mom_change_pct > 0 ? '+' : ''}{sector.mom_change_pct}%</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center mb-3">
                <div>
                  <div className="text-[10px] text-slate-500">Current Index</div>
                  <div className="font-bold font-mono text-white">{sector.current_index}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Previous Index</div>
                  <div className="font-bold font-mono text-slate-400">{sector.previous_index}</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400">
                <span className="font-semibold text-slate-300">Sub-sectors: </span>
                {sector.top_subsectors.join(' • ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'use-based' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {six_use_based_categories.map(cat => (
            <div key={cat.category} className={`rounded-xl border p-5 ${statusBg(cat.status)}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">{cat.category}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColor(cat.status)} bg-black/20`}>{cat.status}</span>
              </div>
              <div className="text-[10px] text-slate-400 mb-3">{cat.telugu_name}</div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div>
                  <div className="text-[10px] text-slate-500">Weight</div>
                  <div className="font-bold font-mono text-white text-sm">{cat.weightage_pct}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">YoY Growth</div>
                  <div className={`font-bold font-mono text-sm ${statusColor(cat.status)}`}>+{cat.yoy_growth_pct}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Index</div>
                  <div className="font-bold font-mono text-white text-sm">{cat.current_index}</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mb-2">
                <span className="font-semibold text-slate-300">Examples: </span>{cat.examples.join(', ')}
              </div>
              <div className="text-[10px] text-sky-300 italic mt-2 border-t border-white/5 pt-2">{cat.macro_signal}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'educational' && educational_framework && (
        <div className="rounded-xl bg-[#121824] border border-[#232E47] p-5">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-400" /> Educational & Analytical Guide</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#0B0E14] border-b border-[#232E47] text-slate-400 font-semibold">
                  <th className="px-3 py-2 text-left">Concept</th>
                  <th className="px-3 py-2 text-left">Definition</th>
                  <th className="px-3 py-2 text-left">Example / Value</th>
                  <th className="px-3 py-2 text-left">Why It Matters</th>
                </tr>
              </thead>
              <tbody>
                {(educational_framework.guide || []).map((item: any, i: number) => (
                  <tr key={i} className="border-b border-[#232E47]/50 hover:bg-[#1A2234]/60">
                    <td className="px-3 py-2 font-bold text-white">{item.concept}</td>
                    <td className="px-3 py-2 text-slate-300 max-w-xs">{item.definition}</td>
                    <td className="px-3 py-2 font-mono text-sky-400">{item.example}</td>
                    <td className="px-3 py-2 text-slate-400 max-w-xs">{item.why_it_matters}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'cross-confirm' && cross_confirmation && (
        <div className="rounded-xl bg-[#121824] border border-[#232E47] p-5">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" /> Cross-Confirmation Matrix</h3>
          <div className="mb-4 p-3 rounded-lg bg-[#0B0E14] border border-sky-500/20">
            <div className="text-xs text-slate-400">Composite Confidence Score:</div>
            <div className="text-2xl font-bold text-sky-400 font-mono">{cross_confirmation.composite_score}/10</div>
            <div className={`text-xs font-bold mt-1 ${cross_confirmation.composite_score >= 7 ? 'text-emerald-400' : cross_confirmation.composite_score >= 5 ? 'text-amber-400' : 'text-rose-400'}`}>
              {cross_confirmation.verdict}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#0B0E14] border-b border-[#232E47] text-slate-400 font-semibold">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Indicator</th>
                  <th className="px-3 py-2 text-left">Current Value</th>
                  <th className="px-3 py-2 text-left">Signal</th>
                  <th className="px-3 py-2 text-left">Confirms IIP?</th>
                </tr>
              </thead>
              <tbody>
                {(cross_confirmation.indicators || []).map((ind: any, i: number) => (
                  <tr key={i} className="border-b border-[#232E47]/50 hover:bg-[#1A2234]/60">
                    <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                    <td className="px-3 py-2 font-bold text-white">{ind.name}</td>
                    <td className="px-3 py-2 font-mono text-sky-400">{ind.value}</td>
                    <td className={`px-3 py-2 font-bold ${ind.signal === 'POSITIVE' ? 'text-emerald-400' : ind.signal === 'NEGATIVE' ? 'text-rose-400' : 'text-amber-400'}`}>{ind.signal}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ind.confirms ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {ind.confirms ? '✓ YES' : '✗ NO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'earnings-flow' && production_to_earnings && (
        <div className="rounded-xl bg-[#121824] border border-[#232E47] p-5">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><ArrowRight className="w-5 h-5 text-cyan-400" /> Production-to-Earnings Institutional Flow</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {(production_to_earnings.three_cash_flows || []).map((cf: any) => (
              <div key={cf.type} className="rounded-lg bg-[#0B0E14] border border-[#232E47] p-4">
                <div className="text-xs font-bold text-white mb-2">{cf.type}</div>
                <div className="text-[10px] text-slate-400 mb-2">{cf.description}</div>
                <div className="space-y-1">
                  {(cf.components || []).map((comp: string, i: number) => (
                    <div key={i} className="text-[10px] text-sky-300">• {comp}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-[#0B0E14] border border-[#232E47] p-3 text-center">
              <div className="text-[10px] text-slate-500">ROCE</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">{production_to_earnings.roce || 'N/A'}</div>
            </div>
            <div className="rounded-lg bg-[#0B0E14] border border-[#232E47] p-3 text-center">
              <div className="text-[10px] text-slate-500">ROE</div>
              <div className="text-lg font-bold text-sky-400 font-mono">{production_to_earnings.roe || 'N/A'}</div>
            </div>
            <div className="rounded-lg bg-[#0B0E14] border border-[#232E47] p-3 text-center">
              <div className="text-[10px] text-slate-500">IIP → Revenue</div>
              <div className="text-sm font-bold text-amber-400">{production_to_earnings.iip_to_revenue || 'Positive'}</div>
            </div>
            <div className="rounded-lg bg-[#0B0E14] border border-[#232E47] p-3 text-center">
              <div className="text-[10px] text-slate-500">Earnings Impact</div>
              <div className="text-sm font-bold text-purple-400">{production_to_earnings.earnings_impact || 'Accelerating'}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && historical_5year && (
        <div className="rounded-xl bg-[#121824] border border-[#232E47] p-5">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-sky-400" /> 5-Year Historical IIP Series (2021-2026)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#0B0E14] border-b border-[#232E47] text-slate-400 font-semibold">
                  <th className="px-3 py-2 text-left">Period</th>
                  <th className="px-3 py-2 text-left">IIP Index</th>
                  <th className="px-3 py-2 text-left">YoY Growth</th>
                  <th className="px-3 py-2 text-left">Manufacturing</th>
                  <th className="px-3 py-2 text-left">Mining</th>
                  <th className="px-3 py-2 text-left">Electricity</th>
                  <th className="px-3 py-2 text-left">NIFTY 50 Index</th>
                </tr>
              </thead>
              <tbody>
                {(historical_5year.series || []).map((row: any, i: number) => (
                  <tr key={i} className="border-b border-[#232E47]/50 hover:bg-[#1A2234]/60">
                    <td className="px-3 py-2 font-bold text-white">{row.period}</td>
                    <td className="px-3 py-2 font-mono text-white">{row.iip_index}</td>
                    <td className={`px-3 py-2 font-mono font-bold ${row.yoy_growth_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.yoy_growth_pct >= 0 ? '+' : ''}{row.yoy_growth_pct}%
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-300">+{row.manufacturing_growth_pct}%</td>
                    <td className="px-3 py-2 font-mono text-slate-300">+{row.mining_growth_pct}%</td>
                    <td className="px-3 py-2 font-mono text-slate-300">+{row.electricity_growth_pct}%</td>
                    <td className="px-3 py-2 font-mono text-sky-400">{row.nifty_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`rounded-xl border p-4 ${alert.severity === 'HIGH' ? 'bg-amber-500/5 border-amber-500/30' : 'bg-[#121824] border-[#232E47]'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${alert.severity === 'HIGH' ? 'text-amber-400' : 'text-sky-400'}`} />
                  <div>
                    <div className="text-sm font-bold text-white">{alert.title}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{alert.detail}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${alert.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'}`}>
                  {alert.badge}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2">{alert.timestamp}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
