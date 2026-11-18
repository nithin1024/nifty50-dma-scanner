import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Clock
} from 'lucide-react';
import { fetchMonitoringDashboard } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const MultiTimeframeMonitoringDashboard: React.FC = () => {
  const { language } = useLanguage();
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (tf: 'daily' | 'weekly' | 'monthly') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMonitoringDashboard(tf);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load monitoring dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(timeframe);
  }, [timeframe]);

  return (
    <div className="space-y-6">
      {/* Header Banner & Timeframe Selector */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h1 className="text-lg font-black text-white tracking-tight">
              {language === 'te' ? 'రోజువారీ, వీక్లీ మరియు మంత్లీ మార్కెట్ పర్యవేక్షణ' : 'Daily, Weekly & Monthly Monitoring Dashboards'}
            </h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              MODULE 10
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {language === 'te' 
              ? 'వివిధ కాల వ్యవధులలో మార్కెట్ ధోరణులు, 5 సంవత్సరాల స్థూల ఆర్థిక మాతృక మరియు సంచిత ప్రవాహాలు.'
              : 'Multi-Timeframe Macro & Technical Surveillance • 5-Year Historical Series & Cumulative Flows'}
          </p>
        </div>

        {/* 3-Timeframe Switcher */}
        <div className="flex items-center bg-[#0B0E14] p-1 rounded-lg border border-[#232E47] text-xs font-mono self-start md:self-auto">
          {(['daily', 'weekly', 'monthly'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-md font-bold uppercase transition-all ${
                timeframe === tf
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3 bg-[#121824] rounded-xl border border-[#232E47] p-8">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <div className="text-slate-300 font-medium text-sm font-mono">
            Loading {timeframe.toUpperCase()} Monitoring Analytics...
          </div>
        </div>
      ) : error || !data ? (
        <div className="bg-[#121824] rounded-xl border border-rose-500/30 p-6 text-center space-y-3">
          <div className="text-rose-400 font-bold">Data Unavailable</div>
          <div className="text-xs text-slate-400 font-mono">{error}</div>
          <button
            onClick={() => loadData(timeframe)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Weekly View Specifics */}
          {timeframe === 'weekly' && (
            <div className="space-y-6">
              {/* Weekly Performance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
                  <div className="text-xs text-slate-400 font-mono">NIFTY Weekly Return</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    +{data.nifty_weekly_performance?.weekly_change_pct}% (+{data.nifty_weekly_performance?.weekly_change_pts} pts)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    High: {data.nifty_weekly_performance?.high} | Low: {data.nifty_weekly_performance?.low}
                  </div>
                </div>

                <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
                  <div className="text-xs text-slate-400 font-mono">5-Session Institutional Cumulative</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    +₹{data.fii_dii_weekly_trend?.total_institutional_flow_cr?.toLocaleString('en-IN')} Cr
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-0.5 font-mono">
                    FII: +₹{data.fii_dii_weekly_trend?.fii_net_crores_5_sessions} Cr | DII: +₹{data.fii_dii_weekly_trend?.dii_net_crores_5_sessions} Cr
                  </div>
                </div>

                <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
                  <div className="text-xs text-slate-400 font-mono">Derivatives Positioning Shift</div>
                  <div className="text-base font-bold font-mono text-amber-300 mt-1">
                    {data.derivatives_weekly_shifts?.fii_index_futures_contracts_change}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    {data.derivatives_weekly_shifts?.fii_long_pct_shift}
                  </div>
                </div>
              </div>

              {/* Weekly Sector Winners & Laggards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#121824] border border-emerald-500/30 rounded-xl p-5 space-y-3">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    Top Sector Gainers (Week Ended)
                  </div>
                  <div className="space-y-2">
                    {data.sector_weekly_winners_losers?.top_gainers?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-900/60 text-xs font-mono">
                        <span className="text-white font-semibold">{item.sector}</span>
                        <span className="text-emerald-400 font-bold">+{item.weekly_return_pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#121824] border border-rose-500/30 rounded-xl p-5 space-y-3">
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
                    Top Sector Laggards (Week Ended)
                  </div>
                  <div className="space-y-2">
                    {data.sector_weekly_winners_losers?.top_laggards?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-900/60 text-xs font-mono">
                        <span className="text-white font-semibold">{item.sector}</span>
                        <span className="text-rose-400 font-bold">{item.weekly_return_pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monthly View Specifics (5-Year Historical Macro Matrix) */}
          {timeframe === 'monthly' && (
            <div className="space-y-6">
              <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#232E47] pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    5-Year Annual Macroeconomic & Flow Matrix
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Official MoSPI & NSE Provenance</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0B0E14] text-slate-400 uppercase text-[10px] border-b border-[#232E47]">
                      <tr>
                        <th className="py-2.5 px-3">Fiscal Year</th>
                        <th className="py-2.5 px-3 text-right">Real GDP %</th>
                        <th className="py-2.5 px-3 text-right">Avg CPI %</th>
                        <th className="py-2.5 px-3 text-right">Repo Rate %</th>
                        <th className="py-2.5 px-3 text-right">FII Net (₹ Cr)</th>
                        <th className="py-2.5 px-3 text-right">DII Net (₹ Cr)</th>
                        <th className="py-2.5 px-3 text-right">NIFTY Return %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232E47]/50">
                      {data.five_year_macro_matrix?.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white">{row.year}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-400">{row.real_gdp_growth_pct}%</td>
                          <td className="py-2.5 px-3 text-right text-slate-300">{row.avg_cpi_pct}%</td>
                          <td className="py-2.5 px-3 text-right text-amber-300 font-bold">{row.repo_rate_pct}%</td>
                          <td className={`py-2.5 px-3 text-right font-bold ${row.fii_net_annual_cr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ₹{row.fii_net_annual_cr?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-sky-400">
                            ₹{row.dii_net_annual_cr?.toLocaleString('en-IN')}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-bold ${row.nifty_annual_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {row.nifty_annual_return_pct >= 0 ? '+' : ''}{row.nifty_annual_return_pct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Daily View Specifics */}
          {timeframe === 'daily' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
                <div className="text-xs text-slate-400 font-mono">NIFTY Spot & VWAP</div>
                <div className="text-xl font-bold font-mono text-white mt-1">₹{data.session_summary?.nifty_spot}</div>
                <div className="text-xs text-sky-400 font-mono mt-0.5">VWAP: ₹{data.session_summary?.vwap} | VIX: {data.session_summary?.india_vix}</div>
              </div>

              <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
                <div className="text-xs text-slate-400 font-mono">Net Institutional Flow (Today)</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">+₹{data.flow_summary?.net_institutional_cr} Cr</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">FII: +₹{data.flow_summary?.fii_cash_net_cr} Cr | DII: +₹{data.flow_summary?.dii_cash_net_cr} Cr</div>
              </div>

              <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
                <div className="text-xs text-slate-400 font-mono">Option Chain Anchors</div>
                <div className="text-xl font-bold font-mono text-amber-300 mt-1">Max Pain: ₹{data.option_chain_summary?.max_pain}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">Support: ₹{data.option_chain_summary?.strongest_support} | Res: ₹{data.option_chain_summary?.strongest_resistance}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
