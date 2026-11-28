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
  PieChart,
  X
} from 'lucide-react';
import { ProfessionalTradingChart } from './ProfessionalTradingChart';
import { 
  fetchFoUniverse, 
  fetchOptionChain, 
  fetchOptionSnapshots,
  fetchExpiries, 
  fetchStrategyPayoff, 
  fetchOptionsAlerts, 
  fetchDataQualityReport,
  getWsUrl
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

interface NiftyLiveOptionChainDashboardProps {
  initialTab?: OptionsTab;
}

export const NiftyLiveOptionChainDashboard: React.FC<NiftyLiveOptionChainDashboardProps> = ({ initialTab = 'CHAIN' }) => {
  const [activeTab, setActiveTab] = useState<OptionsTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [symbol, setSymbol] = useState<string>('NIFTY');
  const [strikeRange, setStrikeRange] = useState<number>(5);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [selectedOptionChart, setSelectedOptionChart] = useState<{ instrumentKey: string; label: string } | null>(null);
  
  // Snapshot mode states (Live vs Historical Past Data)
  const [dataMode, setDataMode] = useState<'LIVE' | 'HISTORICAL'>('LIVE');
  const [pastSnapshots, setPastSnapshots] = useState<any[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');
  
  // Data states
  const [universe, setUniverse] = useState<any[]>([]);
  const [expiries, setExpiries] = useState<string[]>([]);
  const [expiriesForSymbol, setExpiriesForSymbol] = useState<string>('');
  const [chainData, setChainData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [feedStatus, setFeedStatus] = useState<string>('WAITING');
  const [subscriptionMonitor, setSubscriptionMonitor] = useState<any>(null);
  const [chainError, setChainError] = useState<string | null>(null);
  const [technicalLevels, setTechnicalLevels] = useState<any>(null);
  const [technicalLevelsError, setTechnicalLevelsError] = useState<string | null>(null);
  const [technicalLevelsLoading, setTechnicalLevelsLoading] = useState<boolean>(false);
  const feedSocketRef = useRef<WebSocket | null>(null);
  const chainRequestRef = useRef(0);
  const chainDataRef = useRef<any>(null);
  const technicalLevelsRef = useRef<any>(null);
  const lastOptionTickAtRef = useRef<number | null>(null);

  useEffect(() => { chainDataRef.current = chainData; }, [chainData]);
  useEffect(() => { technicalLevelsRef.current = technicalLevels; }, [technicalLevels]);
  
  // Strategy payoff state
  const [selectedStrategy, setSelectedStrategy] = useState<string>('BULL_CALL_SPREAD');
  const [strategyResult, setStrategyResult] = useState<any>(null);
  const [strategyError, setStrategyError] = useState<string | null>(null);

  // Score Details Modal state
  const [selectedScoreStrike, setSelectedScoreStrike] = useState<any | null>(null);

  // Market regime state
  const [marketRegime, setMarketRegime] = useState<any>(null);

  // Alerts & Monitor states
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dataQuality, setDataQuality] = useState<any>(null);

  // Initial load: F&O Universe
  useEffect(() => {
    const socket = new WebSocket(getWsUrl('/ws/options-feed'));
    feedSocketRef.current = socket;
    socket.onmessage = event => {
      let message: any;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.type === 'status') {
        if (['DISCONNECTED', 'FAILED'].includes(message.status)) setFeedStatus('DISCONNECTED');
        else if (lastOptionTickAtRef.current == null) setFeedStatus('WAITING');
      }
      if (message.type !== 'market_data') return;
      const currentChain = chainDataRef.current;
      const optionKeys = new Set((currentChain?.rows || []).flatMap((row: any) =>
        [row.ce?.instrument_key, row.pe?.instrument_key].filter(Boolean)));
      const relevantOptionTick = Object.keys(message.ticks || {}).some(key => optionKeys.has(key));
      const relevantSpotTick = Boolean(currentChain?.instrument_key && message.ticks?.[currentChain.instrument_key]);
      const levelKey = technicalLevelsRef.current?.instrument_key;
      const levelTick = levelKey ? message.ticks?.[levelKey] : null;
      if (levelTick && message.is_live_update) {
        setTechnicalLevels((previous: any) => {
          if (!previous) return previous;
          const spot = Number(levelTick.ltp ?? previous.spot_price);
          const allLevels = (previous.all_levels || []).map((level: any) => {
            if (level.kind === 'INTRADAY_LOW') return { ...level, value: Math.min(Number(level.value), spot), timestamp: levelTick.exchange_timestamp || level.timestamp };
            if (level.kind === 'INTRADAY_HIGH') return { ...level, value: Math.max(Number(level.value), spot), timestamp: levelTick.exchange_timestamp || level.timestamp };
            return level;
          });
          return { ...previous, spot_price: spot, all_levels: allLevels,
            supports: allLevels.filter((level: any) => Number(level.value) <= spot)
              .sort((a: any, b: any) => Number(b.value) - Number(a.value)).slice(0, 3),
            resistances: allLevels.filter((level: any) => Number(level.value) >= spot)
              .sort((a: any, b: any) => Number(a.value) - Number(b.value)).slice(0, 3),
            status: 'LIVE', exchange_timestamp: levelTick.exchange_timestamp || previous.exchange_timestamp,
            server_received_timestamp: levelTick.received_at || previous.server_received_timestamp,
            data_age_seconds: 0 };
        });
      }
      if (!relevantOptionTick && !relevantSpotTick && !levelTick) return;
      if (message.is_live_update && relevantOptionTick) {
        lastOptionTickAtRef.current = Date.now();
        setFeedStatus('LIVE');
      }
      setChainData((previous: any) => {
        if (!previous?.rows) return previous;
        let callOiDelta = 0, putOiDelta = 0, callVolumeDelta = 0, putVolumeDelta = 0;
        let callOiChangeDelta = 0, putOiChangeDelta = 0;
        const spotTick = message.ticks?.[previous.instrument_key || ''];
        const rows = previous.rows.map((row: any) => {
          const next = { ...row };
          for (const side of ['ce', 'pe']) {
            const tick = message.ticks?.[row[side]?.instrument_key];
            if (!tick) continue;
            const oldOi = Number(next[side].oi || 0);
            const oldVolume = Number(next[side].volume || 0);
            const oldOiChange = Number(next[side].oi_change || 0);
            let nextOi = next[side].oi;
            let nextOiChange = next[side].oi_change;
            if (tick.oi != null) {
              nextOi = Number(tick.oi);
              const previousSessionOi = next[side].previous_oi;
              if (previousSessionOi != null) nextOiChange = nextOi - Number(previousSessionOi);
              const delta = nextOi - oldOi;
              if (side === 'ce') {
                callOiDelta += delta;
                callOiChangeDelta += Number(nextOiChange || 0) - oldOiChange;
              } else {
                putOiDelta += delta;
                putOiChangeDelta += Number(nextOiChange || 0) - oldOiChange;
              }
            }
            if (tick.volume != null) {
              const delta = Number(tick.volume) - oldVolume;
              if (side === 'ce') callVolumeDelta += delta; else putVolumeDelta += delta;
            }
            const depth = tick.market_depth?.[0];
            const change = tick.ltp != null && tick.close_price != null ? Number(tick.ltp) - Number(tick.close_price) : next[side].change;
            next[side] = { ...next[side], ltp: tick.ltp ?? next[side].ltp,
              change,
              change_pct: tick.close_price && change != null ? (change / Number(tick.close_price)) * 100 : next[side].change_pct,
              volume: tick.volume ?? next[side].volume, oi: nextOi, oi_change: nextOiChange,
              iv: tick.iv ?? next[side].iv,
              bid_price: depth?.bid_price ?? next[side].bid_price,
              ask_price: depth?.ask_price ?? next[side].ask_price,
              bid_qty: depth?.bid_quantity ?? next[side].bid_qty,
              ask_qty: depth?.ask_quantity ?? next[side].ask_qty,
              volume_increment: tick.incremental_volume ?? next[side].volume_increment,
              oi_exchange_timestamp: tick.oi != null ? tick.exchange_timestamp : next[side].oi_exchange_timestamp,
              oi_received_at: tick.oi != null ? tick.received_at : next[side].oi_received_at,
              exchange_timestamp: tick.exchange_timestamp ?? next[side].exchange_timestamp,
              received_at: tick.received_at ?? next[side].received_at,
              ...tick.greeks };
          }
          return next;
        });
        const calls = Number(previous.totals?.total_call_oi || 0) + callOiDelta;
        const puts = Number(previous.totals?.total_put_oi || 0) + putOiDelta;
        const callVol = Number(previous.totals?.total_call_volume || 0) + callVolumeDelta;
        const putVol = Number(previous.totals?.total_put_volume || 0) + putVolumeDelta;
        const callOiChange = Number(previous.totals?.total_call_oi_change || 0) + callOiChangeDelta;
        const putOiChange = Number(previous.totals?.total_put_oi_change || 0) + putOiChangeDelta;
        const spot = Number(spotTick?.ltp ?? previous.spot_price);
        const atmStrike = rows.length ? rows.reduce((nearest: any, candidate: any) =>
          Math.abs(candidate.strike_price - spot) < Math.abs(nearest.strike_price - spot) ? candidate : nearest, rows[0]).strike_price : null;
        const rowsWithAtm = rows.map((row: any) => ({ ...row,
          is_atm: row.strike_price === atmStrike,
          ce: { ...row.ce, classification: row.strike_price < spot ? 'ITM' : row.strike_price > spot ? 'OTM' : 'ATM' },
          pe: { ...row.pe, classification: row.strike_price > spot ? 'ITM' : row.strike_price < spot ? 'OTM' : 'ATM' },
        }));
        const putLevels = rowsWithAtm.filter((row: any) => row.strike_price <= spot && Number(row.pe?.oi) > 0)
          .sort((a: any, b: any) => Number(b.pe.oi) - Number(a.pe.oi));
        const callLevels = rowsWithAtm.filter((row: any) => row.strike_price >= spot && Number(row.ce?.oi) > 0)
          .sort((a: any, b: any) => Number(b.ce.oi) - Number(a.ce.oi));
        const relevantTicks = Object.entries(message.ticks).filter(([key]) => optionKeys.has(key) || key === previous.instrument_key)
          .map(([, tick]: [string, any]) => tick);
        const exchangeTimes = relevantTicks.map((tick: any) => tick.exchange_timestamp).filter(Boolean).sort();
        const receiveTimes = relevantTicks.map((tick: any) => tick.received_at).filter(Boolean).sort();
        return { ...previous, rows: rowsWithAtm, spot_price: spot, atm_strike: atmStrike,
          feed_timestamps: { exchange: exchangeTimes[exchangeTimes.length - 1] || previous.feed_timestamps?.exchange,
            received: receiveTimes[receiveTimes.length - 1] || previous.feed_timestamps?.received,
            frontend: new Date().toISOString() },
          analytics_freshness: 'PARTIAL_LIVE',
          totals: { ...previous.totals, total_call_oi: calls, total_put_oi: puts,
          total_call_volume: callVol, total_put_volume: putVol,
          total_call_oi_change: callOiChange, total_put_oi_change: putOiChange,
          oi_pcr: calls ? puts / calls : null,
          vol_pcr: callVol ? putVol / callVol : null,
          oi_change_pcr: callOiChange ? putOiChange / callOiChange : null },
          support_resistance: {
            ...previous.support_resistance,
            strong_support: putLevels[0] ? { strike: putLevels[0].strike_price,
              reason: 'Highest observed put OI among currently subscribed strikes' } : null,
            strong_resistance: callLevels[0] ? { strike: callLevels[0].strike_price,
              reason: 'Highest observed call OI among currently subscribed strikes' } : null,
          } };
      });
    };
    const refreshStatus = () => fetch('/api/v1/options/feed-status').then(r => r.json())
      .then(status => {
        setSubscriptionMonitor(status);
        if (['DISCONNECTED', 'FAILED'].includes(status.status)) setFeedStatus('DISCONNECTED');
        else if (lastOptionTickAtRef.current == null) setFeedStatus('WAITING');
        else setFeedStatus(Date.now() - lastOptionTickAtRef.current > 20000 ? 'STALE' : 'LIVE');
      }).catch(() => setFeedStatus('DISCONNECTED'));
    refreshStatus();
    const interval = window.setInterval(refreshStatus, 5000);
    return () => { window.clearInterval(interval); socket.close(); feedSocketRef.current = null; };
  }, []);

  useEffect(() => {
    lastOptionTickAtRef.current = null;
    setFeedStatus('WAITING');
  }, [symbol, selectedExpiry]);

  useEffect(() => {
    if (activeTab !== 'SUPPORT_RESISTANCE') return;
    let cancelled = false;
    setTechnicalLevelsLoading(true);
    setTechnicalLevelsError(null);
    fetch(`/api/v1/options/technical-levels?symbol=${encodeURIComponent(symbol)}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail?.message || data.detail || `HTTP ${response.status}`);
        return data;
      })
      .then(data => { if (!cancelled) setTechnicalLevels(data); })
      .catch(error => {
        if (!cancelled) setTechnicalLevelsError(error instanceof Error ? error.message : 'Historical technical levels are unavailable.');
      })
      .finally(() => { if (!cancelled) setTechnicalLevelsLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab, symbol]);

  useEffect(() => {
    fetchFoUniverse().then(res => {
      setUniverse(res.universe || []);
      setSubscriptionMonitor(res.subscription_monitor || null);
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

  // Load available historical option-chain snapshots
  useEffect(() => {
    fetchOptionSnapshots(symbol).then(res => {
      const snaps = res.snapshots || [];
      setPastSnapshots(snaps);
      if (snaps.length > 0 && !selectedSnapshot) {
        setSelectedSnapshot(snaps[0].captured_at);
      }
    }).catch(() => {});
  }, [symbol]);

  // Load option chain when symbol, strike range, expiry, or snapshot mode changes
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
      const snapTime = dataMode === 'HISTORICAL' ? selectedSnapshot : undefined;
      const data = await fetchOptionChain(symbol, strikeRange, selectedExpiry || undefined, snapTime);
      if (requestId !== chainRequestRef.current) return;
      setChainData(data);
      if (dataMode === 'LIVE') {
        const instrumentKeys = (data.rows || []).flatMap((row: any) => [row.ce?.instrument_key, row.pe?.instrument_key]).filter(Boolean);
        if (feedSocketRef.current?.readyState === WebSocket.OPEN) {
          feedSocketRef.current.send(JSON.stringify({ mode: 'full', instrumentKeys }));
        }
      }
      setMarketRegime(null);
    } catch (err) {
      if (requestId !== chainRequestRef.current) return;
      console.error('Error fetching option chain:', err);
      setChainError(err instanceof Error ? err.message : 'Unable to retrieve verified option-chain data.');
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
  }, [symbol, strikeRange, selectedExpiry, expiriesForSymbol, dataMode, selectedSnapshot]);

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
              <option value={5}>ATM ±5 (5 Above &amp; 5 Below)</option>
              <option value={10}>ATM ±10 (10 Above &amp; 10 Below)</option>
              <option value={15}>ATM ±15 (15 Above &amp; 15 Below)</option>
              <option value={20}>ATM ±20 (20 Above &amp; 20 Below)</option>
            </select>
          </div>

          {/* Data Mode Selector: Live vs Historical Past Snapshots */}
          <div className="flex items-center space-x-1 p-0.5 bg-[#121824] rounded-lg border border-[#232E47]">
            <button
              onClick={() => setDataMode('LIVE')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                dataMode === 'LIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              🔴 Live
            </button>
            <button
              onClick={() => setDataMode('HISTORICAL')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                dataMode === 'HISTORICAL' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              🕒 Past Snapshots
            </button>
          </div>

          {dataMode === 'HISTORICAL' && (
            <div className="flex items-center space-x-2 animate-in fade-in">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase">Snapshot:</span>
              <select
                value={selectedSnapshot}
                onChange={(e) => setSelectedSnapshot(e.target.value)}
                className="bg-[#121824] border border-sky-500/40 text-sky-300 font-mono font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-400"
              >
                {pastSnapshots.length ? pastSnapshots.map(snap => (
                  <option key={snap.captured_at} value={snap.captured_at}>
                    {snap.display_time} ({snap.contracts} contracts)
                  </option>
                )) : (
                  <option value="">No historical snapshots archived yet</option>
                )}
              </select>
            </div>
          )}
        </div>

        {/* Live Feed Status & Quick Stats */}
        <div className="flex flex-col items-end gap-1 font-mono text-xs">
          <div className="flex items-center space-x-2">
            {(() => {
              const now = new Date();
              const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
              const istDate = new Date(istString);
              const day = istDate.getDay();
              const isWeekday = day >= 1 && day <= 5;
              const mins = istDate.getHours() * 60 + istDate.getMinutes();
              const isTradingHours = isWeekday && mins >= (9 * 60 + 15) && mins <= (15 * 60 + 30);
              
              if (feedStatus === 'LIVE') {
                return (
                  <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-300 font-bold">LIVE FEED</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-sky-400 font-bold">Protobuf</span>
                  </div>
                );
              }
              if (!isTradingHours) {
                return (
                  <div className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center space-x-2" title="Market is closed (trading hours: 9:15 AM - 3:30 PM IST). Showing official end-of-session snapshot.">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-slate-300 font-bold">CLOSED / PREVIOUS SESSION</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-sky-400 font-bold">SNAPSHOT</span>
                  </div>
                );
              }
              return (
                <div className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center space-x-2" title="Connecting to live Upstox exchange stream...">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-300 font-bold">CONNECTING TICKS</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-sky-400 font-bold">Protobuf</span>
                </div>
              );
            })()}

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-lg bg-[#121824] hover:bg-[#1a2334] text-slate-300 border border-[#232E47] transition-all"
              title="Refresh Option Chain Snapshot"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
          <span className="text-[9px] text-slate-500">
            Exchange: {chainData?.feed_timestamps?.exchange ? new Date(chainData.feed_timestamps.exchange).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Official NSE closing snapshot'}
            {' · '}Server: {chainData?.feed_timestamps?.received ? new Date(chainData.feed_timestamps.received).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
            {' · '}UI: {chainData?.feed_timestamps?.frontend ? new Date(chainData.feed_timestamps.frontend).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
          </span>
          <span className="text-[9px] text-slate-500">
            Verified stock contracts: {subscriptionMonitor?.tracked_stock_option_contracts ?? '—'} · Active options: {subscriptionMonitor?.active_option_subscriptions ?? '—'} · Real-time ticks activate automatically during market hours (09:15–15:30 IST)
          </span>
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
      {chainData && <div className="text-[10px] text-amber-200/80 px-1">
        Live updates cover the selected underlying and subscribed strikes. Full-chain totals and Max Pain retain the REST snapshot outside those subscribed contracts.
      </div>}

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47] gap-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>NIFTY 50 Live Option Chain Table &bull; {selectedExpiry} Expiry</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Exact 20-Column Table &bull; Image-Based Buildup Scoring (-4 to +4) &bull; Quantitative Market Strength
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40" /> <span className="text-slate-300">ITM</span></span>
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500" /> <span className="text-amber-300 font-bold">ATM (Yellow)</span></span>
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500" /> <span className="text-emerald-400 font-bold">S1 (Green)</span></span>
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-emerald-950 border border-emerald-700" /> <span className="text-emerald-500 font-bold">S2 (Dark Green)</span></span>
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500" /> <span className="text-rose-400 font-bold">R1 (Red)</span></span>
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-rose-950 border border-rose-700" /> <span className="text-rose-500 font-bold">R2 (Dark Red)</span></span>
            </div>
          </div>

          {/* DYNAMIC 2 SUPPORTS & 2 RESISTANCES + ATM SUMMARY DIRECTLY ABOVE TABLE */}
          {(() => {
            const s1Strike = chainData?.support_resistance?.s1?.strike ?? chainData?.support_resistance?.strong_support?.strike;
            const s2Strike = chainData?.support_resistance?.s2?.strike;
            const r1Strike = chainData?.support_resistance?.r1?.strike ?? chainData?.support_resistance?.strong_resistance?.strike;
            const r2Strike = chainData?.support_resistance?.r2?.strike;
            const atmStrike = chainData?.atm_strike;

            return (
              <div className="rounded-lg bg-[#121824] border border-[#232E47] p-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-[#232E47]/70 gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Dynamic Institutional S1/S2 Supports &amp; R1/R2 Resistances (Strike Pivots)</span>
                  </span>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400">Spot: <strong className="text-white">₹{displayMetric(chainData.spot_price)}</strong></span>
                    <span className="text-slate-400">PCR: <strong className={chainData.totals?.oi_pcr >= 1 ? 'text-emerald-400' : 'text-rose-400'}>{displayMetric(chainData.totals?.oi_pcr)}</strong></span>
                    <span className="text-slate-400">ATM Score: <strong className={chainData.totals?.total_score > 0 ? 'text-emerald-400' : chainData.totals?.total_score < 0 ? 'text-rose-400' : 'text-amber-300'}>{chainData.totals?.total_score > 0 ? `+${chainData.totals?.total_score}` : chainData.totals?.total_score ?? 0} ({chainData.totals?.market_view ?? 'Sideways'})</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
                  {/* R2 */}
                  <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 shadow-sm">
                    <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wide">R2 (Dark Red)</div>
                    <div className="text-base font-black text-rose-300 mt-0.5">₹{displayMetric(r2Strike ?? '—')}</div>
                    <div className="text-[9px] text-slate-400">Secondary Resistance Ceiling</div>
                    <div className="text-[9px] text-slate-300 mt-1 font-semibold">OI: {displayMetric(chainData.support_resistance?.r2?.total_oi)} ({chainData.support_resistance?.r2?.oi_change >= 0 ? '+' : ''}{displayMetric(chainData.support_resistance?.r2?.oi_change)})</div>
                  </div>
                  {/* R1 */}
                  <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/50 shadow-sm">
                    <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wide">R1 (Red)</div>
                    <div className="text-base font-black text-rose-400 mt-0.5">₹{displayMetric(r1Strike ?? '—')}</div>
                    <div className="text-[9px] text-slate-400">Primary Resistance Wall</div>
                    <div className="text-[9px] text-slate-300 mt-1 font-semibold">OI: {displayMetric(chainData.support_resistance?.r1?.total_oi)} ({chainData.support_resistance?.r1?.oi_change >= 0 ? '+' : ''}{displayMetric(chainData.support_resistance?.r1?.oi_change)})</div>
                  </div>
                  {/* ATM */}
                  <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/50 shadow-sm col-span-2 sm:col-span-1">
                    <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wide">ATM Pivot (Yellow)</div>
                    <div className="text-base font-black text-amber-300 mt-0.5">₹{displayMetric(atmStrike ?? '—')}</div>
                    <div className="text-[9px] text-slate-400">At-The-Money Strike</div>
                    <div className="text-[9px] text-amber-400 mt-1 font-bold">{chainData.totals?.market_view ?? 'Sideways'} ({chainData.totals?.total_score > 0 ? `+${chainData.totals?.total_score}` : chainData.totals?.total_score ?? 0})</div>
                  </div>
                  {/* S1 */}
                  <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/50 shadow-sm">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">S1 (Green)</div>
                    <div className="text-base font-black text-emerald-400 mt-0.5">₹{displayMetric(s1Strike ?? '—')}</div>
                    <div className="text-[9px] text-slate-400">Primary Support Floor</div>
                    <div className="text-[9px] text-slate-300 mt-1 font-semibold">OI: {displayMetric(chainData.support_resistance?.s1?.total_oi)} ({chainData.support_resistance?.s1?.oi_change >= 0 ? '+' : ''}{displayMetric(chainData.support_resistance?.s1?.oi_change)})</div>
                  </div>
                  {/* S2 */}
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 shadow-sm">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">S2 (Dark Green)</div>
                    <div className="text-base font-black text-emerald-300 mt-0.5">₹{displayMetric(s2Strike ?? '—')}</div>
                    <div className="text-[9px] text-slate-400">Secondary Support Cushion</div>
                    <div className="text-[9px] text-slate-300 mt-1 font-semibold">OI: {displayMetric(chainData.support_resistance?.s2?.total_oi)} ({chainData.support_resistance?.s2?.oi_change >= 0 ? '+' : ''}{displayMetric(chainData.support_resistance?.s2?.oi_change)})</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* EXACT 20-COLUMN OPTION CHAIN TABLE */}
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs font-mono text-center border-collapse">
              <thead>
                <tr className="bg-[#121824] text-slate-400 border-b border-[#232E47]">
                  <th className="py-2 px-2 text-cyan-400 uppercase tracking-wider border-r border-[#232E47]">
                    SCORE
                  </th>
                  <th colSpan={8} className="py-2 px-2 text-emerald-400 uppercase tracking-wider border-r border-[#232E47]">
                    CALLS (CE)
                  </th>
                  <th className="py-2 px-3 text-white uppercase tracking-wider bg-[#171F32]">
                    STRIKE
                  </th>
                  <th colSpan={8} className="py-2 px-2 text-rose-400 uppercase tracking-wider border-l border-[#232E47]">
                    PUTS (PE)
                  </th>
                  <th colSpan={2} className="py-2 px-2 text-amber-400 uppercase tracking-wider border-l border-[#232E47]">
                    QUANT SENTIMENT
                  </th>
                </tr>
                <tr className="bg-[#0B0E14] text-slate-400 border-b border-[#232E47]/70 text-[10px]">
                  {/* Col 1 */}
                  <th className="py-1 px-1.5 text-center text-cyan-300 border-r border-[#232E47]">1. Quant Score</th>
                  {/* Cols 2 - 9 (CE) */}
                  <th className="py-1 px-1.5 text-center">2. CE Pattern</th>
                  <th className="py-1 px-1.5 text-center">3. CE Score</th>
                  <th className="py-1 px-1.5 text-right">4. CE OI</th>
                  <th className="py-1 px-1.5 text-right">5. Chg in CE OI</th>
                  <th className="py-1 px-1.5 text-right">6. CE Vol</th>
                  <th className="py-1 px-1.5 text-right">7. CE IV</th>
                  <th className="py-1 px-1.5 text-right">8. CE Delta</th>
                  <th className="py-1 px-2 text-right border-r border-[#232E47] text-white">9. CE LTP</th>
                  {/* Col 10 (Strike) */}
                  <th className="py-1 px-3 bg-[#171F32] text-amber-300 font-bold">10. Strike Price</th>
                  {/* Cols 11 - 18 (PE) */}
                  <th className="py-1 px-2 text-left border-l border-[#232E47] text-white">11. PE LTP</th>
                  <th className="py-1 px-1.5 text-left">12. PE Delta</th>
                  <th className="py-1 px-1.5 text-left">13. PE IV</th>
                  <th className="py-1 px-1.5 text-left">14. PE Vol</th>
                  <th className="py-1 px-1.5 text-left">15. Chg in PE OI</th>
                  <th className="py-1 px-1.5 text-left">16. PE OI</th>
                  <th className="py-1 px-1.5 text-center">17. PE Pattern</th>
                  <th className="py-1 px-1.5 text-center border-r border-[#232E47]">18. PE Score</th>
                  {/* Cols 19 - 20 (Total Score & Market View) */}
                  <th className="py-1 px-1.5 text-center text-sky-300">19. Total Score</th>
                  <th className="py-1 px-2 text-center text-amber-300">20. Market View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232E47]/40">
                {(() => {
                  const s1Strike = chainData?.support_resistance?.s1?.strike ?? chainData?.support_resistance?.strong_support?.strike;
                  const s2Strike = chainData?.support_resistance?.s2?.strike;
                  const r1Strike = chainData?.support_resistance?.r1?.strike ?? chainData?.support_resistance?.strong_resistance?.strike;
                  const r2Strike = chainData?.support_resistance?.r2?.strike;
                  const atmStrike = chainData?.atm_strike;

                  return chainData.rows.map((row: any) => {
                    const isAtm = row.is_atm || row.strike_price === atmStrike;
                    const isS1 = row.strike_price === s1Strike;
                    const isS2 = row.strike_price === s2Strike;
                    const isR1 = row.strike_price === r1Strike;
                    const isR2 = row.strike_price === r2Strike;

                    const ceItm = row.ce.classification === 'ITM';
                    const peItm = row.pe.classification === 'ITM';

                    // Scoring fallback logic
                    const cePriceChange = row.ce.change ?? 0;
                    const ceOiChange = row.ce.oi_change ?? 0;
                    const pePriceChange = row.pe.change ?? 0;
                    const peOiChange = row.pe.oi_change ?? 0;

                    let ceCode = row.ce_pattern_code || row.ce.pattern_code;
                    let ceScore = row.ce_score ?? row.ce.score;
                    let ceBuildup = row.ce.buildup;
                    if (!ceCode) {
                      if (cePriceChange >= 0 && ceOiChange >= 0) { ceCode = 'LB'; ceScore = 2; ceBuildup = 'Long Buildup'; }
                      else if (cePriceChange >= 0 && ceOiChange < 0) { ceCode = 'SC'; ceScore = 2; ceBuildup = 'Short Covering'; }
                      else if (cePriceChange < 0 && ceOiChange < 0) { ceCode = 'LW'; ceScore = -1; ceBuildup = 'Long Unwinding'; }
                      else { ceCode = 'SB'; ceScore = -2; ceBuildup = 'Short Buildup'; }
                    }

                    let peCode = row.pe_pattern_code || row.pe.pattern_code;
                    let peScore = row.pe_score ?? row.pe.score;
                    let peBuildup = row.pe.buildup;
                    if (!peCode) {
                      if (pePriceChange <= 0 && peOiChange >= 0) { peCode = 'SB'; peScore = 2; peBuildup = 'Short Buildup'; }
                      else if (pePriceChange <= 0 && peOiChange < 0) { peCode = 'LW'; peScore = 1; peBuildup = 'Long Unwinding'; }
                      else if (pePriceChange > 0 && peOiChange >= 0) { peCode = 'LB'; peScore = -2; peBuildup = 'Long Buildup'; }
                      else { peCode = 'SC'; peScore = -2; peBuildup = 'Short Covering'; }
                    }

                    const totalScore = row.total_score ?? row.quant_score ?? (ceScore + peScore);
                    let marketView = row.market_view;
                    if (!marketView) {
                      if (totalScore >= 4) marketView = 'Strong Bullish';
                      else if (totalScore >= 2) marketView = 'Bullish';
                      else if (totalScore >= -1) marketView = 'Sideways / Confusion';
                      else if (totalScore >= -3) marketView = 'Bearish';
                      else marketView = 'Strong Bearish';
                    }

                    // Score modal data
                    const strikeDetails = {
                      strike: row.strike_price,
                      spot: chainData.spot_price,
                      ceCode,
                      ceScore,
                      ceBuildup,
                      cePriceChange,
                      ceOiChange,
                      ceLtp: row.ce.ltp,
                      peCode,
                      peScore,
                      peBuildup,
                      pePriceChange,
                      peOiChange,
                      peLtp: row.pe.ltp,
                      totalScore,
                      marketView,
                      isAtm,
                      isS1,
                      isS2,
                      isR1,
                      isR2
                    };

                    const scoreColorClass = totalScore >= 4
                      ? 'bg-emerald-700 text-white border-emerald-500 font-bold shadow-sm'
                      : totalScore >= 2
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                      : totalScore >= -1
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : totalScore >= -3
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold'
                      : 'bg-rose-900/90 text-rose-200 border-rose-600 font-bold shadow-sm';

                    const marketViewClass = marketView === 'Strong Bullish'
                      ? 'bg-emerald-700/80 text-white border-emerald-400 font-bold'
                      : marketView === 'Bullish'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                      : marketView === 'Sideways / Confusion'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                      : marketView === 'Bearish'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold'
                      : 'bg-rose-900/80 text-rose-200 border-rose-500 font-bold';

                    return (
                      <tr 
                        key={row.strike_price}
                        className={`hover:bg-[#1a2334] transition-colors ${
                          isAtm ? 'bg-amber-500/10 font-semibold' : ''
                        }`}
                      >
                        {/* Col 1: Quant Score */}
                        <td className="py-1.5 px-1.5 border-r border-[#232E47]">
                          <button
                            type="button"
                            onClick={() => setSelectedScoreStrike(strikeDetails)}
                            title="Click to view quantitative mathematical breakdown"
                            className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer hover:scale-105 transition-transform ${scoreColorClass}`}
                          >
                            {totalScore > 0 ? `+${totalScore}` : totalScore}
                          </button>
                        </td>

                        {/* Col 2: CE Pattern */}
                        <td className={`py-1.5 px-1.5 text-center text-[10px] ${ceItm ? 'bg-emerald-950/20' : ''}`}>
                          <button
                            type="button"
                            onClick={() => setSelectedScoreStrike(strikeDetails)}
                            title={`${ceBuildup} (${ceCode})`}
                            className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${
                              ceCode === 'LB' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                              ceCode === 'SC' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                              ceCode === 'LW' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                              'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            }`}
                          >
                            {ceCode}
                          </button>
                        </td>

                        {/* Col 3: CE Score */}
                        <td className={`py-1.5 px-1.5 text-center font-bold ${
                          ceScore > 0 ? 'text-emerald-400' : ceScore < 0 ? 'text-rose-400' : 'text-slate-400'
                        } ${ceItm ? 'bg-emerald-950/20' : ''}`}>
                          {ceScore > 0 ? `+${ceScore}` : ceScore}
                        </td>

                        {/* Col 4: CE OI */}
                        <td className={`py-1.5 px-1.5 text-right font-medium text-slate-300 ${ceItm ? 'bg-emerald-950/20' : ''} ${
                          isR1 ? 'bg-rose-950/40 ring-1 ring-rose-500/50' : ''
                        }`}>
                          <span className={isR1 ? 'text-white font-bold text-xs' : ''}>
                            {displayMetric(row.ce.oi)}
                          </span>
                        </td>

                        {/* Col 5: Chg in CE OI */}
                        <td className={`py-1.5 px-1.5 text-right font-medium ${
                          row.ce.oi_change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        } ${ceItm ? 'bg-emerald-950/20' : ''}`}>
                          {row.ce.oi_change == null ? 'N/A' : `${row.ce.oi_change >= 0 ? '+' : ''}${displayMetric(row.ce.oi_change)}`}
                        </td>

                        {/* Col 6: CE Vol */}
                        <td className={`py-1.5 px-1.5 text-right text-slate-400 ${ceItm ? 'bg-emerald-950/20' : ''}`}>
                          {displayMetric(row.ce.volume)}
                        </td>

                        {/* Col 7: CE IV */}
                        <td className={`py-1.5 px-1.5 text-right text-slate-400 ${ceItm ? 'bg-emerald-950/20' : ''}`}>
                          {displayMetric(row.ce.iv, row.ce.iv == null ? '' : '%')}
                        </td>

                        {/* Col 8: CE Delta */}
                        <td className={`py-1.5 px-1.5 text-right text-sky-400 ${ceItm ? 'bg-emerald-950/20' : ''}`}>
                          {displayMetric(row.ce.delta)}
                        </td>

                        {/* Col 9: CE LTP */}
                        <td className={`py-1.5 px-2 text-right font-bold text-white border-r border-[#232E47] ${ceItm ? 'bg-emerald-950/20 text-emerald-300' : ''}`}>
                          {row.ce.instrument_key ? (
                            <button type="button" onClick={() => setSelectedOptionChart({
                              instrumentKey: row.ce.instrument_key,
                              label: `${symbol} ${selectedExpiry} ${row.strike_price} CE`
                            })} title={`Open chart for ${symbol} ${row.strike_price} CE`} className="text-right hover:text-sky-300 focus-visible:outline focus-visible:outline-sky-400">
                              <span>{row.ce.ltp == null ? 'N/A' : `₹${displayMetric(row.ce.ltp)}`}</span>
                              <span className="block text-[8px] font-normal text-sky-400">Chart</span>
                            </button>
                          ) : row.ce.ltp == null ? 'N/A' : `₹${displayMetric(row.ce.ltp)}`}
                        </td>

                        {/* Col 10: STRIKE PRICE (Center Highlight) */}
                        <td className={`py-1.5 px-3 font-black text-white bg-[#121824] text-center relative ${
                          isAtm ? 'bg-amber-500/25 text-amber-300 border-x-2 border-amber-500' : ''
                        } ${isS1 ? 'bg-emerald-500/25 border-x-2 border-emerald-500' : ''} ${
                          isS2 ? 'bg-emerald-950/70 border-x-2 border-emerald-700' : ''
                        } ${isR1 ? 'bg-rose-500/25 border-x-2 border-rose-500' : ''} ${
                          isR2 ? 'bg-rose-950/70 border-x-2 border-rose-700' : ''
                        }`}>
                          <div className="flex flex-col items-center justify-center">
                            {isR2 && (
                              <span className="text-[7.5px] font-bold px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-700 mb-0.5 uppercase tracking-wider">
                                🛡️ R2 CEILING
                              </span>
                            )}
                            {isR1 && (
                              <span className="text-[7.5px] font-bold px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-300 border border-rose-500 mb-0.5 uppercase tracking-wider">
                                🛡️ R1 RESISTANCE
                              </span>
                            )}
                            {isS1 && (
                              <span className="text-[7.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500 mb-0.5 uppercase tracking-wider">
                                🟢 S1 SUPPORT
                              </span>
                            )}
                            {isS2 && (
                              <span className="text-[7.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 mb-0.5 uppercase tracking-wider">
                                🟢 S2 CUSHION
                              </span>
                            )}
                            <span className="text-sm font-mono font-bold tracking-tight">{row.strike_price.toLocaleString()}</span>
                            {isAtm && (
                              <span className="text-[7.5px] font-bold px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-300 border border-amber-500/50 mt-0.5">
                                ⚡ ATM
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Col 11: PE LTP */}
                        <td className={`py-1.5 px-2 text-left font-bold text-white border-l border-[#232E47] ${peItm ? 'bg-rose-950/20 text-rose-300' : ''}`}>
                          {row.pe.instrument_key ? (
                            <button type="button" onClick={() => setSelectedOptionChart({
                              instrumentKey: row.pe.instrument_key,
                              label: `${symbol} ${selectedExpiry} ${row.strike_price} PE`
                            })} title={`Open chart for ${symbol} ${row.strike_price} PE`} className="text-left hover:text-sky-300 focus-visible:outline focus-visible:outline-sky-400">
                              <span>{row.pe.ltp == null ? 'N/A' : `₹${displayMetric(row.pe.ltp)}`}</span>
                              <span className="block text-[8px] font-normal text-sky-400">Chart</span>
                            </button>
                          ) : row.pe.ltp == null ? 'N/A' : `₹${displayMetric(row.pe.ltp)}`}
                        </td>

                        {/* Col 12: PE Delta */}
                        <td className={`py-1.5 px-1.5 text-left text-sky-400 ${peItm ? 'bg-rose-950/20' : ''}`}>
                          {displayMetric(row.pe.delta)}
                        </td>

                        {/* Col 13: PE IV */}
                        <td className={`py-1.5 px-1.5 text-left text-slate-400 ${peItm ? 'bg-rose-950/20' : ''}`}>
                          {displayMetric(row.pe.iv, row.pe.iv == null ? '' : '%')}
                        </td>

                        {/* Col 14: PE Vol */}
                        <td className={`py-1.5 px-1.5 text-left text-slate-400 ${peItm ? 'bg-rose-950/20' : ''}`}>
                          {displayMetric(row.pe.volume)}
                        </td>

                        {/* Col 15: Chg in PE OI */}
                        <td className={`py-1.5 px-1.5 text-left font-medium ${
                          row.pe.oi_change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        } ${peItm ? 'bg-rose-950/20' : ''}`}>
                          {row.pe.oi_change == null ? 'N/A' : `${row.pe.oi_change >= 0 ? '+' : ''}${displayMetric(row.pe.oi_change)}`}
                        </td>

                        {/* Col 16: PE OI */}
                        <td className={`py-1.5 px-1.5 text-left font-medium text-slate-300 ${peItm ? 'bg-rose-950/20' : ''} ${
                          isS1 ? 'bg-emerald-950/40 ring-1 ring-emerald-500/50' : ''
                        }`}>
                          <span className={isS1 ? 'text-white font-bold text-xs' : ''}>
                            {displayMetric(row.pe.oi)}
                          </span>
                        </td>

                        {/* Col 17: PE Pattern */}
                        <td className={`py-1.5 px-1.5 text-center text-[10px] ${peItm ? 'bg-rose-950/20' : ''}`}>
                          <button
                            type="button"
                            onClick={() => setSelectedScoreStrike(strikeDetails)}
                            title={`${peBuildup} (${peCode})`}
                            className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${
                              peCode === 'SB' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                              peCode === 'LW' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                              peCode === 'LB' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                              'bg-rose-900/60 text-rose-300 border-rose-700'
                            }`}
                          >
                            {peCode}
                          </button>
                        </td>

                        {/* Col 18: PE Score */}
                        <td className={`py-1.5 px-1.5 text-center font-bold border-r border-[#232E47] ${
                          peScore > 0 ? 'text-emerald-400' : peScore < 0 ? 'text-rose-400' : 'text-slate-400'
                        } ${peItm ? 'bg-rose-950/20' : ''}`}>
                          {peScore > 0 ? `+${peScore}` : peScore}
                        </td>

                        {/* Col 19: Total Score */}
                        <td className="py-1.5 px-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedScoreStrike(strikeDetails)}
                            title="Click to view full breakdown"
                            className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer hover:scale-105 transition-transform ${scoreColorClass}`}
                          >
                            {totalScore > 0 ? `+${totalScore}` : totalScore}
                          </button>
                        </td>

                        {/* Col 20: Market View */}
                        <td className="py-1.5 px-2 text-center text-[10px]">
                          <button
                            type="button"
                            onClick={() => setSelectedScoreStrike(strikeDetails)}
                            title="Click for quantitative details"
                            className={`px-2 py-0.5 rounded border ${marketViewClass} cursor-pointer hover:opacity-90`}
                          >
                            {marketView}
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>

          {/* SCORE DETAILS MODAL */}
          {selectedScoreStrike && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-mono animate-fadeIn">
              <div className="bg-[#0e1422] border border-[#232E47] rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative">
                <div className="flex items-center justify-between pb-3 border-b border-[#232E47]">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                      Strike ₹{selectedScoreStrike.strike.toLocaleString()} Quantitative Score Breakdown
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Underlying Spot: ₹{displayMetric(selectedScoreStrike.spot)} &bull; {selectedExpiry}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedScoreStrike(null)}
                    className="p-1 rounded bg-[#1A2234] hover:bg-slate-700 text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mathematical Formula Box */}
                <div className="p-3 rounded-lg bg-[#080b11] border border-[#232E47] space-y-2">
                  <div className="text-xs text-slate-400 uppercase font-semibold">Formula:</div>
                  <div className="text-sm font-bold text-sky-300 font-mono">
                    Total Score = CE Score ({selectedScoreStrike.ceScore > 0 ? `+${selectedScoreStrike.ceScore}` : selectedScoreStrike.ceScore}) + PE Score ({selectedScoreStrike.peScore > 0 ? `+${selectedScoreStrike.peScore}` : selectedScoreStrike.peScore}) = {selectedScoreStrike.totalScore > 0 ? `+${selectedScoreStrike.totalScore}` : selectedScoreStrike.totalScore}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-400">Market View:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                      selectedScoreStrike.totalScore >= 4 ? 'bg-emerald-700 text-white border-emerald-400' :
                      selectedScoreStrike.totalScore >= 2 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                      selectedScoreStrike.totalScore >= -1 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      selectedScoreStrike.totalScore >= -3 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                      'bg-rose-900 text-rose-200 border-rose-500'
                    }`}>
                      {selectedScoreStrike.marketView}
                    </span>
                  </div>
                </div>

                {/* CE & PE Leg Breakdown Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* CE Card */}
                  <div className="p-3 rounded-lg bg-[#121824] border border-emerald-500/30 space-y-1.5">
                    <div className="font-bold text-emerald-400 uppercase flex items-center justify-between">
                      <span>Call (CE) Leg</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">{selectedScoreStrike.ceCode}</span>
                    </div>
                    <div className="text-slate-300">Pattern: <strong>{selectedScoreStrike.ceBuildup}</strong></div>
                    <div className="text-slate-400">Price Change: ₹{selectedScoreStrike.cePriceChange >= 0 ? '+' : ''}{displayMetric(selectedScoreStrike.cePriceChange)}</div>
                    <div className="text-slate-400">OI Change: {selectedScoreStrike.ceOiChange >= 0 ? '+' : ''}{displayMetric(selectedScoreStrike.ceOiChange)} contracts</div>
                    <div className="pt-1 border-t border-[#232E47] flex justify-between font-bold">
                      <span className="text-slate-300">CE Score:</span>
                      <span className={selectedScoreStrike.ceScore > 0 ? 'text-emerald-400' : 'text-rose-400'}>{selectedScoreStrike.ceScore > 0 ? `+${selectedScoreStrike.ceScore}` : selectedScoreStrike.ceScore}</span>
                    </div>
                  </div>

                  {/* PE Card */}
                  <div className="p-3 rounded-lg bg-[#121824] border border-rose-500/30 space-y-1.5">
                    <div className="font-bold text-rose-400 uppercase flex items-center justify-between">
                      <span>Put (PE) Leg</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">{selectedScoreStrike.peCode}</span>
                    </div>
                    <div className="text-slate-300">Pattern: <strong>{selectedScoreStrike.peBuildup}</strong></div>
                    <div className="text-slate-400">Price Change: ₹{selectedScoreStrike.pePriceChange >= 0 ? '+' : ''}{displayMetric(selectedScoreStrike.pePriceChange)}</div>
                    <div className="text-slate-400">OI Change: {selectedScoreStrike.peOiChange >= 0 ? '+' : ''}{displayMetric(selectedScoreStrike.peOiChange)} contracts</div>
                    <div className="pt-1 border-t border-[#232E47] flex justify-between font-bold">
                      <span className="text-slate-300">PE Score:</span>
                      <span className={selectedScoreStrike.peScore > 0 ? 'text-emerald-400' : 'text-rose-400'}>{selectedScoreStrike.peScore > 0 ? `+${selectedScoreStrike.peScore}` : selectedScoreStrike.peScore}</span>
                    </div>
                  </div>
                </div>

                {/* Institutional Rules Reference */}
                <div className="p-2.5 rounded bg-[#080b11] border border-[#232E47] text-[10px] text-slate-400 space-y-1 leading-relaxed">
                  <div className="font-semibold text-slate-300">Institutional Scoring Rules:</div>
                  <div>&bull; CE: LB (Price UP &amp; OI UP) = +2 &bull; SC (Price UP &amp; OI DOWN) = +2 &bull; LW (Price DOWN &amp; OI DOWN) = -1 &bull; SB (Price DOWN &amp; OI UP) = -2</div>
                  <div>&bull; PE: SB (Price DOWN &amp; OI UP) = +2 &bull; LW (Price DOWN &amp; OI DOWN) = +1 &bull; LB (Price UP &amp; OI UP) = -2 &bull; SC (Price UP &amp; OI DOWN) = -2</div>
                </div>

                <div className="text-right pt-2">
                  <button
                    onClick={() => setSelectedScoreStrike(null)}
                    className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OPTION PREMIUM CANDLESTICK & VOLUME CHART */}
          {selectedOptionChart && (
            <section className="mt-4 rounded-xl border border-[#232E47] bg-[#080b11] p-3" aria-label="Selected option contract chart">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedOptionChart.label} premium chart</h4>
                  <p className="text-[10px] text-slate-400">Historical candles and live updates use verified contract key with S1/S2/R1/R2 lines.</p>
                </div>
                <button type="button" onClick={() => setSelectedOptionChart(null)} aria-label="Close option chart" className="rounded-md border border-[#232E47] p-1.5 text-slate-300 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ProfessionalTradingChart
                key={selectedOptionChart.instrumentKey}
                symbol={symbol}
                instrumentKey={selectedOptionChart.instrumentKey}
                displayName={selectedOptionChart.label}
                height={420}
                initialTimeframe="5m"
                priceLevels={[
                  ...(chainData?.support_resistance?.r2?.strike ? [{ price: chainData.support_resistance.r2.strike, title: 'R2 Ceiling', color: '#991B1B', lineWidth: 2 }] : []),
                  ...(chainData?.support_resistance?.r1?.strike ? [{ price: chainData.support_resistance.r1.strike, title: 'R1 Wall', color: '#EF4444', lineWidth: 2 }] : []),
                  ...(chainData?.atm_strike ? [{ price: chainData.atm_strike, title: 'ATM Pivot', color: '#F59E0B', lineWidth: 2 }] : []),
                  ...(chainData?.support_resistance?.s1?.strike ? [{ price: chainData.support_resistance.s1.strike, title: 'S1 Floor', color: '#10B981', lineWidth: 2 }] : []),
                  ...(chainData?.support_resistance?.s2?.strike ? [{ price: chainData.support_resistance.s2.strike, title: 'S2 Cushion', color: '#065F46', lineWidth: 2 }] : []),
                ]}
              />
            </section>
          )}
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
          {/* Support Card: S1 and S2 */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[#232E47]">
              <span className="font-bold text-emerald-400 text-sm flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>INSTITUTIONAL SUPPORT ZONES</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Put OI Walls (S1 &amp; S2)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-[#121824] border border-emerald-500/30 space-y-1">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">S1</span>
                  Primary Support Strike:
                </span>
                <div className="text-2xl font-black text-emerald-400">
                  {chainData.support_resistance?.s1?.strike?.toLocaleString() ?? chainData.support_resistance?.strong_support?.strike?.toLocaleString() ?? 'Not Available'}
                </div>
                <div className="text-[11px] text-slate-300 font-sans">
                  Total OI: <span className="font-mono text-white font-bold">{(chainData.support_resistance?.s1?.total_oi ?? 0).toLocaleString()}</span>
                  <span className="text-slate-500 ml-1">({(chainData.support_resistance?.s1?.oi_change ?? 0) >= 0 ? '+' : ''}{(chainData.support_resistance?.s1?.oi_change ?? 0).toLocaleString()} chg)</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  {chainData.support_resistance?.s1?.reason ?? chainData.support_resistance?.strong_support?.reason}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#121824] border border-emerald-500/20 space-y-1">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 font-bold">S2</span>
                  Secondary Support Strike:
                </span>
                <div className="text-2xl font-black text-emerald-300">
                  {chainData.support_resistance?.s2?.strike?.toLocaleString() ?? 'Not Available'}
                </div>
                <div className="text-[11px] text-slate-300 font-sans">
                  Total OI: <span className="font-mono text-white font-bold">{(chainData.support_resistance?.s2?.total_oi ?? 0).toLocaleString()}</span>
                  <span className="text-slate-500 ml-1">({(chainData.support_resistance?.s2?.oi_change ?? 0) >= 0 ? '+' : ''}{(chainData.support_resistance?.s2?.oi_change ?? 0).toLocaleString()} chg)</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  {chainData.support_resistance?.s2?.reason ?? 'Substantial secondary Put OI concentration cushion below S1'}
                </p>
              </div>
            </div>
          </div>

          {/* Resistance Card: R1 and R2 */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[#232E47]">
              <span className="font-bold text-rose-400 text-sm flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>INSTITUTIONAL RESISTANCE ZONES</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Call OI Walls (R1 &amp; R2)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-[#121824] border border-rose-500/30 space-y-1">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-bold">R1</span>
                  Primary Resistance Strike:
                </span>
                <div className="text-2xl font-black text-rose-400">
                  {chainData.support_resistance?.r1?.strike?.toLocaleString() ?? chainData.support_resistance?.strong_resistance?.strike?.toLocaleString() ?? 'Not Available'}
                </div>
                <div className="text-[11px] text-slate-300 font-sans">
                  Total OI: <span className="font-mono text-white font-bold">{(chainData.support_resistance?.r1?.total_oi ?? 0).toLocaleString()}</span>
                  <span className="text-slate-500 ml-1">({(chainData.support_resistance?.r1?.oi_change ?? 0) >= 0 ? '+' : ''}{(chainData.support_resistance?.r1?.oi_change ?? 0).toLocaleString()} chg)</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  {chainData.support_resistance?.r1?.reason ?? chainData.support_resistance?.strong_resistance?.reason}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#121824] border border-rose-500/20 space-y-1">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 font-bold">R2</span>
                  Secondary Resistance Strike:
                </span>
                <div className="text-2xl font-black text-rose-300">
                  {chainData.support_resistance?.r2?.strike?.toLocaleString() ?? 'Not Available'}
                </div>
                <div className="text-[11px] text-slate-300 font-sans">
                  Total OI: <span className="font-mono text-white font-bold">{(chainData.support_resistance?.r2?.total_oi ?? 0).toLocaleString()}</span>
                  <span className="text-slate-500 ml-1">({(chainData.support_resistance?.r2?.oi_change ?? 0) >= 0 ? '+' : ''}{(chainData.support_resistance?.r2?.oi_change ?? 0).toLocaleString()} chg)</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  {chainData.support_resistance?.r2?.reason ?? 'Secondary Call OI supply ceiling above R1'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* S1 / S2 / R1 / R2 Master Comparison Table */}
      {activeTab === 'SUPPORT_RESISTANCE' && chainData?.support_resistance && (
        <div className="rounded-xl bg-[#0B0E14] border border-[#232E47] p-4 font-mono space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#232E47]">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>S1 / S2 / R1 / R2 Institutional Quantitative Support &amp; Resistance Matrix</span>
            </h4>
            <span className="text-[10px] text-slate-400">Spot: ₹{chainData.spot_price?.toLocaleString()}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#232E47] text-slate-400 text-left bg-[#121824]">
                  <th className="p-2.5">Level</th>
                  <th className="p-2.5">Strike</th>
                  <th className="p-2.5">Total OI</th>
                  <th className="p-2.5">OI Change</th>
                  <th className="p-2.5">Traded Volume</th>
                  <th className="p-2.5">Strength / Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232E47]">
                {[
                  { id: 'S1', data: chainData.support_resistance?.s1, isSupport: true },
                  { id: 'S2', data: chainData.support_resistance?.s2, isSupport: true },
                  { id: 'R1', data: chainData.support_resistance?.r1, isSupport: false },
                  { id: 'R2', data: chainData.support_resistance?.r2, isSupport: false },
                ].map(({ id, data, isSupport }) => (
                  <tr key={id} className="hover:bg-[#121824]/60 transition-colors">
                    <td className="p-2.5 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        isSupport ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {id}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-white text-sm">
                      {data?.strike ? `₹${data.strike.toLocaleString()}` : 'Not Available'}
                    </td>
                    <td className="p-2.5 font-bold text-slate-200">
                      {data?.total_oi ? data.total_oi.toLocaleString() : '—'}
                    </td>
                    <td className={`p-2.5 font-bold ${
                      (data?.oi_change || 0) > 0 ? (isSupport ? 'text-emerald-400' : 'text-rose-400') : (data?.oi_change || 0) < 0 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {data?.oi_change !== undefined ? `${data.oi_change >= 0 ? '+' : ''}${data.oi_change.toLocaleString()}` : '—'}
                    </td>
                    <td className="p-2.5 text-slate-300">
                      {data?.volume ? data.volume.toLocaleString() : '—'}
                    </td>
                    <td className="p-2.5 text-[11px]">
                      <span className={`font-semibold ${isSupport ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {data?.strength || 'Calculated'}
                      </span>
                      <span className="text-slate-400 block font-sans text-[10px] mt-0.5">
                        {data?.reason || (isSupport ? 'Eligible put OI support level' : 'Eligible call OI resistance level')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'SUPPORT_RESISTANCE' && technicalLevelsLoading && !technicalLevels && (
        <div className="p-6 rounded-xl bg-[#0B0E14] border border-[#232E47] text-center text-xs text-slate-400">
          Loading verified historical and intraday candle levels…
        </div>
      )}
      {activeTab === 'SUPPORT_RESISTANCE' && technicalLevelsError && (
        <div role="status" className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/40 text-amber-200 text-sm">
          Candle-based levels are unavailable: {technicalLevelsError}
        </div>
      )}
      {activeTab === 'SUPPORT_RESISTANCE' && technicalLevels && (
        <section className="rounded-xl bg-[#0B0E14] border border-[#232E47] p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#232E47] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Historical and Intraday Price Levels · {technicalLevels.symbol}</h3>
              <p className="text-[10px] text-slate-500 mt-1">Independent of option-chain availability. Levels are reference candidates, not guaranteed reversals.</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold ${technicalLevels.status === 'LIVE' ? 'text-emerald-400' : technicalLevels.status === 'STALE' ? 'text-amber-300' : 'text-slate-400'}`}>
                Underlying {technicalLevels.status}
              </span>
              <div className="text-[10px] text-slate-400 font-mono">Spot ₹{displayMetric(technicalLevels.spot_price)}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([['Support candidates', technicalLevels.supports, 'text-emerald-400'],
               ['Resistance candidates', technicalLevels.resistances, 'text-rose-400']] as const).map(([title, levels, color]) => (
              <div key={title} className="rounded-lg bg-[#121824] border border-[#232E47] p-3">
                <h4 className={`text-xs font-bold ${color} mb-2`}>{title}</h4>
                {levels.length ? levels.map((level: any) => (
                  <div key={level.kind} className="flex items-center justify-between gap-3 border-t border-[#232E47]/60 py-2 text-xs">
                    <div><span className="font-mono text-white">₹{displayMetric(level.value)}</span><span className="block text-[10px] text-slate-500">{level.kind.replace(/_/g, ' ')} · {level.source}</span></div>
                    <span className="text-[10px] text-slate-500">{level.timestamp ? new Date(level.timestamp).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}</span>
                  </div>
                )) : <p className="text-[11px] text-slate-500">No candle level on this side of spot yet.</p>}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">
            {technicalLevels.note} {technicalLevels.exchange_timestamp ? `Exchange ${new Date(technicalLevels.exchange_timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.` : 'Waiting for an underlying exchange tick.'}
          </p>
        </section>
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
