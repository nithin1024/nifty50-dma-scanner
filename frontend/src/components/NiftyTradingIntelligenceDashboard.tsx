import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  RefreshCw
} from 'lucide-react';
import { fetchNiftyTradingIntelligence, fetchMarketAlerts } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const NiftyTradingIntelligenceDashboard: React.FC = () => {
  const { language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tradingRes, alertsRes] = await Promise.all([
        fetchNiftyTradingIntelligence(),
        fetchMarketAlerts()
      ]);
      setData(tradingRes);
      setAlerts(alertsRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to load trading intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 bg-[#121824] rounded-xl border border-[#232E47] p-8">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
        <div className="text-slate-300 font-medium text-sm font-mono">
          {language === 'te' ? 'ట్రేడింగ్ ఇంటెలిజెన్స్ డేటాను లోడ్ చేస్తోంది...' : 'Synthesizing NIFTY Daily Trading Intelligence & Levels...'}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#121824] rounded-xl border border-rose-500/30 p-6 text-center space-y-3">
        <div className="text-rose-400 font-bold">Trading Intelligence Unavailable</div>
        <div className="text-xs text-slate-400 font-mono">{error}</div>
        <button
          onClick={loadData}
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const pivots = data.pivot_levels || {};
  const internals = data.market_internals || {};
  const action = data.trading_action_blueprint || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h1 className="text-lg font-black text-white tracking-tight">
              {language === 'te' ? 'నిఫ్టీ రోజువారీ ట్రేడింగ్ ఇంటెలిజెన్స్ & యాక్షన్ బ్లూప్రింట్' : 'NIFTY Daily Trading Intelligence & Action Blueprint'}
            </h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              MODULE 13 &amp; 14
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {language === 'te' 
              ? 'VWAP, ఇంట్రాడే పివోట్ స్థాయిలు, ఆప్షన్ చైన్ సపోర్ట్/రెసిస్టెన్స్ మరియు 3 కార్యాచరణ దృశ్యాలు.'
              : 'Institutional Technical Levels • Spot vs Futures Basis, Pivot Geometry & Real-time Alerts'}
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{language === 'te' ? 'రిఫ్రెష్ చేయండి' : 'Refresh Levels'}</span>
        </button>
      </div>

      {/* Spot, Futures & Pivot Telemetry Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#121824] border border-[#232E47] p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-medium">NIFTY Spot Price</div>
          <div className="text-xl font-mono font-bold text-white mt-1">₹{data.spot_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-sky-400 font-mono mt-0.5">VWAP: ₹{data.vwap}</div>
        </div>

        <div className="bg-[#121824] border border-[#232E47] p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-medium">Futures &amp; Basis</div>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">₹{data.futures_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Basis: +₹{data.futures_basis} ({data.basis_classification})</div>
        </div>

        <div className="bg-[#121824] border border-[#232E47] p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-medium">Daily Pivot Level</div>
          <div className="text-xl font-mono font-bold text-amber-300 mt-1">₹{pivots.pivot}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">S1: ₹{pivots.support_1} | R1: ₹{pivots.resistance_1}</div>
        </div>

        <div className="bg-[#121824] border border-[#232E47] p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-medium">Institutional Anchors</div>
          <div className="text-xl font-mono font-bold text-white mt-1">Max Pain: ₹{internals.max_pain}</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">PCR: {internals.oi_pcr} | Breadth: {internals.advance_decline_ratio}</div>
        </div>
      </div>

      {/* Actionable Setups (Long & Short Blueprints) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Long Setup Blueprint */}
        <div className="bg-[#121824] border border-emerald-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 border-b border-[#232E47] pb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
              Institutional Long Blueprint (Dips to Value)
            </h3>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2 rounded bg-slate-900/60">
              <span className="text-slate-400">Entry Zone:</span>
              <span className="text-white font-bold">{action.long_setup?.entry_zone}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900/60">
              <span className="text-slate-400">Target 1:</span>
              <span className="text-emerald-400 font-bold">₹{action.long_setup?.target_1}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900/60">
              <span className="text-slate-400">Target 2:</span>
              <span className="text-emerald-400 font-bold">₹{action.long_setup?.target_2}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900/60">
              <span className="text-slate-400">Stop Loss:</span>
              <span className="text-rose-400 font-bold">₹{action.long_setup?.stop_loss}</span>
            </div>
            <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
              <strong>Invalidation:</strong> Below ₹{action.long_setup?.invalidation_level} negates morning momentum.
            </div>
          </div>
        </div>

        {/* Short Setup Blueprint */}
        <div className="bg-[#121824] border border-rose-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 border-b border-[#232E47] pb-2">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
              Institutional Short Blueprint (Supply Rejection)
            </h3>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2 rounded bg-slate-900/60">
              <span className="text-slate-400">Entry Zone:</span>
              <span className="text-white font-bold">{action.short_setup?.entry_zone}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900/60">
              <span className="text-slate-400">Target 1:</span>
              <span className="text-rose-400 font-bold">₹{action.short_setup?.target_1}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900/60">
              <span className="text-slate-400">Target 2:</span>
              <span className="text-rose-400 font-bold">₹{action.short_setup?.target_2}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900/60">
              <span className="text-slate-400">Stop Loss:</span>
              <span className="text-rose-400 font-bold">₹{action.short_setup?.stop_loss}</span>
            </div>
            <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
              <strong>Invalidation:</strong> Above ₹{action.short_setup?.invalidation_level} triggers aggressive short covering.
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Macro & Technical Alert Feed (Module 14) */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#232E47] pb-3">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Module 14: Real-time Institutional Alert Feed
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{alerts.length} Active Triggers</span>
        </div>

        <div className="space-y-3">
          {alerts.map((al: any) => (
            <div 
              key={al.id}
              className="p-4 rounded-xl border border-[#232E47] bg-[#0B0E14] space-y-2 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  al.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {al.category} • {al.severity} IMPACT
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Live Signal</span>
              </div>

              <div className="text-xs font-bold text-white">{al.title}</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{al.detail}</p>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-mono">Affected Assets:</span>
                {al.affected_assets?.map((asset: string, assetIdx: number) => (
                  <span key={assetIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono">
                    {asset}
                  </span>
                ))}
              </div>

              <div className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded border border-amber-500/20 mt-1">
                <strong>Actionable Market Implication:</strong> {al.actionable_implication}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
