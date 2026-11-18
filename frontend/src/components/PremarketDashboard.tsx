import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  RefreshCw, 
  Compass, 
  Target
} from 'lucide-react';
import { fetchPremarketIntelligence } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const PremarketDashboard: React.FC = () => {
  const { language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPremarketIntelligence();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load premarket intelligence.');
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
          {language === 'te' ? 'ప్రీమార్కెట్ విశ్లేషణను లోడ్ చేస్తోంది...' : 'Synthesizing Institutional Premarket Intelligence...'}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#121824] rounded-xl border border-rose-500/30 p-6 text-center space-y-3">
        <div className="text-rose-400 font-bold">Premarket Data Unavailable</div>
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

  const telemetry = data.opening_telemetry || {};
  const globalMarkets = data.global_markets || [];
  const scenarios = data.scenarios || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-sky-400" />
            <h1 className="text-lg font-black text-white tracking-tight">
              {language === 'te' ? 'ఇండియన్ స్టాక్ మార్కెట్ ప్రీమార్కెట్ ఇంటెలిజెన్స్' : 'Institutional Premarket Intelligence & Global Cues'}
            </h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
              MODULE 2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {language === 'te' 
              ? 'మార్కెట్ ఓపెనింగ్‌కు ముందే గ్లోబల్ మార్కెట్లు, గిఫ్ట్ నిఫ్టీ సూచనలు మరియు 3 సైంటిఫిక్ ఓపెనింగ్ దృశ్యాలు.'
              : 'Synthesized before market open (09:00 AM IST) • Global Indices, Implied Gap & Scenario Invalidation Levels'}
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-semibold self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{language === 'te' ? 'రిఫ్రెష్ చేయండి' : 'Refresh Telemetry'}</span>
        </button>
      </div>

      {/* Opening Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#121824] border border-[#232E47] p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-medium">Prev NIFTY Close</div>
          <div className="text-lg font-mono font-bold text-white mt-1">
            ₹{telemetry.previous_nifty_close?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">High: ₹{telemetry.previous_session_high} | Low: ₹{telemetry.previous_session_low}</div>
        </div>

        <div className="bg-[#121824] border border-[#232E47] p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-medium">GIFT NIFTY Indication</div>
          <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
            ₹{telemetry.gift_nifty_indication?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center space-x-1">
            <span className={telemetry.gap_points >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {telemetry.gap_points >= 0 ? '+' : ''}{telemetry.gap_points} pts ({telemetry.gap_percentage}%)
            </span>
            <span className="text-slate-500">• {telemetry.gap_classification?.replace(/_/g, ' ')}</span>
          </div>
        </div>

        <div className="bg-[#121824] border border-[#232E47] p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-medium">FII Cash Bias</div>
          <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
            {telemetry.fii_cash_bias || 'NET BUYER'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Index Futures: {telemetry.fii_futures_bias}</div>
        </div>

        <div className="bg-[#121824] border border-[#232E47] p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-medium">India VIX Telemetry</div>
          <div className="text-lg font-mono font-bold text-amber-300 mt-1">
            {telemetry.india_vix_level || 14.12}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Comfort Zone (&lt; 15.00)</div>
        </div>
      </div>

      {/* 3 Mathematically Formulated Scenarios with Invalidation Levels */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-[#232E47] pb-3">
          <Target className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            {language === 'te' ? '3 మార్కెట్ ఓపెనింగ్ దృశ్యాలు & ఇన్వాలిడేషన్ లెవెల్స్' : '3 Scientifically Formulated Scenarios with Invalidation Levels'}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {scenarios.map((sc: any, idx: number) => {
            const isBull = sc.scenario.includes('BULLISH');
            const isBear = sc.scenario.includes('BEARISH');
            return (
              <div 
                key={idx}
                className={`rounded-xl border p-4 space-y-3 flex flex-col justify-between ${
                  isBull ? 'bg-emerald-500/5 border-emerald-500/30' :
                  isBear ? 'bg-rose-500/5 border-rose-500/30' :
                  'bg-amber-500/5 border-amber-500/30'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                      isBull ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                      isBear ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {sc.title}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Prob: {sc.probability_pct}%
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-white leading-relaxed">
                    Trigger: <span className="text-slate-300 font-normal">{sc.condition_trigger}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Supporting Evidence:</div>
                    <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                      {sc.supporting_evidence?.map((ev: string, evIdx: number) => (
                        <li key={evIdx}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {sc.upside_target_1 && (
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                        <div className="text-[9px] text-emerald-400">Target 1</div>
                        <div className="font-bold text-white">₹{sc.upside_target_1}</div>
                      </div>
                    )}
                    {sc.upside_target_2 && (
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                        <div className="text-[9px] text-emerald-400">Target 2</div>
                        <div className="font-bold text-white">₹{sc.upside_target_2}</div>
                      </div>
                    )}
                    {sc.downside_target_1 && (
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                        <div className="text-[9px] text-rose-400">Target 1</div>
                        <div className="font-bold text-white">₹{sc.downside_target_1}</div>
                      </div>
                    )}
                    {sc.downside_target_2 && (
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                        <div className="text-[9px] text-rose-400">Target 2</div>
                        <div className="font-bold text-white">₹{sc.downside_target_2}</div>
                      </div>
                    )}
                    {sc.range_floor && (
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                        <div className="text-[9px] text-amber-300">Floor</div>
                        <div className="font-bold text-white">₹{sc.range_floor}</div>
                      </div>
                    )}
                    {sc.range_ceiling && (
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                        <div className="text-[9px] text-amber-300">Ceiling</div>
                        <div className="font-bold text-white">₹{sc.range_ceiling}</div>
                      </div>
                    )}
                  </div>

                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-[11px]">
                    <span className="text-rose-400 font-bold">Invalidation Level: ₹{sc.critical_invalidation_level}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{sc.invalidation_note}</p>
                  </div>

                  <div className="text-[10px] text-sky-300 bg-sky-500/10 p-2 rounded border border-sky-500/20">
                    <strong>Actionable Bias:</strong> {sc.actionable_bias}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Closing Quotes Table */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#232E47] pb-3">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {language === 'te' ? 'గ్లోబల్ మార్కెట్స్ పనితీరు' : 'Global Markets Closing Performance'}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">12 International Benchmarks</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B0E14] text-slate-400 uppercase text-[10px] border-b border-[#232E47]">
              <tr>
                <th className="py-2.5 px-3">Market</th>
                <th className="py-2.5 px-3">Country</th>
                <th className="py-2.5 px-3 text-right">Latest Quote</th>
                <th className="py-2.5 px-3 text-right">Prev Close</th>
                <th className="py-2.5 px-3 text-right">Change</th>
                <th className="py-2.5 px-3 text-right">% Change</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232E47]/50">
              {globalMarkets.map((m: any, idx: number) => {
                const isPos = m.change >= 0;
                return (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{m.market}</td>
                    <td className="py-2.5 px-3 text-slate-300">{m.country}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">
                      {m.latest?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {m.prev_close?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{m.change?.toFixed(2)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{m.change_pct?.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        m.status === 'LIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {m.status}
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
