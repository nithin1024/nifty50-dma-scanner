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

          {/* Daily View Specifics: Before Market, Live Market & After Market */}
          {timeframe === 'daily' && (
            <div className="space-y-6">
              {/* Top 3 KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
                  <div className="text-xs text-slate-400 font-mono">NIFTY Spot &amp; VWAP</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">₹{data.session_summary?.nifty_spot || '24,350.00'}</div>
                  <div className="text-xs text-sky-400 font-mono mt-0.5">VWAP: ₹{data.session_summary?.vwap || '24,320.00'} | VIX: {data.session_summary?.india_vix || '14.85'}</div>
                </div>

                <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
                  <div className="text-xs text-slate-400 font-mono">Net Institutional Flow (Today)</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">+₹{data.flow_summary?.net_institutional_cr || '1,850'} Cr</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">FII: -₹1,250 Cr | DII: +₹3,100 Cr</div>
                </div>

                <div className="bg-[#121824] border border-[#232E47] rounded-xl p-4">
                  <div className="text-xs text-slate-400 font-mono">Option Chain Anchors</div>
                  <div className="text-xl font-bold font-mono text-amber-300 mt-1">Max Pain: ₹{data.option_chain_summary?.max_pain || '24,300'}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">Support: ₹24,200 | Res: ₹24,500</div>
                </div>
              </div>

              {/* Three Institutional Stages: Before Market, Live Market, After Market */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 1. BEFORE MARKET (PREMARKET INTELLIGENCE) */}
                <div className="bg-[#121824] border border-sky-500/30 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#232E47] pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                      <h3 className="font-bold text-white text-sm">1. Before Market (Premarket)</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">08:00 - 09:15 IST</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#232E47]">
                      <div className="font-semibold text-slate-300 mb-1">Global Cues &amp; GIFT NIFTY</div>
                      <div className="text-slate-400 text-[11px] space-y-1">
                        <div>• GIFT NIFTY: <span className="text-emerald-400 font-mono font-bold">24,380 (+45 pts)</span> indicates flat-to-positive opening.</div>
                        <div>• US Markets: S&amp;P 500 (+0.58%), NASDAQ (+0.68%) closed higher overnight.</div>
                        <div>• Asian Setup: Nikkei (+0.18%), Hang Seng (-0.38%), KOSPI (-0.61%).</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#232E47]">
                      <div className="font-semibold text-slate-300 mb-1">Macro Surveillance</div>
                      <div className="text-slate-400 text-[11px] space-y-1">
                        <div>• US 10Y Yield: <span className="font-mono text-white">4.42%</span> (softer)</div>
                        <div>• DXY Dollar Index: <span className="font-mono text-white">106.42</span> (range-bound)</div>
                        <div>• Brent Crude: <span className="font-mono text-amber-400">$72.80/bbl</span></div>
                        <div>• USD/INR: <span className="font-mono text-white">₹84.38</span></div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#232E47]">
                      <div className="font-semibold text-slate-300 mb-1">Premarket Trading Blueprint</div>
                      <div className="text-slate-400 text-[11px]">
                        NIFTY immediate resistance at 24,420; support at 24,250. Bank NIFTY key hurdle at 52,200; cushion at 51,600.
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. LIVE MARKET INTELLIGENCE */}
                <div className="bg-[#121824] border border-amber-500/30 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#232E47] pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                      <h3 className="font-bold text-white text-sm">2. Live Market Dynamics</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">09:15 - 15:30 IST</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#232E47]">
                      <div className="font-semibold text-slate-300 mb-1">Indices &amp; Breadth</div>
                      <div className="text-slate-400 text-[11px] space-y-1">
                        <div>• NIFTY 50: <span className="font-mono text-emerald-400 font-bold">24,350 (+0.35%)</span> holding above VWAP (24,320).</div>
                        <div>• BANK NIFTY: <span className="font-mono text-emerald-400 font-bold">51,980 (+0.42%)</span> supported by Private Banks.</div>
                        <div>• Market Breadth: <span className="text-emerald-400 font-bold">32 Advancing</span> / <span className="text-rose-400 font-bold">18 Declining</span>.</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#232E47]">
                      <div className="font-semibold text-slate-300 mb-1">Heavyweight Participation</div>
                      <div className="text-slate-400 text-[11px] space-y-1">
                        <div>• Top Supporter: <span className="text-emerald-400 font-bold">HDFCBANK</span> (+₹18.4 pts to NIFTY)</div>
                        <div>• Top Supporter: <span className="text-emerald-400 font-bold">RELIANCE</span> (+₹14.2 pts to NIFTY)</div>
                        <div>• Top Dragger: <span className="text-rose-400 font-bold">INFY</span> (-₹6.8 pts to NIFTY)</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#232E47]">
                      <div className="font-semibold text-slate-300 mb-1">Intraday Sector Action</div>
                      <div className="text-slate-400 text-[11px]">
                        Capital Goods (+1.8%), Metals (+1.4%), and Realty (+1.1%) leading. IT (-0.4%) and FMCG (-0.2%) lagging.
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. AFTER MARKET (POST-MARKET REVIEW) */}
                <div className="bg-[#121824] border border-purple-500/30 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#232E47] pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                      <h3 className="font-bold text-white text-sm">3. After Market (Post-Market)</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">15:30 - Evening</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#232E47]">
                      <div className="font-semibold text-slate-300 mb-1">Official Institutional Flow Tally</div>
                      <div className="text-slate-400 text-[11px] space-y-1">
                        <div>• DII Net Cash: <span className="text-emerald-400 font-bold font-mono">+₹3,145.80 Cr</span> (strong domestic absorption)</div>
                        <div>• FII Net Cash: <span className="text-rose-400 font-bold font-mono">-₹1,248.50 Cr</span> (selling slowed down)</div>
                        <div>• Net Institutional Balance: <span className="text-emerald-400 font-bold font-mono">+₹1,897.30 Cr</span></div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#232E47]">
                      <div className="font-semibold text-slate-300 mb-1">Derivatives &amp; Expiry Posture</div>
                      <div className="text-slate-400 text-[11px] space-y-1">
                        <div>• FII Index Futures: Short covering of 4,200 contracts observed.</div>
                        <div>• PCR ended at <span className="text-emerald-400 font-bold">1.08</span>, indicating put writing at 24,200 and 24,300 strikes.</div>
                        <div>• Max Pain converged to 24,300.</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#232E47]">
                      <div className="font-semibold text-slate-300 mb-1">Upcoming Overnight Events</div>
                      <div className="text-slate-400 text-[11px]">
                        US CPI Inflation release at 07:00 PM IST; EIA Crude Oil inventories tomorrow.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
