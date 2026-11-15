import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Flame, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  RefreshCw, 
  BarChart3, 
  AlertCircle,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { 
  fetchFoUniverse, 
  fetchOptionChain, 
  fetchExpiries, 
  fetchStrategyPayoff, 
  fetchOptionsAlerts, 
  fetchDataQualityReport 
} from '../services/api';

type OptionsTab = 
  | 'CHAIN'
  | 'OI_PCR'
  | 'MAX_PAIN'
  | 'SUPPORT_RESISTANCE'
  | 'GREEKS_VOLATILITY'
  | 'STRATEGY_SIMULATOR'
  | 'REGIME_PRICE_ACTION'
  | 'ALERTS_MONITOR';

const displayMetric = (value: unknown, suffix = ''): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  return `${typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : String(value)}${suffix}`;
};

export const NiftyLiveOptionChainDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OptionsTab>('CHAIN');
  const [symbol, setSymbol] = useState<string>('NIFTY');
  const [strikeRange, setStrikeRange] = useState<number>(10);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  
  // Data states
  const [universe, setUniverse] = useState<any[]>([]);
  const [expiries, setExpiries] = useState<string[]>([]);
  const [expiriesForSymbol, setExpiriesForSymbol] = useState<string>('');
  const [chainData, setChainData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [feedStatus, setFeedStatus] = useState<string>('WAITING');
  const [chainError, setChainError] = useState<string | null>(null);
  const feedSocketRef = useRef<WebSocket | null>(null);
  const chainRequestRef = useRef(0);
  
  // Strategy payoff state
  const [selectedStrategy, setSelectedStrategy] = useState<string>('BULL_CALL_SPREAD');
  const [strategyResult, setStrategyResult] = useState<any>(null);
  const [strategyError, setStrategyError] = useState<string | null>(null);

  // Market regime state
  const [marketRegime, setMarketRegime] = useState<any>(null);

  // Alerts & Monitor states
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dataQuality, setDataQuality] = useState<any>(null);

  // Initial load: F&O Universe
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/options-feed`);
    feedSocketRef.current = socket;
    socket.onmessage = event => {
      let message: any;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.type === 'status') setFeedStatus(message.status || 'WAITING');
      if (message.type !== 'market_data') return;
      if (message.is_live_update) setFeedStatus('LIVE');
      setChainData((previous: any) => {
        if (!previous?.rows) return previous;
        let callOiDelta = 0, putOiDelta = 0, callVolumeDelta = 0, putVolumeDelta = 0;
        const rows = previous.rows.map((row: any) => {
          const next = { ...row };
          for (const side of ['ce', 'pe']) {
            const tick = message.ticks?.[row[side]?.instrument_key];
            if (!tick) continue;
            const oldOi = Number(next[side].oi || 0);
            const oldVolume = Number(next[side].volume || 0);
            if (tick.oi != null) {
              const delta = Number(tick.oi) - oldOi;
              if (side === 'ce') callOiDelta += delta; else putOiDelta += delta;
            }
            if (tick.volume != null) {
              const delta = Number(tick.volume) - oldVolume;
              if (side === 'ce') callVolumeDelta += delta; else putVolumeDelta += delta;
            }
            next[side] = { ...next[side], ltp: tick.ltp ?? next[side].ltp,
              change: tick.close_price != null && tick.ltp != null ? tick.ltp - tick.close_price : next[side].change,
              change_pct: tick.close_price ? ((tick.ltp - tick.close_price) / tick.close_price) * 100 : next[side].change_pct,
              volume: tick.volume ?? next[side].volume, oi: tick.oi ?? next[side].oi,
              oi_change: tick.oi != null ? Number(next[side].oi_change || 0) + (Number(tick.oi) - oldOi) : next[side].oi_change,
              iv: tick.iv ?? next[side].iv, ...tick.greeks };
          }
          return next;
        });
        const calls = Number(previous.totals?.total_call_oi || 0) + callOiDelta;
        const puts = Number(previous.totals?.total_put_oi || 0) + putOiDelta;
        const callVol = Number(previous.totals?.total_call_volume || 0) + callVolumeDelta;
        const putVol = Number(previous.totals?.total_put_volume || 0) + putVolumeDelta;
        const callOiChange = Number(previous.totals?.total_call_oi_change || 0) + callOiDelta;
        const putOiChange = Number(previous.totals?.total_put_oi_change || 0) + putOiDelta;
        return { ...previous, rows, totals: { ...previous.totals, total_call_oi: calls, total_put_oi: puts,
          total_call_volume: callVol, total_put_volume: putVol,
          total_call_oi_change: callOiChange, total_put_oi_change: putOiChange,
          oi_pcr: calls ? puts / calls : null,
          vol_pcr: callVol ? putVol / callVol : null,
          oi_change_pcr: callOiChange ? putOiChange / callOiChange : null } };
      });
    };
    const refreshStatus = () => fetch('/api/v1/options/feed-status').then(r => r.json())
      .then(status => setFeedStatus(status.status || 'WAITING')).catch(() => setFeedStatus('DISCONNECTED'));
    refreshStatus();
    const interval = window.setInterval(refreshStatus, 5000);
    return () => { window.clearInterval(interval); socket.close(); feedSocketRef.current = null; };
  }, []);

  useEffect(() => {
    fetchFoUniverse().then(res => {
      setUniverse(res.universe || []);
    }).catch(err => console.error('Failed to load F&O Universe:', err));

    fetchOptionsAlerts().then(res => {
      setAlerts(res.alerts || []);
    }).catch(() => {});

    fetchDataQualityReport().then(res => {
      setDataQuality(res);
    }).catch(() => {});
  }, []);

  // When symbol changes, load valid expiries
  useEffect(() => {
    let cancelled = false;
    chainRequestRef.current += 1;
    setExpiriesForSymbol('');
    setExpiries([]);
    setSelectedExpiry('');
    setChainData(null);
    setChainError(null);
    setLoading(true);
    fetchExpiries(symbol).then(res => {
      if (cancelled) return;
      const validExps = Array.isArray(res.expiries) ? res.expiries : [];
      setExpiries(validExps);
      setSelectedExpiry(validExps[0] || '');
      setExpiriesForSymbol(symbol);
      if (!validExps.length) {
        setChainError('Upstox did not return a valid option expiry for this underlying.');
        setLoading(false);
      }
    }).catch(err => {
      if (cancelled) return;
      setChainError(err instanceof Error ? err.message : 'Unable to retrieve valid option expiries.');
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [symbol]);

  // Load option chain when symbol, strike range, or expiry changes
  const loadOptionChain = async () => {
    const requestId = ++chainRequestRef.current;
    if (expiriesForSymbol !== symbol || !selectedExpiry) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setLoading(true);
    setChainError(null);
    try {
      const data = await fetchOptionChain(symbol, strikeRange, selectedExpiry || undefined);
      if (requestId !== chainRequestRef.current) return;
      setChainData(data);
      const instrumentKeys = (data.rows || []).flatMap((row: any) => [row.ce?.instrument_key, row.pe?.instrument_key]).filter(Boolean);
      if (feedSocketRef.current?.readyState === WebSocket.OPEN) {
        feedSocketRef.current.send(JSON.stringify({ mode: 'full', instrumentKeys }));
      }
      
      setMarketRegime(null);
    } catch (err) {
      if (requestId !== chainRequestRef.current) return;
      console.error('Error fetching option chain:', err);
      setChainError(err instanceof Error ? err.message : 'Unable to retrieve verified Upstox option-chain data.');
    } finally {
      if (requestId === chainRequestRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (expiriesForSymbol !== symbol || !selectedExpiry) return;
    loadOptionChain();
  }, [symbol, strikeRange, selectedExpiry, expiriesForSymbol]);

  // Strategy payoff calculation
  useEffect(() => {
    if (activeTab === 'STRATEGY_SIMULATOR' && chainData) {
      setStrategyError(null);
      fetchStrategyPayoff(selectedStrategy, symbol, selectedExpiry || chainData.expiry)
        .then(res => { setStrategyResult(res); setStrategyError(null); })
        .catch(err => { setStrategyResult(null); setStrategyError(err instanceof Error ? err.message : 'Current premiums are unavailable.'); });
    }
  }, [selectedStrategy, activeTab, chainData, symbol, selectedExpiry]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (expiriesForSymbol === symbol && selectedExpiry) {
      void loadOptionChain();
      return;
    }
    setLoading(true);
    setChainError(null);
    fetchExpiries(symbol).then(res => {
      const validExps = Array.isArray(res.expiries) ? res.expiries : [];
      setExpiries(validExps);
      setSelectedExpiry(validExps[0] || '');
      setExpiriesForSymbol(symbol);
      if (!validExps.length) setChainError('Upstox did not return a valid option expiry for this underlying.');
    }).catch(err => {
      setChainError(err instanceof Error ? err.message : 'Unable to retrieve valid option expiries.');
    }).finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  };

  const navItems: { id: OptionsTab; label: string; icon: any }[] = [
    { id: 'CHAIN', label: '1. Live Option Chain', icon: <Layers className="w-4 h-4" /> },
    { id: 'OI_PCR', label: '2. OI & PCR Analysis', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'MAX_PAIN', label: '3. Max Pain Engine', icon: <Flame className="w-4 h-4" /> },
    { id: 'SUPPORT_RESISTANCE', label: '4. Support & Resistance', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'GREEKS_VOLATILITY', label: '5. Greeks & Volatility', icon: <Activity className="w-4 h-4" /> },
    { id: 'STRATEGY_SIMULATOR', label: '6. Strategy Simulator', icon: <PieChart className="w-4 h-4" /> },
    { id: 'REGIME_PRICE_ACTION', label: '7. Regime & VWAP', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'ALERTS_MONITOR', label: '8. Monitor & Alerts', icon: <AlertCircle className="w-4 h-4" /> }
  ];

  const foSymbols = universe.filter(u => u.is_fo_eligible || u.is_index).map(u => u.symbol);

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* TOP INSTITUTIONAL COMMAND BAR */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Symbol Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">Underlying:</span>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-[#121824] border border-[#232E47] text-white font-mono font-bold text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value="NIFTY">NIFTY 50 INDEX</option>
              <option value="BANKNIFTY">BANK NIFTY INDEX</option>
              {foSymbols.filter(s => s !== 'NIFTY' && s !== 'BANKNIFTY').map(sym => (
                <option key={sym} value={sym}>{sym}</option>
              ))}
            </select>
          </div>

          {/* Expiry Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">Expiry:</span>
            <select
              value={selectedExpiry}
              onChange={(e) => setSelectedExpiry(e.target.value)}
              className="bg-[#121824] border border-[#232E47] text-white font-mono font-bold text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
            >
              {expiries.map(exp => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>

          {/* Strike Range Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">Strikes:</span>
            <select
              value={strikeRange}
              onChange={(e) => setStrikeRange(Number(e.target.value))}
              className="bg-[#121824] border border-[#232E47] text-white font-mono font-bold text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value={5}>ATM ±5</option>
              <option value={10}>ATM ±10</option>
              <option value={15}>ATM ±15</option>
              <option value={20}>ATM ±20</option>
            </select>
          </div>
        </div>

        {/* Live Feed Status & Quick Stats */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <div className="px-3 py-1 rounded-lg bg-[#121824] border border-[#232E47] flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${feedStatus === 'LIVE' ? 'bg-emerald-400 animate-pulse' : feedStatus === 'STALE' ? 'bg-amber-400' : 'bg-slate-500'}`} />
            <span className="text-slate-300">
              {feedStatus}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-sky-400 font-bold">Protobuf</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg bg-[#121824] hover:bg-[#1a2334] text-slate-300 border border-[#232E47] transition-all"
            title="Refresh Option Chain Snapshot"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && !chainData && (
        <div className="p-8 rounded-xl bg-[#0B0E14] border border-[#232E47] flex items-center justify-center space-x-2 text-sky-400 font-mono text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
          <span>Ingesting Live Option Chain &amp; Greeks for {symbol}...</span>
        </div>
      )}
      {chainError && <div role="status" className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/40 text-amber-200 text-sm">{chainError}. {chainData ? 'The last verified option-chain snapshot remains visible; live quotes need successful Upstox authentication.' : 'Live quotes are not available until Upstox authentication succeeds.'}</div>}

      {/* ========================================================================= */}
      {/* KEY OPTION CHAIN METRICS BAR (verified spot, ATM, PCR and Max Pain) */}
      {/* ========================================================================= */}
      {chainData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Spot Price */}
          <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#232E47]">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">{symbol} Spot Price</span>
            <div className="text-lg sm:text-xl font-black text-white font-mono mt-0.5">
              ₹{chainData.spot_price?.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Lot Size: {chainData.lot_size}</span>
          </div>

          {/* ATM Strike */}
          <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#232E47]">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">ATM Strike</span>
            <div className="text-lg sm:text-xl font-black text-amber-300 font-mono mt-0.5">
              {chainData.atm_strike?.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Step: {chainData.strike_step} pts</span>
          </div>

          {/* OI PCR */}
          <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#232E47]">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Total OI PCR</span>
            <div className={`text-lg sm:text-xl font-black font-mono mt-0.5 ${
              chainData.totals?.oi_pcr >= 1.0 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {chainData.totals?.oi_pcr}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Vol PCR: {chainData.totals?.vol_pcr}
            </span>
          </div>

          {/* Max Pain */}
          <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#232E47]">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Max Pain Strike</span>
            <div className="text-lg sm:text-xl font-black text-rose-400 font-mono mt-0.5">
              {chainData.max_pain?.max_pain_strike?.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Expiry Scenario Minimum</span>
          </div>

          {/* Net GEX */}
          <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#232E47]">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Net Gamma Exposure</span>
            <div className={`text-lg sm:text-xl font-black font-mono mt-0.5 ${
              chainData.exposures?.net_gex_crores >= 0 ? 'text-sky-400' : 'text-rose-400'
            }`}>
              N/A
            </div>
            <span className="text-[10px] text-slate-400 font-mono truncate block" title={chainData.exposures?.gex_regime}>
              Not supplied by verified chain fields
            </span>
          </div>

          {/* Strong Support / Resistance */}
          <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#232E47]">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">OI Key Levels</span>
            <div className="text-xs font-mono font-bold text-white mt-1 space-y-0.5">
              <div>S: <span className="text-emerald-400 font-bold">{chainData.support_resistance?.strong_support?.strike}</span></div>
              <div>R: <span className="text-rose-400 font-bold">{chainData.support_resistance?.strong_resistance?.strike}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NAVIGATION MODULE TABS */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#0B0E14] border border-[#232E47]">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === item.id 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-[#121824]'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE OPTION CHAIN TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'CHAIN' && chainData && (
        <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#232E47] gap-2">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>NIFTY Live Option Chain Table &bull; {selectedExpiry} Expiry</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Calls (CE) on Left &bull; Strike Price in Center &bull; Puts (PE) on Right
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40" /> <span className="text-slate-300">ITM</span></span>
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/50" /> <span className="text-amber-300">ATM</span></span>
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-[#0B0E14] border border-[#232E47]" /> <span className="text-slate-400">OTM</span></span>
            </div>
          </div>

          {/* Option Chain Table */}
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs font-mono text-center border-collapse">
              <thead>
                <tr className="bg-[#121824] text-slate-400 border-b border-[#232E47]">
                  <th colSpan={9} className="py-2 px-2 text-emerald-400 uppercase tracking-wider border-r border-[#232E47]">
                    CALLS (CE)
                  </th>
                  <th className="py-2 px-3 text-white uppercase tracking-wider bg-[#171F32]">
                    STRIKE
                  </th>
                  <th colSpan={9} className="py-2 px-2 text-rose-400 uppercase tracking-wider border-l border-[#232E47]">
                    PUTS (PE)
                  </th>
                </tr>
                <tr className="bg-[#0B0E14] text-slate-400 border-b border-[#232E47]/70 text-[10px]">
                  {/* CE Columns */}
                  <th className="py-1 px-1.5 text-left">Buildup</th>
                  <th className="py-1 px-1.5 text-right">Prev OI</th>
                  <th className="py-1 px-1.5 text-right">OI</th>
                  <th className="py-1 px-1.5 text-right">OI Chg</th>
                  <th className="py-1 px-1.5 text-right">Volume</th>
                  <th className="py-1 px-1.5 text-right">IV</th>
                  <th className="py-1 px-1.5 text-right">Delta</th>
                  <th className="py-1 px-1.5 text-right">Prev Close</th>
                  <th className="py-1 px-2 text-right border-r border-[#232E47] text-white">LTP</th>
                  {/* Strike */}
                  <th className="py-1 px-3 bg-[#171F32] text-amber-300 font-bold">Strike</th>
                  {/* PE Columns */}
                  <th className="py-1 px-2 text-left border-l border-[#232E47] text-white">LTP</th>
                  <th className="py-1 px-1.5 text-left">Prev Close</th>
                  <th className="py-1 px-1.5 text-left">Delta</th>
                  <th className="py-1 px-1.5 text-left">IV</th>
                  <th className="py-1 px-1.5 text-left">Volume</th>
                  <th className="py-1 px-1.5 text-left">OI Chg</th>
                  <th className="py-1 px-1.5 text-left">OI</th>
                  <th className="py-1 px-1.5 text-left">Prev OI</th>
                  <th className="py-1 px-1.5 text-right">Buildup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232E47]/40">
                {chainData.rows.map((row: any) => {
                  const isAtm = row.is_atm;
                  const ceItm = row.ce.classification === 'ITM';
                  const peItm = row.pe.classification === 'ITM';

                  return (
                    <tr 
                      key={row.strike_price}
                      className={`hover:bg-[#1a2334] transition-colors ${
                        isAtm ? 'bg-amber-500/10 font-bold' : ''
                      }`}
                    >
                      {/* CE Cells */}
                      <td className={`py-1.5 px-1.5 text-left text-[10px] ${ceItm ? 'bg-emerald-950/20' : ''}`}>
                        <span className={`px-1 py-0.5 rounded ${
                          row.ce.buildup === 'Long Buildup' ? 'bg-emerald-500/20 text-emerald-400' :
                          row.ce.buildup === 'Short Buildup' ? 'bg-rose-500/20 text-rose-400' :
                          'text-slate-400'
                        }`}>
                          {row.ce.buildup}
                        </span>
                      </td>
                      <td className={`py-1.5 px-1.5 text-right text-slate-500 ${ceItm ? 'bg-emerald-950/20' : ''}`}>
                        {displayMetric(row.ce.previous_oi)}
                      </td>
                      <td className={`py-1.5 px-1.5 text-right font-medium text-slate-300 ${ceItm ? 'bg-emerald-950/20' : ''}`}>
                        {displayMetric(row.ce.oi)}
                      </td>
                      <td className={`py-1.5 px-1.5 text-right font-medium ${
                        row.ce.oi_change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      } ${ceItm ? 'bg-emerald-950/20' : ''}`}>
                        {row.ce.oi_change == null ? 'N/A' : `${row.ce.oi_change >= 0 ? '+' : ''}${displayMetric(row.ce.oi_change)}`}
                      </td>
                      <td className={`py-1.5 px-1.5 text-right text-slate-400 ${ceItm ? 'bg-emerald-950/20' : ''}`}>
                        {displayMetric(row.ce.volume)}
                      </td>
                      <td className={`py-1.5 px-1.5 text-right text-slate-400 ${ceItm ? 'bg-emerald-950/20' : ''}`}>
                        {displayMetric(row.ce.iv, row.ce.iv == null ? '' : '%')}
                      </td>
                      <td className={`py-1.5 px-1.5 text-right text-sky-400 ${ceItm ? 'bg-emerald-950/20' : ''}`}>
                        {displayMetric(row.ce.delta)}
                      </td>
                      <td className={`py-1.5 px-1.5 text-right text-slate-500 ${ceItm ? 'bg-emerald-950/20' : ''}`}>
                        {row.ce.previous_close == null ? 'N/A' : `₹${displayMetric(row.ce.previous_close)}`}
                      </td>
                      <td className={`py-1.5 px-2 text-right font-bold text-white border-r border-[#232E47] ${ceItm ? 'bg-emerald-950/20 text-emerald-300' : ''}`}>
                        {row.ce.ltp == null ? 'N/A' : `₹${displayMetric(row.ce.ltp)}`}
                      </td>

                      {/* STRIKE PRICE */}
                      <td className={`py-1.5 px-3 font-black text-white bg-[#121824] ${
                        isAtm ? 'bg-amber-500/25 text-amber-300 border-x-2 border-amber-500' : ''
                      }`}>
                        {row.strike_price.toLocaleString()}
                      </td>

                      {/* PE Cells */}
                      <td className={`py-1.5 px-2 text-left font-bold text-white border-l border-[#232E47] ${peItm ? 'bg-rose-950/20 text-rose-300' : ''}`}>
                        {row.pe.ltp == null ? 'N/A' : `₹${displayMetric(row.pe.ltp)}`}
                      </td>
                      <td className={`py-1.5 px-1.5 text-left text-slate-500 ${peItm ? 'bg-rose-950/20' : ''}`}>
                        {row.pe.previous_close == null ? 'N/A' : `₹${displayMetric(row.pe.previous_close)}`}
                      </td>
                      <td className={`py-1.5 px-1.5 text-left text-sky-400 ${peItm ? 'bg-rose-950/20' : ''}`}>
                        {displayMetric(row.pe.delta)}
                      </td>
                      <td className={`py-1.5 px-1.5 text-left text-slate-400 ${peItm ? 'bg-rose-950/20' : ''}`}>
                        {displayMetric(row.pe.iv, row.pe.iv == null ? '' : '%')}
                      </td>
                      <td className={`py-1.5 px-1.5 text-left text-slate-400 ${peItm ? 'bg-rose-950/20' : ''}`}>
                        {displayMetric(row.pe.volume)}
                      </td>
                      <td className={`py-1.5 px-1.5 text-left font-medium ${
                        row.pe.oi_change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      } ${peItm ? 'bg-rose-950/20' : ''}`}>
                        {row.pe.oi_change == null ? 'N/A' : `${row.pe.oi_change >= 0 ? '+' : ''}${displayMetric(row.pe.oi_change)}`}
                      </td>
                      <td className={`py-1.5 px-1.5 text-left font-medium text-slate-300 ${peItm ? 'bg-rose-950/20' : ''}`}>
                        {displayMetric(row.pe.oi)}
                      </td>
                      <td className={`py-1.5 px-1.5 text-left text-slate-500 ${peItm ? 'bg-rose-950/20' : ''}`}>
                        {displayMetric(row.pe.previous_oi)}
                      </td>
                      <td className={`py-1.5 px-1.5 text-right text-[10px] ${peItm ? 'bg-rose-950/20' : ''}`}>
                        <span className={`px-1 py-0.5 rounded ${
                          row.pe.buildup === 'Long Buildup' ? 'bg-emerald-500/20 text-emerald-400' :
                          row.pe.buildup === 'Short Buildup' ? 'bg-rose-500/20 text-rose-400' :
                          'text-slate-400'
                        }`}>
                          {row.pe.buildup}
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

      {/* ========================================================================= */}
      {/* TAB 2: OI & PCR ANALYSIS */}
      {/* ========================================================================= */}
      {activeTab === 'OI_PCR' && chainData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* OI Buildup Classification */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-3 font-mono">
            <h4 className="text-xs font-bold text-white uppercase flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span>15-Minute Clock Boundary OI Buildup Matrix</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-[#121824] border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 font-bold block">LONG BUILDUP</span>
                <span className="text-white">Price Rising &bull; OI Expanding</span>
                <span className="text-[10px] text-slate-400 block mt-1">Institutional aggressive fresh buying</span>
              </div>
              <div className="p-3 rounded-lg bg-[#121824] border border-rose-500/30">
                <span className="text-[10px] text-rose-400 font-bold block">SHORT BUILDUP</span>
                <span className="text-white">Price Falling &bull; OI Expanding</span>
                <span className="text-[10px] text-slate-400 block mt-1">Aggressive supply creation / call writing</span>
              </div>
              <div className="p-3 rounded-lg bg-[#121824] border border-sky-500/30">
                <span className="text-[10px] text-sky-400 font-bold block">SHORT COVERING</span>
                <span className="text-white">Price Rising &bull; OI Contracting</span>
                <span className="text-[10px] text-slate-400 block mt-1">Bears closing positions on upward momentum</span>
              </div>
              <div className="p-3 rounded-lg bg-[#121824] border border-amber-500/30">
                <span className="text-[10px] text-amber-400 font-bold block">LONG UNWINDING</span>
                <span className="text-white">Price Falling &bull; OI Contracting</span>
                <span className="text-[10px] text-slate-400 block mt-1">Bulls liquidating long exposures</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#232E47]">
              <span className="text-slate-400 text-xs">
                Total Call OI: <strong className="text-white">{chainData.totals?.total_call_oi?.toLocaleString()}</strong> | 
                Total Put OI: <strong className="text-white">{chainData.totals?.total_put_oi?.toLocaleString()}</strong>
              </span>
            </div>
          </div>

          {/* Multi-Timeframe PCR Matrix */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-3 font-mono">
            <h4 className="text-xs font-bold text-white uppercase flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Put-Call Ratio (PCR) Analysis Suite</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded bg-[#121824] border border-[#232E47]">
                <span className="text-slate-300">Total Open Interest PCR:</span>
                <strong className="text-emerald-400 font-bold text-sm">{chainData.totals?.oi_pcr}</strong>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#121824] border border-[#232E47]">
                <span className="text-slate-300">Volume Traded PCR:</span>
                <strong className="text-sky-400 font-bold text-sm">{chainData.totals?.vol_pcr}</strong>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#121824] border border-[#232E47]">
                <span className="text-slate-300">OI Change PCR:</span>
                <strong className="text-amber-400 font-bold text-sm">{chainData.totals?.oi_change_pcr}</strong>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              PCR Interpretation: OI PCR &gt; 1.20 signals strong put writing support. PCR &lt; 0.75 indicates heavy overhead call resistance.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MAX PAIN ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'MAX_PAIN' && chainData && (
        <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#232E47]">
            <div>
              <h4 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Max Pain Strike &bull; Minimizing Option Seller Payout</span>
              </h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Calculated across all strikes for {selectedExpiry}
              </p>
            </div>
            <div className="px-3 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono font-bold text-sm">
              Max Pain: {chainData.max_pain?.max_pain_strike?.toLocaleString()}
            </div>
          </div>

          {/* Payout Table */}
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            <table className="w-full text-xs font-mono text-left">
              <thead className="sticky top-0 bg-[#121824] text-slate-400 border-b border-[#232E47]">
                <tr>
                  <th className="py-2 px-3">Hypothetical Expiry Price</th>
                  <th className="py-2 px-3 text-right">Call OI-Weighted Payout</th>
                  <th className="py-2 px-3 text-right">Put OI-Weighted Payout</th>
                  <th className="py-2 px-3 text-right">Total OI-Weighted Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232E47]/40 text-slate-300">
                {chainData.max_pain?.payout_table?.map((item: any) => {
                  const isMaxPain = item.hypothetical_expiry_price === chainData.max_pain?.max_pain_strike;
                  return (
                    <tr 
                      key={item.hypothetical_expiry_price}
                      className={isMaxPain ? 'bg-rose-500/15 font-bold text-rose-300' : 'hover:bg-[#1a2334]'}
                    >
                      <td className="py-2 px-3">{item.hypothetical_expiry_price.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-medium">{item.ce_payout?.toLocaleString() ?? 'N/A'}</td>
                      <td className="py-2 px-3 text-right text-sky-400 font-medium">{item.pe_payout?.toLocaleString() ?? 'N/A'}</td>
                      <td className="py-2 px-3 text-right font-black">{item.total_payout?.toLocaleString() ?? 'N/A'}</td>
                    </tr>
                  );
                })}
                {!(chainData.max_pain?.payout_table || []).length && (
                  <tr><td colSpan={4} className="py-6 text-center text-slate-400">Max Pain is unavailable because this chain has no observed open interest.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUPPORT & RESISTANCE */}
      {/* ========================================================================= */}
      {activeTab === 'SUPPORT_RESISTANCE' && chainData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Support Card */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[#232E47]">
              <span className="font-bold text-emerald-400 text-sm flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>INSTITUTIONAL SUPPORT ZONES</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Put OI Walls</span>
            </div>
            <div className="p-3 rounded-lg bg-[#121824] border border-emerald-500/30 space-y-1">
              <span className="text-xs text-slate-400">Primary Support Strike:</span>
              <div className="text-2xl font-black text-emerald-400">
                {chainData.support_resistance?.strong_support?.strike?.toLocaleString()}
              </div>
              <p className="text-xs text-slate-300 font-sans mt-1">
                {chainData.support_resistance?.strong_support?.reason}
              </p>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-[#232E47]">
                Invalidation Level: <strong className="text-rose-400">{displayMetric(chainData.support_resistance?.strong_support?.invalidation_level)}</strong>
              </div>
            </div>
          </div>

          {/* Resistance Card */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[#232E47]">
              <span className="font-bold text-rose-400 text-sm flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>INSTITUTIONAL RESISTANCE ZONES</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Call OI Walls</span>
            </div>
            <div className="p-3 rounded-lg bg-[#121824] border border-rose-500/30 space-y-1">
              <span className="text-xs text-slate-400">Primary Resistance Strike:</span>
              <div className="text-2xl font-black text-rose-400">
                {chainData.support_resistance?.strong_resistance?.strike?.toLocaleString()}
              </div>
              <p className="text-xs text-slate-300 font-sans mt-1">
                {chainData.support_resistance?.strong_resistance?.reason}
              </p>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-[#232E47]">
                Invalidation Level: <strong className="text-emerald-400">{displayMetric(chainData.support_resistance?.strong_resistance?.invalidation_level)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GREEKS & VOLATILITY */}
      {/* ========================================================================= */}
      {activeTab === 'GREEKS_VOLATILITY' && chainData && (
        <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-4 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-[#232E47]">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Black-Scholes Options Greeks &amp; Second-Order Volatility Suite</span>
            </h4>
            <span className="text-[10px] text-slate-400">Model Assumptions: r=6.5% Repo &bull; q=1.2% Div Yield</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
              <span className="text-slate-400 block text-[10px]">ATM IV</span>
              <strong className="text-white text-base">{chainData.exposures?.atm_iv_pct}%</strong>
            </div>
            <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
              <span className="text-slate-400 block text-[10px]">52-Week IV Rank</span>
              <strong className="text-emerald-400 text-base">{displayMetric(chainData.exposures?.iv_rank_52w)}</strong>
            </div>
            <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
              <span className="text-slate-400 block text-[10px]">52-Week IV Percentile</span>
              <strong className="text-sky-400 text-base">{displayMetric(chainData.exposures?.iv_percentile_52w)}</strong>
            </div>
            <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
              <span className="text-slate-400 block text-[10px]">Gamma Flip Level</span>
              <strong className="text-amber-300 text-base">{displayMetric(chainData.exposures?.gamma_flip_strike)}</strong>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Second-Order Greeks: Charm estimates the decay of delta over time ($\partial \Delta / \partial t$), and Vanna estimates the sensitivity of delta to volatility shocks ($\partial \Delta / \partial \sigma$).
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: 14-STRATEGY SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'STRATEGY_SIMULATOR' && (
        <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#232E47] gap-2">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-purple-400" />
                <span>Options Strategy Payoff Simulator &bull; 14 Structural Models</span>
              </h4>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Simulate profit/loss, breakevens, and risk-reward ratios. Purely educational.
              </p>
            </div>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="bg-[#121824] border border-[#232E47] text-white text-xs font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value="BULL_CALL_SPREAD">Bull Call Spread</option>
              <option value="BEAR_PUT_SPREAD">Bear Put Spread</option>
              <option value="BULL_PUT_SPREAD">Bull Put Spread (Credit)</option>
              <option value="BEAR_CALL_SPREAD">Bear Call Spread (Credit)</option>
              <option value="LONG_STRADDLE">Long Straddle</option>
              <option value="SHORT_STRADDLE">Short Straddle</option>
              <option value="LONG_STRANGLE">Long Strangle</option>
              <option value="SHORT_STRANGLE">Short Strangle</option>
              <option value="IRON_CONDOR">Iron Condor</option>
              <option value="BUTTERFLY">Long Butterfly</option>
              <option value="LONG_CALL">Long Call</option>
              <option value="SHORT_CALL">Short Call</option>
              <option value="LONG_PUT">Long Put</option>
              <option value="SHORT_PUT">Short Put</option>
            </select>
          </div>

          {strategyError && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">Live strategy premiums are unavailable: {strategyError}</div>}
          {strategyResult && (
            <div className="space-y-3">
              {strategyResult.is_market_quote === true && <p className="text-xs text-slate-400">Uses the selected expiry’s observed Upstox option-chain premiums ({strategyResult.observed_at}). Expiry payoff is hypothetical; it does not model time decay or volatility changes.</p>}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-slate-400 text-[10px]">Net Debit / Credit</span>
                  <strong className="text-white text-base block mt-0.5">
                    ₹{strategyResult.net_debit_credit?.toLocaleString()}
                  </strong>
                </div>
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-slate-400 text-[10px]">Max Profit</span>
                  <strong className="text-emerald-400 text-base block mt-0.5">
                    {typeof strategyResult.max_profit === 'number' ? `₹${strategyResult.max_profit.toLocaleString()}` : strategyResult.max_profit}
                  </strong>
                </div>
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-slate-400 text-[10px]">Max Loss</span>
                  <strong className="text-rose-400 text-base block mt-0.5">
                    {typeof strategyResult.max_loss === 'number' ? `₹${strategyResult.max_loss.toLocaleString()}` : strategyResult.max_loss}
                  </strong>
                </div>
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-slate-400 text-[10px]">Breakevens</span>
                  <strong className="text-amber-300 text-base block mt-0.5">
                    {strategyResult.breakevens?.join(', ') || 'None'}
                  </strong>
                </div>
              </div>

              {/* Legs Table */}
              <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                <h5 className="text-xs font-bold text-white mb-2">Strategy Leg Configuration</h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-slate-400 border-b border-[#232E47]">
                      <tr>
                        <th className="py-1">Action</th>
                        <th className="py-1">Type</th>
                        <th className="py-1">Strike</th>
                        <th className="py-1">Premium</th>
                        <th className="py-1">Contracts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232E47]/40 text-slate-300">
                      {strategyResult.legs?.map((leg: any, idx: number) => (
                        <tr key={idx}>
                          <td className={`py-1 font-bold ${leg.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {leg.action}
                          </td>
                          <td className="py-1">{leg.type}</td>
                          <td className="py-1">{leg.strike}</td>
                          <td className="py-1">₹{leg.premium}</td>
                          <td className="py-1">{leg.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: REGIME & PRICE ACTION */}
      {/* ========================================================================= */}
      {activeTab === 'REGIME_PRICE_ACTION' && !marketRegime && (
        <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] text-sm text-slate-300">
          Regime and CPR readings need verified intraday VWAP and session OHLC data. Those inputs are not present in the current option-chain snapshot, so no regime value is shown.
        </div>
      )}
      {activeTab === 'REGIME_PRICE_ACTION' && marketRegime && (
        <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-[#232E47]">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Market Regime Detection &amp; CPR VWAP Pivots</span>
            </h4>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {marketRegime.regime}
            </span>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {marketRegime.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-2">
            <div className="p-2.5 rounded bg-[#121824] border border-[#232E47]">
              <span className="text-slate-400 text-[10px] block">Central Pivot (CPR)</span>
              <strong className="text-white">₹{marketRegime.pivots?.cpr_pivot?.toLocaleString()}</strong>
            </div>
            <div className="p-2.5 rounded bg-[#121824] border border-[#232E47]">
              <span className="text-slate-400 text-[10px] block">Resistance 1 (R1)</span>
              <strong className="text-rose-400">₹{marketRegime.pivots?.r1?.toLocaleString()}</strong>
            </div>
            <div className="p-2.5 rounded bg-[#121824] border border-[#232E47]">
              <span className="text-slate-400 text-[10px] block">Support 1 (S1)</span>
              <strong className="text-emerald-400">₹{marketRegime.pivots?.s1?.toLocaleString()}</strong>
            </div>
            <div className="p-2.5 rounded bg-[#121824] border border-[#232E47]">
              <span className="text-slate-400 text-[10px] block">Resistance 2 (R2)</span>
              <strong className="text-rose-400">₹{marketRegime.pivots?.r2?.toLocaleString()}</strong>
            </div>
            <div className="p-2.5 rounded bg-[#121824] border border-[#232E47]">
              <span className="text-slate-400 text-[10px] block">Support 2 (S2)</span>
              <strong className="text-emerald-400">₹{marketRegime.pivots?.s2?.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: ALERTS & SUBSCRIPTION MONITOR */}
      {/* ========================================================================= */}
      {activeTab === 'ALERTS_MONITOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono">
          {/* Active Alerts */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-3">
            <h4 className="text-xs font-bold text-white uppercase flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Real-Time Market &amp; Feed Alerts</span>
            </h4>
            <div className="space-y-2 text-xs">
              {alerts.map((alt: any) => (
                <div key={alt.id} className="p-3 rounded-lg bg-[#121824] border border-[#232E47] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{alt.instrument} &bull; {alt.type}</span>
                    <span className="text-[10px] text-slate-500">{new Date(alt.timestamp).toLocaleTimeString('en-IN')}</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs">{alt.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Data Quality & Subscriptions */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-3">
            <h4 className="text-xs font-bold text-white uppercase flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Data Quality Monitor &amp; Upstox V3 Feed</span>
            </h4>
            {dataQuality && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded bg-[#121824] border border-[#232E47]">
                  <span className="text-slate-400">Feed Mode:</span>
                  <span className="text-emerald-400 font-bold">{dataQuality.feed_status} ({dataQuality.app_mode})</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#121824] border border-[#232E47]">
                  <span className="text-slate-400">WebSocket V3 Status:</span>
                  <span className="text-sky-400 font-bold">{dataQuality.websocket_status}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#121824] border border-[#232E47]">
                  <span className="text-slate-400">Feed Latency:</span>
                  <span className="text-white">{dataQuality.latency_ms} ms</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#121824] border border-[#232E47]">
                  <span className="text-slate-400">Data Freshness:</span>
                  <span className="text-white">{dataQuality.data_freshness_seconds}s</span>
                </div>
                <div className="p-2.5 rounded bg-[#121824] border border-[#232E47] text-slate-300 font-sans text-[11px] leading-relaxed">
                  {dataQuality.honest_data_policy}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
