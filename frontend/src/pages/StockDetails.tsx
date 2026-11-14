import React, { useState, useEffect } from 'react';
import { LineChart, Search, Sparkles, Check, X } from 'lucide-react';
import { fetchStockDetails } from '../services/api';
import type { StockDetailsResponse } from '../types';
import { VolumeTrendChart } from '../components/VolumeTrendChart';

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
  const [data, setData] = useState<StockDetailsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchStockDetails(selectedSymbol)
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

  // Clean SVG technical analysis chart: Daily Closes, 20 DMA & Synchronized Volume Bar Graph
  const renderChart = () => {
    if (!data || !data.chart_data || data.chart_data.length === 0) return null;
    const candles = data.chart_data.slice(-90); // Last 90 sessions
    const closes = candles.map(c => c.close);
    const dma20s = candles.map(c => c.dma20).filter((v): v is number => v !== null);
    const volumes = candles.map(c => c.volume);

    const minVal = Math.min(...closes, ...(dma20s.length ? dma20s : [closes[0]])) * 0.98;
    const maxVal = Math.max(...closes, ...(dma20s.length ? dma20s : [closes[0]])) * 1.02;
    const range = maxVal - minVal || 1;

    const maxVol = Math.max(...volumes, 1) * 1.1;

    // Calculate 20-session volume average for overlay line
    const volSma20: (number | null)[] = candles.map((_, i) => {
      if (i < 19) return null;
      const slice = volumes.slice(i - 19, i + 1);
      return slice.reduce((a, b) => a + b, 0) / 20;
    });

    const width = 800;
    const priceHeight = 180;
    const volHeight = 70;
    const totalHeight = priceHeight + volHeight + 20;

    const getX = (i: number) => (i / (candles.length - 1)) * width;
    const getPriceY = (val: number) => priceHeight - ((val - minVal) / range) * priceHeight;
    const getVolY = (vol: number) => totalHeight - ((vol / maxVol) * volHeight);

    const closePoints = candles.map((c, i) => `${getX(i)},${getPriceY(c.close)}`).join(' ');
    const dma20Points = candles
      .map((c, i) => (c.dma20 !== null ? `${getX(i)},${getPriceY(c.dma20)}` : null))
      .filter(Boolean)
      .join(' ');

    const volMaPoints = volSma20
      .map((v, i) => (v !== null ? `${getX(i)},${getVolY(v)}` : null))
      .filter(Boolean)
      .join(' ');

    const barWidth = Math.max(2, (width / candles.length) * 0.7);

    return (
      <div className="relative w-full bg-[#0B0E14] rounded-lg p-2 border border-[#232E47]/60 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between text-xs font-mono px-2 pt-1 pb-2 border-b border-[#232E47]/40 gap-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-0.5 bg-sky-400" />
              <span className="text-slate-300">Daily Close</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-0.5 bg-amber-400" />
              <span className="text-slate-300">20 DMA</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" />
              <span className="text-slate-300">Vol (Up)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/80" />
              <span className="text-slate-300">Vol (Down)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-0.5 bg-purple-400" />
              <span className="text-slate-300">20 Vol SMA</span>
            </div>
          </div>
          <div className="text-slate-500 text-[11px]">Last 90 Sessions</div>
        </div>

        <svg viewBox={`0 0 ${width} ${totalHeight}`} className="w-full h-[320px] pt-2" preserveAspectRatio="none">
          {/* Price Grid lines */}
          <line x1="0" y1={priceHeight * 0.25} x2={width} y2={priceHeight * 0.25} stroke="#232E47" strokeDasharray="3 3" />
          <line x1="0" y1={priceHeight * 0.5} x2={width} y2={priceHeight * 0.5} stroke="#232E47" strokeDasharray="3 3" />
          <line x1="0" y1={priceHeight * 0.75} x2={width} y2={priceHeight * 0.75} stroke="#232E47" strokeDasharray="3 3" />

          {/* Separator line between price and volume */}
          <line x1="0" y1={priceHeight + 10} x2={width} y2={priceHeight + 10} stroke="#232E47" strokeWidth="1" />

          {/* Price Close line */}
          <polyline
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2"
            points={closePoints}
          />
          {/* 20 DMA line */}
          {dma20Points && (
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              points={dma20Points}
            />
          )}

          {/* Volume Bars */}
          {candles.map((c, i) => {
            const isUp = c.close >= c.open;
            const x = getX(i) - (barWidth / 2);
            const barH = Math.max(1, (c.volume / maxVol) * volHeight);
            const y = totalHeight - barH;
            return (
              <rect
                key={c.time}
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                fill={isUp ? '#10B981' : '#F43F5E'}
                opacity="0.8"
              />
            );
          })}

          {/* 20 Volume SMA line */}
          {volMaPoints && (
            <polyline
              fill="none"
              stroke="#C084FC"
              strokeWidth="1.5"
              strokeDasharray="3 2"
              points={volMaPoints}
            />
          )}
        </svg>

        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-2 pt-1">
          <span>Range: ₹{minVal.toFixed(1)} - ₹{maxVal.toFixed(1)}</span>
          <span>Max Volume: {(maxVol / 1000000).toFixed(2)}M</span>
        </div>
      </div>
    );
  };

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
          {/* Historical Candlestick & DMA Curve Chart */}
          <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <LineChart className="w-4 h-4 text-sky-400" />
                <h2 className="font-bold text-white text-sm">
                  Historical Price &amp; 20 DMA Trajectory
                </h2>
              </div>
              <span className="text-xs font-mono text-white">
                Latest Close: <span className="font-bold text-emerald-400">₹{data.latest_close.toFixed(2)}</span> ({data.latest_trading_date})
              </span>
            </div>
            {renderChart()}
          </div>

          {/* Volume Trend Bar Chart (Matching Screenshot) */}
          <VolumeTrendChart 
            title="Volume Trend"
            symbol={selectedSymbol}
            sessions={(data.chart_data || []).slice(-6).map((c, i, arr) => {
              const prevClose = i > 0 ? arr[i - 1].close : c.open;
              const chgPct = prevClose > 0 ? ((c.close - prevClose) / prevClose) * 100 : 0;
              return {
                date: c.time,
                volume: c.volume,
                price_change_pct: chgPct,
                close_price: c.close
              };
            })}
          />

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
