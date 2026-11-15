import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Bell
} from 'lucide-react';

export interface ChartDataPoint {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume: number;
  delivery_pct?: number;
  delivery_volume?: number;
  dma20?: number | null;
  dma50?: number | null;
  dma100?: number | null;
  dma200?: number | null;
  vwap?: number | null;
  oi?: number;
  oi_change?: number;
  pcr?: number;
  iv?: number;
}

export interface InstitutionalStockChartProps {
  symbol: string;
  data: ChartDataPoint[];
  title?: string;
  unit?: string;
  height?: number;
  className?: string;
  isOptionOrMacro?: boolean;
  onTimeframeChange?: (tf: string) => void;
  selectedTimeframe?: string;
  onConfigureAlert?: (symbol: string, currentPrice: number) => void;
}

export const InstitutionalStockChart: React.FC<InstitutionalStockChartProps> = ({
  symbol,
  data = [],
  title,
  unit: _unit = '₹',
  height = 420,
  className = '',
  isOptionOrMacro: _isOptionOrMacro = false,
  onTimeframeChange,
  selectedTimeframe = '1Y',
  onConfigureAlert
}) => {
  // Timeframe state
  const [timeframe, setTimeframe] = useState<string>(selectedTimeframe);
  // Chart mode placeholder (LINE used by default)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Overlay visibility toggles
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showDma20, setShowDma20] = useState<boolean>(true);
  const [showDma50, setShowDma50] = useState<boolean>(true);
  const [showDma100, _setShowDma100] = useState<boolean>(false);
  const [showDma200, setShowDma200] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [showVolSma, setShowVolSma] = useState<boolean>(true);
  const [showVwap, _setShowVwap] = useState<boolean>(true);

  // Crosshair & Hover state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Zoom / Slice range state
  const [zoomRange, setZoomRange] = useState<{ start: number; end: number } | null>(null);

  // Handle external timeframe sync
  useEffect(() => {
    setTimeframe(selectedTimeframe);
  }, [selectedTimeframe]);

  const handleTimeframeSelect = (tf: string) => {
    setTimeframe(tf);
    setZoomRange(null);
    if (onTimeframeChange) {
      onTimeframeChange(tf);
    }
  };

  // Slice data based on timeframe
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    let count = data.length;
    if (timeframe === '1M') count = Math.min(22, data.length);
    else if (timeframe === '3M') count = Math.min(66, data.length);
    else if (timeframe === '6M') count = Math.min(132, data.length);
    else if (timeframe === '1Y') count = Math.min(250, data.length);
    else if (timeframe === '3Y') count = Math.min(750, data.length);
    else if (timeframe === '5Y') count = Math.min(1250, data.length);

    const slice = data.slice(-count);
    if (zoomRange) {
      return slice.slice(zoomRange.start, zoomRange.end);
    }
    return slice;
  }, [data, timeframe, zoomRange]);

  // Derive only the volume average; delivery metrics stay absent unless supplied by a source.
  const enrichedData = useMemo(() => {
    return filteredData.map((d, i, arr) => {
      // Vol SMA
      let volSma = 0;
      if (i >= 19) {
        const win = arr.slice(i - 19, i + 1);
        volSma = win.reduce((sum, item) => sum + item.volume, 0) / 20;
      }

      return {
        ...d,
        volSma
      };
    });
  }, [filteredData]);

  // Active selected point: either hovered or latest candle
  const activePoint = useMemo(() => {
    if (enrichedData.length === 0) return null;
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < enrichedData.length) {
      return enrichedData[hoverIndex];
    }
    return enrichedData[enrichedData.length - 1];
  }, [enrichedData, hoverIndex]);

  // Calculations for layout & coordinates
  const svgWidth = 840;
  const svgHeight = isFullscreen ? Math.max(500, window.innerHeight - 240) : height;

  const padLeft = 65;   // Left Y-axis for Volume
  const padRight = 75;  // Right Y-axis for Price
  const padTop = 30;
  const padBottom = 40;

  const plotWidth = svgWidth - padLeft - padRight;
  const pricePlotHeight = (svgHeight - padTop - padBottom) * 0.72;
  const volPlotHeight = (svgHeight - padTop - padBottom) * 0.22;
  const volPlotTop = padTop + pricePlotHeight + 10;

  // Min and Max scales
  const priceStats = useMemo(() => {
    if (enrichedData.length === 0) return { min: 0, max: 100, range: 100 };
    const prices: number[] = [];
    enrichedData.forEach(d => {
      if (d.close) prices.push(d.close);
      if (d.high) prices.push(d.high);
      if (d.low) prices.push(d.low);
      if (showDma20 && d.dma20) prices.push(d.dma20);
      if (showDma50 && d.dma50) prices.push(d.dma50);
      if (showDma100 && d.dma100) prices.push(d.dma100);
      if (showDma200 && d.dma200) prices.push(d.dma200);
      if (showVwap && d.vwap) prices.push(d.vwap);
    });
    const min = Math.min(...prices) * 0.985;
    const max = Math.max(...prices) * 1.015;
    return { min, max, range: max - min || 1 };
  }, [enrichedData, showDma20, showDma50, showDma100, showDma200, showVwap]);

  const maxVolume = useMemo(() => {
    if (enrichedData.length === 0) return 1;
    return Math.max(...enrichedData.map(d => d.volume), 1) * 1.15;
  }, [enrichedData]);

  // Coordinate mapping functions
  const count = enrichedData.length;
  const getX = (i: number) => padLeft + (count > 1 ? (i / (count - 1)) * plotWidth : plotWidth / 2);
  const getPriceY = (val: number) => padTop + pricePlotHeight - ((val - priceStats.min) / priceStats.range) * pricePlotHeight;
  const getVolY = (vol: number) => volPlotTop + volPlotHeight - (vol / maxVolume) * volPlotHeight;

  // Percentage from start of visible range
  const startClose = enrichedData[0]?.close || 1;
  const fromStartPct = activePoint ? (((activePoint.close - startClose) / startClose) * 100) : 0;

  // SVG Paths
  const priceLinePath = useMemo(() => {
    if (count < 2) return '';
    return enrichedData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getPriceY(d.close)}`).join(' ');
  }, [enrichedData, priceStats]);

  const priceAreaPath = useMemo(() => {
    if (count < 2) return '';
    const line = priceLinePath;
    const bottomY = padTop + pricePlotHeight;
    return `${line} L ${getX(count - 1)} ${bottomY} L ${getX(0)} ${bottomY} Z`;
  }, [priceLinePath, count]);

  const dma20Path = useMemo(() => {
    if (!showDma20) return '';
    const valid = enrichedData.map((d, i) => (d.dma20 ? { x: getX(i), y: getPriceY(d.dma20) } : null)).filter(Boolean);
    if (valid.length < 2) return '';
    return valid.map((pt: any, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  }, [enrichedData, showDma20, priceStats]);

  const dma50Path = useMemo(() => {
    if (!showDma50) return '';
    const valid = enrichedData.map((d, i) => (d.dma50 ? { x: getX(i), y: getPriceY(d.dma50) } : null)).filter(Boolean);
    if (valid.length < 2) return '';
    return valid.map((pt: any, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  }, [enrichedData, showDma50, priceStats]);

  const dma200Path = useMemo(() => {
    if (!showDma200) return '';
    const valid = enrichedData.map((d, i) => (d.dma200 ? { x: getX(i), y: getPriceY(d.dma200) } : null)).filter(Boolean);
    if (valid.length < 2) return '';
    return valid.map((pt: any, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  }, [enrichedData, showDma200, priceStats]);

  const volSmaPath = useMemo(() => {
    if (!showVolSma) return '';
    const valid = enrichedData.map((d, i) => (d.volSma ? { x: getX(i), y: getVolY(d.volSma) } : null)).filter(Boolean);
    if (valid.length < 2) return '';
    return valid.map((pt: any, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  }, [enrichedData, showVolSma, maxVolume]);

  // Volume format helper: e.g. 1.1 Cr, 45 L, 50 K
  const formatVolume = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)} L`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)} K`;
    return val.toLocaleString();
  };

  // Mouse / Touch interaction handler
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || count === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Scale to viewBox coordinates
    const scaleX = svgWidth / rect.width;
    const scaleY = svgHeight / rect.height;
    const svgX = clientX * scaleX;
    const svgY = clientY * scaleY;

    // Find nearest point along plot width
    const clampedX = Math.max(padLeft, Math.min(svgWidth - padRight, svgX));
    const ratio = (clampedX - padLeft) / plotWidth;
    const idx = Math.round(ratio * (count - 1));

    setHoverIndex(idx);
    setMousePos({ x: getX(idx), y: svgY });
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
    setMousePos(null);
  };

  // Zoom controls
  const handleZoom = (factor: number) => {
    if (count <= 10) return;
    const curStart = zoomRange ? zoomRange.start : 0;
    const curEnd = zoomRange ? zoomRange.end : count;
    const currentSpan = curEnd - curStart;
    const newSpan = Math.max(10, Math.round(currentSpan * factor));
    const center = Math.round((curStart + curEnd) / 2);
    const newStart = Math.max(0, center - Math.round(newSpan / 2));
    const newEnd = Math.min(count, newStart + newSpan);
    setZoomRange({ start: newStart, end: newEnd });
  };

  const handleResetZoom = () => {
    setZoomRange(null);
  };

  // Y-axis price tick generation
  const priceTicks = useMemo(() => {
    const ticks = [];
    const step = priceStats.range / 4;
    for (let i = 0; i <= 4; i++) {
      const val = priceStats.min + (i * step);
      ticks.push({
        val: Math.round(val),
        y: getPriceY(val)
      });
    }
    return ticks;
  }, [priceStats]);

  // Y-axis volume tick generation (Left axis)
  const volTicks = useMemo(() => {
    const ticks = [];
    for (let i = 1; i <= 2; i++) {
      const vol = (maxVolume / 2) * i;
      ticks.push({
        val: formatVolume(vol),
        y: getVolY(vol)
      });
    }
    return ticks;
  }, [maxVolume]);

  // X-axis date labels
  const dateTicks = useMemo(() => {
    if (count < 2) return [];
    const ticks = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const idx = Math.min(count - 1, Math.round((i / steps) * (count - 1)));
      ticks.push({
        date: enrichedData[idx].date,
        x: getX(idx)
      });
    }
    return ticks;
  }, [enrichedData]);

  // Selected point coordinates for crosshair
  const activeIdx = hoverIndex !== null ? hoverIndex : count - 1;
  const activeX = getX(activeIdx);
  const activeY = activePoint ? getPriceY(activePoint.close) : 0;

  // Dynamic floating tooltip positioning (auto-reposition to avoid clipping)
  const tooltipWidth = 190;
  const tooltipHeight = 150;
  const isRightHalf = activeX > (padLeft + plotWidth / 2);
  const tooltipX = isRightHalf ? activeX - tooltipWidth - 15 : activeX + 15;
  const tooltipY = Math.max(padTop + 5, Math.min(padTop + pricePlotHeight - tooltipHeight - 10, activeY - 40));

  return (
    <div className={`rounded-xl bg-[#0B0E14] border border-[#232E47] p-3 sm:p-4 flex flex-col space-y-3 font-sans ${className} ${
      isFullscreen ? 'fixed inset-0 z-50 p-6 bg-[#0B0E14]' : ''
    }`}>
      {/* ========================================================================= */}
      {/* 1. TOP CONTROLS & TIMEFRAME TOOLBAR (Matching Reference Screenshot 1) */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#232E47] gap-2">
        {/* Left: Symbol & Title */}
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          <h3 className="text-sm sm:text-base font-black text-white font-mono tracking-wide">
            {symbol} {title ? `• ${title}` : ''}
          </h3>
          {activePoint && (
            <span className="text-xs font-mono font-bold text-emerald-400 ml-1">
              ₹{activePoint.close.toLocaleString()}
            </span>
          )}
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/40 text-slate-300 border border-slate-600/40">HISTORICAL</span>
        </div>

        {/* Center: Timeframe Bar (1M, 3M, 6M, 1Y, 3Y, 5Y, MAX) */}
        <div className="flex items-center space-x-1 bg-[#121824] p-0.5 rounded-lg border border-[#232E47]">
          {['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'].map(tf => (
            <button
              key={tf}
              onClick={() => handleTimeframeSelect(tf)}
              className={`px-2 sm:px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                timeframe === tf
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Right: Actions, Alerts, Zoom & Fullscreen */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Alert Button */}
          {onConfigureAlert && activePoint && (
            <button
              onClick={() => onConfigureAlert(symbol, activePoint.close)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold hover:bg-amber-500/25 transition-all"
              title="Create Real-time Price/Indicator Alert"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alert</span>
            </button>
          )}

          {/* Zoom In / Out / Reset */}
          <div className="flex items-center space-x-0.5 bg-[#121824] border border-[#232E47] rounded-lg p-0.5">
            <button onClick={() => handleZoom(0.75)} className="p-1 hover:text-white text-slate-400" title="Zoom In">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleZoom(1.35)} className="p-1 hover:text-white text-slate-400" title="Zoom Out">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleResetZoom} className="p-1 hover:text-white text-slate-400" title="Reset Zoom">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

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

      {/* ========================================================================= */}
      {/* 2. OVERLAY SELECTION PILLS (Checkboxes for 20 DMA, 50 DMA, 200 DMA, Volume) */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-mono">
        <button
          onClick={() => setShowPrice(!showPrice)}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-all ${
            showPrice ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-[#121824] text-slate-500 border-[#232E47]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>Price</span>
        </button>

        <button
          onClick={() => setShowDma20(!showDma20)}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-all ${
            showDma20 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-[#121824] text-slate-500 border-[#232E47]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>20 DMA</span>
        </button>

        <button
          onClick={() => setShowDma50(!showDma50)}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-all ${
            showDma50 ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-[#121824] text-slate-500 border-[#232E47]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span>50 DMA</span>
        </button>

        <button
          onClick={() => setShowDma200(!showDma200)}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-all ${
            showDma200 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-[#121824] text-slate-500 border-[#232E47]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span>200 DMA</span>
        </button>

        <button
          onClick={() => setShowVolume(!showVolume)}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-all ${
            showVolume ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-[#121824] text-slate-500 border-[#232E47]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Volume</span>
        </button>

        <button
          onClick={() => setShowVolSma(!showVolSma)}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-all ${
            showVolSma ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' : 'bg-[#121824] text-slate-500 border-[#232E47]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span>Vol SMA</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN SVG COMBINED PRICE + VOLUME CHART WITH FLOATING TRACKING BOX */}
      {/* ========================================================================= */}
      <div className="relative w-full overflow-hidden rounded-lg bg-[#0B0E14] border border-[#232E47]/70 select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full cursor-crosshair touch-none"
          preserveAspectRatio="none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            <linearGradient id="stockAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.22" />
              <stop offset="90%" stopColor="#38BDF8" stopOpacity="0.01" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {priceTicks.map((pt, idx) => (
            <line
              key={`gl-p-${idx}`}
              x1={padLeft}
              y1={pt.y}
              x2={svgWidth - padRight}
              y2={pt.y}
              stroke="#171F32"
              strokeDasharray="2 2"
            />
          ))}

          {/* Volume Section Separator Line */}
          <line
            x1={padLeft}
            y1={volPlotTop - 4}
            x2={svgWidth - padRight}
            y2={volPlotTop - 4}
            stroke="#232E47"
            strokeWidth="1"
          />

          {/* Right Y-Axis Price Labels (Exact numerical ticks e.g. ₹900, ₹1000, ₹1100) */}
          {priceTicks.map((pt, idx) => (
            <text
              key={`ytick-${idx}`}
              x={svgWidth - padRight + 8}
              y={pt.y + 3}
              fill="#94A3B8"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="start"
            >
              ₹{pt.val.toLocaleString()}
            </text>
          ))}

          {/* Left Y-Axis Volume Labels (e.g. 1 Cr, 2 Cr) */}
          {showVolume && volTicks.map((vt, idx) => (
            <text
              key={`vols-${idx}`}
              x={padLeft - 6}
              y={vt.y + 3}
              fill="#64748B"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="end"
            >
              {vt.val}
            </text>
          ))}

          {/* Bottom X-Axis Date Labels */}
          {dateTicks.map((dt, idx) => (
            <text
              key={`dtick-${idx}`}
              x={dt.x}
              y={svgHeight - 12}
              fill="#64748B"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {dt.date}
            </text>
          ))}

          {/* Shaded Area under Price Curve */}
          {showPrice && priceAreaPath && (
            <path d={priceAreaPath} fill="url(#stockAreaGrad)" />
          )}

          {/* Volume Histogram Bars (Synchronized to price timeline) */}
          {showVolume && enrichedData.map((d, i) => {
            const barX = getX(i) - 2;
            const barW = Math.max(2, (plotWidth / count) * 0.7);
            const barTop = getVolY(d.volume);
            const barH = (volPlotTop + volPlotHeight) - barTop;
            const isBullish = d.close >= (d.open || d.close);
            const isSelected = i === activeIdx;

            return (
              <rect
                key={`volbar-${i}`}
                x={barX}
                y={barTop}
                width={barW}
                height={Math.max(1, barH)}
                fill={isBullish ? '#10B981' : '#F43F5E'}
                opacity={isSelected ? 1.0 : 0.45}
                className="transition-opacity"
              />
            );
          })}

          {/* 20-Session Volume SMA Line */}
          {showVolSma && volSmaPath && (
            <path
              d={volSmaPath}
              fill="none"
              stroke="#FACC15"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
          )}

          {/* 200 DMA Line (Rose) */}
          {showDma200 && dma200Path && (
            <path
              d={dma200Path}
              fill="none"
              stroke="#F43F5E"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}

          {/* 50 DMA Line (Purple) */}
          {showDma50 && dma50Path && (
            <path
              d={dma50Path}
              fill="none"
              stroke="#A855F7"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}

          {/* 20 DMA Line (Amber) */}
          {showDma20 && dma20Path && (
            <path
              d={dma20Path}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.0"
              strokeLinecap="round"
            />
          )}

          {/* Main Price Polyline (Sky Blue) */}
          {showPrice && priceLinePath && (
            <path
              d={priceLinePath}
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* ========================================================================= */}
          {/* CROSSHAIR & SELECTED POINT (Follows Mouse or Touch) */}
          {/* ========================================================================= */}
          {activePoint && (
            <g className="pointer-events-none">
              {/* Vertical Crosshair Line across price and volume panes */}
              <line
                x1={activeX}
                y1={padTop}
                x2={activeX}
                y2={volPlotTop + volPlotHeight}
                stroke="#38BDF8"
                strokeWidth="1.2"
                strokeDasharray="4 3"
              />

              {/* Horizontal Crosshair Line to right Y-axis */}
              <line
                x1={padLeft}
                y1={activeY}
                x2={svgWidth - padRight}
                y2={activeY}
                stroke="#38BDF8"
                strokeWidth="1"
                strokeDasharray="4 3"
              />

              {/* Highlighted Circular Data Dot on Price Curve (Exact Target Style) */}
              <circle
                cx={activeX}
                cy={activeY}
                r="5.5"
                fill="#38BDF8"
                stroke="#0B0E14"
                strokeWidth="2"
              />

              {/* Right Y-Axis Badge highlighting exact selected price */}
              <g transform={`translate(${svgWidth - padRight}, ${activeY - 10})`}>
                <rect x="0" y="0" width="70" height="20" rx="3" fill="#0284C7" />
                <text x="35" y="14" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  ₹{activePoint.close.toLocaleString()}
                </text>
              </g>

              {/* Bottom X-Axis Badge highlighting exact selected date */}
              <g transform={`translate(${activeX - 45}, ${volPlotTop + volPlotHeight + 2})`}>
                <rect x="0" y="0" width="90" height="18" rx="3" fill="#1E293B" stroke="#38BDF8" strokeWidth="0.8" />
                <text x="45" y="13" fill="#38BDF8" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  {activePoint.date}
                </text>
              </g>
            </g>
          )}
        </svg>

        {/* ========================================================================= */}
        {/* 4. FLOATING NUMERICAL INFORMATION TOOLTIP (Exact Match to Reference Image 1) */}
        {/* ========================================================================= */}
        {activePoint && (
          <div
            className="absolute pointer-events-none bg-[#121824]/95 backdrop-blur-md border border-[#38BDF8]/60 rounded-lg p-2.5 shadow-2xl text-xs font-mono z-30 transition-all duration-75"
            style={{
              left: `${(tooltipX / svgWidth) * 100}%`,
              top: `${(tooltipY / svgHeight) * 100}%`,
              width: `${(tooltipWidth / svgWidth) * 100}%`,
              minWidth: '175px'
            }}
          >
            {/* Header: Date */}
            <div className="flex justify-between items-center pb-1 mb-1.5 border-b border-[#232E47]">
              <span className="text-slate-400 text-[10px] uppercase font-bold">DATE:</span>
              <strong className="text-white text-[11px]">{activePoint.date}</strong>
            </div>

            {/* Price */}
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400 text-[10px] uppercase font-bold">PRICE:</span>
              <strong className="text-emerald-400 font-bold text-xs">
                ₹{activePoint.close.toLocaleString()}
              </strong>
            </div>

            {/* From Start % */}
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400 text-[10px] uppercase font-bold">FROM START:</span>
              <strong className={`font-bold text-xs ${fromStartPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {fromStartPct >= 0 ? '+' : ''}{fromStartPct.toFixed(1)}%
              </strong>
            </div>

            {/* Volume */}
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400 text-[10px] uppercase font-bold">VOLUME:</span>
              <strong className="text-sky-300 font-bold text-xs">
                {formatVolume(activePoint.volume)}
              </strong>
            </div>

            {activePoint.open !== undefined && <div className="flex justify-between py-0.5"><span className="text-slate-400 text-[10px]">OPEN:</span><strong className="text-slate-200">₹{activePoint.open.toLocaleString()}</strong></div>}
            {activePoint.high !== undefined && <div className="flex justify-between py-0.5"><span className="text-slate-400 text-[10px]">HIGH:</span><strong className="text-slate-200">₹{activePoint.high.toLocaleString()}</strong></div>}
            {activePoint.low !== undefined && <div className="flex justify-between py-0.5"><span className="text-slate-400 text-[10px]">LOW:</span><strong className="text-slate-200">₹{activePoint.low.toLocaleString()}</strong></div>}
            {activePoint.delivery_volume !== undefined && <div className="flex justify-between py-0.5"><span className="text-slate-400 text-[10px]">DELIVERY VOLUME:</span><strong className="text-amber-300">{formatVolume(activePoint.delivery_volume)}</strong></div>}
            {activePoint.delivery_pct !== undefined && <div className="flex justify-between py-0.5"><span className="text-slate-400 text-[10px]">DELIVERY:</span><strong className="text-amber-300">{activePoint.delivery_pct}%</strong></div>}
            {activePoint.vwap != null && <div className="flex justify-between py-0.5"><span className="text-slate-400 text-[10px]">VWAP:</span><strong className="text-slate-200">₹{activePoint.vwap.toLocaleString()}</strong></div>}

            {/* Optional DMA Breakdown */}
            {(showDma20 || showDma50 || showDma200) && (
              <div className="mt-1 pt-1 border-t border-[#232E47] text-[10px] space-y-0.5">
                {showDma20 && activePoint.dma20 && (
                  <div className="flex justify-between">
                    <span className="text-amber-400">20 DMA:</span>
                    <span className="text-slate-300">₹{activePoint.dma20.toLocaleString()}</span>
                  </div>
                )}
                {showDma50 && activePoint.dma50 && (
                  <div className="flex justify-between">
                    <span className="text-purple-400">50 DMA:</span>
                    <span className="text-slate-300">₹{activePoint.dma50.toLocaleString()}</span>
                  </div>
                )}
                {showDma200 && activePoint.dma200 && (
                  <div className="flex justify-between">
                    <span className="text-rose-400">200 DMA:</span>
                    <span className="text-slate-300">₹{activePoint.dma200.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer note: Data Provenance */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
        <span>Hover or drag crosshair to inspect the selected historical record &bull; Dual-axis scaling</span>
        <span>Unavailable fields are omitted</span>
      </div>
    </div>
  );
};
