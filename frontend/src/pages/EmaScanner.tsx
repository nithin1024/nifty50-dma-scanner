import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Search, 
  RefreshCw, 
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { fetchEmaScanner } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

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

export const EmaScanner: React.FC<{ onSelectStock?: (symbol: string) => void }> = ({ onSelectStock }) => {
  const { language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGroup, setActiveGroup] = useState<string>('ALL');
  const [rsiMin, setRsiMin] = useState<number>(40.0);
  const [rsiMax, setRsiMax] = useState<number>(60.0);

  const loadData = async (min = rsiMin, max = rsiMax) => {
    try {
      setLoading(true);
      const res = await fetchEmaScanner(min, max);
      setData(res);
    } catch (err) {
      console.error('Failed to load EMA scanner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(rsiMin, rsiMax);
    setRefreshing(false);
  };

  const handleApplyRsiFilter = () => {
    loadData(rsiMin, rsiMax);
  };

  const records: EmaRecord[] = data?.all_results || [];

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

      {/* 2. Controls & Configurable RSI Corridor Toolbar */}
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

      {/* 3. Main EMA + RSI Scanner Output Table */}
      {loading ? (
        <div className="bg-[#121824] rounded-xl border border-[#232E47] p-12 text-center">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
          <div className="text-sm font-semibold text-white">Calculating EMA 9, EMA 21, and RSI 14 Series...</div>
          <div className="text-xs text-slate-400 mt-1">Analyzing all 50 constituents for crossovers and consolidation zones.</div>
        </div>
      ) : (
        <div className="bg-[#121824] rounded-xl border border-[#232E47] overflow-hidden shadow-lg">
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
                  return (
                    <tr 
                      key={item.symbol}
                      onClick={() => onSelectStock && onSelectStock(item.symbol)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Stock Symbol & Company */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white group-hover:text-amber-400 transition-colors font-mono">
                            {item.symbol}
                          </span>
                          {item.satisfies_ema_and_rsi && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Satisfies EMA Bullish + RSI 40-60" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{item.company_name}</div>
                      </td>

                      {/* Close Price */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                        ₹{item.close.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* EMA 9 */}
                      <td className="py-3 px-3 text-right font-mono text-sky-400 whitespace-nowrap">
                        ₹{item.ema_9.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* EMA 21 */}
                      <td className="py-3 px-3 text-right font-mono text-purple-400 whitespace-nowrap">
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
