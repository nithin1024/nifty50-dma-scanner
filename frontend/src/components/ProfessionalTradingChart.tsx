import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  CrosshairMode,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  type ISeriesApi,
  type IChartApi
} from 'lightweight-charts';
import { 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Activity, 
  Layers
} from 'lucide-react';
import { fetchChartCandles, getChartCsvDownloadUrl } from '../services/api';

const getChartBucketTime = (timestampMs: number, timeframe: string): number => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date(timestampMs));
  const part = (type: string) => Number(parts.find(item => item.type === type)?.value || 0);
  const sessionOpen = Date.UTC(part('year'), part('month') - 1, part('day'), 3, 45) / 1000;
  const seconds = timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '15m' ? 900 : timeframe === '1h' ? 3600 : null;
  if (seconds == null) return sessionOpen;
  return sessionOpen + Math.floor((timestampMs / 1000 - sessionOpen) / seconds) * seconds;
};

const getIstSessionDate = (timestampMs: number): string => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date(timestampMs));

const formatCandleLegendTime = (
  timeVal: any,
  tf: string,
  isLatest: boolean = false,
  isLive: boolean = false
): string => {
  if (timeVal == null) return '—';
  const timestampMs = typeof timeVal === 'number' ? timeVal * 1000 : new Date(timeVal).getTime();
  if (isNaN(timestampMs)) return String(timeVal);

  const intraday = ['1m', '5m', '15m', '1h'].includes(tf);
  if (intraday) {
    const formatted = new Date(timestampMs).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return isLatest && isLive ? `${formatted} (Live Bar)` : formatted;
  } else {
    const formatted = new Date(timestampMs).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    return isLatest && isLive ? `${formatted} (Today Live)` : formatted;
  }
};

interface ProfessionalTradingChartProps {
  symbol?: string;
  className?: string;
  height?: number;
  initialTimeframe?: string;
  instrumentKey?: string;
  displayName?: string;
  availableSymbols?: string[];
  onSymbolChange?: (symbol: string) => void;
}

export const ProfessionalTradingChart: React.FC<ProfessionalTradingChartProps> = ({
  symbol = 'NIFTY',
  className = '',
  height = 500,
  initialTimeframe = '15m',
  instrumentKey,
  displayName,
  availableSymbols = [],
  onSymbolChange
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<any> | null>(null);
  const sma100SeriesRef = useRef<ISeriesApi<any> | null>(null);
  const sma200SeriesRef = useRef<ISeriesApi<any> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<any> | null>(null);

  const [selectedSymbol, setSelectedSymbol] = useState<string>(symbol);
  const [timeframe, setTimeframe] = useState<string>(initialTimeframe);
  const [chartType, setChartType] = useState<'CANDLESTICK' | 'LINE' | 'AREA' | 'HEIKIN_ASHI'>('CANDLESTICK');
  const [loading, setLoading] = useState<boolean>(true);
  const [candlesData, setCandlesData] = useState<any[]>([]);
  const [indicatorsData, setIndicatorsData] = useState<any>({});
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showIndicators, setShowIndicators] = useState<boolean>(true);
  const [showSeries, setShowSeries] = useState({ sma20: true, sma50: false, sma100: false, sma200: true, ema9: true, ema21: true });
  const [activeLegend, setActiveLegend] = useState<{
    time: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    vwap?: number;
    oi?: number;
    iv?: number;
    delta?: number;
    gamma?: number;
    theta?: number;
    vega?: number;
    change?: number;
    changePct?: number;
    sma20?: number;
    sma50?: number;
    sma100?: number;
    sma200?: number;
    ema9?: number;
    ema21?: number;
  } | null>(null);
  const [feedStatus, setFeedStatus] = useState('WAITING');
  const [feedTimestamps, setFeedTimestamps] = useState<{ exchange: string | null; received: string | null; frontend: string | null }>({ exchange: null, received: null, frontend: null });
  const [liveClock, setLiveClock] = useState<string>(() => new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const [liveFollow, setLiveFollow] = useState(true);
  const [olderLoading, setOlderLoading] = useState(false);
  const [hasOlder, setHasOlder] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const preservedRangeRef = useRef<any>(null);
  const loadingOlderRef = useRef(false);
  const hasInitialRangeRef = useRef(false);
  const feedSocketRef = useRef<WebSocket | null>(null);
  const instrumentKeyRef = useRef<string | null>(null);
  const timeframeRef = useRef(timeframe);
  const lastInstrumentTickAtRef = useRef<number | null>(null);
  const selectedTimeRef = useRef<any>(null);
  const selectedPriceRef = useRef<number | null>(null);
  const candlesDataRef = useRef<any[]>(candlesData);
  const indicatorsDataRef = useRef<any>(indicatorsData);
  const chartDataRef = useRef<any[]>([]);
  const overlaySettingsRef = useRef<string>('');
  const loadOlderRef = useRef<() => Promise<void>>(async () => undefined);
  const liveFollowRef = useRef(liveFollow);
  const chartSymbols = Array.from(new Set(['NIFTY', 'BANKNIFTY', ...availableSymbols, symbol]));
  const chartSymbol = selectedSymbol || symbol;
  timeframeRef.current = timeframe;
  candlesDataRef.current = candlesData;
  indicatorsDataRef.current = indicatorsData;
  liveFollowRef.current = liveFollow;

  useEffect(() => setSelectedSymbol(symbol), [symbol]);

  const handleSymbolChange = (nextSymbol: string) => {
    setSelectedSymbol(nextSymbol);
    onSymbolChange?.(nextSymbol);
  };

  // Timeframes supported
  const timeframes = ['1m', '5m', '15m', '1h', '1D', '1M', '3M', '6M', '1Y', '3Y', '5Y'];

  // Load candle data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    setChartError(null);
    setHasOlder(true);
    preservedRangeRef.current = null;
    hasInitialRangeRef.current = false;
    fetchChartCandles(chartSymbol, timeframe, chartType, undefined, instrumentKey)
      .then(res => {
        if (!isMounted) return;
        setCandlesData(res.candles || []);
        setIndicatorsData(res.indicators || {});
        setHasOlder((res.candles || []).length > 0);
        // Aggregate feed status alone is not enough: this chart stays WAITING
        // until this instrument itself produces an actual V3 message.
        setFeedStatus('WAITING');
        lastInstrumentTickAtRef.current = null;
        setFeedTimestamps({ exchange: null, received: null, frontend: null });
        instrumentKeyRef.current = res.instrument_key || null;
        if (feedSocketRef.current?.readyState === WebSocket.OPEN && res.instrument_key) {
          feedSocketRef.current.send(JSON.stringify({ mode: 'full', instrumentKeys: [res.instrument_key] }));
        }
        setLoading(false);
      })
      .catch(err => {
        setChartError(err instanceof Error ? err.message : 'Unable to retrieve historical chart data.');
        setFeedStatus('WAITING');
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [chartSymbol, timeframe, chartType, instrumentKey]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/chart-feed`);
    feedSocketRef.current = socket;
    socket.onmessage = event => {
      let message: any;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.type === 'status' && ['DISCONNECTED', 'FAILED'].includes(message.status)) {
        setFeedStatus('DISCONNECTED');
      }
      const tick = message.ticks?.[instrumentKeyRef.current || ''];
      if (!tick) return;
      if (message.is_live_update) {
        setFeedStatus('LIVE');
        lastInstrumentTickAtRef.current = Date.now();
        setFeedTimestamps({ exchange: tick.exchange_timestamp || null, received: tick.received_at || null,
          frontend: new Date().toISOString() });
      }
      const exchangeMs = Number(tick.last_trade_time);
      if (!Number.isFinite(exchangeMs) || exchangeMs <= 0) return;
      setCandlesData(current => {
        if (!current.length) return current;
        const next = [...current];
        const last = { ...next[next.length - 1] };
        const intraday = ['1m', '5m', '15m', '1h'].includes(timeframeRef.current);
        const sameSessionDay = !intraday && getIstSessionDate(exchangeMs) === getIstSessionDate(Number(last.time) * 1000);
        const bucketTime = sameSessionDay ? Number(last.time) : getChartBucketTime(exchangeMs, timeframeRef.current);
        if (bucketTime < Number(last.time) || exchangeMs / 1000 < Number(last.time)) return current;
        const increment = Number(tick.incremental_volume || 0);
        if (bucketTime === Number(last.time)) {
          last.close = Number(tick.ltp);
          last.high = Math.max(Number(last.high), Number(tick.ltp));
          last.low = Math.min(Number(last.low), Number(tick.ltp));
          if (tick.volume != null && Number(tick.volume) > Number(last.volume || 0)) {
            last.volume = Number(tick.volume);
          } else if (tick.incremental_volume != null) {
            last.volume = Number(last.volume || 0) + increment;
          }
          last.oi = tick.oi ?? last.oi;
          last.iv = tick.iv ?? last.iv;
          last.exchange_timestamp = tick.exchange_timestamp;
          last.received_at = tick.received_at;
          if (tick.greeks) Object.assign(last, tick.greeks);
          next[next.length - 1] = last;
        } else {
          next.push({ time: bucketTime, time_iso: new Date(bucketTime * 1000).toISOString(),
            open: Number(tick.ltp), high: Number(tick.ltp), low: Number(tick.ltp),
            close: Number(tick.ltp), volume: tick.incremental_volume == null ? null : increment,
            oi: tick.oi, iv: tick.iv, exchange_timestamp: tick.exchange_timestamp,
            received_at: tick.received_at, ...(tick.greeks || {}) });
        }
        return next;
      });
    };
    const poll = window.setInterval(() => fetch('/api/v1/options/feed-status').then(r => r.json())
      .then(status => {
        if (['DISCONNECTED', 'FAILED'].includes(status.status)) setFeedStatus('DISCONNECTED');
        else if (lastInstrumentTickAtRef.current == null) setFeedStatus('WAITING');
        else setFeedStatus(Date.now() - lastInstrumentTickAtRef.current > 20000 ? 'STALE' : 'LIVE');
      }).catch(() => setFeedStatus('DISCONNECTED')), 5000);
    return () => { window.clearInterval(poll); socket.close(); feedSocketRef.current = null; };
  }, []);

  const loadOlder = async () => {
    if (loadingOlderRef.current || !hasOlder || !candlesData.length) return;
    loadingOlderRef.current = true;
    setOlderLoading(true);
    const oldest = candlesData[0];
    const before = new Date(Number(oldest.time) * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    try {
      const page = await fetchChartCandles(chartSymbol, timeframe, chartType, before, instrumentKey);
      const older = page.candles || [];
      if (!older.length) setHasOlder(false);
      else {
        setCandlesData(current => {
          const times = new Set(current.map(candle => candle.time));
          const merged = [...older.filter((candle: any) => !times.has(candle.time)), ...current];
          return merged.sort((a, b) => Number(a.time) - Number(b.time));
        });
        const oldSma = page.indicators?.sma_20 || [];
        const oldSma50 = page.indicators?.sma_50 || [];
        const oldSma100 = page.indicators?.sma_100 || [];
        const oldSma200 = page.indicators?.sma_200 || [];
        const oldEma = page.indicators?.ema_9 || [];
        const oldEma21 = page.indicators?.ema_21 || [];
        setIndicatorsData((current: any) => ({
          sma_20: [...oldSma, ...(current.sma_20 || [])],
          sma_50: [...oldSma50, ...(current.sma_50 || [])],
          sma_100: [...oldSma100, ...(current.sma_100 || [])],
          sma_200: [...oldSma200, ...(current.sma_200 || [])],
          ema_9: [...oldEma, ...(current.ema_9 || [])],
          ema_21: [...oldEma21, ...(current.ema_21 || [])]
        }));
      }
    } catch (err) {
      setHasOlder(false);
      setChartError(err instanceof Error ? err.message : 'Unable to load older chart history.');
    } finally {
      loadingOlderRef.current = false;
      setOlderLoading(false);
    }
  };
  loadOlderRef.current = loadOlder;

  // Initialize and update Lightweight Charts instance
  useEffect(() => {
    if (!chartContainerRef.current) return;
    chartDataRef.current = [];

    // Preserve the user's exact visible timestamp range while older pages are added.
    if (chartApiRef.current) {
      try { preservedRangeRef.current = chartApiRef.current.timeScale().getVisibleRange(); } catch { /* chart has no range yet */ }
    }
    // Clean up prior chart
    if (chartApiRef.current) {
      chartApiRef.current.remove();
      chartApiRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth || 800,
      height: isFullscreen ? window.innerHeight - 180 : height,
      layout: {
        background: { type: ColorType.Solid, color: '#0B0E14' },
        textColor: '#94A3B8',
        fontSize: 11,
        fontFamily: 'JetBrains Mono, Menlo, monospace',
      },
      grid: {
        vertLines: { color: '#171F32', style: 1 },
        horzLines: { color: '#171F32', style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#38BDF8',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0284C7',
        },
        horzLine: {
          color: '#38BDF8',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0284C7',
        },
      },
      rightPriceScale: {
        borderColor: '#232E47',
        scaleMargins: {
          top: 0.1,
          bottom: 0.22,
        },
        autoScale: true,
      },
      timeScale: {
        borderColor: '#232E47',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: any) => {
          const timestamp = typeof time === 'number'
            ? new Date(time * 1000)
            : new Date(Date.UTC(time.year, time.month - 1, time.day, 12));
          const intraday = ['1m', '5m', '15m', '1h'].includes(timeframe);
          return intraday
            ? timestamp.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
            : timestamp.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: '2-digit' });
        },
      },
    });

    chartApiRef.current = chart;

    // Add main price series
    let mainSeries: ISeriesApi<any>;
    if (chartType === 'LINE') {
      mainSeries = chart.addSeries(LineSeries, {
        color: '#38BDF8',
        lineWidth: 2,
        priceFormat: { type: 'price', precision: 2, minMove: 0.05 },
      });
    } else if (chartType === 'AREA') {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(56, 189, 248, 0.45)',
        bottomColor: 'rgba(56, 189, 248, 0.02)',
        lineColor: '#38BDF8',
        lineWidth: 2,
        priceFormat: { type: 'price', precision: 2, minMove: 0.05 },
      });
    } else {
      // Candlestick / Heikin-Ashi
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10B981',
        downColor: '#F43F5E',
        borderVisible: false,
        wickUpColor: '#10B981',
        wickDownColor: '#F43F5E',
        priceFormat: { type: 'price', precision: 2, minMove: 0.05 },
      });
    }
    mainSeriesRef.current = mainSeries;

    // Add synchronized volume histogram in lower pane
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // Add technical indicator overlays
    const smaSeries = chart.addSeries(LineSeries, {
      color: '#F59E0B',
      lineWidth: 1,
      title: 'SMA 20',
      priceScaleId: 'right',
    });
    smaSeriesRef.current = smaSeries;

    const sma50Series = chart.addSeries(LineSeries, {
      color: '#A855F7', lineWidth: 1, title: 'SMA 50', priceScaleId: 'right',
    });
    sma50SeriesRef.current = sma50Series;
    const sma100Series = chart.addSeries(LineSeries, {
      color: '#F43F5E', lineWidth: 1, title: 'SMA 100', priceScaleId: 'right',
    });
    sma100SeriesRef.current = sma100Series;
    const sma200Series = chart.addSeries(LineSeries, {
      color: '#F97316', lineWidth: 1, title: 'SMA 200', priceScaleId: 'right',
    });
    sma200SeriesRef.current = sma200Series;

    const emaSeries = chart.addSeries(LineSeries, {
      color: '#38BDF8',
      lineWidth: 1,
      title: 'EMA 9',
      priceScaleId: 'right',
    });
    emaSeriesRef.current = emaSeries;
    const ema21Series = chart.addSeries(LineSeries, {
      color: '#F59E0B', lineWidth: 1, title: 'EMA 21', priceScaleId: 'right',
    });
    ema21SeriesRef.current = ema21Series;

    // Populate data
    if (candlesData.length > 0) {
      const priceItems = candlesData.map(c => {
        if (chartType === 'LINE' || chartType === 'AREA') {
          return { time: c.time, value: c.close };
        }
        return {
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        };
      });
      mainSeries.setData(priceItems);

      const volumeItems = candlesData.map(c => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)',
      }));
      volumeSeries.setData(volumeItems);

      // Indicators
      if (indicatorsData.sma_20 && showIndicators && showSeries.sma20) {
        const smaItems = candlesData
          .map((c, i) => ({ time: c.time, value: indicatorsData.sma_20[i] }))
          .filter(item => item.value !== null && item.value !== undefined);
        smaSeries.setData(smaItems);
      }

      if (indicatorsData.ema_9 && showIndicators && showSeries.ema9) {
        const emaItems = candlesData
          .map((c, i) => ({ time: c.time, value: indicatorsData.ema_9[i] }))
          .filter(item => item.value !== null && item.value !== undefined);
        emaSeries.setData(emaItems);
      }
      if (indicatorsData.ema_21 && showIndicators && showSeries.ema21) {
        const ema21Items = candlesData
          .map((c, i) => ({ time: c.time, value: indicatorsData.ema_21[i] }))
          .filter(item => item.value !== null && item.value !== undefined);
        ema21Series.setData(ema21Items);
      }

      for (const [period, series, key] of [[50, sma50Series, 'sma50'], [100, sma100Series, 'sma100'], [200, sma200Series, 'sma200']] as const) {
        const values = indicatorsData[`sma_${period}`];
        if (values && showIndicators && showSeries[key]) {
          series.setData(candlesData.map((c, i) => ({ time: c.time, value: values[i] }))
            .filter(item => item.value !== null && item.value !== undefined));
        }
      }

      if (preservedRangeRef.current) {
        try { chart.timeScale().setVisibleRange(preservedRangeRef.current); } catch { chart.timeScale().fitContent(); }
      } else {
        const end = candlesData.length - 1;
        chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, end - 149), to: end + 5 });
        hasInitialRangeRef.current = true;
      }

      // Initial legend with latest bar
      const latestIndex = candlesData.length - 1;
      const rememberedIndex = selectedTimeRef.current == null ? -1 : candlesData.findIndex(c => c.time === selectedTimeRef.current);
      const selectedIndex = rememberedIndex >= 0 ? rememberedIndex : latestIndex;
      const selected = candlesData[selectedIndex];
      const prevClose = selectedIndex > 0 ? candlesData[selectedIndex - 1].close : selected.open;
      const chg = selected.close - prevClose;
      setActiveLegend({
        time: formatCandleLegendTime(selected.time, timeframe, selectedIndex === latestIndex, feedStatus === 'LIVE'),
        open: selected.open,
        high: selected.high,
        low: selected.low,
        close: selected.close,
        volume: selected.volume,
        vwap: selected.vwap,
        oi: selected.oi,
        iv: selected.iv,
        delta: selected.delta,
        gamma: selected.gamma,
        theta: selected.theta,
        vega: selected.vega,
        change: chg,
        changePct: prevClose ? (chg / prevClose) * 100 : 0,
        sma20: indicatorsData.sma_20?.[selectedIndex],
        sma50: indicatorsData.sma_50?.[selectedIndex],
        sma100: indicatorsData.sma_100?.[selectedIndex],
        sma200: indicatorsData.sma_200?.[selectedIndex],
        ema9: indicatorsData.ema_9?.[selectedIndex],
        ema21: indicatorsData.ema_21?.[selectedIndex]
      });
      if (rememberedIndex >= 0 && selectedPriceRef.current !== null) {
        try { chart.setCrosshairPosition(selectedPriceRef.current, selected.time, mainSeries); } catch { /* selected candle is outside loaded chart range */ }
      }
    }

    // Subscribe to crosshair movement
    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData || !mainSeries) {
        selectedTimeRef.current = null;
        selectedPriceRef.current = null;
        return;
      }

      const barData: any = param.seriesData.get(mainSeries);
      if (barData) {
        selectedTimeRef.current = param.time;
        const currentCandles = candlesDataRef.current;
        const currentIndicators = indicatorsDataRef.current;
        const match = currentCandles.find(c => c.time === param.time);
        const openVal = barData.open !== undefined ? barData.open : barData.value;
        const closeVal = barData.close !== undefined ? barData.close : barData.value;
        selectedPriceRef.current = closeVal;
        const highVal = barData.high !== undefined ? barData.high : barData.value;
        const lowVal = barData.low !== undefined ? barData.low : barData.value;
        const matchedIndex = match ? currentCandles.indexOf(match) : -1;
        const prevClose = matchedIndex > 0 ? currentCandles[matchedIndex - 1].close : openVal;
        const chg = match ? closeVal - prevClose : 0;

        setActiveLegend({
          time: formatCandleLegendTime(param.time, timeframe, matchedIndex === currentCandles.length - 1, feedStatus === 'LIVE'),
          open: openVal,
          high: highVal,
          low: lowVal,
          close: closeVal,
          volume: match?.volume,
          vwap: match?.vwap,
          oi: match?.oi,
          iv: match?.iv,
          delta: match?.delta,
          gamma: match?.gamma,
          theta: match?.theta,
          vega: match?.vega,
          change: chg,
          changePct: prevClose > 0 ? (chg / prevClose) * 100 : 0,
          sma20: matchedIndex >= 0 ? currentIndicators.sma_20?.[matchedIndex] : undefined,
          sma50: matchedIndex >= 0 ? currentIndicators.sma_50?.[matchedIndex] : undefined,
          sma100: matchedIndex >= 0 ? currentIndicators.sma_100?.[matchedIndex] : undefined,
          sma200: matchedIndex >= 0 ? currentIndicators.sma_200?.[matchedIndex] : undefined,
          ema9: matchedIndex >= 0 ? currentIndicators.ema_9?.[matchedIndex] : undefined,
          ema21: matchedIndex >= 0 ? currentIndicators.ema_21?.[matchedIndex] : undefined
        });
      }
    });

    chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (!range) return;
      const currentCandles = candlesDataRef.current;
      const latestIndex = currentCandles.length - 1;
      if (liveFollowRef.current && latestIndex > 0 && range.to < latestIndex - 2) setLiveFollow(false);
      if (hasInitialRangeRef.current && range.from <= 2 && !loadingOlderRef.current) void loadOlderRef.current();
    });

    // Handle container resize
    const handleResize = () => {
      if (chartContainerRef.current && chartApiRef.current) {
        chartApiRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 180 : height,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartApiRef.current) {
        chartApiRef.current.remove();
        chartApiRef.current = null;
      }
    };
  }, [chartSymbol, chartType, height, instrumentKey, isFullscreen, timeframe]);

  // Update the existing chart series in place. Live price and volume ticks
  // touch only the active candle; older history is merged with the visible
  // time range preserved, so scrolling never tears down or resets the chart.
  useEffect(() => {
    const chart = chartApiRef.current;
    const mainSeries = mainSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!chart || !mainSeries || !volumeSeries || !candlesData.length) return;

    const previous = chartDataRef.current;
    const timestampsMatch = previous.length > 0
      && previous.length <= candlesData.length
      && previous.every((candle, index) => candle.time === candlesData[index]?.time);
    const incremental = timestampsMatch
      && (candlesData.length === previous.length || candlesData.length === previous.length + 1);
    const overlaySettings = JSON.stringify({ showIndicators, showSeries });
    const overlaySettingsChanged = overlaySettingsRef.current !== overlaySettings;
    const logicalRangeBeforeUpdate = incremental && candlesData.length === previous.length + 1 && !liveFollow
      ? chart.timeScale().getVisibleLogicalRange() : null;

    const toPriceItem = (candle: any) => chartType === 'LINE' || chartType === 'AREA'
      ? { time: candle.time, value: candle.close }
      : { time: candle.time, open: candle.open, high: candle.high, low: candle.low, close: candle.close };
    const toVolumeItem = (candle: any) => ({ time: candle.time, value: candle.volume ?? 0,
      color: candle.close >= candle.open ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)' });

    if (incremental) {
      const latest = candlesData[candlesData.length - 1];
      try {
        mainSeries.update(toPriceItem(latest));
        volumeSeries.update(toVolumeItem(latest));
      } catch {
        mainSeries.setData(candlesData.map(toPriceItem));
        volumeSeries.setData(candlesData.map(toVolumeItem));
      }
    } else {
      let preservedRange: any = null;
      const prepended = previous.length > 0 && candlesData.length > previous.length
        && candlesData[candlesData.length - 1]?.time === previous[previous.length - 1]?.time
        && previous.every((candle, index) => candle.time === candlesData[candlesData.length - previous.length + index]?.time);
      if (prepended) {
        try { preservedRange = chart.timeScale().getVisibleRange(); } catch { /* no range yet */ }
      }
      mainSeries.setData(candlesData.map(toPriceItem));
      volumeSeries.setData(candlesData.map(toVolumeItem));
      if (preservedRange) {
        try { chart.timeScale().setVisibleRange(preservedRange); } catch { /* range can be outside returned page */ }
      } else if (!previous.length) {
        const end = candlesData.length - 1;
        chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, end - 149), to: end + 5 });
        hasInitialRangeRef.current = true;
      }
    }

    const setOverlay = (ref: React.MutableRefObject<ISeriesApi<any> | null>, values: number[] | undefined,
      visible: boolean, period: number, kind: 'SMA' | 'EMA') => {
      const series = ref.current;
      if (!series) return;
      series.applyOptions({ visible: showIndicators && visible });
      if (!showIndicators || !visible || !values) {
        series.setData([]);
        return;
      }
      if (incremental && !overlaySettingsChanged) {
        const index = candlesData.length - 1;
        let value = values[index];
        if (kind === 'SMA' && candlesData.length >= period) {
          const closes = candlesData.slice(-period).map(candle => Number(candle.close));
          value = closes.reduce((sum, close) => sum + close, 0) / period;
        } else if (kind === 'EMA' && candlesData.length >= period) {
          const alpha = 2 / (period + 1);
          const prior = values[index - 1];
          if (prior != null && Number.isFinite(Number(prior))) {
            value = Number(prior) + alpha * (Number(candlesData[index].close) - Number(prior));
          }
        }
        if (value != null && Number.isFinite(Number(value))) {
          try { series.update({ time: candlesData[index].time, value: Number(value) }); }
          catch { series.setData(candlesData.map((candle, index) => ({ time: candle.time, value: values[index] }))
            .filter(item => item.value != null)); }
        }
      } else {
        series.setData(candlesData.map((candle, index) => ({ time: candle.time, value: values[index] }))
          .filter(item => item.value != null));
      }
    };
    setOverlay(smaSeriesRef, indicatorsData.sma_20, showSeries.sma20, 20, 'SMA');
    setOverlay(sma50SeriesRef, indicatorsData.sma_50, showSeries.sma50, 50, 'SMA');
    setOverlay(sma100SeriesRef, indicatorsData.sma_100, showSeries.sma100, 100, 'SMA');
    setOverlay(sma200SeriesRef, indicatorsData.sma_200, showSeries.sma200, 200, 'SMA');
    setOverlay(emaSeriesRef, indicatorsData.ema_9, showSeries.ema9, 9, 'EMA');
    setOverlay(ema21SeriesRef, indicatorsData.ema_21, showSeries.ema21, 21, 'EMA');

    chartDataRef.current = candlesData;
    overlaySettingsRef.current = overlaySettings;
    const latestIndex = candlesData.length - 1;
    const selectedIndex = selectedTimeRef.current == null
      ? latestIndex : candlesData.findIndex(candle => candle.time === selectedTimeRef.current);
    const resolvedIndex = selectedIndex >= 0 ? selectedIndex : latestIndex;
    const selected = candlesData[resolvedIndex];
    const previousClose = resolvedIndex > 0 ? candlesData[resolvedIndex - 1].close : selected.open;
    const change = selected.close - previousClose;
    setActiveLegend({
      time: formatCandleLegendTime(selected.time, timeframe, resolvedIndex === latestIndex, feedStatus === 'LIVE'),
      open: selected.open, high: selected.high, low: selected.low, close: selected.close,
      volume: selected.volume, vwap: selected.vwap, oi: selected.oi, iv: selected.iv,
      delta: selected.delta, gamma: selected.gamma, theta: selected.theta, vega: selected.vega,
      change, changePct: previousClose ? (change / previousClose) * 100 : 0,
      sma20: indicatorsData.sma_20?.[resolvedIndex], sma50: indicatorsData.sma_50?.[resolvedIndex],
      sma100: indicatorsData.sma_100?.[resolvedIndex], sma200: indicatorsData.sma_200?.[resolvedIndex],
      ema9: indicatorsData.ema_9?.[resolvedIndex], ema21: indicatorsData.ema_21?.[resolvedIndex],
    });
    if (incremental && candlesData.length === previous.length + 1 && liveFollow) {
      chart.timeScale().scrollToRealTime();
    } else if (logicalRangeBeforeUpdate) {
      try { chart.timeScale().setVisibleLogicalRange(logicalRangeBeforeUpdate); } catch { /* keep current range */ }
    }
  }, [candlesData, chartType, indicatorsData, liveFollow, showIndicators, showSeries]);

  // Zoom and pan handlers
  const handleZoomIn = () => {
    if (!chartApiRef.current) return;
    const timeScale = chartApiRef.current.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (range) {
      const span = range.to - range.from;
      const center = (range.from + range.to) / 2;
      const newSpan = span * 0.7;
      timeScale.setVisibleLogicalRange({ from: center - newSpan / 2, to: center + newSpan / 2 });
    }
  };

  const handleZoomOut = () => {
    if (!chartApiRef.current) return;
    const timeScale = chartApiRef.current.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (range) {
      const span = range.to - range.from;
      const center = (range.from + range.to) / 2;
      const newSpan = span * 1.4;
      timeScale.setVisibleLogicalRange({ from: center - newSpan / 2, to: center + newSpan / 2 });
    }
  };

  const handleResetZoom = () => {
    if (chartApiRef.current) {
      chartApiRef.current.timeScale().fitContent();
    }
  };

  const handleGoToLive = () => {
    setLiveFollow(true);
    if (chartApiRef.current) {
      chartApiRef.current.timeScale().scrollToRealTime();
    }
  };

  return (
    <div className={`rounded-xl bg-[#0B0E14] border border-[#232E47] p-4 flex flex-col space-y-3 font-sans ${className} ${isFullscreen ? 'fixed inset-0 z-50 p-6 bg-[#0B0E14]' : ''}`}>
      {/* Top Header: Controls & Chart Tools */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#232E47] gap-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${feedStatus === 'LIVE' ? 'bg-emerald-400 animate-pulse' : feedStatus === 'STALE' ? 'bg-amber-400' : 'bg-slate-500'}`} />
            <h3 className="text-sm sm:text-base font-black text-white tracking-wide font-mono">
              {displayName && chartSymbol === symbol ? displayName : chartSymbol} &bull; {timeframe.toUpperCase()}
            </h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${feedStatus === 'LIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'}`}>
              {feedStatus}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              IST {liveClock}
            </span>
            <span className="hidden sm:inline text-[8px] sm:text-[9px] text-slate-500" title={`Exchange timestamp: ${feedTimestamps.exchange || 'waiting'}; server received: ${feedTimestamps.received || 'waiting'}; frontend received: ${feedTimestamps.frontend || 'waiting'}`}>
              {feedTimestamps.exchange ? `Exch ${new Date(feedTimestamps.exchange).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}` : ''}
            </span>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center space-x-1 bg-[#121824] p-0.5 rounded-lg border border-[#232E47]">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                  timeframe === tf 
                    ? 'bg-sky-500 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {!instrumentKey && (
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <span>Instrument</span>
            <select value={chartSymbol} onChange={event => handleSymbolChange(event.target.value)}
              className="max-w-48 rounded-lg border border-[#232E47] bg-[#121824] px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-sky-500">
              {chartSymbols.map(item => <option key={item} value={item}>{item === 'NIFTY' ? 'NIFTY 50' : item === 'BANKNIFTY' ? 'BANK NIFTY' : item}</option>)}
            </select>
          </label>
        )}

        {/* Chart Type & Actions */}
        <div className="flex items-center space-x-2">
          {/* Chart Style Switcher */}
          <select
            value={chartType}
            onChange={(e: any) => setChartType(e.target.value)}
            className="bg-[#121824] border border-[#232E47] text-white text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
          >
            <option value="CANDLESTICK">Candlestick (OHLC)</option>
            <option value="HEIKIN_ASHI">Heikin-Ashi</option>
            <option value="LINE">Line Chart</option>
            <option value="AREA">Area Baseline</option>
          </select>

          {/* Indicators Toggle */}
          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className={`p-1.5 rounded-lg border text-xs font-mono flex items-center space-x-1 ${
              showIndicators 
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40' 
                : 'bg-[#121824] text-slate-400 border-[#232E47]'
            }`}
            title="Toggle all technical indicator overlays"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Indicators</span>
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center space-x-0.5 bg-[#121824] border border-[#232E47] rounded-lg p-0.5">
            <button onClick={handleZoomIn} className="p-1 hover:text-white text-slate-400" title="Zoom In">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleZoomOut} className="p-1 hover:text-white text-slate-400" title="Zoom Out">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleResetZoom} className="p-1 hover:text-white text-slate-400" title="Reset Zoom">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Go to Live Follow Button */}
          <button
            onClick={() => liveFollow ? setLiveFollow(false) : handleGoToLive()}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${feedStatus === 'LIVE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25' : 'bg-[#121824] text-slate-300 border border-[#232E47]'}`}
          >
            {liveFollow ? 'Pause Live Follow' : 'Go to Live'}
          </button>

          {/* CSV Export */}
          <a
            href={getChartCsvDownloadUrl(chartSymbol, timeframe, chartType, instrumentKey)}
            download={`${chartSymbol}_${timeframe}_candles.csv`}
            className="p-1.5 rounded-lg bg-[#121824] hover:bg-[#1a2334] text-slate-300 border border-[#232E47]"
            title="Download OHLCV CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </a>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-[#121824] hover:bg-[#1a2334] text-slate-300 border border-[#232E47]"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5" aria-label="Chart series selection">
        {([
          ['sma20', 'SMA 20'], ['sma50', 'SMA 50'], ['sma100', 'SMA 100'],
          ['sma200', 'SMA 200'], ['ema9', 'EMA 9'], ['ema21', 'EMA 21']
        ] as const).map(([key, label]) => (
          <button key={key} type="button" aria-pressed={showSeries[key]}
            onClick={() => setShowSeries(current => ({ ...current, [key]: !current[key] }))}
            className={`px-2 py-1 rounded border text-[10px] font-mono ${showSeries[key] && showIndicators ? 'bg-sky-500/15 text-sky-300 border-sky-500/40' : 'bg-[#121824] text-slate-500 border-[#232E47]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Synchronized OHLC Legend Header */}
      {activeLegend && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-slate-300 bg-[#121824] px-3 py-1.5 rounded-lg border border-[#232E47]/70">
          <span className="text-slate-400">
            {['1m', '5m', '15m', '1h'].includes(timeframe) ? 'Bar: ' : 'Session: '}
            <strong className="text-white">{activeLegend.time}</strong>
          </span>
          <span>O: <strong className="text-white">₹{activeLegend.open?.toLocaleString()}</strong></span>
          <span>H: <strong className="text-emerald-400">₹{activeLegend.high?.toLocaleString()}</strong></span>
          <span>L: <strong className="text-rose-400">₹{activeLegend.low?.toLocaleString()}</strong></span>
          <span>C: <strong className="text-white">₹{activeLegend.close?.toLocaleString()}</strong></span>
          {activeLegend.change !== undefined && (
            <span className={activeLegend.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {activeLegend.change >= 0 ? '+' : ''}{activeLegend.change.toFixed(2)} ({activeLegend.changePct?.toFixed(2)}%)
            </span>
          )}
          {activeLegend.volume !== undefined && activeLegend.volume !== null && (
            <span className="text-slate-400">Vol: <strong className="text-sky-300">{activeLegend.volume.toLocaleString()}</strong></span>
          )}
          {activeLegend.vwap !== undefined && activeLegend.vwap !== null && (
            <span className="text-slate-400">VWAP: <strong className="text-purple-300">₹{activeLegend.vwap.toLocaleString()}</strong></span>
          )}
          {activeLegend.oi !== undefined && activeLegend.oi !== null && <span className="text-slate-400">OI: <strong className="text-sky-300">{activeLegend.oi.toLocaleString()}</strong></span>}
          {activeLegend.iv !== undefined && activeLegend.iv !== null && <span className="text-slate-400">IV: <strong className="text-purple-300">{activeLegend.iv.toFixed(2)}%</strong></span>}
          {activeLegend.delta !== undefined && <span className="text-slate-400">Δ: <strong className="text-white">{activeLegend.delta.toFixed(3)}</strong></span>}
          {activeLegend.gamma !== undefined && <span className="text-slate-400">Γ: <strong className="text-white">{activeLegend.gamma.toFixed(5)}</strong></span>}
          {activeLegend.theta !== undefined && <span className="text-slate-400">Θ: <strong className="text-white">{activeLegend.theta.toFixed(3)}</strong></span>}
          {activeLegend.vega !== undefined && <span className="text-slate-400">Vega: <strong className="text-white">{activeLegend.vega.toFixed(3)}</strong></span>}
          {showSeries.sma20 && activeLegend.sma20 !== undefined && activeLegend.sma20 !== null && <span className="text-amber-300">SMA20: ₹{activeLegend.sma20.toLocaleString()}</span>}
          {showSeries.sma50 && activeLegend.sma50 !== undefined && activeLegend.sma50 !== null && <span className="text-purple-300">SMA50: ₹{activeLegend.sma50.toLocaleString()}</span>}
          {showSeries.sma100 && activeLegend.sma100 !== undefined && activeLegend.sma100 !== null && <span className="text-rose-300">SMA100: ₹{activeLegend.sma100.toLocaleString()}</span>}
          {showSeries.sma200 && activeLegend.sma200 !== undefined && activeLegend.sma200 !== null && <span className="text-orange-300">SMA200: ₹{activeLegend.sma200.toLocaleString()}</span>}
          {showSeries.ema9 && activeLegend.ema9 !== undefined && activeLegend.ema9 !== null && <span className="text-sky-300">EMA9: ₹{activeLegend.ema9.toLocaleString()}</span>}
          {showSeries.ema21 && activeLegend.ema21 !== undefined && activeLegend.ema21 !== null && <span className="text-amber-300">EMA21: ₹{activeLegend.ema21.toLocaleString()}</span>}
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="relative w-full overflow-hidden rounded-lg bg-[#0B0E14] border border-[#232E47]/60">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0B0E14]/80 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-sky-400 font-mono text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
              <span>Streaming {chartSymbol} Candles ({timeframe})...</span>
            </div>
          </div>
        )}

      {chartError && <div className="text-amber-300 text-xs font-mono" role="status">{chartError}</div>}
      {olderLoading && <div className="text-slate-400 text-[10px] font-mono">Loading older Upstox candles…</div>}
        <div ref={chartContainerRef} className="w-full" />
      </div>

      {/* Synchronized Historical Numerical Data Table (Satisfying Section 27.17) */}
      <div className="mt-3 p-3 rounded-xl bg-[#121824] border border-[#232E47] space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-[#232E47]">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 font-mono">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Synchronized Numerical OHLCV Data Table ({candlesData.length} Records)</span>
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">
            Asia/Kolkata (IST) &bull; Tick Size ₹0.05 &bull; Real-time Verified
          </span>
        </div>

        <div className="max-h-48 overflow-y-auto scrollbar-thin">
          <table className="w-full text-xs font-mono text-left">
            <thead className="sticky top-0 bg-[#0B0E14] text-slate-400 border-b border-[#232E47]">
              <tr>
                <th className="py-1.5 px-2">Time / Date (IST)</th>
                <th className="py-1.5 px-2 text-right">Open</th>
                <th className="py-1.5 px-2 text-right">High</th>
                <th className="py-1.5 px-2 text-right">Low</th>
                <th className="py-1.5 px-2 text-right">Close</th>
                <th className="py-1.5 px-2 text-right">Volume</th>
                <th className="py-1.5 px-2 text-right">VWAP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232E47]/40 text-slate-300">
              {candlesData.slice().reverse().map((c, idx) => {
                const isIntraday = ['1m', '5m', '15m', '1h'].includes(timeframe);
                const timeLabel = typeof c.time === 'number' 
                  ? (isIntraday 
                      ? new Date(c.time * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
                      : new Date(c.time * 1000).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }))
                  : String(c.time);
                const isBullish = c.close >= c.open;
                return (
                  <tr key={idx} className="hover:bg-[#1a2334] transition-colors">
                    <td className="py-1.5 px-2 font-medium text-slate-200">{timeLabel}</td>
                    <td className="py-1.5 px-2 text-right font-medium">₹{c.open?.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right text-emerald-400 font-medium">₹{c.high?.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right text-rose-400 font-medium">₹{c.low?.toLocaleString()}</td>
                    <td className={`py-1.5 px-2 text-right font-bold ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ₹{c.close?.toLocaleString()}
                    </td>
                    <td className="py-1.5 px-2 text-right text-sky-300">{c.volume?.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right text-purple-300">₹{c.vwap?.toLocaleString() || '-'}</td>
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
