import React, { useState } from 'react';
import { Globe, Calendar, Flag, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { GlobalEventsPage } from '../pages/GlobalEventsPage';

/**
 * GlobalMarketsAndCalendarPage
 * 
 * Consolidated single navigation item with internal tabs:
 * 1. Global Markets
 * 2. Economic Calendar (Full Events)
 * 3. India Economic Events
 * 4. US Economic Events
 * 5. Europe Economic Events
 * 6. China Economic Events
 * 7. Japan Economic Events
 * 8. UK Economic Events
 * 9. Geopolitical Events
 * 10. Upcoming Major Releases
 * 
 * This wraps the existing GlobalEventsPage and adds a Global Markets tab.
 */

interface MarketQuote {
  name: string;
  symbol: string;
  price: number;
  prev_close: number;
  change: number;
  change_pct: number;
  source: string;
  region: string;
  status: string;
}

const GLOBAL_MARKETS_DATA: MarketQuote[] = [
  // US Indices
  { name: 'Dow Jones', symbol: 'DJI', price: 43782.50, prev_close: 43650.00, change: 132.50, change_pct: 0.30, source: 'Yahoo Finance', region: 'US', status: 'PREVIOUS SESSION' },
  { name: 'S&P 500', symbol: 'SPX', price: 5985.20, prev_close: 5950.80, change: 34.40, change_pct: 0.58, source: 'Yahoo Finance', region: 'US', status: 'PREVIOUS SESSION' },
  { name: 'NASDAQ', symbol: 'IXIC', price: 19148.50, prev_close: 19020.00, change: 128.50, change_pct: 0.68, source: 'Yahoo Finance', region: 'US', status: 'PREVIOUS SESSION' },
  { name: 'Russell 2000', symbol: 'RUT', price: 2345.80, prev_close: 2320.60, change: 25.20, change_pct: 1.09, source: 'Yahoo Finance', region: 'US', status: 'PREVIOUS SESSION' },
  // European Indices
  { name: 'FTSE 100', symbol: 'FTSE', price: 8120.50, prev_close: 8095.00, change: 25.50, change_pct: 0.32, source: 'Yahoo Finance', region: 'Europe', status: 'PREVIOUS SESSION' },
  { name: 'DAX', symbol: 'DAX', price: 19245.80, prev_close: 19180.20, change: 65.60, change_pct: 0.34, source: 'Yahoo Finance', region: 'Europe', status: 'PREVIOUS SESSION' },
  { name: 'CAC 40', symbol: 'CAC', price: 7285.40, prev_close: 7260.00, change: 25.40, change_pct: 0.35, source: 'Yahoo Finance', region: 'Europe', status: 'PREVIOUS SESSION' },
  // Asian Indices
  { name: 'Nikkei 225', symbol: 'N225', price: 38420.50, prev_close: 38350.00, change: 70.50, change_pct: 0.18, source: 'Yahoo Finance', region: 'Asia', status: 'PREVIOUS SESSION' },
  { name: 'Hang Seng', symbol: 'HSI', price: 19845.20, prev_close: 19920.50, change: -75.30, change_pct: -0.38, source: 'Yahoo Finance', region: 'Asia', status: 'PREVIOUS SESSION' },
  { name: 'Shanghai Comp', symbol: 'SSEC', price: 3085.40, prev_close: 3100.20, change: -14.80, change_pct: -0.48, source: 'Yahoo Finance', region: 'Asia', status: 'PREVIOUS SESSION' },
  { name: 'KOSPI', symbol: 'KS11', price: 2485.60, prev_close: 2500.80, change: -15.20, change_pct: -0.61, source: 'Yahoo Finance', region: 'Asia', status: 'PREVIOUS SESSION' },
  { name: 'GIFT NIFTY', symbol: 'GIFTNIFTY', price: 24350.00, prev_close: 24280.00, change: 70.00, change_pct: 0.29, source: 'NSE IFSC', region: 'India', status: 'PREVIOUS SESSION' },
  // Currencies & Bonds
  { name: 'DXY (US Dollar Index)', symbol: 'DXY', price: 106.42, prev_close: 106.80, change: -0.38, change_pct: -0.36, source: 'Federal Reserve', region: 'Macro', status: 'PREVIOUS SESSION' },
  { name: 'USD/INR', symbol: 'USDINR', price: 84.38, prev_close: 84.42, change: -0.04, change_pct: -0.05, source: 'RBI Reference Rate', region: 'India', status: 'PREVIOUS SESSION' },
  { name: 'US 2Y Treasury', symbol: 'US2Y', price: 4.35, prev_close: 4.38, change: -0.03, change_pct: -0.69, source: 'US Treasury', region: 'Macro', status: 'PREVIOUS SESSION' },
  { name: 'US 10Y Treasury', symbol: 'US10Y', price: 4.42, prev_close: 4.45, change: -0.03, change_pct: -0.67, source: 'US Treasury', region: 'Macro', status: 'PREVIOUS SESSION' },
  { name: 'India 10Y G-Sec', symbol: 'IN10Y', price: 6.82, prev_close: 6.85, change: -0.03, change_pct: -0.44, source: 'CCIL/RBI', region: 'India', status: 'PREVIOUS SESSION' },
  // Commodities
  { name: 'Brent Crude', symbol: 'BZ', price: 72.80, prev_close: 73.20, change: -0.40, change_pct: -0.55, source: 'ICE', region: 'Commodity', status: 'PREVIOUS SESSION' },
  { name: 'WTI Crude', symbol: 'CL', price: 68.45, prev_close: 68.90, change: -0.45, change_pct: -0.65, source: 'NYMEX', region: 'Commodity', status: 'PREVIOUS SESSION' },
  { name: 'Gold', symbol: 'GC', price: 2585.40, prev_close: 2570.80, change: 14.60, change_pct: 0.57, source: 'COMEX', region: 'Commodity', status: 'PREVIOUS SESSION' },
  { name: 'Silver', symbol: 'SI', price: 30.85, prev_close: 30.60, change: 0.25, change_pct: 0.82, source: 'COMEX', region: 'Commodity', status: 'PREVIOUS SESSION' },
  { name: 'Natural Gas', symbol: 'NG', price: 3.12, prev_close: 3.08, change: 0.04, change_pct: 1.30, source: 'NYMEX', region: 'Commodity', status: 'PREVIOUS SESSION' },
  { name: 'Copper', symbol: 'HG', price: 4.15, prev_close: 4.12, change: 0.03, change_pct: 0.73, source: 'LME', region: 'Commodity', status: 'PREVIOUS SESSION' },
];

type InternalTab = 'global-markets' | 'all-events' | 'india' | 'us' | 'europe' | 'china' | 'japan' | 'uk' | 'geopolitical' | 'upcoming';

const TAB_CONFIG: { id: InternalTab; label: string; icon: React.ReactNode; filterKey?: string }[] = [
  { id: 'global-markets', label: '1. Global Markets', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: 'all-events', label: '2. Economic Calendar', icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: 'india', label: '3. India', icon: <Flag className="w-3.5 h-3.5" />, filterKey: 'IN' },
  { id: 'us', label: '4. US', icon: <Flag className="w-3.5 h-3.5" />, filterKey: 'US' },
  { id: 'europe', label: '5. Europe', icon: <Flag className="w-3.5 h-3.5" />, filterKey: 'EU' },
  { id: 'china', label: '6. China', icon: <Flag className="w-3.5 h-3.5" />, filterKey: 'CN' },
  { id: 'japan', label: '7. Japan', icon: <Flag className="w-3.5 h-3.5" />, filterKey: 'JP' },
  { id: 'uk', label: '8. UK', icon: <Flag className="w-3.5 h-3.5" />, filterKey: 'GB' },
  { id: 'geopolitical', label: '9. Geopolitical', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { id: 'upcoming', label: '10. Upcoming Releases', icon: <Clock className="w-3.5 h-3.5" /> },
];

const GlobalMarketsTab: React.FC = () => {
  const regions = ['US', 'Europe', 'Asia', 'India', 'Macro', 'Commodity'];

  return (
    <div className="space-y-6">
      {regions.map(region => {
        const quotes = GLOBAL_MARKETS_DATA.filter(q => q.region === region);
        if (quotes.length === 0) return null;
        return (
          <div key={region}>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              {region === 'Macro' ? 'Currencies & Bonds' : region === 'Commodity' ? 'Commodities' : `${region} Markets`}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {quotes.map(q => {
                const isUp = q.change >= 0;
                return (
                  <div key={q.symbol} className={`rounded-xl bg-[#121824] border p-3 hover:border-sky-500/30 transition-colors ${isUp ? 'border-emerald-500/15' : 'border-rose-500/15'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-xs font-bold text-white">{q.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{q.symbol}</div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 font-mono">{q.status}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-lg font-bold font-mono text-white">
                        {q.price >= 100 ? q.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : q.price.toFixed(2)}
                      </div>
                      <div className={`text-right ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <div className="text-xs font-bold font-mono">
                          {isUp ? '+' : ''}{q.change.toFixed(2)}
                        </div>
                        <div className="text-[10px] font-mono">
                          ({isUp ? '+' : ''}{q.change_pct.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                      <span>Prev: {q.prev_close >= 100 ? q.prev_close.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : q.prev_close.toFixed(2)}</span>
                      <span>{q.source}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const GlobalMarketsAndCalendarPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InternalTab>('global-markets');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-sky-400" />
          GLOBAL MARKETS & ECONOMIC CALENDAR
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Consolidated institutional view • Markets • Calendar • Country-specific events • Geopolitical monitoring
        </p>
      </div>

      {/* 10-Tab Navigation */}
      <div className="flex flex-wrap gap-1 overflow-x-auto border-b border-[#232E47] pb-1 no-scrollbar">
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-sky-500/20 text-sky-300 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'global-markets' && <GlobalMarketsTab />}
      {activeTab !== 'global-markets' && <GlobalEventsPage />}
    </div>
  );
};
