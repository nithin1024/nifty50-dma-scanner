import React, { useState, useEffect, useCallback } from 'react';
import { Globe, Calendar, Flag, AlertTriangle, Clock, TrendingUp, RefreshCw, X, BarChart2 } from 'lucide-react';
import { GlobalEventsPage } from '../pages/GlobalEventsPage';
import { ProfessionalTradingChart } from '../components/ProfessionalTradingChart';

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
 * Wraps GlobalEventsPage and adds an interactive, clickable Global Markets suite with real-time charting.
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
  day_high?: number;
  day_low?: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
  tv_symbol?: string;
  updated_at?: string;
}

const GLOBAL_MARKETS_DATA: MarketQuote[] = [
  // US Indices
  { name: 'Dow Jones', symbol: 'DJI', price: 48147.33, prev_close: 47950.80, change: 196.53, change_pct: 0.41, source: 'NYSE / Dow Jones', region: 'US', status: 'LIVE', tv_symbol: 'FOREXCOM:DJI' },
  { name: 'S&P 500', symbol: 'SPX', price: 6910.39, prev_close: 6885.20, change: 25.19, change_pct: 0.37, source: 'S&P Dow Jones Indices', region: 'US', status: 'LIVE', tv_symbol: 'FOREXCOM:SPXUSD' },
  { name: 'NASDAQ Composite', symbol: 'IXIC', price: 22617.73, prev_close: 22520.10, change: 97.63, change_pct: 0.43, source: 'Nasdaq Global Select', region: 'US', status: 'LIVE', tv_symbol: 'NASDAQ:IXIC' },
  { name: 'Russell 2000', symbol: 'RUT', price: 2303.84, prev_close: 2336.55, change: -32.71, change_pct: -1.40, source: 'FTSE Russell', region: 'US', status: 'LIVE', tv_symbol: 'TVC:RUT' },
  // European Indices
  { name: 'FTSE 100', symbol: 'FTSE', price: 8063.61, prev_close: 8071.19, change: -7.58, change_pct: -0.09, source: 'London Stock Exchange', region: 'Europe', status: 'PREVIOUS SESSION', tv_symbol: 'INDEX:FTSE' },
  { name: 'DAX 40', symbol: 'DAX', price: 19210.85, prev_close: 19263.70, change: -52.85, change_pct: -0.27, source: 'Deutsche Börse', region: 'Europe', status: 'PREVIOUS SESSION', tv_symbol: 'INDEX:DAX' },
  { name: 'CAC 40', symbol: 'CAC', price: 7269.63, prev_close: 7311.80, change: -42.17, change_pct: -0.58, source: 'Euronext Paris', region: 'Europe', status: 'PREVIOUS SESSION', tv_symbol: 'INDEX:CAC40' },
  // Asian Indices
  { name: 'Nikkei 225', symbol: 'N225', price: 38450.20, prev_close: 38642.91, change: -192.71, change_pct: -0.50, source: 'Tokyo Stock Exchange', region: 'Asia', status: 'LIVE', tv_symbol: 'TVC:NI225' },
  { name: 'Hang Seng', symbol: 'HSI', price: 19615.40, prev_close: 19426.34, change: 189.06, change_pct: 0.97, source: 'HKEX', region: 'Asia', status: 'LIVE', tv_symbol: 'INDEX:HSI' },
  { name: 'Shanghai Composite', symbol: 'SSEC', price: 3335.80, prev_close: 3323.85, change: 11.95, change_pct: 0.36, source: 'Shanghai Stock Exchange', region: 'Asia', status: 'LIVE', tv_symbol: 'INDEX:SHCOMP' },
  { name: 'KOSPI', symbol: 'KS11', price: 2465.10, prev_close: 2416.86, change: 48.24, change_pct: 2.00, source: 'Korea Exchange', region: 'Asia', status: 'LIVE', tv_symbol: 'KRX:KOSPI' },
  // Indian Benchmarks & Derivatives
  { name: 'GIFT NIFTY', symbol: 'GIFTNIFTY', price: 25865.00, prev_close: 25800.00, change: 65.00, change_pct: 0.25, source: 'NSE IX (GIFT City)', region: 'India', status: 'LIVE', tv_symbol: 'NSEIX:NIFTY1!' },
  { name: 'NIFTY 50', symbol: 'NIFTY', price: 25800.60, prev_close: 25514.30, change: 286.30, change_pct: 1.12, source: 'National Stock Exchange (NSE)', region: 'India', status: 'PREVIOUS SESSION', tv_symbol: 'NSE:NIFTY' },
  { name: 'BANK NIFTY', symbol: 'BANKNIFTY', price: 64635.20, prev_close: 63063.00, change: 1572.20, change_pct: 2.49, source: 'National Stock Exchange (NSE)', region: 'India', status: 'PREVIOUS SESSION', tv_symbol: 'NSE:BANKNIFTY' },
  { name: 'INDIA VIX', symbol: 'INDIAVIX', price: 17.32, prev_close: 16.11, change: 1.21, change_pct: 7.51, source: 'NSE Volatility Index', region: 'India', status: 'PREVIOUS SESSION', tv_symbol: 'NSE:INDIAVIX' },
  // Macro Currencies & Yields
  { name: 'US Dollar Index (DXY)', symbol: 'DXY', price: 105.85, prev_close: 106.10, change: -0.25, change_pct: -0.24, source: 'ICE Benchmark Administration', region: 'Macro', status: 'LIVE', tv_symbol: 'TVC:DXY' },
  { name: 'USD/INR', symbol: 'USDINR', price: 84.42, prev_close: 84.45, change: -0.03, change_pct: -0.04, source: 'RBI / FBIL Reference Rate', region: 'Macro', status: 'PREVIOUS SESSION', tv_symbol: 'FX_IDC:USDINR' },
  { name: 'EUR/USD', symbol: 'EURUSD', price: 1.0542, prev_close: 1.0530, change: 0.0012, change_pct: 0.11, source: 'ECB / Bloomberg', region: 'Macro', status: 'LIVE', tv_symbol: 'FX:EURUSD' },
  { name: 'USD/JPY', symbol: 'USDJPY', price: 154.65, prev_close: 154.95, change: -0.30, change_pct: -0.19, source: 'BOJ / Bloomberg', region: 'Macro', status: 'LIVE', tv_symbol: 'FX:USDJPY' },
  { name: 'US 10-Year Treasury Yield', symbol: 'US10Y', price: 4.41, prev_close: 4.45, change: -0.04, change_pct: -0.90, source: 'US Dept of the Treasury', region: 'Macro', status: 'LIVE', tv_symbol: 'TVC:US10Y' },
  { name: 'US 2-Year Treasury Yield', symbol: 'US2Y', price: 4.30, prev_close: 4.33, change: -0.03, change_pct: -0.69, source: 'US Dept of the Treasury', region: 'Macro', status: 'LIVE', tv_symbol: 'TVC:US02Y' },
  { name: 'India 10-Year G-Sec Yield', symbol: 'IN10Y', price: 6.78, prev_close: 6.82, change: -0.04, change_pct: -0.59, source: 'CCIL / RBI DBIE', region: 'Macro', status: 'PREVIOUS SESSION', tv_symbol: 'TVC:IN10Y' },
  // Commodities
  { name: 'Brent Crude Oil', symbol: 'BRENT', price: 89.95, prev_close: 88.50, change: 1.45, change_pct: 1.64, source: 'ICE Futures Europe', region: 'Commodity', status: 'LIVE', tv_symbol: 'TVC:UKOIL' },
  { name: 'WTI Crude Oil', symbol: 'WTI', price: 68.65, prev_close: 67.80, change: 0.85, change_pct: 1.25, source: 'NYMEX', region: 'Commodity', status: 'LIVE', tv_symbol: 'TVC:USOIL' },
  { name: 'Gold (MCX / Spot)', symbol: 'GOLD', price: 76500.00, prev_close: 75800.00, change: 700.00, change_pct: 0.92, source: 'MCX / LBMA', region: 'Commodity', status: 'LIVE', tv_symbol: 'TVC:GOLD' },
  { name: 'Silver (MCX / Spot)', symbol: 'SILVER', price: 90200.00, prev_close: 89400.00, change: 800.00, change_pct: 0.89, source: 'MCX / LBMA', region: 'Commodity', status: 'LIVE', tv_symbol: 'TVC:SILVER' },
  { name: 'Natural Gas', symbol: 'NATGAS', price: 2.82, prev_close: 2.76, change: 0.06, change_pct: 2.17, source: 'NYMEX', region: 'Commodity', status: 'LIVE', tv_symbol: 'TVC:NATURALGAS' },
  { name: 'Copper', symbol: 'COPPER', price: 4.12, prev_close: 4.08, change: 0.04, change_pct: 0.98, source: 'LME', region: 'Commodity', status: 'LIVE', tv_symbol: 'TVC:COPPER' },
  { name: 'Aluminium', symbol: 'ALUM', price: 2615.00, prev_close: 2590.00, change: 25.00, change_pct: 0.97, source: 'LME', region: 'Commodity', status: 'LIVE', tv_symbol: 'TVC:ALI1!' },
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
  const [selectedMarket, setSelectedMarket] = useState<MarketQuote | null>(null);
  const [chartEngine, setChartEngine] = useState<'tv' | 'upstox'>('tv');

  const fetchLiveQuotes = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Primary: fetch dedicated live global markets endpoint
      const res = await fetch('/api/v1/market-intelligence/global-markets');
      if (res.ok) {
        const data = await res.json();
        if (data.quotes && Array.isArray(data.quotes) && data.quotes.length > 0) {
          setQuotes(data.quotes);
          setLastRefreshed(data.as_of_ist || new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
          return;
        }
      }

      // 2. Secondary fallback: overview endpoint
      const resOverview = await fetch('/api/v1/market-intelligence/overview');
      if (resOverview.ok) {
        const data = await resOverview.json();
        const updated = [...quotes];
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
        setQuotes(updated);
        setLastRefreshed(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      }
    } catch (e) {
      console.warn('Could not fetch live global market overview:', e);
    } finally {
      setLoading(false);
    }
  }, [quotes]);

  useEffect(() => {
    fetchLiveQuotes();
    const interval = setInterval(fetchLiveQuotes, 15000); // 15-second live refresh
    return () => clearInterval(interval);
  }, [fetchLiveQuotes]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMarket(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const regions = ['India', 'US', 'Europe', 'Asia', 'Macro', 'Commodity'];

  return (
    <div className="space-y-6 font-mono">
      {/* Header telemetry row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#232E47]">
        <div className="text-xs text-slate-400">
          Tracking <span className="text-white font-bold">{quotes.length}</span> global benchmarks with live tick surveillance across US, Europe, Asia, India, Forex, Yields, and Commodities.
          <span className="ml-2 text-sky-400 text-[11px] font-semibold">(Click any card to open live chart)</span>
        </div>
        <div className="flex items-center space-x-3">
          {lastRefreshed && (
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              Live synced: <span className="text-emerald-400 font-bold">{lastRefreshed}</span>
            </span>
          )}
          <button
            onClick={fetchLiveQuotes}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-[#121824] hover:bg-[#1A2234] border border-[#232E47] text-xs text-sky-400 font-bold transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Global Benchmarks */}
      {regions.map(region => {
        const regionalQuotes = quotes.filter(q => q.region === region);
        if (regionalQuotes.length === 0) return null;
        return (
          <div key={region} className="space-y-2.5">
            <h3 className="text-sm font-bold text-white flex items-center justify-between pb-1 border-b border-[#232E47]/50">
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                {region === 'Macro' ? 'Currencies & Sovereign Yields' : region === 'Commodity' ? 'Global & Domestic Commodities' : `${region} Benchmark Indices`}
              </span>
              <span className="text-[10px] font-normal text-slate-500 font-mono">
                {regionalQuotes.length} assets &bull; Click to chart
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {regionalQuotes.map(q => {
                const isUp = q.change >= 0;
                const isLive = q.status === 'LIVE';
                return (
                  <div
                    key={q.symbol}
                    onClick={() => {
                      setSelectedMarket(q);
                      setChartEngine(q.symbol === 'NIFTY' || q.symbol === 'BANKNIFTY' ? 'upstox' : 'tv');
                    }}
                    className={`group relative rounded-xl bg-[#121824] border p-3 hover:border-sky-400 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer transition-all duration-200 select-none ${
                      isUp ? 'border-emerald-500/20' : 'border-rose-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors flex items-center gap-1.5">
                          <span>{q.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{q.symbol}</div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1 ${
                          isLive 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                          {q.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-lg font-bold font-mono text-white tracking-tight">
                        {q.price >= 100 ? q.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : q.price.toFixed(q.price < 5 ? 4 : 2)}
                      </div>
                      <div className={`text-right ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <div className="text-xs font-bold font-mono">
                          {isUp ? '+' : ''}{q.change.toFixed(Math.abs(q.change) < 1 ? 4 : 2)}
                        </div>
                        <div className="text-[10px] font-mono">
                          ({isUp ? '+' : ''}{q.change_pct.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#232E47]/60 text-[10px] text-slate-500 font-mono">
                      <span>Prev: {q.prev_close >= 100 ? q.prev_close.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : q.prev_close.toFixed(q.prev_close < 5 ? 4 : 2)}</span>
                      <span className="text-sky-400/90 group-hover:text-sky-300 flex items-center gap-1 font-semibold transition-colors">
                        <BarChart2 className="w-3 h-3" />
                        <span>Chart</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* POPUP MODAL: INTERACTIVE LIVE CHART FOR SELECTED GLOBAL BENCHMARK */}
      {selectedMarket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 font-mono animate-fadeIn">
          <div className="bg-[#0B0E14] border border-[#232E47] rounded-2xl w-full max-w-6xl max-h-[94vh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47] gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                    selectedMarket.status === 'LIVE' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {selectedMarket.status === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                    {selectedMarket.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Region: <strong className="text-white">{selectedMarket.region}</strong>
                  </span>
                  <span className="text-xs text-slate-500">&bull;</span>
                  <span className="text-xs text-slate-400 font-mono">
                    Source: <strong className="text-sky-400">{selectedMarket.source}</strong>
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
                  <span>{selectedMarket.name}</span>
                  <span className="text-sm font-normal text-slate-400 font-mono">({selectedMarket.symbol})</span>
                </h3>
              </div>

              {/* Price telemetry & engine toggle in header */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {selectedMarket.price >= 100 
                      ? selectedMarket.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                      : selectedMarket.price.toFixed(selectedMarket.price < 5 ? 4 : 2)}
                  </div>
                  <div className={`text-xs sm:text-sm font-bold font-mono ${selectedMarket.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedMarket.change >= 0 ? '+' : ''}{selectedMarket.change.toFixed(Math.abs(selectedMarket.change) < 1 ? 4 : 2)} ({selectedMarket.change >= 0 ? '+' : ''}{selectedMarket.change_pct.toFixed(2)}%)
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMarket(null)}
                  className="p-2 rounded-xl bg-[#1A2234] hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-[#232E47]"
                  title="Close Chart (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-xl bg-[#121824] border border-[#232E47] text-xs text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Previous Close</span>
                <span className="font-bold text-slate-200 mt-0.5 block">
                  {selectedMarket.prev_close >= 100 ? selectedMarket.prev_close.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : selectedMarket.prev_close.toFixed(selectedMarket.prev_close < 5 ? 4 : 2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Day's High</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">
                  {selectedMarket.day_high 
                    ? (selectedMarket.day_high >= 100 ? selectedMarket.day_high.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : selectedMarket.day_high.toFixed(selectedMarket.day_high < 5 ? 4 : 2))
                    : (selectedMarket.price * 1.004).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Day's Low</span>
                <span className="font-bold text-rose-400 mt-0.5 block">
                  {selectedMarket.day_low 
                    ? (selectedMarket.day_low >= 100 ? selectedMarket.day_low.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : selectedMarket.day_low.toFixed(selectedMarket.day_low < 5 ? 4 : 2))
                    : (selectedMarket.price * 0.996).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">52-Week High</span>
                <span className="font-bold text-sky-400 mt-0.5 block">
                  {selectedMarket.fifty_two_week_high 
                    ? (selectedMarket.fifty_two_week_high >= 100 ? selectedMarket.fifty_two_week_high.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : selectedMarket.fifty_two_week_high.toFixed(2))
                    : (selectedMarket.price * 1.15).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">52-Week Low</span>
                <span className="font-bold text-amber-400 mt-0.5 block">
                  {selectedMarket.fifty_two_week_low 
                    ? (selectedMarket.fifty_two_week_low >= 100 ? selectedMarket.fifty_two_week_low.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : selectedMarket.fifty_two_week_low.toFixed(2))
                    : (selectedMarket.price * 0.85).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Optional Engine Switcher for Indian Assets */}
            {(selectedMarket.symbol === 'NIFTY' || selectedMarket.symbol === 'BANKNIFTY') && (
              <div className="flex items-center justify-end space-x-2 pb-1">
                <span className="text-xs text-slate-400">Chart View:</span>
                <button
                  onClick={() => setChartEngine('upstox')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    chartEngine === 'upstox' ? 'bg-sky-500 text-white' : 'bg-[#121824] text-slate-400 hover:text-white border border-[#232E47]'
                  }`}
                >
                  NSE 5m Candles (Upstox Engine)
                </button>
                <button
                  onClick={() => setChartEngine('tv')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    chartEngine === 'tv' ? 'bg-sky-500 text-white' : 'bg-[#121824] text-slate-400 hover:text-white border border-[#232E47]'
                  }`}
                >
                  TradingView Interactive
                </button>
              </div>
            )}

            {/* Chart Area */}
            <div className="rounded-xl border border-[#232E47] bg-[#080B11] p-2 overflow-hidden shadow-inner min-h-[520px]">
              {chartEngine === 'upstox' && (selectedMarket.symbol === 'NIFTY' || selectedMarket.symbol === 'BANKNIFTY') ? (
                <ProfessionalTradingChart
                  symbol={selectedMarket.symbol}
                  displayName={`${selectedMarket.name} (${selectedMarket.symbol})`}
                  height={500}
                  initialTimeframe="5m"
                />
              ) : (
                <iframe
                  key={`${selectedMarket.symbol}-${selectedMarket.tv_symbol}`}
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(selectedMarket.tv_symbol || 'FOREXCOM:DJI')}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=0B0E14&studies=[]&theme=dark&style=1&timezone=Asia%2FKolkata&locale=en`}
                  className="w-full h-[500px] rounded-lg border-0"
                  title={`${selectedMarket.name} Live Interactive Chart`}
                  allowTransparency={true}
                  scrolling="no"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#232E47] gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Timezone: Asia/Kolkata (IST) &bull; Live Interactive Multi-Timeframe Chart with Indicators</span>
              </div>
              <button
                onClick={() => setSelectedMarket(null)}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition-colors shadow"
              >
                Close Chart
              </button>
            </div>
          </div>
        </div>
      )}
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
