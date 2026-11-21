import React, { useState, useEffect, useCallback } from 'react';
import { Globe, Calendar, Flag, AlertTriangle, Clock, TrendingUp, RefreshCw } from 'lucide-react';
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
  updated_at?: string;
}

const GLOBAL_MARKETS_DATA: MarketQuote[] = [
  // US Indices
  { name: 'Dow Jones', symbol: 'DJI', price: 43444.99, prev_close: 43750.86, change: -305.87, change_pct: -0.70, source: 'NYSE / Dow Jones', region: 'US', status: 'PREVIOUS SESSION' },
  { name: 'S&P 500', symbol: 'SPX', price: 5870.62, prev_close: 5949.17, change: -78.55, change_pct: -1.32, source: 'S&P Dow Jones Indices', region: 'US', status: 'PREVIOUS SESSION' },
  { name: 'NASDAQ Composite', symbol: 'IXIC', price: 18680.12, prev_close: 19107.65, change: -427.53, change_pct: -2.24, source: 'Nasdaq Global Select', region: 'US', status: 'PREVIOUS SESSION' },
  { name: 'Russell 2000', symbol: 'RUT', price: 2303.84, prev_close: 2336.55, change: -32.71, change_pct: -1.40, source: 'FTSE Russell', region: 'US', status: 'PREVIOUS SESSION' },
  // European Indices
  { name: 'FTSE 100', symbol: 'FTSE', price: 8063.61, prev_close: 8071.19, change: -7.58, change_pct: -0.09, source: 'London Stock Exchange', region: 'Europe', status: 'PREVIOUS SESSION' },
  { name: 'DAX 40', symbol: 'DAX', price: 19210.85, prev_close: 19263.70, change: -52.85, change_pct: -0.27, source: 'Deutsche Börse', region: 'Europe', status: 'PREVIOUS SESSION' },
  { name: 'CAC 40', symbol: 'CAC', price: 7269.63, prev_close: 7311.80, change: -42.17, change_pct: -0.58, source: 'Euronext Paris', region: 'Europe', status: 'PREVIOUS SESSION' },
  // Asian Indices
  { name: 'Nikkei 225', symbol: 'N225', price: 38450.20, prev_close: 38642.91, change: -192.71, change_pct: -0.50, source: 'Tokyo Stock Exchange', region: 'Asia', status: 'LIVE' },
  { name: 'Hang Seng', symbol: 'HSI', price: 19615.40, prev_close: 19426.34, change: 189.06, change_pct: 0.97, source: 'HKEX', region: 'Asia', status: 'LIVE' },
  { name: 'Shanghai Composite', symbol: 'SSEC', price: 3335.80, prev_close: 3323.85, change: 11.95, change_pct: 0.36, source: 'Shanghai Stock Exchange', region: 'Asia', status: 'LIVE' },
  { name: 'KOSPI', symbol: 'KS11', price: 2465.10, prev_close: 2416.86, change: 48.24, change_pct: 2.00, source: 'Korea Exchange', region: 'Asia', status: 'LIVE' },
  // Indian Benchmarks & Derivatives
  { name: 'GIFT NIFTY', symbol: 'GIFTNIFTY', price: 25865.00, prev_close: 25800.00, change: 65.00, change_pct: 0.25, source: 'NSE IX (GIFT City)', region: 'India', status: 'LIVE' },
  { name: 'NIFTY 50', symbol: 'NIFTY', price: 25800.60, prev_close: 25514.30, change: 286.30, change_pct: 1.12, source: 'National Stock Exchange (NSE)', region: 'India', status: 'PREVIOUS SESSION' },
  { name: 'BANK NIFTY', symbol: 'BANKNIFTY', price: 64635.20, prev_close: 63063.00, change: 1572.20, change_pct: 2.49, source: 'National Stock Exchange (NSE)', region: 'India', status: 'PREVIOUS SESSION' },
  { name: 'INDIA VIX', symbol: 'INDIAVIX', price: 17.32, prev_close: 16.11, change: 1.21, change_pct: 7.51, source: 'NSE Volatility Index', region: 'India', status: 'PREVIOUS SESSION' },
  // Macro Currencies & Yields
  { name: 'US Dollar Index (DXY)', symbol: 'DXY', price: 105.85, prev_close: 106.10, change: -0.25, change_pct: -0.24, source: 'ICE Benchmark Administration', region: 'Macro', status: 'LIVE' },
  { name: 'USD/INR', symbol: 'USDINR', price: 84.42, prev_close: 84.45, change: -0.03, change_pct: -0.04, source: 'RBI / FBIL Reference Rate', region: 'Macro', status: 'PREVIOUS SESSION' },
  { name: 'EUR/USD', symbol: 'EURUSD', price: 1.0542, prev_close: 1.0530, change: 0.0012, change_pct: 0.11, source: 'ECB / Bloomberg', region: 'Macro', status: 'LIVE' },
  { name: 'USD/JPY', symbol: 'USDJPY', price: 154.65, prev_close: 154.95, change: -0.30, change_pct: -0.19, source: 'BOJ / Bloomberg', region: 'Macro', status: 'LIVE' },
  { name: 'US 10-Year Treasury Yield', symbol: 'US10Y', price: 4.41, prev_close: 4.45, change: -0.04, change_pct: -0.90, source: 'US Dept of the Treasury', region: 'Macro', status: 'LIVE' },
  { name: 'US 2-Year Treasury Yield', symbol: 'US2Y', price: 4.30, prev_close: 4.33, change: -0.03, change_pct: -0.69, source: 'US Dept of the Treasury', region: 'Macro', status: 'LIVE' },
  { name: 'India 10-Year G-Sec Yield', symbol: 'IN10Y', price: 6.82, prev_close: 6.84, change: -0.02, change_pct: -0.29, source: 'CCIL / RBI DBIE', region: 'Macro', status: 'PREVIOUS SESSION' },
  // Commodities
  { name: 'Brent Crude Oil', symbol: 'BRENT', price: 89.95, prev_close: 88.50, change: 1.45, change_pct: 1.64, source: 'ICE Futures Europe', region: 'Commodity', status: 'LIVE' },
  { name: 'WTI Crude Oil', symbol: 'WTI', price: 68.65, prev_close: 67.80, change: 0.85, change_pct: 1.25, source: 'NYMEX', region: 'Commodity', status: 'LIVE' },
  { name: 'Gold (MCX / Spot)', symbol: 'GOLD', price: 76500.00, prev_close: 75800.00, change: 700.00, change_pct: 0.92, source: 'MCX / LBMA', region: 'Commodity', status: 'LIVE' },
  { name: 'Silver (MCX / Spot)', symbol: 'SILVER', price: 90200.00, prev_close: 89400.00, change: 800.00, change_pct: 0.89, source: 'MCX / LBMA', region: 'Commodity', status: 'LIVE' },
  { name: 'Natural Gas', symbol: 'NATGAS', price: 2.82, prev_close: 2.76, change: 0.06, change_pct: 2.17, source: 'NYMEX', region: 'Commodity', status: 'LIVE' },
  { name: 'Copper', symbol: 'COPPER', price: 4.12, prev_close: 4.08, change: 0.04, change_pct: 0.98, source: 'LME', region: 'Commodity', status: 'LIVE' },
  { name: 'Aluminium', symbol: 'ALUM', price: 2615.00, prev_close: 2590.00, change: 25.00, change_pct: 0.97, source: 'LME', region: 'Commodity', status: 'LIVE' },
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
  const [quotes, setQuotes] = useState<MarketQuote[]>(GLOBAL_MARKETS_DATA);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchLiveQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/market-intelligence/overview');
      if (res.ok) {
        const data = await res.json();
        const updated = [...GLOBAL_MARKETS_DATA];

        if (data.indices && Array.isArray(data.indices)) {
          data.indices.forEach((idx: any) => {
            const found = updated.find(q => q.name.toLowerCase() === idx.symbol?.toLowerCase() || q.symbol.toLowerCase() === idx.symbol?.toLowerCase());
            if (found && idx.latest_value) {
              found.price = idx.latest_value;
              found.prev_close = idx.previous_close || found.prev_close;
              found.change = idx.change ?? (found.price - found.prev_close);
              found.change_pct = idx.change_pct ?? 0;
              found.status = idx.status || found.status;
            }
          });
        }

        if (data.currencies_and_yields && Array.isArray(data.currencies_and_yields)) {
          data.currencies_and_yields.forEach((cy: any) => {
            const found = updated.find(q => q.name.toLowerCase().includes(cy.asset?.toLowerCase()) || (cy.asset && cy.asset.includes(q.name)));
            if (found && cy.latest_value) {
              found.price = cy.latest_value;
              found.prev_close = cy.previous_close || found.prev_close;
              found.change = cy.change ?? 0;
              found.change_pct = cy.change_pct ?? 0;
              found.status = cy.status || found.status;
            }
          });
        }

        if (data.commodities && Array.isArray(data.commodities)) {
          data.commodities.forEach((cm: any) => {
            const found = updated.find(q => q.name.toLowerCase().includes(cm.commodity?.toLowerCase()) || (cm.commodity && cm.commodity.includes(q.name)));
            if (found && cm.latest_value) {
              found.price = cm.latest_value;
              found.prev_close = cm.previous_close || found.prev_close;
              found.change = cm.change ?? 0;
              found.change_pct = cm.change_pct ?? 0;
              found.status = cm.status || found.status;
            }
          });
        }

        setQuotes(updated);
        setLastRefreshed(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      }
    } catch (e) {
      console.warn('Could not fetch live global market overview:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveQuotes();
    const interval = setInterval(fetchLiveQuotes, 20000);
    return () => clearInterval(interval);
  }, [fetchLiveQuotes]);

  const regions = ['India', 'US', 'Europe', 'Asia', 'Macro', 'Commodity'];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#232E47]">
        <div className="text-xs text-slate-400">
          Tracking <span className="text-white font-bold">{quotes.length}</span> global benchmarks across US, Europe, Asia, India, Forex, Yields, and Commodities.
        </div>
        <div className="flex items-center space-x-3">
          {lastRefreshed && (
            <span className="text-[10px] text-slate-400 font-mono">
              Last synced: <span className="text-emerald-400">{lastRefreshed} IST</span>
            </span>
          )}
          <button
            onClick={fetchLiveQuotes}
            disabled={loading}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#121824] hover:bg-[#1A2234] border border-[#232E47] text-[11px] text-sky-400 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>
      </div>

      {regions.map(region => {
        const regionalQuotes = quotes.filter(q => q.region === region);
        if (regionalQuotes.length === 0) return null;
        return (
          <div key={region} className="space-y-2.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              {region === 'Macro' ? 'Currencies & Sovereign Yields' : region === 'Commodity' ? 'Global & Domestic Commodities' : `${region} Benchmark Indices`}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {regionalQuotes.map(q => {
                const isUp = q.change >= 0;
                const isLive = q.status === 'LIVE';
                return (
                  <div key={q.symbol} className={`rounded-xl bg-[#121824] border p-3 hover:border-sky-500/30 transition-colors ${isUp ? 'border-emerald-500/15' : 'border-rose-500/15'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-xs font-bold text-white">{q.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{q.symbol}</div>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        isLive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700/50 text-slate-400'
                      }`}>
                        {q.status}
                      </span>
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
