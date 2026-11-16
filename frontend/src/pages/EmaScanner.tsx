import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Search, 
  RefreshCw, 
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  LineChart as LineChartIcon,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { fetchEmaScanner, fetchStockDetails } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { ProfessionalTradingChart } from '../components/ProfessionalTradingChart';
import type { StockDetailsResponse } from '../types';

interface EmaRecord {
  symbol: string;
  company_name: string;
  industry: string;
  close: number;
  prev_close: number;
  trading_date: string;
  ema_9: number;
  ema_21: number;
  prev_ema_9: number | null;
  prev_ema_21: number | null;
  ema_distance_pct: number;
  alignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  fresh_bullish_crossover: boolean;
  fresh_bearish_crossover: boolean;
  rsi_14: number;
  prev_rsi_14: number | null;
  rsi_direction: 'RISING' | 'FALLING' | 'FLAT';
  rsi_status: string;
  is_in_rsi_corridor: boolean;
  satisfies_ema_and_rsi: boolean;
  volume: number;
  rvol: number;
  volume_status: string;
  institutional_bias: string;
}

// Pure exponential moving average calculation
function calculateEmaSeries(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = [];
  let ema: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      const slice = values.slice(0, period);
      ema = slice.reduce((a, b) => a + b, 0) / period;
      result.push(ema);
    } else {
      ema = (values[i] * k) + (ema! * (1 - k));
      result.push(ema);
    }
  }
  return result;
}

// Pure Wilder's RSI calculation
function calculateWilderRsiSeries(values: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (values.length <= period) return values.map(() => null);

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i <= period; i++) {
    if (i < period) {
      result.push(null);
    } else {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    }
  }

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(100 - (100 / (1 + rs)));
  }

  return result;
}

export const EmaScanner: React.FC<{ onSelectStock?: (symbol: string) => void }> = ({ onSelectStock }) => {
  const { language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGroup, setActiveGroup] = useState<string>('ALL');
  const [rsiMin, setRsiMin] = useState<number>(40.0);
  const [rsiMax, setRsiMax] = useState<number>(60.0);

  // Selected Stock for Interactive Line Chart
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');
  const [chartView, setChartView] = useState<'upstox' | 'corridor'>('upstox');
  const [chartSessions, setChartSessions] = useState<number>(15);
  const [stockDetails, setStockDetails] = useState<StockDetailsResponse | null>(null);
  const [chartLoading, setChartLoading] = useState<boolean>(false);

  const loadData = async (min = rsiMin, max = rsiMax) => {
    try {
      setLoading(true);
      const res = await fetchEmaScanner(min, max);
      setData(res);
      // If selectedSymbol is default and records exist, select the first bullish stock
      if (res?.all_results && res.all_results.length > 0) {
        const topBull = res.all_results.find((r: EmaRecord) => r.satisfies_ema_and_rsi) || res.all_results[0];
        if (topBull && selectedSymbol === 'RELIANCE') {
          setSelectedSymbol(topBull.symbol);
        }
      }
    } catch (err) {
      console.error('Failed to load EMA scanner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch candle data for the selected symbol for line chart rendering
  useEffect(() => {
    let isMounted = true;
    setChartLoading(true);
    fetchStockDetails(selectedSymbol, '6m')
      .then(res => {
        if (isMounted) setStockDetails(res);
      })
      .catch(err => console.error(err))
      .finally(() => {
        if (isMounted) setChartLoading(false);
      });
    return () => { isMounted = false; };
  }, [selectedSymbol]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(rsiMin, rsiMax);
    setRefreshing(false);
  };

  const handleApplyRsiFilter = () => {
    loadData(rsiMin, rsiMax);
  };

  const records: EmaRecord[] = data?.all_results || [];
  const selectedRecord = records.find(r => r.symbol === selectedSymbol);
  const availableSymbols = useMemo(() => records.map(r => r.symbol), [records]);

  // Filtered by search and active group
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSym = r.symbol.toLowerCase().includes(q);
        const matchName = r.company_name.toLowerCase().includes(q);
        const matchInd = r.industry.toLowerCase().includes(q);
        if (!matchSym && !matchName && !matchInd) return false;
      }

      if (activeGroup === 'BULLISH_CORRIDOR') {
        return r.satisfies_ema_and_rsi;
      } else if (activeGroup === 'BEARISH_CORRIDOR') {
        return r.alignment === 'BEARISH' && r.is_in_rsi_corridor;
      } else if (activeGroup === 'FRESH_BULLISH') {
        return r.fresh_bullish_crossover;
      } else if (activeGroup === 'FRESH_BEARISH') {
        return r.fresh_bearish_crossover;
      } else if (activeGroup === 'RSI_OUTSIDE') {
        return !r.is_in_rsi_corridor;
      } else if (activeGroup === 'NEAR_CROSSOVER') {
        return Math.abs(r.ema_distance_pct) <= 0.60;
      }

      return true;
    });
  }, [records, searchQuery, activeGroup]);

  // Compute calculated line series for the chart
  const chartSeries = useMemo(() => {
    if (!stockDetails || !stockDetails.chart_data || stockDetails.chart_data.length < 25) {
      return null;
    }
    const candles = stockDetails.chart_data;
    const closes = candles.map(c => c.close);
    const ema9Series = calculateEmaSeries(closes, 9);
    const ema21Series = calculateEmaSeries(closes, 21);
    const rsi14Series = calculateWilderRsiSeries(closes, 14);

    // Take the trailing N sessions for clean, high-precision line graph
    const n = Math.min(chartSessions, candles.length);
    const sliceStart = candles.length - n;

    const points = [];
    for (let i = sliceStart; i < candles.length; i++) {
      points.push({
        date: candles[i].time,
        close: candles[i].close,
        ema9: ema9Series[i],
        ema21: ema21Series[i],
        rsi14: rsi14Series[i],
        volume: candles[i].volume
      });
    }

    return points;
  }, [stockDetails, chartSessions]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-[#121824] rounded-xl border border-[#232E47] p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  NIFTY 50 EMA 9 / 21 &amp; RSI 14 SCANNER
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  MOMENTUM ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {language === 'te'
                  ? 'NIFTY 50 కోసం EMA 9 మరియు EMA 21 ఎక్స్‌పోనెన్షియల్ మూవింగ్ యావరేజ్ క్రాస్‌ఓవర్లు, వైల్డర్స్ RSI 14 కారిడార్ (40-60 పరిధి) మరియు వాల్యూమ్ కన్ఫర్మేషన్ ద్వారా స్వల్పకాలిక మొమెంటం స్కానర్.'
                  : "Quantitative technical scanner evaluating Exponential Moving Averages (EMA 9 vs EMA 21) paired with Wilder's RSI 14 consolidation corridor (40-60 range), fresh crossovers, and volume accumulation confirmation across all 50 constituents."}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/40 text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh EMA Scan'}</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-[#232E47]/70">
          <div 
            onClick={() => setActiveGroup('ALL')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeGroup === 'ALL' ? 'bg-slate-800/80 border-sky-500/50' : 'bg-[#0B0E14]/70 border-[#232E47] hover:bg-slate-800/40'
            }`}
          >
            <div className="text-[11px] text-slate-400">Total Constituents</div>
            <div className="text-lg font-bold text-white mt-0.5">{data?.total_constituents || 50}</div>
          </div>

          <div 
            onClick={() => setActiveGroup('BULLISH_CORRIDOR')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeGroup === 'BULLISH_CORRIDOR' ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-[#0B0E14]/70 border-[#232E47] hover:bg-slate-800/40'
            }`}
          >
            <div className="text-[11px] text-emerald-400 font-medium">Bullish + RSI 40-60</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{data?.summary_counts?.bullish_and_rsi_satisfied || 0}</div>
          </div>

          <div 
            onClick={() => setActiveGroup('FRESH_BULLISH')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeGroup === 'FRESH_BULLISH' ? 'bg-sky-500/20 border-sky-500/50' : 'bg-[#0B0E14]/70 border-[#232E47] hover:bg-slate-800/40'
            }`}
          >
            <div className="text-[11px] text-sky-400 font-medium">Fresh Bullish Cross</div>
            <div className="text-lg font-bold text-sky-400 mt-0.5">{data?.summary_counts?.fresh_bullish_crossovers || 0}</div>
          </div>

          <div 
            onClick={() => setActiveGroup('FRESH_BEARISH')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeGroup === 'FRESH_BEARISH' ? 'bg-rose-500/20 border-rose-500/50' : 'bg-[#0B0E14]/70 border-[#232E47] hover:bg-slate-800/40'
            }`}
          >
            <div className="text-[11px] text-rose-400 font-medium">Fresh Bearish Cross</div>
            <div className="text-lg font-bold text-rose-400 mt-0.5">{data?.summary_counts?.fresh_bearish_crossovers || 0}</div>
          </div>

          <div 
            onClick={() => setActiveGroup('NEAR_CROSSOVER')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeGroup === 'NEAR_CROSSOVER' ? 'bg-amber-500/20 border-amber-500/50' : 'bg-[#0B0E14]/70 border-[#232E47] hover:bg-slate-800/40'
            }`}
          >
            <div className="text-[11px] text-amber-300 font-medium">Near Cross Watchlist</div>
            <div className="text-lg font-bold text-amber-300 mt-0.5">{data?.groups?.watchlist_near_crossover?.length || 0}</div>
          </div>

          <div 
            onClick={() => setActiveGroup('RSI_OUTSIDE')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              activeGroup === 'RSI_OUTSIDE' ? 'bg-purple-500/20 border-purple-500/50' : 'bg-[#0B0E14]/70 border-[#232E47] hover:bg-slate-800/40'
            }`}
          >
            <div className="text-[11px] text-purple-300 font-medium">RSI Outside 40-60</div>
            <div className="text-lg font-bold text-purple-300 mt-0.5">{data?.groups?.rsi_outside_corridor?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED INTERACTIVE EMA + RSI LINE GRAPH (Replica of User's Reference Images with Data Dots) */}
      <div className="bg-[#121824] rounded-xl border border-[#232E47] p-5 shadow-xl space-y-4">
        {/* Header with Selected Stock Telemetry & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <LineChartIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-black text-white font-mono">{selectedSymbol}</span>
                <span className="text-xs text-slate-400">({selectedRecord?.company_name || stockDetails?.company_name || 'NIFTY 50'})</span>
                {selectedRecord && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedRecord.alignment === 'BULLISH'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {selectedRecord.alignment === 'BULLISH' ? 'EMA 9 > EMA 21 (BULLISH)' : 'EMA 9 < EMA 21 (BEARISH)'}
                  </span>
                )}
                {selectedRecord?.satisfies_ema_and_rsi && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-amber-400" />
                    <span>CORRIDOR SATISFIED</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono mt-1 text-slate-400">
                <span>Latest Close: <strong className="text-white">₹{selectedRecord?.close?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '—'}</strong></span>
                <span>EMA 9: <strong className="text-emerald-400">₹{selectedRecord?.ema_9?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '—'}</strong></span>
                <span>EMA 21: <strong className="text-amber-400">₹{selectedRecord?.ema_21?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '—'}</strong></span>
                <span>RSI 14: <strong className="text-purple-400">{selectedRecord?.rsi_14?.toFixed(1) || '—'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher: Upstox Pro Candlestick vs Corridor */}
            <div className="flex items-center bg-[#0B0E14] p-0.5 rounded-lg border border-[#232E47] text-xs font-mono">
              <button
                type="button"
                onClick={() => setChartView('upstox')}
                className={`px-3 py-1 rounded font-bold transition-all flex items-center space-x-1.5 ${
                  chartView === 'upstox'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Upstox Pro Chart</span>
              </button>
              <button
                type="button"
                onClick={() => setChartView('corridor')}
                className={`px-3 py-1 rounded font-bold transition-all flex items-center space-x-1.5 ${
                  chartView === 'corridor'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>RSI Corridor</span>
              </button>
            </div>

            {chartView === 'corridor' && (
              <div className="flex items-center space-x-1 bg-[#0B0E14] p-0.5 rounded-lg border border-[#232E47] text-xs font-mono">
                {[10, 15, 30].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setChartSessions(s)}
                    className={`px-2.5 py-1 rounded font-bold transition-all ${
                      chartSessions === s ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}-Sessions
                  </button>
                ))}
              </div>
            )}

            {onSelectStock && (
              <button
                type="button"
                onClick={() => onSelectStock(selectedSymbol)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 border border-sky-500/30 text-xs font-semibold"
                title="Inspect 5-year multi-year candles in Historical view"
              >
                <span>Inspect 5-Yr</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Stock Selector Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
          <span className="text-[11px] text-slate-500 font-sans uppercase font-bold shrink-0">Quick Inspect:</span>
          {records.slice(0, 10).map(stock => (
            <button
              key={stock.symbol}
              type="button"
              onClick={() => setSelectedSymbol(stock.symbol)}
              className={`px-2 py-0.5 rounded-md text-[11px] transition-all shrink-0 border ${
                selectedSymbol === stock.symbol
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                  : 'bg-[#0B0E14] text-slate-400 border-[#232E47] hover:text-white hover:border-slate-600'
              }`}
            >
              {stock.symbol}
            </button>
          ))}
        </div>

        {/* Primary Chart Area: Upstox Pro Chart or Corridor View */}
        {chartView === 'upstox' ? (
          <div className="rounded-xl overflow-hidden border border-[#232E47] bg-[#0B0E14]">
            <ProfessionalTradingChart
              symbol={selectedSymbol}
              availableSymbols={availableSymbols}
              onSymbolChange={setSelectedSymbol}
              initialTimeframe="1D"
              height={460}
            />
          </div>
        ) : (
          <div className="bg-[#0B0E14] rounded-lg border border-[#232E47]/70 p-3">
          {chartLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mb-2" />
              <span>Rendering EMA 9 / 21 &amp; RSI 14 Line Series for {selectedSymbol}...</span>
            </div>
          ) : !chartSeries || chartSeries.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs font-mono">
              No candle data available for {selectedSymbol}.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Legend row */}
              <div className="flex flex-wrap items-center justify-between text-xs font-mono pb-2 border-b border-[#232E47]/40 gap-2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-sky-400 border border-sky-300" />
                    <span className="text-white font-semibold">Daily Close (₹)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-400" />
                    <span className="text-white font-semibold">EMA 9 Fast (₹)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-300" />
                    <span className="text-white font-semibold">EMA 21 Slow (₹)</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500">
                  Exact Line Graph with Data Dots • Smooth Polyline Interpolation
                </span>
              </div>

              {/* Price & EMA SVG Line Graph */}
              <div className="relative w-full h-56 pt-2">
                {(() => {
                  const svgWidth = 800;
                  const svgHeight = 210;
                  const padX = 65;
                  const padY = 20;
                  const plotW = svgWidth - (padX * 2);
                  const plotH = svgHeight - (padY * 2);

                  const allPriceVals: number[] = [];
                  chartSeries.forEach(p => {
                    allPriceVals.push(p.close);
                    if (p.ema9 !== null) allPriceVals.push(p.ema9);
                    if (p.ema21 !== null) allPriceVals.push(p.ema21);
                  });

                  const minVal = Math.min(...allPriceVals) * 0.99;
                  const maxVal = Math.max(...allPriceVals) * 1.01;
                  const range = maxVal - minVal || 1;

                  const count = chartSeries.length;
                  const getX = (i: number) => padX + (count > 1 ? (i / (count - 1)) * plotW : plotW / 2);
                  const getY = (val: number) => padY + plotH - ((val - minVal) / range) * plotH;

                  const closePoints = chartSeries.map((p, i) => `${getX(i)},${getY(p.close)}`).join(' ');
                  const ema9Points = chartSeries
                    .map((p, i) => (p.ema9 !== null ? `${getX(i)},${getY(p.ema9)}` : null))
                    .filter(Boolean)
                    .join(' ');
                  const ema21Points = chartSeries
                    .map((p, i) => (p.ema21 !== null ? `${getX(i)},${getY(p.ema21)}` : null))
                    .filter(Boolean)
                    .join(' ');

                  const areaPoints = `${getX(0)},${svgHeight - padY} ${closePoints} ${getX(count - 1)},${svgHeight - padY}`;

                  return (
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="emaPriceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.20" />
                          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Dotted Reference Grid Lines */}
                      {[0.2, 0.5, 0.8].map((ratio, idx) => {
                        const yLevel = padY + plotH * ratio;
                        const priceAtLevel = maxVal - (ratio * range);
                        return (
                          <g key={`grid-${idx}`}>
                            <line x1={padX} y1={yLevel} x2={svgWidth - padX} y2={yLevel} stroke="#232E47" strokeDasharray="3 3" />
                            <text x={padX - 8} y={yLevel + 3} textAnchor="end" fill="#64748B" fontSize="9" fontFamily="monospace">
                              ₹{priceAtLevel.toFixed(1)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Top & Bottom Axis Labels */}
                      <text x={padX - 8} y={padY + 8} textAnchor="end" fill="#94A3B8" fontSize="10" fontFamily="monospace">₹{maxVal.toFixed(1)}</text>
                      <text x={padX - 8} y={svgHeight - padY} textAnchor="end" fill="#94A3B8" fontSize="10" fontFamily="monospace">₹{minVal.toFixed(1)}</text>

                      {/* Shaded Price Area */}
                      <polygon points={areaPoints} fill="url(#emaPriceGrad)" />

                      {/* Daily Close Polyline (Sky Blue) */}
                      <polyline
                        points={closePoints}
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* EMA 9 Polyline (Emerald) */}
                      {ema9Points && (
                        <polyline
                          points={ema9Points}
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* EMA 21 Polyline (Amber) */}
                      {ema21Points && (
                        <polyline
                          points={ema21Points}
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Data Dots with Exact Value Callouts */}
                      {chartSeries.map((p, i) => {
                        const cx = getX(i);
                        const cy = getY(p.close);
                        return (
                          <g key={`dot-${i}`} className="group cursor-pointer">
                            <circle
                              cx={cx}
                              cy={cy}
                              r="4.5"
                              fill="#38BDF8"
                              stroke="#0B0E14"
                              strokeWidth="2"
                              className="transition-all hover:r-6"
                            />
                            {/* Hover tooltip */}
                            <title>{`${p.date}\nClose: ₹${p.close.toFixed(2)}\nEMA 9: ₹${p.ema9 ? p.ema9.toFixed(2) : '—'}\nEMA 21: ₹${p.ema21 ? p.ema21.toFixed(2) : '—'}`}</title>
                          </g>
                        );
                      })}

                      {/* Date Labels below */}
                      {chartSeries.map((p, i) => {
                        const cx = getX(i);
                        const parts = p.date.split('-');
                        const dateLabel = parts.length >= 3 ? `${parts[2]}/${parts[1]}` : p.date;
                        return (
                          <text
                            key={`d-${i}`}
                            x={cx}
                            y={svgHeight - 4}
                            textAnchor="middle"
                            fill="#64748B"
                            fontSize="9"
                            fontFamily="monospace"
                          >
                            {dateLabel}
                          </text>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>

              {/* Lower Pane: RSI 14 Line Graph with Shaded 40-60 Corridor */}
              <div className="pt-2 border-t border-[#232E47]/50">
                <div className="flex items-center justify-between text-xs font-mono pb-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <span className="text-purple-300 font-bold">Wilder's RSI 14 Oscillator</span>
                    <span className="text-[10px] text-slate-400">• 40-60 Consolidation Corridor</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-300 font-mono">
                    Current RSI: {chartSeries[chartSeries.length - 1]?.rsi14?.toFixed(1) || '—'}
                  </span>
                </div>

                <div className="relative w-full h-24 pt-1">
                  {(() => {
                    const svgWidth = 800;
                    const svgHeight = 90;
                    const padX = 65;
                    const padY = 10;
                    const plotW = svgWidth - (padX * 2);
                    const plotH = svgHeight - (padY * 2);

                    const count = chartSeries.length;
                    const getX = (i: number) => padX + (count > 1 ? (i / (count - 1)) * plotW : plotW / 2);
                    const getRsiY = (val: number) => padY + plotH - ((val / 100) * plotH);

                    const y60 = getRsiY(60);
                    const y40 = getRsiY(40);

                    const rsiPoints = chartSeries
                      .map((p, i) => (p.rsi14 !== null ? `${getX(i)},${getRsiY(p.rsi14)}` : null))
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full" preserveAspectRatio="none">
                        {/* Shaded 40-60 Corridor Band */}
                        <rect
                          x={padX}
                          y={y60}
                          width={plotW}
                          height={y40 - y60}
                          fill="#F59E0B"
                          fillOpacity="0.12"
                        />

                        {/* Corridor Border Lines */}
                        <line x1={padX} y1={y60} x2={svgWidth - padX} y2={y60} stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1={padX} y1={y40} x2={svgWidth - padX} y2={y40} stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" />

                        {/* Y-Axis Labels */}
                        <text x={padX - 8} y={y60 + 3} textAnchor="end" fill="#F59E0B" fontSize="9" fontFamily="monospace">60</text>
                        <text x={padX - 8} y={y40 + 3} textAnchor="end" fill="#F59E0B" fontSize="9" fontFamily="monospace">40</text>

                        {/* RSI 14 Line */}
                        {rsiPoints && (
                          <polyline
                            points={rsiPoints}
                            fill="none"
                            stroke="#C084FC"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                        {/* RSI Data Dots */}
                        {chartSeries.map((p, i) => {
                          if (p.rsi14 === null) return null;
                          const cx = getX(i);
                          const cy = getRsiY(p.rsi14);
                          return (
                            <g key={`rsi-dot-${i}`} className="group cursor-pointer">
                              <circle
                                cx={cx}
                                cy={cy}
                                r="3.5"
                                fill="#C084FC"
                                stroke="#0B0E14"
                                strokeWidth="1.5"
                              />
                              <title>{`${p.date}: RSI ${p.rsi14.toFixed(1)}`}</title>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* 3. Controls & Configurable RSI Corridor Toolbar */}
      <div className="bg-[#121824] rounded-xl border border-[#232E47] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stock symbol, company, or sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B0E14] border border-[#232E47] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>

        {/* Configurable RSI Filter Settings */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-2 bg-[#0B0E14] border border-[#232E47] px-3 py-1.5 rounded-lg">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">RSI Corridor:</span>
            <input
              type="number"
              value={rsiMin}
              onChange={(e) => setRsiMin(parseFloat(e.target.value) || 0)}
              className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-center font-mono text-white"
            />
            <span className="text-slate-500">to</span>
            <input
              type="number"
              value={rsiMax}
              onChange={(e) => setRsiMax(parseFloat(e.target.value) || 100)}
              className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-center font-mono text-white"
            />
            <button
              onClick={handleApplyRsiFilter}
              className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold hover:bg-amber-500/30 text-[11px]"
            >
              Apply
            </button>
          </div>

          {/* Group Filter Buttons */}
          <div className="flex bg-[#0B0E14] p-0.5 rounded-lg border border-[#232E47]">
            <button
              onClick={() => setActiveGroup('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                activeGroup === 'ALL' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              All (50)
            </button>
            <button
              onClick={() => setActiveGroup('BULLISH_CORRIDOR')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                activeGroup === 'BULLISH_CORRIDOR' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bullish + RSI 40-60
            </button>
            <button
              onClick={() => setActiveGroup('FRESH_BULLISH')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                activeGroup === 'FRESH_BULLISH' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fresh Crossovers
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main EMA + RSI Scanner Output Table */}
      {loading ? (
        <div className="bg-[#121824] rounded-xl border border-[#232E47] p-12 text-center">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
          <div className="text-sm font-semibold text-white">Calculating EMA 9, EMA 21, and RSI 14 Series...</div>
          <div className="text-xs text-slate-400 mt-1">Analyzing all 50 constituents for crossovers and consolidation zones.</div>
        </div>
      ) : (
        <div className="bg-[#121824] rounded-xl border border-[#232E47] overflow-hidden shadow-lg">
          <div className="p-3 bg-[#0B0E14] border-b border-[#232E47] flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-white">
              Showing {filteredRecords.length} Constituents • Click any row to display its line graph
            </span>
            <span className="font-mono text-[11px] text-amber-400">
              Active Graph: {selectedSymbol}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0B0E14] border-b border-[#232E47] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Stock / Constituent</th>
                  <th className="py-3 px-3 text-right">Latest Close</th>
                  <th className="py-3 px-3 text-right">EMA 9</th>
                  <th className="py-3 px-3 text-right">EMA 21</th>
                  <th className="py-3 px-3 text-right">Spread %</th>
                  <th className="py-3 px-3 text-center">Alignment</th>
                  <th className="py-3 px-3 text-right">RSI 14</th>
                  <th className="py-3 px-3 text-center">RSI Status</th>
                  <th className="py-3 px-3 text-center">Crossover Signal</th>
                  <th className="py-3 px-4 text-center">Volume Bias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232E47]/60">
                {filteredRecords.map((item) => {
                  const isBull = item.alignment === 'BULLISH';
                  const isBear = item.alignment === 'BEARISH';
                  const isSelected = item.symbol === selectedSymbol;

                  return (
                    <tr 
                      key={item.symbol}
                      onClick={() => setSelectedSymbol(item.symbol)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected 
                          ? 'bg-amber-500/15 border-l-4 border-amber-400' 
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Stock Symbol & Company */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold font-mono transition-colors ${
                            isSelected ? 'text-amber-300' : 'text-white group-hover:text-amber-400'
                          }`}>
                            {item.symbol}
                          </span>
                          {item.satisfies_ema_and_rsi && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Satisfies EMA Bullish + RSI 40-60" />
                          )}
                          {isSelected && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              GRAPHED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{item.company_name}</div>
                      </td>

                      {/* Close Price */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                        ₹{item.close.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* EMA 9 */}
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 whitespace-nowrap">
                        ₹{item.ema_9.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* EMA 21 */}
                      <td className="py-3 px-3 text-right font-mono text-amber-400 whitespace-nowrap">
                        ₹{item.ema_21.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Distance / Spread % */}
                      <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                        <span className={`font-semibold ${item.ema_distance_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.ema_distance_pct >= 0 ? '+' : ''}{item.ema_distance_pct.toFixed(2)}%
                        </span>
                      </td>

                      {/* Alignment Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBull 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : isBear
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {isBull ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          <span>{item.alignment}</span>
                        </span>
                      </td>

                      {/* RSI 14 Value & Direction */}
                      <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                        <div className={`font-bold ${
                          item.rsi_14 > 70 ? 'text-rose-400' :
                          item.rsi_14 < 30 ? 'text-emerald-400' :
                          item.is_in_rsi_corridor ? 'text-amber-300' :
                          'text-slate-300'
                        }`}>
                          {item.rsi_14.toFixed(1)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.rsi_direction === 'RISING' ? '↑ Rising' : item.rsi_direction === 'FALLING' ? '↓ Falling' : '— Flat'}
                        </div>
                      </td>

                      {/* RSI Corridor Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.is_in_rsi_corridor
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : item.rsi_14 > 70
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {item.is_in_rsi_corridor ? '40-60 CORRIDOR' : item.rsi_14 > 70 ? 'OVERBOUGHT' : 'TRANSITIONAL'}
                        </span>
                      </td>

                      {/* Crossover Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.fresh_bullish_crossover ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[10px] animate-pulse shadow-md">
                            ★ FRESH BULLISH CROSS
                          </span>
                        ) : item.fresh_bearish_crossover ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-black text-[10px] animate-pulse shadow-md">
                            ▼ FRESH BEARISH CROSS
                          </span>
                        ) : Math.abs(item.ema_distance_pct) <= 0.60 ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/30">
                            NEAR CROSS ({item.ema_distance_pct.toFixed(2)}%)
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">—</span>
                        )}
                      </td>

                      {/* Volume & Institutional Bias */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.institutional_bias === 'ACCUMULATION' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.institutional_bias === 'DISTRIBUTION'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.volume_status.replace('_', ' ')} (RVOL {item.rvol}x)
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
    </div>
  );
};

export default EmaScanner;
