import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw, X, ExternalLink, LineChart } from 'lucide-react';
import { ProfessionalTradingChart } from '../components/ProfessionalTradingChart';

const API_BASE = '/api/v1';

interface StockRecord {
  symbol: string;
  name: string;
  sector: string;
  mcap_category: string;
  ltp: number;
  prev_close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  avg_vol_20: number;
  vwap: number;
  mcap_cr: number;
  high_52w: number;
  low_52w: number;
  pe: number;
  pb: number;
  roe: number;
  roce: number;
  opm: number;
  debt_to_equity?: number;
  rsi_14: number;
  ema_9: number;
  ema_21: number;
  sma_20: number;
  sma_50: number;
  sma_100: number;
  sma_200: number;
  macd_signal: string;
  dividend_yield: number;
  promoter_holding: number;
  institutional_holding: number;
  change: number;
  change_pct: number;
  rvol: number;
  dist_52w_high: number;
  dist_52w_low: number;
  above_vwap: boolean;
  above_sma20: boolean;
  above_sma50: boolean;
  above_sma100: boolean;
  above_sma200: boolean;
  above_all_4_smas: boolean;
  ema_crossover: string;
  status: string;
  timestamp: string;
}

interface SectorPerf {
  sector: string;
  total_stocks: number;
  advancing: number;
  declining: number;
  unchanged: number;
  sector_average_change_pct: number;
  total_traded_volume: number;
  relative_volume: number;
  top_gainers: string[];
  top_losers: string[];
  dma_participation_pct: number;
  ema_participation_pct: number;
  trend: string;
}

const SCREENER_OPTIONS = [
  { value: '', label: 'All Stocks' },
  { value: 'HIGH_VOLUME', label: '🔥 High Volume' },
  { value: 'LOW_VOLUME', label: '📉 Low Volume' },
  { value: 'RVOL_BREAKOUT', label: '🚀 RVOL Breakout' },
  { value: 'ABOVE_VWAP', label: '⬆️ Above VWAP' },
  { value: 'BELOW_VWAP', label: '⬇️ Below VWAP' },
  { value: 'ABOVE_ALL_4_SMAS', label: '💪 Above All 4 SMAs' },
  { value: 'ABOVE_SMA200', label: '📊 Above SMA 200' },
  { value: 'BULLISH_EMA_CROSSOVER', label: '🟢 Bullish EMA Cross' },
  { value: 'BEARISH_EMA_CROSSOVER', label: '🔴 Bearish EMA Cross' },
  { value: 'RSI_ABOVE_70', label: '⚠️ RSI > 70 (Overbought)' },
  { value: 'RSI_BELOW_30', label: '💎 RSI < 30 (Oversold)' },
  { value: '52W_HIGH_BREAKOUT', label: '🏔️ 52W High Breakout' },
];

const MCAP_OPTIONS = [
  { value: '', label: 'All Caps' },
  { value: 'Large Cap', label: 'Large Cap' },
  { value: 'Mid Cap', label: 'Mid Cap' },
  { value: 'Small Cap', label: 'Small Cap' },
];

interface AllStocksDashboardProps {
  onSelectStock?: (symbol: string) => void;
}

export const AllStocksDashboard: React.FC<AllStocksDashboardProps> = ({ onSelectStock }) => {
  const [stocks, setStocks] = useState<StockRecord[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [sectorPerf, setSectorPerf] = useState<SectorPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedMcap, setSelectedMcap] = useState('');
  const [selectedScreener, setSelectedScreener] = useState('');
  const [activeView, setActiveView] = useState<'stocks' | 'sectors'>('stocks');
  const [sortField, setSortField] = useState<string>('change_pct');
  const [sortAsc, setSortAsc] = useState(false);
  const [previewStock, setPreviewStock] = useState<StockRecord | null>(null);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSector) params.set('sector', selectedSector);
      if (searchQuery) params.set('search', searchQuery);
      if (selectedMcap) params.set('mcap_category', selectedMcap);
      if (selectedScreener) params.set('screener_filter', selectedScreener);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE}/stocks-universe${qs}`);
      if (res.ok) setStocks(await res.json());
    } catch (err) { console.error('Failed to fetch stocks:', err); }
    setLoading(false);
  }, [selectedSector, searchQuery, selectedMcap, selectedScreener]);

  useEffect(() => {
    fetchStocks();
    fetch(`${API_BASE}/stocks-universe/sectors`).then(r => r.json()).then(setSectors).catch(() => {});
    fetch(`${API_BASE}/stocks-universe/sectors/performance`).then(r => r.json()).then(setSectorPerf).catch(() => {});
  }, [fetchStocks]);

  const sortedStocks = useMemo(() => {
    const copy = [...stocks];
    copy.sort((a: any, b: any) => {
      const va = a[sortField] ?? 0;
      const vb = b[sortField] ?? 0;
      return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return copy;
  }, [stocks, sortField, sortAsc]);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const advCount = stocks.filter(s => s.change > 0).length;
  const decCount = stocks.filter(s => s.change < 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-cyan-400" />
            ALL STOCKS — NSE EQUITY UNIVERSE
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            22 Sectors • Technical & Volume Screener • Company Fundamentals • Sector Performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveView('stocks')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${activeView === 'stocks' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'text-slate-400 border-slate-700 hover:text-white'}`}>
            📊 Stocks
          </button>
          <button onClick={() => setActiveView('sectors')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${activeView === 'sectors' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'text-slate-400 border-slate-700 hover:text-white'}`}>
            🏭 Sector Performance
          </button>
          <button onClick={fetchStocks} className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Breadth Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-[#121824] border border-[#232E47] p-3">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Total Stocks</div>
          <div className="text-xl font-bold text-white mt-1">{stocks.length}</div>
        </div>
        <div className="rounded-xl bg-[#121824] border border-emerald-500/20 p-3">
          <div className="text-[10px] uppercase text-emerald-500 font-semibold flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Advancing</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{advCount}</div>
        </div>
        <div className="rounded-xl bg-[#121824] border border-rose-500/20 p-3">
          <div className="text-[10px] uppercase text-rose-500 font-semibold flex items-center gap-1"><ArrowDownRight className="w-3 h-3" /> Declining</div>
          <div className="text-xl font-bold text-rose-400 mt-1">{decCount}</div>
        </div>
        <div className="rounded-xl bg-[#121824] border border-[#232E47] p-3">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Sectors</div>
          <div className="text-xl font-bold text-sky-400 mt-1">{sectors.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-[#121824] border border-[#232E47] p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search symbol or company name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0B0E14] border border-[#232E47] text-sm text-white placeholder-slate-500 focus:border-sky-500/50 focus:outline-none"
            />
          </div>
          <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className="px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#232E47] text-xs text-white min-w-[150px]">
            <option value="">All Sectors</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={selectedMcap} onChange={(e) => setSelectedMcap(e.target.value)} className="px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#232E47] text-xs text-white">
            {MCAP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={selectedScreener} onChange={(e) => setSelectedScreener(e.target.value)} className="px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#232E47] text-xs text-white min-w-[180px]">
            {SCREENER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {activeView === 'stocks' && (
        <div className="rounded-xl bg-[#121824] border border-[#232E47] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
              <span className="ml-3 text-slate-400 text-sm">Loading stocks...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0B0E14] border-b border-[#232E47] text-slate-400 font-semibold">
                    {[
                      { key: 'symbol', label: 'Symbol' },
                      { key: 'sector', label: 'Sector' },
                      { key: 'ltp', label: 'LTP' },
                      { key: 'change_pct', label: 'Change %' },
                      { key: 'volume', label: 'Volume' },
                      { key: 'rvol', label: 'RVOL' },
                      { key: 'vwap', label: 'VWAP' },
                      { key: 'rsi_14', label: 'RSI' },
                      { key: 'ema_crossover', label: 'EMA Cross' },
                      { key: 'macd_signal', label: 'MACD' },
                      { key: 'mcap_cr', label: 'MCap (Cr)' },
                      { key: 'pe', label: 'P/E' },
                      { key: 'roe', label: 'ROE %' },
                      { key: 'actions', label: 'Chart & Live Volume' },
                    ].map(col => (
                      <th key={col.key} className="px-3 py-2 text-left cursor-pointer hover:text-sky-400 whitespace-nowrap select-none" onClick={() => col.key !== 'actions' && toggleSort(col.key)}>
                        {col.label} {sortField === col.key ? (sortAsc ? '↑' : '↓') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedStocks.map((stock) => {
                    const isUp = stock.change >= 0;
                    return (
                      <tr 
                        key={stock.symbol} 
                        onClick={() => setPreviewStock(stock)}
                        className="border-b border-[#232E47]/50 hover:bg-[#1A2234] cursor-pointer transition-colors group"
                        title="Click to inspect live candlestick chart & volume bar graph"
                      >
                        <td className="px-3 py-2">
                          <div className="font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                            <span>{stock.symbol}</span>
                            <LineChart className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                          </div>
                          <div className="text-[10px] text-slate-500 max-w-[120px] truncate">{stock.name}</div>
                        </td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{stock.sector}</td>
                        <td className="px-3 py-2 font-mono font-semibold text-white">₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={`px-3 py-2 font-mono font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isUp ? '+' : ''}{stock.change_pct.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-300">
                          <div>{(stock.volume / 100000).toFixed(1)}L</div>
                          {/* Live mini volume indicator */}
                          <div className="w-16 bg-[#0B0E14] rounded-full h-1 mt-0.5 overflow-hidden">
                            <div className={`h-1 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, Math.round(stock.rvol * 50))}%` }}></div>
                          </div>
                        </td>
                        <td className={`px-3 py-2 font-mono font-bold ${stock.rvol > 1.5 ? 'text-amber-400' : stock.rvol > 1.0 ? 'text-sky-400' : 'text-slate-400'}`}>
                          {stock.rvol.toFixed(2)}x
                        </td>
                        <td className={`px-3 py-2 font-mono ${stock.above_vwap ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ₹{stock.vwap.toFixed(1)}
                        </td>
                        <td className={`px-3 py-2 font-mono font-bold ${stock.rsi_14 > 70 ? 'text-rose-400' : stock.rsi_14 < 30 ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {stock.rsi_14.toFixed(1)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${stock.ema_crossover === 'BULLISH_CROSSOVER' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {stock.ema_crossover === 'BULLISH_CROSSOVER' ? '🟢 BULL' : '🔴 BEAR'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${stock.macd_signal === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-400' : stock.macd_signal === 'BEARISH' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-400'}`}>
                            {stock.macd_signal}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-300">{(stock.mcap_cr / 100).toFixed(0)}K</td>
                        <td className="px-3 py-2 font-mono text-slate-300">{stock.pe.toFixed(1)}</td>
                        <td className="px-3 py-2 font-mono text-sky-400">{stock.roe.toFixed(1)}%</td>
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setPreviewStock(stock)}
                            className="px-2.5 py-1 rounded bg-sky-500/15 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-semibold text-[10px] flex items-center gap-1 transition-colors"
                          >
                            <LineChart className="w-3 h-3" />
                            Chart &amp; Vol
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {sortedStocks.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">No stocks match the current filters.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Interactive Stock Chart & Volume Modal Drawer */}
      {previewStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0B0E14] border border-[#232E47] p-5 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#232E47] pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-black text-white">{previewStock.symbol}</h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
                    {previewStock.sector}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {previewStock.mcap_category}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{previewStock.name}</div>
              </div>

              <div className="flex items-center space-x-2">
                {onSelectStock && (
                  <button
                    onClick={() => {
                      onSelectStock(previewStock.symbol);
                      setPreviewStock(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Open in primary Stock Details trading page"
                  >
                    <span>Full Screen Chart</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setPreviewStock(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#121824] border border-[#232E47]">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">LTP</div>
                <div className="text-base font-bold font-mono text-white mt-0.5">₹{previewStock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className={`text-[10px] font-bold ${previewStock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {previewStock.change >= 0 ? '+' : ''}{previewStock.change_pct.toFixed(2)}%
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#121824] border border-[#232E47]">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Traded Volume</div>
                <div className="text-base font-bold font-mono text-white mt-0.5">{(previewStock.volume / 100000).toFixed(2)} Lakhs</div>
                <div className="text-[10px] text-slate-400 font-mono">Avg: {(previewStock.avg_vol_20 / 100000).toFixed(2)}L</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#121824] border border-[#232E47]">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Relative Volume (RVOL)</div>
                <div className={`text-base font-bold font-mono mt-0.5 ${previewStock.rvol >= 1.5 ? 'text-amber-400' : previewStock.rvol >= 1.0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {previewStock.rvol.toFixed(2)}x
                </div>
                <div className="text-[10px] font-semibold text-slate-400">{previewStock.rvol >= 1.5 ? '🔥 Breakout Vol' : previewStock.rvol < 0.8 ? 'Contraction' : 'Normal'}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#121824] border border-[#232E47]">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">VWAP &amp; Position</div>
                <div className={`text-base font-bold font-mono mt-0.5 ${previewStock.above_vwap ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ₹{previewStock.vwap.toFixed(1)}
                </div>
                <div className={`text-[10px] font-bold ${previewStock.above_vwap ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {previewStock.above_vwap ? '▲ Above VWAP' : '▼ Below VWAP'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#121824] border border-[#232E47]">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">52-Week Range</div>
                <div className="text-xs font-bold font-mono text-white mt-0.5">₹{previewStock.low_52w} - ₹{previewStock.high_52w}</div>
                <div className="text-[10px] text-slate-400">{previewStock.dist_52w_high.toFixed(1)}% from High</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#121824] border border-[#232E47]">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Valuation (P/E &amp; ROE)</div>
                <div className="text-base font-bold font-mono text-sky-400 mt-0.5">{previewStock.pe.toFixed(1)}x P/E</div>
                <div className="text-[10px] text-emerald-400 font-mono">ROE: {previewStock.roe.toFixed(1)}%</div>
              </div>
            </div>

            {/* Interactive Candlestick Chart & Volume Histogram */}
            <div className="rounded-xl border border-[#232E47] bg-[#121824] p-2 overflow-hidden">
              <ProfessionalTradingChart 
                symbol={previewStock.symbol}
                displayName={`${previewStock.symbol} • ${previewStock.name}`}
                initialTimeframe="15m"
                height={420}
              />
            </div>

            {/* Fundamentals & Technicals Details Footer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Moving Averages</div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between"><span>SMA 20:</span> <span className="text-white">₹{previewStock.sma_20}</span></div>
                  <div className="flex justify-between"><span>SMA 50:</span> <span className="text-white">₹{previewStock.sma_50}</span></div>
                  <div className="flex justify-between"><span>SMA 200:</span> <span className="text-white">₹{previewStock.sma_200}</span></div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Momentum &amp; EMA</div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between"><span>EMA 9/21:</span> <span className={previewStock.ema_crossover === 'BULLISH_CROSSOVER' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{previewStock.ema_crossover === 'BULLISH_CROSSOVER' ? 'BULLISH' : 'BEARISH'}</span></div>
                  <div className="flex justify-between"><span>Wilder RSI (14):</span> <span className={previewStock.rsi_14 > 70 ? 'text-rose-400 font-bold' : previewStock.rsi_14 < 30 ? 'text-emerald-400 font-bold' : 'text-sky-400'}>{previewStock.rsi_14}</span></div>
                  <div className="flex justify-between"><span>MACD Signal:</span> <span className="text-white">{previewStock.macd_signal}</span></div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Financial Ratios</div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between"><span>ROCE:</span> <span className="text-emerald-400">{previewStock.roce}%</span></div>
                  <div className="flex justify-between"><span>Operating Margin:</span> <span className="text-white">{previewStock.opm}%</span></div>
                  <div className="flex justify-between"><span>Debt/Equity:</span> <span className="text-white">{previewStock.debt_to_equity}</span></div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Ownership &amp; Yield</div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between"><span>Institutional:</span> <span className="text-sky-400">{previewStock.institutional_holding}%</span></div>
                  <div className="flex justify-between"><span>Promoter:</span> <span className="text-white">{previewStock.promoter_holding}%</span></div>
                  <div className="flex justify-between"><span>Dividend Yield:</span> <span className="text-emerald-400">{previewStock.dividend_yield}%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'sectors' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Sector Performance Comparison Dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectorPerf.map(sp => (
              <div key={sp.sector} className="rounded-xl bg-[#121824] border border-[#232E47] p-4 hover:border-sky-500/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-white text-sm">{sp.sector}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sp.trend === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {sp.trend === 'BULLISH' ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                    {sp.trend}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Avg Chg</div>
                    <div className={`font-bold font-mono text-sm ${sp.sector_average_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sp.sector_average_change_pct >= 0 ? '+' : ''}{sp.sector_average_change_pct}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Adv/Dec</div>
                    <div className="font-bold text-sm">
                      <span className="text-emerald-400">{sp.advancing}</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-rose-400">{sp.declining}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">RVOL</div>
                    <div className={`font-bold font-mono text-sm ${sp.relative_volume > 1.3 ? 'text-amber-400' : 'text-slate-300'}`}>{sp.relative_volume}x</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center mb-3">
                  <div>
                    <div className="text-[10px] text-slate-500">DMA 50 Participation</div>
                    <div className="w-full bg-[#0B0E14] rounded-full h-1.5 mt-1">
                      <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${sp.dma_participation_pct}%` }}></div>
                    </div>
                    <div className="text-[10px] font-mono text-sky-400 mt-0.5">{sp.dma_participation_pct}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">EMA Bullish</div>
                    <div className="w-full bg-[#0B0E14] rounded-full h-1.5 mt-1">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${sp.ema_participation_pct}%` }}></div>
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400 mt-0.5">{sp.ema_participation_pct}%</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <div>
                    <span className="text-slate-500">Top: </span>
                    <span className="text-emerald-400 font-mono">{sp.top_gainers.join(', ') || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Lag: </span>
                    <span className="text-rose-400 font-mono">{sp.top_losers.join(', ') || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
