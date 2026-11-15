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

interface ProfessionalTradingChartProps {
  symbol?: string;
  className?: string;
  height?: number;
}

export const ProfessionalTradingChart: React.FC<ProfessionalTradingChartProps> = ({
  symbol = 'NIFTY',
  className = '',
  height = 500
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<any> | null>(null);

  const [timeframe, setTimeframe] = useState<string>('15m');
  const [chartType, setChartType] = useState<'CANDLESTICK' | 'LINE' | 'AREA' | 'HEIKIN_ASHI'>('CANDLESTICK');
  const [loading, setLoading] = useState<boolean>(true);
  const [candlesData, setCandlesData] = useState<any[]>([]);
  const [indicatorsData, setIndicatorsData] = useState<any>({});
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showIndicators, setShowIndicators] = useState<boolean>(true);
  const [activeLegend, setActiveLegend] = useState<{
    time: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    vwap?: number;
    change?: number;
    changePct?: number;
  } | null>(null);

  // Timeframes supported
  const timeframes = ['1m', '5m', '15m', '1h', 'Daily', '5Y'];

  // Load candle data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchChartCandles(symbol, timeframe, chartType)
      .then(res => {
        if (!isMounted) return;
        setCandlesData(res.candles || []);
        setIndicatorsData(res.indicators || {});
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load chart data:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [symbol, timeframe, chartType]);

  // Initialize and update Lightweight Charts instance
  useEffect(() => {
    if (!chartContainerRef.current) return;

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

    const emaSeries = chart.addSeries(LineSeries, {
      color: '#38BDF8',
      lineWidth: 1,
      title: 'EMA 9',
      priceScaleId: 'right',
    });
    emaSeriesRef.current = emaSeries;

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
      if (indicatorsData.sma_20 && showIndicators) {
        const smaItems = candlesData
          .map((c, i) => ({ time: c.time, value: indicatorsData.sma_20[i] }))
          .filter(item => item.value !== null && item.value !== undefined);
        smaSeries.setData(smaItems);
      }

      if (indicatorsData.ema_9 && showIndicators) {
        const emaItems = candlesData
          .map((c, i) => ({ time: c.time, value: indicatorsData.ema_9[i] }))
          .filter(item => item.value !== null && item.value !== undefined);
        emaSeries.setData(emaItems);
      }

      chart.timeScale().fitContent();

      // Initial legend with latest bar
      const latest = candlesData[candlesData.length - 1];
      const prevClose = candlesData.length > 1 ? candlesData[candlesData.length - 2].close : latest.open;
      const chg = latest.close - prevClose;
      setActiveLegend({
        time: typeof latest.time === 'number' ? new Date(latest.time * 1000).toLocaleTimeString('en-IN') : String(latest.time),
        open: latest.open,
        high: latest.high,
        low: latest.low,
        close: latest.close,
        volume: latest.volume,
        vwap: latest.vwap,
        change: chg,
        changePct: (chg / prevClose) * 100
      });
    }

    // Subscribe to crosshair movement
    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData || !mainSeries) return;

      const barData: any = param.seriesData.get(mainSeries);
      if (barData) {
        const match = candlesData.find(c => c.time === param.time);
        const openVal = barData.open !== undefined ? barData.open : barData.value;
        const closeVal = barData.close !== undefined ? barData.close : barData.value;
        const highVal = barData.high !== undefined ? barData.high : barData.value;
        const lowVal = barData.low !== undefined ? barData.low : barData.value;
        const chg = match ? closeVal - openVal : 0;

        setActiveLegend({
          time: typeof param.time === 'number' ? new Date((param.time as number) * 1000).toLocaleTimeString('en-IN') : String(param.time),
          open: openVal,
          high: highVal,
          low: lowVal,
          close: closeVal,
          volume: match?.volume,
          vwap: match?.vwap,
          change: chg,
          changePct: openVal > 0 ? (chg / openVal) * 100 : 0
        });
      }
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
  }, [candlesData, chartType, height, isFullscreen, showIndicators]);

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
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm sm:text-base font-black text-white tracking-wide font-mono">
              {symbol} &bull; {timeframe.toUpperCase()}
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
              TRADINGVIEW ENGINE
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
            title="Toggle Technical Indicators (SMA 20, EMA 9)"
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
            onClick={handleGoToLive}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold hover:bg-emerald-500/25 transition-all"
          >
            Live Follow
          </button>

          {/* CSV Export */}
          <a
            href={getChartCsvDownloadUrl(symbol, timeframe, chartType)}
            download={`${symbol}_${timeframe}_candles.csv`}
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

      {/* Synchronized OHLC Legend Header */}
      {activeLegend && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-300 bg-[#121824] px-3 py-1.5 rounded-lg border border-[#232E47]/70">
          <span className="text-slate-400">Time: <strong className="text-white">{activeLegend.time}</strong></span>
          <span>O: <strong className="text-white">₹{activeLegend.open?.toLocaleString()}</strong></span>
          <span>H: <strong className="text-emerald-400">₹{activeLegend.high?.toLocaleString()}</strong></span>
          <span>L: <strong className="text-rose-400">₹{activeLegend.low?.toLocaleString()}</strong></span>
          <span>C: <strong className="text-white">₹{activeLegend.close?.toLocaleString()}</strong></span>
          {activeLegend.change !== undefined && (
            <span className={activeLegend.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {activeLegend.change >= 0 ? '+' : ''}{activeLegend.change.toFixed(2)} ({activeLegend.changePct?.toFixed(2)}%)
            </span>
          )}
          {activeLegend.volume && (
            <span className="text-slate-400">Vol: <strong className="text-sky-300">{activeLegend.volume.toLocaleString()}</strong></span>
          )}
          {activeLegend.vwap && (
            <span className="text-slate-400">VWAP: <strong className="text-purple-300">₹{activeLegend.vwap.toLocaleString()}</strong></span>
          )}
          {showIndicators && (
            <div className="flex items-center space-x-2 pl-2 border-l border-[#232E47]">
              <span className="text-amber-400 font-bold">SMA20</span>
              <span className="text-sky-400 font-bold">EMA9</span>
            </div>
          )}
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="relative w-full overflow-hidden rounded-lg bg-[#0B0E14] border border-[#232E47]/60">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0B0E14]/80 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-sky-400 font-mono text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
              <span>Streaming {symbol} Candles ({timeframe})...</span>
            </div>
          </div>
        )}
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
                const timeLabel = typeof c.time === 'number' 
                  ? new Date(c.time * 1000).toLocaleString('en-IN') 
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
