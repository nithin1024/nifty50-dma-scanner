import React, { useState } from 'react';
import type { HeavyweightsReport } from '../types';
import { 
  Crown, 
  Layers 
} from 'lucide-react';

interface Top7HeavyweightsProps {
  heavyweights: HeavyweightsReport | null;
  loading?: boolean;
  onSelectStock?: (symbol: string) => void;
}

export const Top7Heavyweights: React.FC<Top7HeavyweightsProps> = ({
  heavyweights,
  loading: _loading,
  onSelectStock: _onSelectStock
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('HDFCBANK');

  const stocks = heavyweights?.heavyweights || [];
  const selectedHw = stocks.find(s => s.symbol === selectedSymbol) || stocks[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 rounded-xl bg-[#121824] border border-[#232E47]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Crown className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Page 4 — Top 7 NIFTY 50 Heavyweight Stock Tracker
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dedicated institutional tracking for HDFCBANK, ICICIBANK, RELIANCE, BHARTIARTL, LT, SBIN, and INFY (~46% combined weight).
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-[#1A2234] px-4 py-2 rounded-lg border border-[#232E47] text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">COMBINED WEIGHT</span>
            <strong className="text-white text-base">{heavyweights?.combined_weightage_pct || 45.5}%</strong>
          </div>
          <div className="border-l border-[#232E47] pl-4">
            <span className="text-slate-400 block text-[10px]">EST. INDEX CONTRIBUTION</span>
            <strong className={`text-base ${((heavyweights?.combined_estimated_contribution_pts || 0) >= 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(heavyweights?.combined_estimated_contribution_pts || 0) >= 0 ? '+' : ''}
              {(heavyweights?.combined_estimated_contribution_pts || 0).toFixed(4)} pts
            </strong>
          </div>
        </div>
      </div>

      {/* Stock Selection Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {stocks.map((hw) => {
          const isSelected = hw.symbol === selectedSymbol;
          const isPositive = hw.market_data.price_change_pct >= 0;
          return (
            <button
              key={hw.symbol}
              onClick={() => setSelectedSymbol(hw.symbol)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-[#121824] hover:bg-slate-800/60 text-slate-300 border border-[#232E47]'
              }`}
            >
              <span>{hw.symbol}</span>
              <span className="text-[10px] text-slate-400 font-normal">({hw.weightage.toFixed(2)}%)</span>
              <span className={`text-[11px] ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '+' : ''}{hw.market_data.price_change_pct.toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Heavyweight Detailed Card */}
      {selectedHw && (
        <div className="space-y-6">
          {/* Top Detail Card */}
          <div className="p-6 rounded-xl bg-[#121824] border border-[#232E47] shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#232E47]/70 pb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/20">
                    {selectedHw.sector} &bull; {selectedHw.industry}
                  </span>
                  <span className="text-xs text-slate-500">ISIN: {selectedHw.isin}</span>
                </div>
                <div className="flex items-baseline space-x-3 mt-1.5">
                  <h2 className="text-2xl font-black text-white">{selectedHw.symbol}</h2>
                  <span className="text-sm text-slate-300 font-medium">{selectedHw.company_name}</span>
                </div>
              </div>

              {/* Price & Contribution Highlights */}
              <div className="flex items-center space-x-6">
                <div>
                  <div className="text-xs text-slate-400">Current LTP</div>
                  <div className="text-2xl font-black text-white">₹{selectedHw.market_data.ltp.toFixed(2)}</div>
                  <div className={`text-xs font-bold ${selectedHw.market_data.price_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedHw.market_data.price_change_pct >= 0 ? '+' : ''}{selectedHw.market_data.price_change_pct.toFixed(2)}% (₹{selectedHw.market_data.price_change.toFixed(2)})
                  </div>
                </div>

                <div className="border-l border-[#232E47] pl-6">
                  <div className="text-xs text-slate-400">NIFTY Contribution (pts)</div>
                  <div className={`text-2xl font-black ${selectedHw.weightage_impact.approx_index_contribution_pts >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedHw.weightage_impact.approx_index_contribution_pts >= 0 ? '+' : ''}
                    {selectedHw.weightage_impact.approx_index_contribution_pts.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium uppercase">
                    Role: {selectedHw.weightage_impact.impact_status}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 text-xs">
              <div className="p-3 rounded-lg bg-[#1A2234]">
                <span className="text-slate-400 block text-[10px]">INDEX WEIGHTAGE</span>
                <strong className="text-white text-sm">{selectedHw.weightage.toFixed(2)}%</strong>
              </div>
              <div className="p-3 rounded-lg bg-[#1A2234]">
                <span className="text-slate-400 block text-[10px]">CUMULATIVE VOLUME</span>
                <strong className="text-white text-sm">{selectedHw.market_data.cumulative_volume.toLocaleString()}</strong>
              </div>
              <div className="p-3 rounded-lg bg-[#1A2234]">
                <span className="text-slate-400 block text-[10px]">6-SESSION AVG VOL</span>
                <strong className="text-white text-sm">
                  {selectedHw.volume_analytics.six_session_avg_volume ? Math.round(selectedHw.volume_analytics.six_session_avg_volume).toLocaleString() : '-'}
                </strong>
              </div>
              <div className="p-3 rounded-lg bg-[#1A2234]">
                <span className="text-slate-400 block text-[10px]">RVOL</span>
                <strong className="text-amber-400 text-sm">
                  {selectedHw.volume_analytics.rvol ? `${selectedHw.volume_analytics.rvol.toFixed(2)}x` : '-'}
                </strong>
              </div>
              <div className="p-3 rounded-lg bg-[#1A2234]">
                <span className="text-slate-400 block text-[10px]">DMA SCORE</span>
                <strong className="text-white text-sm">{selectedHw.technical_analytics.score}/6</strong>
              </div>
              <div className="p-3 rounded-lg bg-[#1A2234]">
                <span className="text-slate-400 block text-[10px]">CLOSEST SUPPORT</span>
                <strong className="text-emerald-400 text-sm">{selectedHw.technical_analytics.closest_support_dma || 'None'}</strong>
              </div>
            </div>
          </div>

          {/* Section B: Six-Session Volume History Table */}
          <div className="p-5 rounded-xl bg-[#121824] border border-[#232E47]">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Section B — Six-Session Volume &amp; Price Change History</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#1A2234] text-slate-400 text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Session</th>
                    <th className="py-2.5 px-3">Trading Date</th>
                    <th className="py-2.5 px-3 text-right">Close Price</th>
                    <th className="py-2.5 px-3 text-right">Price Change %</th>
                    <th className="py-2.5 px-3 text-right">Traded Volume</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232E47]/60">
                  {selectedHw.six_session_history.map((s, idx) => {
                    const isLatest = idx === selectedHw.six_session_history.length - 1;
                    const isPos = s.price_change_pct >= 0;
                    return (
                      <tr key={s.trading_date} className={isLatest ? 'bg-sky-500/10 font-bold' : ''}>
                        <td className="py-2.5 px-3 text-slate-400">Session {s.session_index}</td>
                        <td className="py-2.5 px-3 font-mono text-white">{s.trading_date}</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{s.close_price.toFixed(2)}</td>
                        <td className={`py-2.5 px-3 text-right font-mono ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPos ? '+' : ''}{s.price_change_pct.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                          {s.traded_volume.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          {isLatest ? (
                            <span className="text-[10px] uppercase font-bold text-sky-400 px-1.5 py-0.5 rounded bg-sky-500/20">Latest</span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Historical</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section D: Six DMA Technical Analytics Grid */}
          <div className="p-5 rounded-xl bg-[#121824] border border-[#232E47]">
            <h3 className="text-sm font-bold text-white mb-3">
              Section D — Six Simple Moving Averages (DMAs) &amp; Distances
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {[5, 10, 20, 50, 100, 200].map(period => {
                const sma = selectedHw.technical_analytics.smas[`dma${period}`];
                const dist = selectedHw.technical_analytics.distances[`dist_dma${period}`];
                const isAbove = sma !== null && sma !== undefined && selectedHw.market_data.ltp > sma;

                return (
                  <div 
                    key={period} 
                    className={`p-3.5 rounded-lg border ${
                      isAbove 
                        ? 'bg-emerald-500/5 border-emerald-500/30' 
                        : 'bg-rose-500/5 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                      <span className="font-bold text-white">{period} DMA</span>
                      <span className={`text-[10px] font-bold ${isAbove ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isAbove ? 'ABOVE' : 'BELOW'}
                      </span>
                    </div>
                    <div className="text-base font-mono font-bold text-white">
                      {sma ? `₹${sma.toFixed(2)}` : 'N/A'}
                    </div>
                    <div className={`text-[11px] font-mono mt-0.5 ${isAbove ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {dist !== null && dist !== undefined ? `${dist >= 0 ? '+' : ''}${dist.toFixed(2)}%` : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
