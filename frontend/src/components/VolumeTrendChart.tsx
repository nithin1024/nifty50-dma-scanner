import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface VolumeTrendSession {
  date: string; // e.g. "2026-11-13"
  volume: number;
  price_change_pct?: number;
  close_price?: number;
  isLatest?: boolean;
}

interface VolumeTrendChartProps {
  title?: string;
  symbol?: string;
  sessions: VolumeTrendSession[];
  avgVolume?: number;
  className?: string;
}

/**
 * Format volume in standard Indian numbering system (Crores and Lakhs).
 * 1 Crore (Cr) = 10,000,000
 * 1 Lakh (L) = 100,000
 */
export function formatIndianVolume(vol: number): string {
  if (!vol || vol <= 0) return '0';
  if (vol >= 10000000) {
    const cr = vol / 10000000;
    // Show 1 decimal only if needed, e.g., 4 Cr or 3.6 Cr
    const formatted = cr >= 10 ? Math.round(cr).toString() : (Math.round(cr * 10) / 10).toString();
    return `${formatted} Cr`;
  }
  if (vol >= 100000) {
    const lk = Math.round(vol / 100000);
    return `${lk} L`;
  }
  if (vol >= 1000) {
    return `${Math.round(vol / 1000)} K`;
  }
  return `${Math.round(vol)}`;
}

/**
 * Parse trading date into Day and Month for X-axis stacking.
 */
export function parseDateParts(dateStr: string): { day: string; month: string } {
  if (!dateStr) return { day: '-', month: '' };
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10);
      return {
        day: parseInt(parts[2], 10).toString(),
        month: monthNames[mIdx] || parts[1]
      };
    }
  } catch {
    // fallback
  }
  return { day: dateStr, month: '' };
}

export const VolumeTrendChart: React.FC<VolumeTrendChartProps> = ({
  title = 'Volume Trend',
  symbol,
  sessions,
  avgVolume,
  className = ''
}) => {
  const { t } = useLanguage();
  const [order, setOrder] = useState<'NEWEST_FIRST' | 'CHRONOLOGICAL'>('NEWEST_FIRST');

  if (!sessions || sessions.length === 0) {
    return (
      <div className={`p-5 rounded-xl bg-[#121824] border border-[#232E47] text-slate-400 text-xs text-center ${className}`}>
        {t('No volume trend data available.')}
      </div>
    );
  }

  // Calculate 6-session average volume if not provided
  const calculatedAvg = avgVolume ?? (
    sessions.reduce((acc, s) => acc + (s.volume || 0), 0) / sessions.length
  );

  // Order sessions according to user preference (screenshot shows newest first on left)
  const orderedSessions = order === 'NEWEST_FIRST' 
    ? [...sessions].reverse() 
    : [...sessions];

  // Calculate peak for 4-tier Y-axis (4.8Cr, 3.6Cr, 2.4Cr, 1.2Cr, 0 style)
  const rawMax = Math.max(...sessions.map(s => s.volume || 0), calculatedAvg, 1);
  // Round up to a clean ceiling
  const yMax = rawMax * 1.25;

  const ySteps = [
    yMax,
    yMax * 0.75,
    yMax * 0.50,
    yMax * 0.25,
    0
  ];

  // Average line position in percentage from bottom
  const avgLinePct = Math.min(95, Math.max(5, (calculatedAvg / yMax) * 100));

  return (
    <div className={`p-6 rounded-2xl bg-[#121824] border border-[#232E47] shadow-xl ${className}`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#232E47]/60 mb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>{t(title)}</span>
            {symbol && <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-semibold">{symbol}</span>}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('Institutional daily traded volume with 6-session average benchmark (Cr / Lakhs)')}
          </p>
        </div>

        {/* Sort Order Toggle */}
        <div className="flex items-center space-x-1 bg-[#0B0E14] p-1 rounded-lg border border-[#232E47] text-xs">
          <button
            onClick={() => setOrder('NEWEST_FIRST')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              order === 'NEWEST_FIRST' 
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="Show latest session on the left (matches trading app)"
          >
            {t('Newest First')}
          </button>
          <button
            onClick={() => setOrder('CHRONOLOGICAL')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              order === 'CHRONOLOGICAL' 
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="Show oldest to newest"
          >
            {t('Chronological')}
          </button>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="relative pt-6 pb-2">
        {/* Y-Axis Gridlines & Labels */}
        <div className="absolute inset-0 pt-6 pb-12 flex flex-col justify-between pointer-events-none">
          {ySteps.map((val, idx) => (
            <div key={idx} className="relative flex items-center w-full">
              {/* Y-Axis Label */}
              <span className="w-14 text-left font-mono text-xs text-slate-400 select-none">
                {formatIndianVolume(val)}
              </span>
              {/* Horizontal Gridline */}
              <div className="flex-1 border-b border-[#232E47]/40" />
            </div>
          ))}
        </div>

        {/* Average Volume Benchmark Horizontal Dashed Line */}
        <div 
          className="absolute left-0 right-0 z-20 flex items-center pointer-events-none transition-all duration-300"
          style={{ bottom: `calc(${avgLinePct}% + 44px)` }}
        >
          {/* Left Average Pill Badge (Matching Screenshot) */}
          <span className="px-2 py-0.5 rounded-md bg-[#6B21A8] text-purple-100 font-mono text-[11px] font-bold shadow-md tracking-wide z-30">
            {formatIndianVolume(calculatedAvg)} (AVG)
          </span>
          {/* Dashed line extending across */}
          <div className="flex-1 border-t-2 border-dashed border-purple-400/70 ml-2" />
        </div>

        {/* Vertical Bars Canvas */}
        <div className="relative h-64 pl-16 pr-4 flex items-end justify-around gap-3 z-10 pb-12">
          {orderedSessions.map((session, idx) => {
            const vol = session.volume || 0;
            const heightPct = Math.min(100, Math.max(4, (vol / yMax) * 100));
            const volFormatted = formatIndianVolume(vol);
            const { day, month } = parseDateParts(session.date);
            const isPos = (session.price_change_pct || 0) >= 0;

            return (
              <div 
                key={session.date || idx}
                className="flex-1 flex flex-col items-center h-full justify-end group relative"
              >
                {/* Volume Label Above Bar */}
                <div className="mb-2 text-center transition-transform group-hover:-translate-y-1">
                  <span className="font-bold text-white text-xs sm:text-sm font-mono tracking-tight block">
                    {volFormatted}
                  </span>
                  {session.price_change_pct !== undefined && (
                    <span className={`text-[10px] font-mono block ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{session.price_change_pct.toFixed(1)}%
                    </span>
                  )}
                </div>

                {/* The Soft Lavender / Lilac Rounded Bar (Matching Screenshot) */}
                <div 
                  className="w-full max-w-[48px] rounded-t-xl bg-[#C4B5FD] hover:bg-[#DDD6FE] transition-all duration-300 shadow-md relative"
                  style={{ height: `${heightPct}%` }}
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0B0E14] text-slate-100 text-[10px] font-mono py-1 px-2 rounded border border-[#232E47] whitespace-nowrap pointer-events-none z-30 shadow-lg">
                    Volume: {vol.toLocaleString()}
                  </div>
                </div>

                {/* X-Axis Date Stack (Day on top, Month below) */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center select-none">
                  <div className="text-xs font-bold text-slate-200 font-mono leading-none">
                    {day}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium leading-tight">
                    {month}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Notes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-4 border-t border-[#232E47]/60 mt-4 gap-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#C4B5FD] inline-block"></span>
            <span>{t('Daily Traded Volume')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-purple-400 inline-block"></span>
            <span className="text-purple-300 font-mono">{t('6-Session Average Line')}</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          {t('Average')}: {formatIndianVolume(calculatedAvg)} ({Math.round(calculatedAvg).toLocaleString()})
        </div>
      </div>
    </div>
  );
};
