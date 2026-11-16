import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Zap, 
  Search, 
  RefreshCw, 
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
} from 'lucide-react';
import { fetchEmaScanner } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { ProfessionalTradingChart } from '../components/ProfessionalTradingChart';

interface EmaRecord {
  symbol: string;
  company_name: string;
  industry: string;
  close: number;
  prev_close: number;
  trading_date: string;
  instrument_key?: string;
  data_freshness?: string;
  latest_update_timestamp?: string | null;
  data_age_seconds?: number | null;
  ema_periods?: number[];
  ema_values?: Record<string, number | null>;
  previous_ema_values?: Record<string, number | null>;
  price_vs_ema?: Record<string, string>;
  ema_crossovers?: { fast_period: number; slow_period: number; signal: string; bullish: boolean; bearish: boolean }[];
  trend_direction?: string;
  multi_ema_aligned?: boolean;
  volume_freshness?: string;
  live_volume?: number | null;
  live_volume_increment?: number | null;
  volume_confirmation?: string;
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
  rsi_series?: { trading_date: string; value: number }[];
  rsi_direction: 'RISING' | 'FALLING' | 'FLAT';
  rsi_status: string;
  is_in_rsi_corridor: boolean;
  satisfies_ema_and_rsi: boolean;
  volume: number;
  rvol: number;
  volume_status: string;
  institutional_bias: string;
}

const RsiHistoryChart: React.FC<{ symbol: string; series: { trading_date: string; value: number }[] }> = ({ symbol, series }) => {
  const width = 760;
  const height = 220;
  const left = 42;
  const right = 12;
  const top = 14;
  const plotHeight = 162;
  const plotWidth = width - left - right;
  const points = series.map((item, index) => ({
    ...item,
    x: left + (series.length > 1 ? (index / (series.length - 1)) * plotWidth : plotWidth / 2),
    y: top + ((100 - Math.max(0, Math.min(100, item.value))) / 100) * plotHeight,
  }));
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const levels = [70, 60, 50, 40, 30];

  return (
    <div className="bg-[#0B0E14] rounded-xl border border-[#232E47] p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white">RSI 14 history · {symbol}</h3>
          <p className="mt-1 text-[11px] text-slate-400">Wilder RSI computed from the scanner's historical daily closes. Shaded band marks the 40–60 corridor.</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Latest RSI</div>
          <div className="font-mono text-lg font-bold text-purple-300">{series.length ? series[series.length - 1].value.toFixed(1) : '—'}</div>
        </div>
      </div>
      {points.length > 1 ? <>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${symbol} 14 period RSI history`} className="h-44 w-full overflow-visible">
          <rect x={left} y={top + 0.4 * plotHeight} width={plotWidth} height={0.2 * plotHeight} fill="rgba(168,85,247,0.10)" />
          {levels.map(level => {
            const y = top + ((100 - level) / 100) * plotHeight;
            return <g key={level}>
              <line x1={left} y1={y} x2={width - right} y2={y} stroke={level === 40 || level === 60 ? '#7049a8' : '#263247'} strokeDasharray={level === 50 ? '0' : '4 5'} />
              <text x={left - 8} y={y + 3} textAnchor="end" fill="#64748b" fontSize="9">{level}</text>
            </g>;
          })}
          <path d={path} fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {points.length > 0 && <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill="#e9d5ff" stroke="#a855f7" strokeWidth="2">
            <title>{`${points[points.length - 1].trading_date}: RSI ${points[points.length - 1].value.toFixed(2)}`}</title>
          </circle>}
          <text x={left} y={height - 10} fill="#64748b" fontSize="9">{points[0].trading_date}</text>
          <text x={width - right} y={height - 10} textAnchor="end" fill="#64748b" fontSize="9">{points[points.length - 1].trading_date}</text>
        </svg>
        <div className="flex items-center justify-between text-[10px] text-slate-500"><span>{series.length} daily observations</span><span>30 oversold · 40–60 corridor · 70 overbought</span></div>
      </> : <div className="py-8 text-center text-xs text-slate-500">RSI history is not available for this selection yet.</div>}
    </div>
  );
};

export const EmaScanner: React.FC<{ onSelectStock?: (symbol: string) => void }> = ({ onSelectStock }) => {
  const { language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGroup, setActiveGroup] = useState<string>('ALL');
  const [rsiMin, setRsiMin] = useState<number>(40.0);
  const [rsiMax, setRsiMax] = useState<number>(60.0);
  const [emaPeriods, setEmaPeriods] = useState<number[]>([5, 9, 10, 20, 21, 50, 100, 200]);
  const [emaPeriodDraft, setEmaPeriodDraft] = useState<string>('5, 9, 10, 20, 21, 50, 100, 200');
  const wsRef = useRef<WebSocket | null>(null);

  // Selected Stock for Interactive Line Chart
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');

  const loadData = async (min = rsiMin, max = rsiMax, periods = emaPeriods) => {
    try {
      setLoading(true);
      const res = await fetchEmaScanner(min, max, periods);
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

  // EMA rows subscribe to the shared normalized V3 feed. No scanner polling is used.
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let stopped = false;
    let retryTimer: number | undefined;
    const connect = () => {
      if (stopped) return;
      const socket = new WebSocket(`${protocol}//${window.location.host}/ws/chart-feed`);
      wsRef.current = socket;
      socket.onmessage = event => {
        let message: any;
        try { message = JSON.parse(event.data); } catch { return; }
        if (message.type !== 'market_data' || !message.ticks) return;
        setData((previous: any) => {
          if (!previous?.all_results) return previous;
          const rows = previous.all_results.map((record: EmaRecord) => {
            const tick = message.ticks[record.instrument_key || ''];
            const price = Number(tick?.ltp);
            if (!tick || !Number.isFinite(price) || price <= 0) return record;
            const baseValues = record.previous_ema_values || {};
            const periods: number[] = previous.ema_periods_config || emaPeriods;
            const values: Record<string, number | null> = {};
            for (const period of periods) {
              const rawBase = baseValues[String(period)];
              const base = rawBase == null ? Number.NaN : Number(rawBase);
              values[String(period)] = Number.isFinite(base)
                ? price * (2 / (period + 1)) + base * (1 - (2 / (period + 1)))
                : record.ema_values?.[String(period)] ?? null;
            }
            const prior9 = baseValues['9'] == null ? Number.NaN : Number(baseValues['9']);
            const prior21 = baseValues['21'] == null ? Number.NaN : Number(baseValues['21']);
            const ema9 = Number(values['9']);
            const ema21 = Number(values['21']);
            const alignment = ema9 > ema21 ? 'BULLISH' : ema9 < ema21 ? 'BEARISH' : 'NEUTRAL';
            const freshBullish = Number.isFinite(prior9) && Number.isFinite(prior21) && prior9 <= prior21 && ema9 > ema21;
            const freshBearish = Number.isFinite(prior9) && Number.isFinite(prior21) && prior9 >= prior21 && ema9 < ema21;
            const comparisons: Record<string, string> = {};
            for (const period of periods) {
              const ema = Number(values[String(period)]);
              if (Number.isFinite(ema)) comparisons[String(period)] = price > ema ? 'ABOVE' : price < ema ? 'BELOW' : 'AT';
            }
            const ordered = periods.map(period => values[String(period)]).filter((value): value is number => value != null);
            const bullishAligned = ordered.length === periods.length && ordered.every((value, index) => index === 0 || ordered[index - 1] >= value);
            const bearishAligned = ordered.length === periods.length && ordered.every((value, index) => index === 0 || ordered[index - 1] <= value);
            const emaCrossovers = (record.ema_crossovers || []).map(cross => {
              const priorFast = Number(baseValues[String(cross.fast_period)]);
              const priorSlow = Number(baseValues[String(cross.slow_period)]);
              const currentFast = Number(values[String(cross.fast_period)]);
              const currentSlow = Number(values[String(cross.slow_period)]);
              const bullish = priorFast <= priorSlow && currentFast > currentSlow;
              const bearish = priorFast >= priorSlow && currentFast < currentSlow;
              return { ...cross, signal: bullish ? 'BULLISH' : bearish ? 'BEARISH' : 'NONE', bullish, bearish };
            });
            const previousClose = Number(tick.close_price);
            return {
              ...record,
              close: price,
              prev_close: previousClose > 0 ? previousClose : record.prev_close,
              ema_9: ema9,
              ema_21: ema21,
              ema_values: values,
              price_vs_ema: comparisons,
              ema_crossovers: emaCrossovers,
              alignment,
              trend_direction: bullishAligned ? 'BULLISH' : bearishAligned ? 'BEARISH' : alignment,
              multi_ema_aligned: bullishAligned || bearishAligned,
              fresh_bullish_crossover: freshBullish,
              fresh_bearish_crossover: freshBearish,
              ema_distance_pct: ema21 ? ((ema9 - ema21) / ema21) * 100 : 0,
              data_freshness: 'LIVE',
              latest_update_timestamp: tick.exchange_timestamp || tick.received_at,
              data_age_seconds: 0,
              price_source: 'Upstox Market Data Feed V3',
              volume: tick.volume ?? record.volume,
              live_volume: tick.volume ?? record.live_volume,
              live_volume_increment: tick.incremental_volume ?? record.live_volume_increment,
              volume_freshness: tick.volume == null ? record.volume_freshness : 'LIVE',
              volume_confirmation: (tick.incremental_volume || 0) > 0 ? 'INCREASING' : 'NO_NEW_LIVE_VOLUME',
              volume_counter_reset: Boolean(tick.volume_counter_reset),
              is_in_rsi_corridor: record.rsi_14 >= rsiMin && record.rsi_14 <= rsiMax,
              satisfies_ema_and_rsi: alignment === 'BULLISH' && record.rsi_14 >= rsiMin && record.rsi_14 <= rsiMax,
            };
          });
          const freshBullish = rows.filter((row: EmaRecord) => row.fresh_bullish_crossover);
          const freshBearish = rows.filter((row: EmaRecord) => row.fresh_bearish_crossover);
          return {
            ...previous,
            all_results: rows,
            summary_counts: {
              ...previous.summary_counts,
              bullish_alignment: rows.filter((row: EmaRecord) => row.alignment === 'BULLISH').length,
              bearish_alignment: rows.filter((row: EmaRecord) => row.alignment === 'BEARISH').length,
              fresh_bullish_crossovers: freshBullish.length,
              fresh_bearish_crossovers: freshBearish.length,
              in_rsi_corridor: rows.filter((row: EmaRecord) => row.is_in_rsi_corridor).length,
              bullish_and_rsi_satisfied: rows.filter((row: EmaRecord) => row.satisfies_ema_and_rsi).length,
            },
            groups: {
              ...previous.groups,
              fresh_bullish_crossovers: freshBullish,
              fresh_bearish_crossovers: freshBearish,
              bullish_ema_rsi_corridor: rows.filter((row: EmaRecord) => row.satisfies_ema_and_rsi),
              bearish_ema_rsi_corridor: rows.filter((row: EmaRecord) => row.alignment === 'BEARISH' && row.is_in_rsi_corridor),
            },
          };
        });
      };
      socket.onclose = () => {
        if (!stopped) retryTimer = window.setTimeout(connect, 5000);
      };
      socket.onerror = () => socket.close();
    };
    connect();
    return () => {
      stopped = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [emaPeriods, rsiMin, rsiMax]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(rsiMin, rsiMax, emaPeriods);
    setRefreshing(false);
  };

  const handleApplyRsiFilter = () => {
    loadData(rsiMin, rsiMax, emaPeriods);
  };

  const handleApplyEmaPeriods = () => {
    const parsed = [...new Set(emaPeriodDraft.split(',').map(value => Number(value.trim())).filter(Number.isInteger))].sort((a, b) => a - b);
    if (!parsed.length || parsed.length > 12 || parsed.some(period => period < 2 || period > 500)) return;
    setEmaPeriods(parsed);
    void loadData(rsiMin, rsiMax, parsed);
  };

  const records: EmaRecord[] = data?.all_results || [];
  const visibleEmaPeriods: number[] = data?.ema_periods_config || emaPeriods;
  const selectedRecord = records.find(r => r.symbol === selectedSymbol);

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
      } else if (activeGroup === 'BULLISH_TREND') {
        return r.trend_direction === 'BULLISH';
      } else if (activeGroup === 'BEARISH_TREND') {
        return r.trend_direction === 'BEARISH';
      } else if (activeGroup === 'EMA_CROSSOVER') {
        return (r.ema_crossovers || []).some(cross => cross.bullish || cross.bearish);
      }

      return true;
    });
  }, [records, searchQuery, activeGroup]);

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

      {/* 2. UPSTOX HISTORICAL CANDLE CHART WITH EMA OVERLAYS */}
      <div className="bg-[#121824] rounded-xl border border-[#232E47] p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-black text-white font-mono">{selectedSymbol}</span>
              <span className="text-xs text-slate-400">({selectedRecord?.company_name || 'NIFTY 50'})</span>
              {selectedRecord && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedRecord.alignment === 'BULLISH'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {selectedRecord.alignment === 'BULLISH' ? 'EMA 9 > EMA 21 (BULLISH)' : 'EMA 9 < EMA 21 (BEARISH)'}
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
          {onSelectStock && (
            <button
              onClick={() => onSelectStock(selectedSymbol)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 border border-sky-500/30 text-xs font-semibold"
              title="Open this stock in the shared professional chart"
            >
              <span>Open in Professional Chart</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
          <span className="text-[11px] text-slate-500 font-sans uppercase font-bold shrink-0">Quick Inspect:</span>
          {records.slice(0, 8).map(stock => (
            <button
              key={stock.symbol}
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

        <div className="rounded-lg border border-[#232E47]/70 p-1">
          <ProfessionalTradingChart
            symbol={selectedSymbol}
            availableSymbols={records.map(record => record.symbol)}
            onSymbolChange={setSelectedSymbol}
            height={450}
            initialTimeframe="6M"
          />
        </div>
        <p className="text-[10px] text-slate-500">Candles are retrieved from Upstox Historical Candle V3. Use the EMA 9 and EMA 21 overlays in the chart controls.</p>
        <RsiHistoryChart symbol={selectedSymbol} series={selectedRecord?.rsi_series || []} />
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

          <div className="flex items-center gap-2 bg-[#0B0E14] border border-[#232E47] px-3 py-1.5 rounded-lg">
            <span className="text-slate-400">EMA periods:</span>
            <input
              aria-label="Comma-separated EMA periods"
              value={emaPeriodDraft}
              onChange={(event) => setEmaPeriodDraft(event.target.value)}
              className="w-48 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white"
              placeholder="5, 9, 10, 20, 21, 50, 100, 200"
            />
            <button
              onClick={handleApplyEmaPeriods}
              className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold hover:bg-sky-500/30 text-[11px]"
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
            <button
              onClick={() => setActiveGroup('BULLISH_TREND')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${activeGroup === 'BULLISH_TREND' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'}`}
            >
              EMA Aligned Up
            </button>
            <button
              onClick={() => setActiveGroup('BEARISH_TREND')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${activeGroup === 'BEARISH_TREND' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'}`}
            >
              EMA Aligned Down
            </button>
            <button
              onClick={() => setActiveGroup('EMA_CROSSOVER')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${activeGroup === 'EMA_CROSSOVER' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'}`}
            >
              EMA Crossovers
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
                  <th className="py-3 px-3 text-right">Latest Price</th>
                  {visibleEmaPeriods.map(period => <th key={period} className="py-3 px-3 text-right">EMA {period}</th>)}
                  <th className="py-3 px-3 text-right">Spread %</th>
                  <th className="py-3 px-3 text-center">Alignment</th>
                  <th className="py-3 px-3 text-right">RSI 14</th>
                  <th className="py-3 px-3 text-center">RSI Status</th>
                  <th className="py-3 px-3 text-center">Crossover Signal</th>
                  <th className="py-3 px-4 text-center">Volume Bias</th>
                  <th className="py-3 px-4 text-center">Freshness / Updated</th>
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

                      {visibleEmaPeriods.map(period => {
                        const value = item.ema_values?.[String(period)];
                        const comparison = item.price_vs_ema?.[String(period)];
                        return <td key={period} className={`py-3 px-3 text-right font-mono whitespace-nowrap ${comparison === 'ABOVE' ? 'text-emerald-400' : comparison === 'BELOW' ? 'text-rose-400' : 'text-slate-400'}`}>
                          {value == null ? '—' : `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                          <div className="text-[9px] text-slate-500">{comparison || 'HISTORY SHORT'}</div>
                        </td>;
                      })}

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

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`block text-[10px] font-bold ${item.data_freshness === 'LIVE' ? 'text-emerald-400' : item.data_freshness === 'STALE' ? 'text-amber-300' : 'text-slate-500'}`}>
                          {item.data_freshness || 'HISTORICAL_ONLY'}
                        </span>
                        <span className="block text-[9px] text-slate-500" title={item.latest_update_timestamp || ''}>
                          {item.latest_update_timestamp ? new Date(item.latest_update_timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'No live tick'}
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
