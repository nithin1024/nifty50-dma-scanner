import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Check, X } from 'lucide-react';
import { fetchStockDetails } from '../services/api';
import type { StockDetailsResponse } from '../types';
import { ProfessionalTradingChart } from '../components/ProfessionalTradingChart';
import { useLanguage } from '../context/LanguageContext';

interface StockDetailsProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  availableSymbols: string[];
}

export const StockDetails: React.FC<StockDetailsProps> = ({
  selectedSymbol,
  onSymbolChange,
  availableSymbols
}) => {
  const { t } = useLanguage();
  const [data, setData] = useState<StockDetailsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchStockDetails(selectedSymbol, '5y')
      .then(res => {
        if (isMounted) setData(res);
      })
      .catch(err => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [selectedSymbol]);

  const filteredSymbols = availableSymbols.filter(s => 
    s.toLowerCase().includes(search.toLowerCase())
  );



  return (
    <div className="space-y-6">
      {/* Header and Symbol Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white">{selectedSymbol}</h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Score: {data?.score ?? 0}/6
            </span>
            <span className="text-xs text-slate-400">
              {data?.company_name}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
            <span>Sector: {data?.industry}</span>
            <span>&bull;</span>
            <span>ISIN: {data?.isin}</span>
            <span>&bull;</span>
            <span className="text-emerald-400">{data?.status} ({data?.total_sessions} sessions)</span>
          </div>
        </div>

        {/* Quick Stock Selector */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#121824] border border-[#232E47] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none w-36"
            />
          </div>

          <select
            value={selectedSymbol}
            onChange={(e) => onSymbolChange(e.target.value)}
            className="bg-[#121824] border border-[#232E47] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
          >
            {filteredSymbols.map(sym => (
              <option key={sym} value={sym}>{sym}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-12 text-center text-slate-400">
          Loading 6-DMA breakdown for {selectedSymbol}...
        </div>
      ) : data ? (
        <>
          {/* Historical Price & DMA Trajectory — Professional Interactive Chart */}
          <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-white text-sm">
                {t('Historical Price & DMA Trajectory')}
              </h2>
              <span className="text-xs font-mono text-white">
                {t('Latest Close')}: <span className="font-bold text-emerald-400">₹{data.latest_close.toFixed(2)}</span> ({data.latest_trading_date})
              </span>
            </div>
            <ProfessionalTradingChart symbol={selectedSymbol} height={420} initialTimeframe="5m" />
          </div>

          {/* 6 DMA Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[5, 10, 20, 50, 100, 200].map((period) => {
              const smaVal = data.smas[`dma${period}`];
              const isAbove = data.comparisons[`above_dma${period}`];
              const dist = data.distances[`dist_dma${period}`];

              return (
                <div 
                  key={period}
                  className={`bg-[#121824] border rounded-xl p-3.5 transition-all ${
                    isAbove ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{period} DMA</span>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isAbove ? 'bg-emerald-500 text-black font-bold' : 'bg-rose-500 text-white font-bold'
                    }`}>
                      {isAbove ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                    </span>
                  </div>

                  <div className="mt-2 text-base font-bold font-mono text-white">
                    ₹{smaVal !== null ? smaVal.toFixed(2) : '-'}
                  </div>

                  <div className="mt-1 text-xs font-mono">
                    {dist !== null ? (
                      <span className={dist >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {dist >= 0 ? '+' : ''}{dist.toFixed(2)}%
                      </span>
                    ) : '-'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fresh Crossovers Detected for this Stock */}
          <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5">
            <h2 className="font-bold text-white text-sm mb-3 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Fresh Bullish Crossover Events</span>
            </h2>
            {data.fresh_crossovers && data.fresh_crossovers.length > 0 ? (
              <div className="space-y-2">
                {data.fresh_crossovers.map((xo, i) => (
                  <div key={i} className="bg-[#1A2234] border border-amber-500/30 rounded-lg p-3 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-amber-300">{xo.label} Fresh Bullish Crossover</span>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Previous close ₹{xo.previous_close} &le; SMA ₹{xo.previous_sma} &rarr; Latest close ₹{xo.latest_close} &gt; SMA ₹{xo.latest_sma}
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                      +{xo.distance_pct}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">
                No fresh daily crossovers in the latest session (stock is either established above or below SMAs).
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
