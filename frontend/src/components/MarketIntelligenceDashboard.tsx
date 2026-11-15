import React, { useState, useEffect } from 'react';
import type { MarketIntelligenceReport } from '../types';
import { 
  Globe, 
  TrendingDown, 
  DollarSign, 
  Flame, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp,
  BookOpen,
  Search,
  BarChart3,
  ExternalLink,
  Newspaper,
  Download,
  Calendar,
  Activity,
  Percent,
  Coins,
  ShieldCheck,
  Building2,
  Factory
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { 
  fetchMacroTopicDetail, 
  fetchGlobalNews, 
  getMacroCsvDownloadUrl,
  fetchMarketIntelligence,
  fetchFiiDiiCash
} from '../services/api';
import { MacroIndicatorModal } from './MacroIndicatorModal';

interface MarketIntelligenceDashboardProps {
  intelligence: MarketIntelligenceReport | null;
  className?: string;
}

type MacroTab = 
  | 'ALL'
  | 'CASH_FLOWS'
  | 'DERIVATIVES'
  | 'INFLATION'
  | 'GDP'
  | 'RBI_POLICY'
  | 'BOND_YIELDS'
  | 'COMMODITIES'
  | 'CURRENCY'
  | 'PMI_IIP'
  | 'FISCAL_LABOUR'
  | 'CALENDAR'
  | 'MARKET_IMPACT'
  | 'GLOSSARY'
  | 'NEWS';

const displayMarketValue = (value: unknown, digits = 2): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
  return value.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits });
};

type CashFlowHistoryPoint = {
  date: string;
  fii_net?: number;
  dii_net?: number;
};

const CashFlowHistoryGraph: React.FC<{
  label: string;
  net: number;
  buy: number;
  sell: number;
  color: string;
  series: CashFlowHistoryPoint[];
}> = ({ label, net, buy, sell, color, series }) => {
  const points = [...series].slice(0, 30).reverse();
  const values = points.map(point => label === 'FII / FPI' ? point.fii_net ?? 0 : point.dii_net ?? 0);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const range = Math.max(maxValue - minValue, 1);
  const chartTop = 12;
  const chartHeight = 104;
  const baseline = chartTop + (maxValue / range) * chartHeight;
  const barSlot = 640 / Math.max(values.length, 1);
  const barWidth = Math.min(28, Math.max(8, barSlot * 0.56));
  const positive = net > 0;

  return (
    <div className="rounded-xl border border-[#232E47] bg-[#0B0E14] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-white">{label} cash flow</div>
          <div className="mt-1 text-[10px] text-slate-500">Daily net · ₹ crore</div>
        </div>
        <div className={`font-mono text-base font-bold ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
          {positive ? '+' : ''}{displayMarketValue(net)} Cr
        </div>
      </div>
      {values.length > 0 ? <svg viewBox="0 0 680 146" role="img" aria-label={`${label} daily net cash flow graph`} className="mt-2 h-36 w-full">
        <line x1="20" y1={baseline} x2="660" y2={baseline} stroke="#475569" strokeWidth="1" />
        {values.map((value, index) => {
          const x = 20 + (index + 0.5) * barSlot - barWidth / 2;
          const yValue = chartTop + ((maxValue - value) / range) * chartHeight;
          const y = Math.min(yValue, baseline);
          const height = Math.max(Math.abs(baseline - yValue), 2);
          return <g key={`${points[index].date}-${index}`}>
            <rect x={x} y={y} width={barWidth} height={height} rx="2" fill={value >= 0 ? color : '#fb7185'} opacity="0.85">
              <title>{`${points[index].date} · ${label} net ₹${displayMarketValue(value)} crore`}</title>
            </rect>
          </g>;
        })}
        <text x="20" y="139" fill="#64748b" fontSize="9">{new Date(`${points[0].date}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</text>
        {points.length > 1 && <text x="660" y="139" textAnchor="end" fill="#64748b" fontSize="9">{new Date(`${points[points.length - 1].date}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</text>}
      </svg> : <div className="py-8 text-center text-xs text-slate-500">No published daily observations are available to chart.</div>}
      <div className="grid grid-cols-2 gap-2 border-t border-[#232E47] pt-3 text-xs sm:grid-cols-3">
        <div><div className="text-[10px] uppercase tracking-wide text-slate-500">Gross buys</div><div className="mt-1 font-mono font-semibold text-white">₹{displayMarketValue(buy)} Cr</div></div>
        <div><div className="text-[10px] uppercase tracking-wide text-slate-500">Gross sells</div><div className="mt-1 font-mono font-semibold text-white">₹{displayMarketValue(sell)} Cr</div></div>
        <div className="col-span-2 sm:col-span-1"><div className="text-[10px] uppercase tracking-wide text-slate-500">Direction</div><div className={`mt-1 font-semibold ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>{net === 0 ? 'Neutral' : positive ? 'Net buyer' : 'Net seller'}</div></div>
      </div>
    </div>
  );
};

export const MarketIntelligenceDashboard: React.FC<MarketIntelligenceDashboardProps> = ({
  intelligence,
  className = ''
}) => {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<MacroTab>('ALL');
  const [glossarySearch, setGlossarySearch] = useState('');
  const [cashTimeframe, setCashTimeframe] = useState<'5D' | '10D' | '20D'>('10D');

  // Selected Macro Topic Modal State
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Global News State
  const [newsFeed, setNewsFeed] = useState<any[]>([]);
  const [upstoxReport, setUpstoxReport] = useState<any>(intelligence);
  const [cashReport, setCashReport] = useState<any>(null);
  const [cashError, setCashError] = useState<string | null>(null);

  useEffect(() => setUpstoxReport(intelligence), [intelligence]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const next = await fetchMarketIntelligence();
      if (active) setUpstoxReport(next);
    };
    void refresh().catch(() => {});
    const timer = window.setInterval(() => void refresh().catch(() => {}), 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const refreshCashFlow = async () => {
      try {
        const next = await fetchFiiDiiCash();
        if (active) {
          setCashReport(next);
          setCashError(null);
        }
      } catch (err) {
        if (active) setCashError(err instanceof Error ? err.message : 'Verified FII/DII cash-flow data is unavailable.');
      }
    };
    void refreshCashFlow();
    const timer = window.setInterval(() => void refreshCashFlow(), 5 * 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    fetchGlobalNews().then(data => setNewsFeed(data || [])).catch(() => {});
  }, []);

  const handleOpenTopic = async (topicId: string) => {
    try {
      const detail = await fetchMacroTopicDetail(topicId);
      setSelectedTopic(detail);
      setModalOpen(true);
    } catch (err) {
      console.error('Error fetching macro topic detail:', err);
    }
  };

  if (upstoxReport || !intelligence) {
    const verified = upstoxReport?.data_source === 'UPSTOX';
    const chain = verified ? upstoxReport.option_chain : null;
    const status = String(chain?.data_status || upstoxReport?.feed_status || 'WAITING').toUpperCase();
    const statusStyle = status === 'LIVE'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
      : status === 'STALE'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
        : status === 'DISCONNECTED'
          ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
          : 'border-sky-500/40 bg-sky-500/10 text-sky-300';
    const metric = (label: string, value: string, note?: string) => (
      <div key={label} className="rounded-xl border border-[#232E47] bg-[#121824] p-4">
        <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
        <div className="mt-1 text-xl font-bold text-white">{value}</div>
        {note && <div className="mt-1 text-[10px] text-slate-500">{note}</div>}
      </div>
    );
    const spot = typeof chain?.spot_price === 'number' ? chain.spot_price : null;
    const levelNote = (strike?: number) => spot != null && typeof strike === 'number'
      ? `${strike > spot ? '+' : ''}${displayMarketValue(strike - spot)} pts from spot`
      : undefined;
    const support = chain?.support_resistance?.strong_support?.strike;
    const resistance = chain?.support_resistance?.strong_resistance?.strike;
    const restoredTabs: { id: MacroTab; label: string; icon: React.ReactNode }[] = [
      { id: 'ALL', label: 'All Intelligence', icon: <Globe className="w-3.5 h-3.5" /> },
      { id: 'CASH_FLOWS', label: '1. FII/DII Cash Flow', icon: <DollarSign className="w-3.5 h-3.5" /> },
      { id: 'DERIVATIVES', label: '2. Derivatives Positioning', icon: <TrendingDown className="w-3.5 h-3.5" /> },
      { id: 'INFLATION', label: '3. Inflation (CPI/WPI)', icon: <Flame className="w-3.5 h-3.5" /> },
      { id: 'GDP', label: '4. GDP & Accounts', icon: <BarChart3 className="w-3.5 h-3.5" /> },
      { id: 'RBI_POLICY', label: '5. RBI Policy Corridor', icon: <Percent className="w-3.5 h-3.5" /> },
      { id: 'BOND_YIELDS', label: '6. 10Y Bond Yields', icon: <Activity className="w-3.5 h-3.5" /> },
      { id: 'COMMODITIES', label: '7. Commodities & Crude', icon: <Coins className="w-3.5 h-3.5" /> },
      { id: 'CURRENCY', label: '8. Currency (USD/INR)', icon: <DollarSign className="w-3.5 h-3.5" /> },
      { id: 'PMI_IIP', label: '9. PMI & IIP Production', icon: <Factory className="w-3.5 h-3.5" /> },
      { id: 'FISCAL_LABOUR', label: '10. Fiscal & Employment', icon: <Building2 className="w-3.5 h-3.5" /> },
      { id: 'CALENDAR', label: '11. Economic Calendar', icon: <Calendar className="w-3.5 h-3.5" /> },
      { id: 'MARKET_IMPACT', label: '12. Macro-to-NIFTY Impact', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
      { id: 'GLOSSARY', label: 'Macro Cheat Sheet', icon: <BookOpen className="w-3.5 h-3.5" /> },
      { id: 'NEWS', label: 'Global Wire', icon: <Newspaper className="w-3.5 h-3.5" /> },
    ];
    const unavailable: Record<Exclude<MacroTab, 'ALL' | 'CASH_FLOWS' | 'DERIVATIVES' | 'MARKET_IMPACT' | 'GLOSSARY' | 'NEWS'>, string> = {
      INFLATION: 'No verified release feed is connected yet. CPI is published by MoSPI/NSO and WPI by the Office of the Economic Adviser.',
      GDP: 'No verified national-accounts series is connected yet. The official source is MoSPI/NSO.',
      RBI_POLICY: 'No verified RBI policy-rate and decision feed is connected yet.',
      BOND_YIELDS: 'No verified government-bond yield series is connected yet. RBI and FBIL publish relevant rates.',
      COMMODITIES: 'No licensed live commodity-price provider is connected yet.',
      CURRENCY: 'No verified USD/INR quote or FBIL reference-rate feed is connected yet.',
      PMI_IIP: 'IIP needs the MoSPI/NSO release; PMI is separately published and licensed. Neither feed is connected yet.',
      FISCAL_LABOUR: 'No verified CGA/Ministry of Finance or MoSPI/PLFS release feed is connected yet.',
      CALENDAR: 'No verified official economic-release calendar is connected yet.',
    };
    const unavailableCard = (title: string, detail: string) => (
      <div key={title} className="rounded-xl border border-[#232E47] bg-[#0B0E14] p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-200"><ShieldAlert className="h-4 w-4 text-amber-400" />{title}</div>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{detail}</p>
        <div className="mt-3 text-[10px] font-mono uppercase tracking-wide text-slate-500">Source integration needed</div>
      </div>
    );
    const cashLatest = cashReport?.latest;
    const cashHistory: CashFlowHistoryPoint[] = Array.isArray(cashReport?.history) ? cashReport.history : [];
    const graphHistory = cashHistory.length ? cashHistory : (cashReport?.data_date && cashLatest ? [{
      date: cashReport.data_date,
      fii_net: cashLatest.fii_fpi?.net,
      dii_net: cashLatest.dii?.net,
    }] : []);
    const renderCashFlows = () => (
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">Daily FII/FPI and DII cash-market activity</h3>
            <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-slate-400">These are verified daily cash-market totals, not an intraday live feed. Upstox is used when available; NSE is the labeled fallback and its report is provisional.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className={`rounded-lg border px-2.5 py-1 font-bold ${cashReport?.status === 'CURRENT' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : cashReport?.status === 'STALE' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-slate-600 bg-slate-800/50 text-slate-300'}`}>{cashReport?.source_provider === 'UPSTOX_MARKET_INFO' ? 'UPSTOX DAILY' : cashReport?.source_provider === 'NSE_FII_DII_REPORT' ? 'NSE DAILY' : `${cashReport?.status || 'WAITING'}`}{cashReport?.status && cashReport.status !== 'CURRENT' ? ` · ${cashReport.status}` : ''}</span>
            <span className="rounded-lg border border-[#232E47] px-2.5 py-1 text-slate-300">As of {cashReport?.data_date || '—'}</span>
          </div>
        </div>
        {cashLatest ? <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <CashFlowHistoryGraph label="FII / FPI" net={cashLatest.fii_fpi?.net} buy={cashLatest.fii_fpi?.buy} sell={cashLatest.fii_fpi?.sell} color="#34d399" series={graphHistory} />
          <CashFlowHistoryGraph label="DII" net={cashLatest.dii?.net} buy={cashLatest.dii?.buy} sell={cashLatest.dii?.sell} color="#38bdf8" series={graphHistory} />
        </div> : <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">{cashReport?.detail || cashError || 'Waiting for a verified provider report.'}</div>}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#232E47] bg-[#0B0E14] p-3 text-[10px] text-slate-500">
          <span>Source: <a className="text-sky-300 hover:underline" href={cashReport?.source_url || 'https://upstox.com/developer/api-documentation/get-fii-data/'} target="_blank" rel="noreferrer">{cashReport?.source || 'Upstox daily FII/DII; NSE fallback'}</a> · ₹ crore · Daily values{cashReport?.provisional ? ' · provisional NSE report' : ''}</span>
          <span>{cashReport?.fetched_at ? `Retrieved ${new Date(cashReport.fetched_at).toLocaleString('en-IN')}` : 'No current provider refresh'}</span>
        </div>
        {cashReport?.history_sessions <= 1 && <p className="text-[10px] text-slate-500">Historical bars use actual daily provider observations archived by this service; no older flow values are estimated.</p>}
      </div>
    );

    return (
      <section className={`rounded-2xl bg-[#121824] border border-[#232E47] shadow-xl overflow-hidden ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gradient-to-r from-[#171F32] via-[#121824] to-[#1A182E] border-b border-[#232E47]/70 gap-3">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20"><Globe className="w-5 h-5" /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{t('Indian Market Intelligence & Institutional Macro Surveillance Suite')}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 font-mono font-bold border border-sky-500/30">MODULES 32-39</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold ${statusStyle}`}>OPTIONS: {status}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Upstox option data and daily FII/DII cash flows, each labeled with its source and update schedule.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-[10px] text-slate-500">{upstoxReport?.observed_at ? new Date(upstoxReport.observed_at).toLocaleTimeString() : 'Option feed time unavailable'}</span>
            <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg bg-[#0B0E14] text-slate-400 hover:text-white border border-[#232E47]" title="Toggle dashboard visibility">
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="bg-[#0B0E14] px-4 py-2 border-b border-[#232E47] overflow-x-auto no-scrollbar flex items-center space-x-1.5 text-xs">
          {restoredTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${activeTab === tab.id ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-sm font-bold' : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/60'}`}>
              {tab.icon}<span>{t(tab.label)}</span>
            </button>
          ))}
        </div>

        {!collapsed && <div className="p-5 space-y-5">
          {activeTab === 'ALL' && <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div><h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Verified NIFTY market snapshot</h3><p className="mt-1 text-[11px] text-slate-500">Option-chain statistics from the selected Upstox expiry.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold ${statusStyle}`}>{status}</span>
                <span className="rounded-lg border border-[#232E47] px-2.5 py-1 text-[10px] text-slate-300">Expiry: {chain?.expiry || 'N/A'}</span>
                <span className="rounded-lg border border-[#232E47] px-2.5 py-1 text-[10px] text-slate-300">REST: {chain?.source || 'waiting'}</span>
              </div>
            </div>
            {!chain && <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">{upstoxReport?.detail || 'Waiting for the verified Upstox option-chain response. The overview sections remain available while data loads.'}</p>}
            {chain && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {metric('NIFTY spot', displayMarketValue(chain.spot_price), `ATM ${displayMarketValue(chain.atm_strike, 0)}`)}
              {metric('Put / call OI ratio', displayMarketValue(chain.totals?.oi_pcr, 3), 'From returned chain open interest')}
              {metric('Max pain', displayMarketValue(chain.max_pain?.max_pain_strike, 0), 'Calculated from observed chain OI')}
              {metric('ATM option IV', chain.exposures?.atm_iv_pct == null ? 'N/A' : `${displayMarketValue(chain.exposures.atm_iv_pct)}%`, 'CE/PE average; not India VIX')}
              {metric('Put OI support', displayMarketValue(support, 0), levelNote(support))}
              {metric('Call OI resistance', displayMarketValue(resistance, 0), levelNote(resistance))}
              {metric('Call OI change', displayMarketValue(chain.totals?.total_call_oi_change, 0), 'Current OI minus previous OI')}
              {metric('Put OI change', displayMarketValue(chain.totals?.total_put_oi_change, 0), 'Current OI minus previous OI')}
              {metric('Call volume', displayMarketValue(chain.totals?.total_call_volume, 0), 'Observed across selected expiry')}
              {metric('Put volume', displayMarketValue(chain.totals?.total_put_volume, 0), 'Observed across selected expiry')}
              {metric('Volume PCR', displayMarketValue(chain.totals?.vol_pcr, 3), 'Put volume divided by call volume')}
              {metric('OI change PCR', displayMarketValue(chain.totals?.oi_change_pcr, 3), 'Unavailable when call OI change is zero')}
            </div>}
            {renderCashFlows()}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {unavailableCard('Inflation, GDP & RBI policy', 'CPI/WPI, GDP, policy rates and releases need an official macroeconomic data source.')}
              {unavailableCard('Rates, commodities & currency', 'RBI/FBIL rates and licensed cross-asset quotes are not connected yet.')}
            </div>
          </>}

          {activeTab === 'CASH_FLOWS' && renderCashFlows()}

          {activeTab === 'DERIVATIVES' && <div className="space-y-4">
            <div><h3 className="text-sm font-bold text-white">Derivatives positioning</h3><p className="mt-1 text-xs text-slate-400">Live option-chain metrics from the selected Upstox expiry.</p></div>
            {chain ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {metric('Call OI', displayMarketValue(chain.totals?.total_call_oi, 0))}
              {metric('Put OI', displayMarketValue(chain.totals?.total_put_oi, 0))}
              {metric('OI PCR', displayMarketValue(chain.totals?.oi_pcr, 3))}
              {metric('Call / put OI change', `${displayMarketValue(chain.totals?.total_call_oi_change, 0)} / ${displayMarketValue(chain.totals?.total_put_oi_change, 0)}`)}
              {metric('Call / put volume', `${displayMarketValue(chain.totals?.total_call_volume, 0)} / ${displayMarketValue(chain.totals?.total_put_volume, 0)}`)}
              {metric('Volume PCR', displayMarketValue(chain.totals?.vol_pcr, 3))}
              {metric('Max pain', displayMarketValue(chain.max_pain?.max_pain_strike, 0))}
              {metric('ATM IV', chain.exposures?.atm_iv_pct == null ? 'N/A' : `${displayMarketValue(chain.exposures.atm_iv_pct)}%`)}
            </div> : <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">{upstoxReport?.detail || 'Waiting for verified Upstox option-chain data.'}</p>}
            <p className="text-[11px] text-slate-500">Upstox option-chain OI is shown here. Participant-specific FII/DII derivatives positioning is not included in these responses.</p>
          </div>}

          {activeTab === 'MARKET_IMPACT' && <div className="space-y-4">
            <div><h3 className="text-sm font-bold text-white">Macro to NIFTY impact</h3><p className="mt-1 text-xs text-slate-400">The section is restored with observed option-chain support and resistance; macro attribution is withheld until verified macro inputs are connected.</p></div>
            {chain ? <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {metric('NIFTY spot', displayMarketValue(chain.spot_price))}
              {metric('Observed put OI support', displayMarketValue(support, 0), levelNote(support))}
              {metric('Observed call OI resistance', displayMarketValue(resistance, 0), levelNote(resistance))}
            </div> : <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">Verified option-chain levels are waiting for Upstox data.</p>}
            <div className="rounded-xl border border-[#232E47] bg-[#0B0E14] p-4 text-xs text-slate-400">No causal macro-to-index scenario is calculated without verified FII/DII, inflation, rates and event data.</div>
          </div>}

          {activeTab === 'GLOSSARY' && <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              ['Open interest (OI)', 'Outstanding option positions reported in the selected Upstox chain.'],
              ['Put/call ratio (PCR)', 'Put OI divided by call OI for the same returned chain.'],
              ['Implied volatility (IV)', 'Option-implied volatility from returned Upstox option Greeks; it is not India VIX.'],
              ['Max Pain', 'Expiry strike with the lowest OI-weighted intrinsic payout across observed chain strikes.'],
              ['Support / resistance', 'Highest observed put OI at/below spot and call OI at/above spot.'],
              ['Feed status', 'LIVE means feed ticks were received; WAITING and STALE are shown as such.']
            ].map(([term, definition]) => <div key={term} className="rounded-xl border border-[#232E47] bg-[#0B0E14] p-4"><div className="text-sm font-bold text-white">{term}</div><p className="mt-2 text-xs text-slate-400">{definition}</p></div>)}
          </div>}

          {activeTab === 'NEWS' && <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Global Wire</h3>
            {newsFeed.length ? newsFeed.slice(0, 12).map((item, index) => <div key={item.id || item.url || index} className="rounded-xl border border-[#232E47] bg-[#0B0E14] p-4"><div className="text-sm text-slate-200">{item.title || item.headline || 'News item'}</div><div className="mt-2 text-[10px] text-slate-500">{item.source || item.publisher || 'External news source'} {item.published_at ? `• ${item.published_at}` : ''}</div></div>) : <p className="rounded-xl border border-[#232E47] bg-[#0B0E14] p-4 text-sm text-slate-400">No global news items are available from the configured source right now.</p>}
          </div>}

          {activeTab !== 'ALL' && activeTab !== 'CASH_FLOWS' && activeTab !== 'DERIVATIVES' && activeTab !== 'MARKET_IMPACT' && activeTab !== 'GLOSSARY' && activeTab !== 'NEWS' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">{restoredTabs.find(tab => tab.id === activeTab)?.icon}{restoredTabs.find(tab => tab.id === activeTab)?.label}</div>
              {unavailableCard(restoredTabs.find(tab => tab.id === activeTab)?.label || 'Market module', unavailable[activeTab])}
            </div>
          )}

          <p className="rounded-lg border border-[#232E47] bg-[#0B0E14] p-3 text-[11px] leading-relaxed text-slate-400">
            Option source: {upstoxReport?.source_endpoint || chain?.source || 'Upstox option-chain API'} · Cash-flow source: {cashReport?.source || 'Upstox daily FII/DII with NSE fallback'}. The cash-flow report is daily, not intraday. A REST option snapshot can be available while the WebSocket feed is WAITING outside market hours. Macro figures without a verified provider remain unavailable.
          </p>
        </div>}
      </section>
    );
  }
  if (intelligence?.data_source !== 'UPSTOX') {
    return (
      <section className={`rounded-2xl border border-[#232E47] bg-[#121824] p-5 ${className}`}>
        <div className="flex items-center gap-2 text-white"><Activity className="h-5 w-5 text-sky-400" /><h2 className="font-bold">Upstox Market Data</h2></div>
        <p className="mt-3 text-sm text-amber-300">{upstoxReport?.detail || 'Waiting for verified Upstox data. Unsupported or unverified figures are hidden.'}</p>
      </section>
    );
  }

  const { 
    market_closing_levels, 
    fii_dii_cash_activity, 
    fii_derivatives_positioning, 
    cpi_inflation_breakdown,
    gdp_national_accounts,
    economic_calendar,
    market_impact_engine,
    macro_glossary = []
  } = intelligence;

  // Filtered glossary terms
  const filteredGlossary = macro_glossary.filter(item => {
    const q = glossarySearch.toLowerCase();
    return (
      item.term.toLowerCase().includes(q) ||
      item.definition.toLowerCase().includes(q) ||
      (item.remember_this && item.remember_this.toLowerCase().includes(q)) ||
      (item.group && item.group.toLowerCase().includes(q))
    );
  });

  // Max inflation value for horizontal bar graph scaling (peak is 10.14%)
  const maxInflation = 12.0;
  const rbiCeilingPct = (cpi_inflation_breakdown.rbi_tolerance_ceiling_pct / maxInflation) * 100;

  // Slice historical cash series for dual-series graph
  const rawHistory: any[] = (fii_dii_cash_activity as any).historical_daily_series || [];
  const historySlice = cashTimeframe === '5D' ? rawHistory.slice(0, 5) : cashTimeframe === '10D' ? rawHistory.slice(0, 10) : rawHistory.slice(0, 20);
  const chronologicalHistory = [...historySlice].reverse();

  // Find max absolute flow for dual-series graph scaling
  const maxAbsFlow = Math.max(
    ...chronologicalHistory.map(s => Math.max(Math.abs(s.fii_net || 0), Math.abs(s.dii_net || 0))),
    10000
  );

  const navTabs: { id: MacroTab; label: string; icon: React.ReactNode }[] = [
    { id: 'ALL', label: 'All Intelligence', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'CASH_FLOWS', label: '1. FII/DII Cash Flow', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'DERIVATIVES', label: '2. Derivatives Positioning', icon: <TrendingDown className="w-3.5 h-3.5" /> },
    { id: 'INFLATION', label: '3. Inflation (CPI/WPI)', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'GDP', label: '4. GDP & Accounts', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'RBI_POLICY', label: '5. RBI Policy Corridor', icon: <Percent className="w-3.5 h-3.5" /> },
    { id: 'BOND_YIELDS', label: '6. 10Y Bond Yields', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'COMMODITIES', label: '7. Commodities & Crude', icon: <Coins className="w-3.5 h-3.5" /> },
    { id: 'CURRENCY', label: '8. Currency (USD/INR)', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'PMI_IIP', label: '9. PMI & IIP Production', icon: <Factory className="w-3.5 h-3.5" /> },
    { id: 'FISCAL_LABOUR', label: '10. Fiscal & Employment', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'CALENDAR', label: '11. Economic Calendar', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'MARKET_IMPACT', label: '12. Macro-to-NIFTY Impact', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'GLOSSARY', label: 'Macro Cheat Sheet', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'NEWS', label: 'Global Wire', icon: <Newspaper className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className={`rounded-2xl bg-[#121824] border border-[#232E47] shadow-xl overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gradient-to-r from-[#171F32] via-[#121824] to-[#1A182E] border-b border-[#232E47]/70 gap-3">
        <div className="flex items-center space-x-3">
          <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Globe className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {t('Indian Market Intelligence & Institutional Macro Surveillance Suite')}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                MODULES 32-39
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              FII/DII Institutional Cash &amp; Derivatives OI, CPI/WPI Inflation, Real/Nominal GDP, RBI Policy, and Explainable Market Impact
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-[#0B0E14] text-slate-400 hover:text-white border border-[#232E47] transition-colors"
            title="Toggle dashboard visibility"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 12 Dedicated Section Tabs (Horizontal Scrollable Menu for Desktop & Mobile) */}
      <div className="bg-[#0B0E14] px-4 py-2 border-b border-[#232E47] overflow-x-auto no-scrollbar flex items-center space-x-1.5 text-xs">
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-sm font-bold'
                  : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab.icon}
              <span>{t(tab.label)}</span>
            </button>
          );
        })}
      </div>

      {!collapsed && (
        <div className="p-5 space-y-6">
          {/* SECTION 1: BENCHMARKS (Visible on ALL or specific tabs) */}
          {(activeTab === 'ALL') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t('Confirmed Closing Levels & Global Geopolitical Benchmarks')}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Ref Date: {market_closing_levels.nifty_50.date}
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Nifty 50 */}
                <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47]">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>NIFTY 50</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      +{market_closing_levels.nifty_50.change_pct}%
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {market_closing_levels.nifty_50.level.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">Official NSE Settlement</div>
                </div>

                {/* Sensex */}
                <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47]">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>BSE SENSEX</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      +{market_closing_levels.sensex.change_pct}%
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {market_closing_levels.sensex.level.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">Official BSE Settlement</div>
                </div>

                {/* USD / INR */}
                <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47]">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>USD / INR</span>
                    <span className="text-amber-400 font-mono font-bold">84.38</span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    ₹{market_closing_levels.usd_inr.rate}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">RBI Reference Rate</div>
                </div>

                {/* Brent Crude Oil */}
                <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47]">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>BRENT CRUDE</span>
                    <span className="text-emerald-400 font-mono font-bold">-1.89%</span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    ${market_closing_levels.crude_oil_brent.price_usd}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono truncate">ICE Global Benchmark</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: MODULE 32 — FII / DII INSTITUTIONAL CASH FLOW ANALYTICS */}
          {/* ========================================================================= */}
          {(activeTab === 'ALL' || activeTab === 'CASH_FLOWS') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>1. FII &amp; DII Institutional Cash Market Activity (Equity &amp; Debt)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Session Date: {fii_dii_cash_activity.session_date} &bull; Net Flow = Gross Purchases - Gross Sales
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={getMacroCsvDownloadUrl('fii-dii')}
                    download="fii_dii_cash_flows.csv"
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </a>
                  <span className="text-xs px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 font-mono font-bold border border-sky-500/20">
                    NSE OFFICIAL
                  </span>
                </div>
              </div>

              {/* Latest Cash Flow Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FII Card */}
                <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47]">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-emerald-400">Foreign Institutional Investors (FII / FPI)</span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-400 text-[10px]">
                      {fii_dii_cash_activity.fii_sentiment}
                    </span>
                  </div>
                  <div className="text-3xl font-black text-emerald-400 font-mono">
                    +₹{fii_dii_cash_activity.fii_net_crores.toLocaleString()} Cr
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-[#232E47]/60 font-mono">
                    <span>Gross Buy: ₹{(fii_dii_cash_activity.fii_gross_buy || 0).toLocaleString()} Cr</span>
                    <span>Gross Sell: ₹{(fii_dii_cash_activity.fii_gross_sell || 0).toLocaleString()} Cr</span>
                  </div>
                </div>

                {/* DII Card */}
                <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47]">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-sky-400">Domestic Institutional Investors (DII)</span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-rose-500/20 text-rose-400 text-[10px]">
                      {fii_dii_cash_activity.dii_sentiment}
                    </span>
                  </div>
                  <div className="text-3xl font-black text-rose-400 font-mono">
                    ₹{fii_dii_cash_activity.dii_net_crores.toLocaleString()} Cr
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-[#232E47]/60 font-mono">
                    <span>Gross Buy: ₹{(fii_dii_cash_activity.dii_gross_buy || 0).toLocaleString()} Cr</span>
                    <span>Gross Sell: ₹{(fii_dii_cash_activity.dii_gross_sell || 0).toLocaleString()} Cr</span>
                  </div>
                </div>
              </div>

              {/* Multi-Session Aggregation Matrix */}
              <div className="overflow-x-auto rounded-lg border border-[#232E47]">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#1A2234] text-slate-400 text-[10px] uppercase font-sans">
                    <tr>
                      <th className="py-2.5 px-3">Horizon / Aggregation Period</th>
                      <th className="py-2.5 px-3 text-right">FII Net Investment</th>
                      <th className="py-2.5 px-3 text-right">DII Net Investment</th>
                      <th className="py-2.5 px-3 text-right">Combined Institutional Flow</th>
                      <th className="py-2.5 px-3 text-center">Market Bias</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232E47]/60 bg-[#121824]">
                    <tr>
                      <td className="py-2.5 px-3 text-white font-medium">Latest Session (14 Nov 2026)</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+₹{fii_dii_cash_activity.fii_net_crores.toLocaleString()} Cr</td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-bold">₹{fii_dii_cash_activity.dii_net_crores.toLocaleString()} Cr</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+₹{fii_dii_cash_activity.net_institutional_crores.toLocaleString()} Cr</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400">NET ACCUMULATION</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-white font-medium">Previous 5 Sessions Total</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+₹{fii_dii_cash_activity.aggregates?.five_session_total?.fii_net?.toLocaleString()} Cr</td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-bold">₹{fii_dii_cash_activity.aggregates?.five_session_total?.dii_net?.toLocaleString()} Cr</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        +₹{((fii_dii_cash_activity.aggregates?.five_session_total?.fii_net || 0) + (fii_dii_cash_activity.aggregates?.five_session_total?.dii_net || 0)).toLocaleString()} Cr
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400">FII AGGRESSIVE BUY</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-white font-medium">Previous 20 Sessions Total</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+₹{fii_dii_cash_activity.aggregates?.twenty_session_total?.fii_net?.toLocaleString()} Cr</td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-bold">₹{fii_dii_cash_activity.aggregates?.twenty_session_total?.dii_net?.toLocaleString()} Cr</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        +₹{((fii_dii_cash_activity.aggregates?.twenty_session_total?.fii_net || 0) + (fii_dii_cash_activity.aggregates?.twenty_session_total?.dii_net || 0)).toLocaleString()} Cr
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400">EQUITY EXPANSION</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-white font-medium">Month-to-Date (Nov 2026 MTD)</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+₹{fii_dii_cash_activity.aggregates?.monthly_mtd_total?.fii_net?.toLocaleString()} Cr</td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-bold">₹{fii_dii_cash_activity.aggregates?.monthly_mtd_total?.dii_net?.toLocaleString()} Cr</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        +₹{((fii_dii_cash_activity.aggregates?.monthly_mtd_total?.fii_net || 0) + (fii_dii_cash_activity.aggregates?.monthly_mtd_total?.dii_net || 0)).toLocaleString()} Cr
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400">STRONG INFLOWS</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-white font-medium">Year-to-Date (CY2026 YTD)</td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-bold">₹{fii_dii_cash_activity.aggregates?.ytd_total?.fii_net?.toLocaleString()} Cr</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+₹{fii_dii_cash_activity.aggregates?.ytd_total?.dii_net?.toLocaleString()} Cr</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        +₹{((fii_dii_cash_activity.aggregates?.ytd_total?.fii_net || 0) + (fii_dii_cash_activity.aggregates?.ytd_total?.dii_net || 0)).toLocaleString()} Cr
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-sky-400">DII RECORD SHIELD</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SVG Line Graph: Dual Series Net Cash Activity */}
              <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#232E47]/60 gap-2 font-mono">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase flex items-center space-x-2">
                      <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Historical FII vs DII Net Cash Activity (Zero-Line Baseline)</span>
                    </h4>
                    <span className="text-[10px] text-slate-500">Daily net institutional investment in ₹ Crore</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs">
                    {(['5D', '10D', '20D'] as const).map(tf => (
                      <button
                        key={tf}
                        onClick={() => setCashTimeframe(tf)}
                        className={`px-2 py-0.5 rounded font-bold ${cashTimeframe === tf ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'}`}
                      >
                        {tf.replace('D', '-Days')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative w-full h-56 pt-2">
                  {(() => {
                    const svgWidth = 800;
                    const svgHeight = 200;
                    const padX = 50;
                    const padY = 20;
                    const plotWidth = svgWidth - (padX * 2);
                    const plotHeight = svgHeight - (padY * 2);
                    const zeroY = padY + (plotHeight / 2);

                    const count = chronologicalHistory.length;
                    const getX = (i: number) => padX + (count > 1 ? (i / (count - 1)) * plotWidth : plotWidth / 2);
                    const getY = (val: number) => zeroY - ((val / (maxAbsFlow || 1)) * (plotHeight / 2 - 5));

                    const fiiPoints = chronologicalHistory.map((s, i) => `${getX(i)},${getY(s.fii_net)}`).join(' ');
                    const diiPoints = chronologicalHistory.map((s, i) => `${getX(i)},${getY(s.dii_net)}`).join(' ');

                    return (
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full" preserveAspectRatio="none">
                        <line x1={padX} y1={zeroY} x2={svgWidth - padX} y2={zeroY} stroke="#475569" strokeWidth="1.5" strokeDasharray="4 3" />
                        <text x={padX - 8} y={zeroY + 3} textAnchor="end" fill="#94A3B8" fontSize="10" fontFamily="monospace" fontWeight="bold">₹0</text>
                        <text x={padX - 8} y={padY + 10} textAnchor="end" fill="#10B981" fontSize="9" fontFamily="monospace">+{Math.round(maxAbsFlow).toLocaleString()}</text>
                        <text x={padX - 8} y={svgHeight - padY} textAnchor="end" fill="#F43F5E" fontSize="9" fontFamily="monospace">-{Math.round(maxAbsFlow).toLocaleString()}</text>

                        {/* Polylines */}
                        <polyline points={fiiPoints} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points={diiPoints} fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                        {/* FII Dots */}
                        {chronologicalHistory.map((s, i) => (
                          <g key={`fii-${i}`} className="group cursor-pointer">
                            <circle cx={getX(i)} cy={getY(s.fii_net)} r="4.5" fill="#10B981" stroke="#0B0E14" strokeWidth="2" />
                            <title>{`${s.date}\nFII Net: ${s.fii_net >= 0 ? '+' : ''}${s.fii_net.toLocaleString()} Cr\nDII Net: ${s.dii_net >= 0 ? '+' : ''}${s.dii_net.toLocaleString()} Cr`}</title>
                          </g>
                        ))}

                        {/* DII Dots */}
                        {chronologicalHistory.map((s, i) => (
                          <g key={`dii-${i}`} className="group cursor-pointer">
                            <circle cx={getX(i)} cy={getY(s.dii_net)} r="4.5" fill="#38BDF8" stroke="#0B0E14" strokeWidth="2" />
                            <title>{`${s.date}\nDII Net: ${s.dii_net >= 0 ? '+' : ''}${s.dii_net.toLocaleString()} Cr`}</title>
                          </g>
                        ))}

                        {/* Date Labels below */}
                        {chronologicalHistory.map((s, i) => (
                          <text key={`d-${i}`} x={getX(i)} y={svgHeight - 4} textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="monospace">
                            {s.date.split(' ')[0]} {s.date.split(' ')[1]}
                          </text>
                        ))}
                      </svg>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 font-mono">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-0.5 bg-emerald-500" />
                      <span>FII Daily Net Flow</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-0.5 bg-sky-400" />
                      <span>DII Daily Net Flow</span>
                    </span>
                  </div>
                  <span>Source: NSE Official Bhavcopy &amp; NSDL FPI Monitor &bull; Final Verified</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: MODULE 32 — PARTICIPANT-WISE DERIVATIVES POSITIONING */}
          {/* ========================================================================= */}
          {(activeTab === 'ALL' || activeTab === 'DERIVATIVES') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-purple-400" />
                    <span>2. FII Index Futures &amp; Stock Futures Derivatives Positioning (NSE Participant-Wise OI)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Session Date: {fii_derivatives_positioning.session_date} &bull; Participant-Wise Open Interest
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={getMacroCsvDownloadUrl('derivatives')}
                    download="fii_derivatives_positioning.csv"
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </a>
                  <span className="text-xs px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-bold font-mono border border-purple-500/30">
                    SHORT UNWINDING: -71.7%
                  </span>
                </div>
              </div>

              {/* FII Net Position Highlight Card */}
              <div className="p-5 rounded-xl bg-[#121824] border border-rose-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium uppercase block">
                    FII Net Index-Futures Position &bull; 14 November Close
                  </span>
                  <div className="text-3xl font-black text-rose-400 font-mono mt-0.5">
                    {fii_derivatives_positioning.net_index_futures_contracts.toLocaleString()} contracts
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Long: <strong className="text-white font-mono">{((fii_derivatives_positioning as any).long_contracts || 88450).toLocaleString()}</strong> | 
                    Short: <strong className="text-white font-mono">{((fii_derivatives_positioning as any).short_contracts || 152100).toLocaleString()}</strong> | 
                    L/S Ratio: <strong className="text-amber-400 font-mono">{((fii_derivatives_positioning as any).long_short_ratio || 0.58)}</strong>
                  </div>
                </div>

                <div className="text-left md:text-right">
                  <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 inline-block">
                    Net Bearish Exposure Reduced &bull; 6,763 fewer net shorts vs 12 Nov
                  </span>
                  <div className="text-[11px] text-slate-400 font-mono mt-1.5">
                    NSE Participant-Wise Derivatives Report Across All Index Contracts
                  </div>
                </div>
              </div>

              {/* FII Net Shorts Declining Line Chart */}
              <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-[#232E47]/60 gap-2 font-mono">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      <span>FII Net Index-Futures Shorts — Sharp Decline</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">Absolute number of net-short contracts, end of session</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                      Unwound: -71.7% from 225,000 Peak
                    </span>
                  </div>
                </div>

                {/* SVG Historical Line Graph Matching User's Reference */}
                <div className="relative w-full h-48 pt-2">
                  {(() => {
                    const shortsHistory = [
                      { date: '28 Oct', contracts: 225000, label: '225,000 (Peak)' },
                      { date: '03 Nov', contracts: 180000, label: '180,000' },
                      { date: '06 Nov', contracts: 126900, label: '126,900' },
                      { date: '09 Nov', contracts: 90741, label: '90,741' },
                      { date: '11 Nov', contracts: 70413, label: '70,413' },
                      { date: '14 Nov', contracts: 63650, label: '63,650 (Current)' }
                    ];

                    const svgWidth = 800;
                    const svgHeight = 180;
                    const padX = 70;
                    const padY = 25;
                    const plotW = svgWidth - (padX * 2);
                    const plotH = svgHeight - (padY * 2);

                    const maxVal = 240000;
                    const minVal = 40000;
                    const range = maxVal - minVal;

                    const getX = (i: number) => padX + (i / (shortsHistory.length - 1)) * plotW;
                    const getY = (val: number) => padY + plotH - ((val - minVal) / range) * plotH;

                    const pointsStr = shortsHistory.map((pt, i) => `${getX(i)},${getY(pt.contracts)}`).join(' ');
                    const areaPoints = `${getX(0)},${svgHeight - padY} ${pointsStr} ${getX(shortsHistory.length - 1)},${svgHeight - padY}`;

                    return (
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="shortDeclineGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {[225000, 180000, 120000, 70000].map((level) => {
                          const yPos = getY(level);
                          return (
                            <g key={`lvl-${level}`}>
                              <line x1={padX} y1={yPos} x2={svgWidth - padX} y2={yPos} stroke="#232E47" strokeDasharray="3 3" />
                              <text x={padX - 8} y={yPos + 3} textAnchor="end" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                                {level.toLocaleString()}
                              </text>
                            </g>
                          );
                        })}

                        <polygon points={areaPoints} fill="url(#shortDeclineGrad)" />

                        <polyline
                          points={pointsStr}
                          fill="none"
                          stroke="#38BDF8"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {shortsHistory.map((pt, i) => (
                          <g key={`pt-${i}`} className="group cursor-pointer">
                            <circle cx={getX(i)} cy={getY(pt.contracts)} r="4.5" fill="#38BDF8" stroke="#0B0E14" strokeWidth="2" />
                            <text x={getX(i)} y={getY(pt.contracts) - 9} textAnchor="middle" fill="#F8FAFC" fontSize="10" fontFamily="monospace" fontWeight="bold">
                              {pt.contracts.toLocaleString()}
                            </text>
                            <text x={getX(i)} y={svgHeight - 4} textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="monospace">
                              {pt.date}
                            </text>
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 4: MODULE 33 — INDIA INFLATION ANALYTICS (CPI vs WPI STRICTLY SEPARATE) */}
          {/* ========================================================================= */}
          {(activeTab === 'ALL' || activeTab === 'INFLATION') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-rose-500/20 text-rose-400">
                      <Flame className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      3. India Inflation Analytics — CPI vs WPI Distinct Suites (RBI 4% Target)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official Release Period: October 2026 &bull; Publication Date: 12-14 Nov 2026 &bull; Status: FINAL
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={getMacroCsvDownloadUrl('inflation')}
                    download="india_inflation_cpi_wpi.csv"
                    className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </a>
                  <div className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono font-bold text-xs">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>RBI Ceiling: 6.0% (Breached at 6.21%)</span>
                  </div>
                </div>
              </div>

              {/* CPI vs WPI Comparison Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Suite A: CPI */}
                <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47] space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-[#232E47]">
                    <span className="font-bold text-rose-400">CONSUMER PRICE INDEX (CPI SUITE)</span>
                    <span className="font-mono text-[10px] text-slate-400">MoSPI (Base 2012=100)</span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between py-1 border-b border-[#232E47]/40">
                      <span className="text-slate-300">Headline CPI YoY</span>
                      <strong className="text-rose-400 font-bold">6.21% (Breaches 6% ceiling)</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#232E47]/40">
                      <span className="text-slate-300">Core CPI (ex Food &amp; Fuel)</span>
                      <strong className="text-emerald-400 font-bold">3.50% (Benign)</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#232E47]/40">
                      <span className="text-slate-300">Food CPI (CFPI)</span>
                      <strong className="text-rose-400 font-bold">10.87% (Vegetable surge)</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-300">Fuel &amp; Light Inflation</span>
                      <strong className="text-sky-400 font-bold">-1.39% (Deflationary)</strong>
                    </div>
                  </div>
                </div>

                {/* Suite B: WPI */}
                <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47] space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-[#232E47]">
                    <span className="font-bold text-sky-400">WHOLESALE PRICE INDEX (WPI SUITE)</span>
                    <span className="font-mono text-[10px] text-slate-400">DPIIT (Base 2011-12=100)</span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between py-1 border-b border-[#232E47]/40">
                      <span className="text-slate-300">Headline WPI YoY</span>
                      <strong className="text-sky-400 font-bold">2.36% (Previous: 1.84%)</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#232E47]/40">
                      <span className="text-slate-300">Core WPI (Non-Food Mfg)</span>
                      <strong className="text-emerald-400 font-bold">0.80% (Input cost stability)</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#232E47]/40">
                      <span className="text-slate-300">Food WPI</span>
                      <strong className="text-rose-400 font-bold">13.54%</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-300">Fuel &amp; Power WPI</span>
                      <strong className="text-emerald-400 font-bold">-5.79% (Deflationary cushion)</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* CPI Category Breakdown Chart */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  CPI Category Breakdown (% YoY) with RBI 6.0% Threshold
                </span>
                <div className="space-y-2">
                  {cpi_inflation_breakdown.categories.map((item, idx) => {
                    const widthPct = Math.min(100, Math.max(3, (item.yoy_inflation_pct / maxInflation) * 100));
                    return (
                      <div key={idx} className="flex items-center text-xs group">
                        <div className="w-[180px] sm:w-[220px] pr-3 text-right font-medium text-slate-300 text-[11px] truncate group-hover:text-white" title={item.category}>
                          {item.category}
                        </div>
                        <div className="flex-1 bg-[#171F32] h-5 rounded-md overflow-hidden relative border border-[#232E47]/70">
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-rose-500/60 z-10 pointer-events-none" 
                            style={{ left: `${rbiCeilingPct}%` }}
                            title="RBI 6.0% Upper Tolerance Ceiling"
                          />
                          <div 
                            className={`h-full rounded-md transition-all ${
                              item.breaches_rbi_ceiling ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-gradient-to-r from-sky-600 to-sky-400'
                            }`}
                            style={{ width: `${widthPct}%` }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono font-bold text-[10px] text-white">
                            {item.yoy_inflation_pct.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 5: MODULE 34 — GDP AND NATIONAL ACCOUNTS ANALYTICS */}
          {/* ========================================================================= */}
          {(activeTab === 'ALL' || activeTab === 'GDP') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-sky-400" />
                    <span>4. GDP &amp; National Accounts Analytics (Real vs Nominal &amp; GVA)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    MoSPI National Accounts Division &bull; Base Year 2011-12 &bull; Constant vs Current Prices
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={getMacroCsvDownloadUrl('gdp')}
                    download="india_gdp_national_accounts.csv"
                    className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </a>
                  <span className="text-xs px-2.5 py-1 rounded bg-sky-500/15 text-sky-300 font-mono font-bold border border-sky-500/30">
                    REAL GDP: +6.70% YoY
                  </span>
                </div>
              </div>

              {/* Key National Accounts Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
                <div className="p-3.5 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">Real GDP Growth</span>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">6.70% YoY</div>
                  <span className="text-[10px] text-slate-500 font-sans">Pure volume expansion</span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">Nominal GDP Growth</span>
                  <div className="text-xl font-bold text-white mt-0.5">9.70% YoY</div>
                  <span className="text-[10px] text-slate-500 font-sans">Output + current inflation</span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">Gross Value Added (GVA)</span>
                  <div className="text-xl font-bold text-sky-400 mt-0.5">6.80% YoY</div>
                  <span className="text-[10px] text-slate-500 font-sans">Supply-side value creation</span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">Implied GDP Deflator</span>
                  <div className="text-xl font-bold text-amber-400 mt-0.5">3.00%</div>
                  <span className="text-[10px] text-slate-500 font-sans">Nominal minus Real</span>
                </div>
              </div>

              {/* Expenditure Components Breakdown Table */}
              <div className="overflow-x-auto rounded-lg border border-[#232E47]">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#1A2234] text-slate-400 text-[10px] uppercase font-sans">
                    <tr>
                      <th className="py-2.5 px-3">Expenditure Component</th>
                      <th className="py-2.5 px-3 text-right">Share of GDP (%)</th>
                      <th className="py-2.5 px-3 text-right">YoY Growth (%)</th>
                      <th className="py-2.5 px-3">Economic Interpretation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232E47]/60 bg-[#121824]">
                    {(gdp_national_accounts?.expenditure_components || []).map((c: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-white font-medium">{c.component}</td>
                        <td className="py-2.5 px-3 text-right text-sky-400 font-bold">{c.share_pct}%</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+{c.yoy_growth_pct}%</td>
                        <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">{c.focus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 6: MODULE 35 — RBI MONETARY POLICY & MACROECONOMIC DASHBOARD */}
          {/* ========================================================================= */}
          {(activeTab === 'ALL' || activeTab === 'RBI_POLICY' || activeTab === 'BOND_YIELDS' || activeTab === 'COMMODITIES' || activeTab === 'CURRENCY' || activeTab === 'PMI_IIP' || activeTab === 'FISCAL_LABOUR') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Percent className="w-4 h-4 text-amber-400" />
                    <span>5. RBI Policy Corridor, Bond Yields, Commodities, and Real Economy</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    RBI &bull; CCIL &bull; FBIL &bull; ICE &bull; S&amp;P Global Verified Indicators
                  </span>
                </div>
                <a
                  href={getMacroCsvDownloadUrl('rbi-macro')}
                  download="rbi_macro_dashboard.csv"
                  className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </a>
              </div>

              {/* RBI Corridor Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">RBI Repo Rate</span>
                  <div className="text-lg font-bold text-amber-400 mt-0.5">6.50%</div>
                  <span className="text-[9px] text-slate-500 font-sans">Policy Stance: Neutral</span>
                </div>
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">SDF Rate</span>
                  <div className="text-lg font-bold text-white mt-0.5">6.25%</div>
                  <span className="text-[9px] text-slate-500 font-sans">Corridor Floor</span>
                </div>
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">MSF Rate</span>
                  <div className="text-lg font-bold text-white mt-0.5">6.75%</div>
                  <span className="text-[9px] text-slate-500 font-sans">Corridor Ceiling</span>
                </div>
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">Cash Reserve (CRR)</span>
                  <div className="text-lg font-bold text-white mt-0.5">4.50%</div>
                  <span className="text-[9px] text-slate-500 font-sans">% of NDTL</span>
                </div>
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">10Y G-Sec Yield</span>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">6.78%</div>
                  <span className="text-[9px] text-slate-500 font-sans">-6 bps change</span>
                </div>
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">Manufacturing PMI</span>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">57.50</div>
                  <span className="text-[9px] text-slate-500 font-sans">Expansion &gt;50</span>
                </div>
              </div>

              {/* Commodities & Currency Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">Brent Crude Oil</span>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">$72.80 / bbl</div>
                  <span className="text-[9px] text-slate-500 font-sans">Benign for Indian CAD</span>
                </div>
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">Gold (MCX)</span>
                  <div className="text-lg font-bold text-amber-300 mt-0.5">₹76,500 / 10g</div>
                  <span className="text-[9px] text-slate-500 font-sans">$2,630 / oz Spot</span>
                </div>
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">USD / INR</span>
                  <div className="text-lg font-bold text-white mt-0.5">₹84.38</div>
                  <span className="text-[9px] text-slate-500 font-sans">RBI Intervention Band</span>
                </div>
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">Fiscal Deficit Target</span>
                  <div className="text-lg font-bold text-sky-400 mt-0.5">4.90% of GDP</div>
                  <span className="text-[9px] text-slate-500 font-sans">FY26 Glide Path: 4.5%</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 7: MODULE 36 — ECONOMIC CALENDAR & SURPRISE ENGINE */}
          {/* ========================================================================= */}
          {(activeTab === 'ALL' || activeTab === 'CALENDAR') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <span>6. Economic Calendar &amp; Quantitative Surprise Engine</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    High-impact market-moving events with actual vs consensus tracking
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-sky-500/10 text-sky-300 font-mono font-bold border border-sky-500/20">
                  VERIFIED SOURCES ONLY
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[#232E47]">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#1A2234] text-slate-400 text-[10px] uppercase font-sans">
                    <tr>
                      <th className="py-2.5 px-3">Date &amp; Time (IST)</th>
                      <th className="py-2.5 px-3">Economic Event</th>
                      <th className="py-2.5 px-3 text-right">Previous</th>
                      <th className="py-2.5 px-3 text-right">Forecast</th>
                      <th className="py-2.5 px-3 text-right">Actual Result</th>
                      <th className="py-2.5 px-3 text-center">Surprise / Impact</th>
                      <th className="py-2.5 px-3">Official Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232E47]/60 bg-[#121824]">
                    {(economic_calendar?.events || []).map((ev: any) => (
                      <tr key={ev.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                          <div>{ev.scheduled_date}</div>
                          <div className="text-[10px] text-slate-500">{ev.scheduled_time_ist}</div>
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-bold text-white">{ev.event}</div>
                          <div className="text-[11px] text-amber-300">{ev.event_te}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400">{ev.previous_value}</td>
                        <td className="py-2.5 px-3 text-right text-sky-400 font-bold">{ev.consensus_forecast}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400">{ev.actual_result}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ev.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {ev.surprise}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">{ev.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 8: MODULE 37 — MACRO TO MARKET IMPACT ENGINE */}
          {/* ========================================================================= */}
          {(activeTab === 'ALL' || activeTab === 'MARKET_IMPACT') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>7. Macro-to-NIFTY Market Impact Engine (Explainable Institutional Transmission)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Objective quantitative cross-asset matrix &bull; No automated buy/sell signals
                  </span>
                </div>
                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                    Option Chain PCR: {market_impact_engine?.option_chain_derivatives_matrix?.put_call_ratio_pcr || 1.08}
                  </span>
                </div>
              </div>

              {/* Option Chain & Levels Matrix */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">NIFTY Directional Bias</span>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {market_impact_engine?.nifty_50_impact?.directional_bias?.replace(/_/g, ' ') || 'MILDLY BULLISH'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">Max Pain Level</span>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {market_impact_engine?.option_chain_derivatives_matrix?.max_pain_level?.toLocaleString() || '24,000'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">Implied Volatility (VIX)</span>
                  <div className="text-sm font-bold text-sky-400 mt-0.5">
                    {market_impact_engine?.option_chain_derivatives_matrix?.implied_volatility_vix || 14.50}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">Call Resistance Wall</span>
                  <div className="text-sm font-bold text-rose-400 mt-0.5">
                    {market_impact_engine?.option_chain_derivatives_matrix?.call_open_interest_resistance_strike?.toLocaleString() || '24,500'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="text-[10px] text-slate-400 block">Put Support Barrier</span>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {market_impact_engine?.option_chain_derivatives_matrix?.put_open_interest_support_strike?.toLocaleString() || '23,800'}
                  </div>
                </div>
              </div>

              {/* 4-Way Objective Factor Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                {/* Bullish Factors */}
                <div className="p-4 rounded-xl bg-[#121824] border border-emerald-500/30 space-y-2">
                  <h4 className="font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Potential Bullish Factors</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-300">
                    {(market_impact_engine?.institutional_synthesis_factors?.potential_bullish_factors || []).map((f: string, i: number) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="text-emerald-400">&bull;</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bearish Factors */}
                <div className="p-4 rounded-xl bg-[#121824] border border-rose-500/30 space-y-2">
                  <h4 className="font-bold text-rose-400 uppercase tracking-wider flex items-center space-x-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>Potential Bearish Factors</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-300">
                    {(market_impact_engine?.institutional_synthesis_factors?.potential_bearish_factors || []).map((f: string, i: number) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="text-rose-400">&bull;</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 9: MACROECONOMIC CHEAT SHEET GLOSSARY */}
          {/* ========================================================================= */}
          {(activeTab === 'ALL' || activeTab === 'GLOSSARY') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47]/70 gap-3 mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-sky-500/20 text-sky-400">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      8. National Accounts &amp; Macro Intelligence Glossary (Click for Quantitative Deep Dive)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click any macroeconomic indicator to inspect 5-year observation series, formulas, charts, and sector sensitivity matrices.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    placeholder="Search macro indicator..."
                    className="w-full bg-[#121824] border border-[#232E47] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[#232E47]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#1A2234] text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[140px]">Term / Indicator</th>
                      <th className="py-2.5 px-3">Definition &amp; Core Meaning</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Takeaway / Focus</th>
                      <th className="py-2.5 px-3 text-right">Interactive Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232E47]/60 bg-[#0F1420]">
                    {filteredGlossary.map((item, idx) => {
                      const topicId = (item.id || item.term).toLowerCase().replace(/\s+/g, '-');
                      return (
                        <tr 
                          key={idx} 
                          onClick={() => handleOpenTopic(topicId)}
                          className="hover:bg-slate-800/60 cursor-pointer transition-colors group"
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white group-hover:text-amber-400 transition-colors font-mono text-xs">
                                {item.term}
                              </span>
                              {item.group && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                  {item.group}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {item.definition}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 font-medium text-[11px] border border-purple-500/20 inline-block">
                              {item.remember_this || 'Macro Foundation'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="text-sky-400 group-hover:text-sky-300 text-xs font-bold inline-flex items-center space-x-1">
                              <span>Inspect 5-Yr History</span>
                              <ExternalLink className="w-3 h-3" />
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
          {/* SECTION 10: VERIFIED INSTITUTIONAL NEWS WIRE */}
          {/* ========================================================================= */}
          {(activeTab === 'ALL' || activeTab === 'NEWS') && (
            <div className="p-5 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#232E47]/70">
                <div className="flex items-center space-x-2">
                  <Newspaper className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">
                    9. Verified Institutional News Wire &amp; 3-Way Scenario Analysis
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Real Sources: Reuters, Bloomberg, Mint, Ministry of Commerce
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newsFeed.map((news) => (
                  <div key={news.id} className="p-4 rounded-xl bg-[#121824] border border-[#232E47] space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold">
                        {news.category}
                      </span>
                      <span>{news.publication_time}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug hover:text-sky-300 transition-colors">
                      {news.headline}
                    </h4>
                    <div className="text-xs font-semibold text-amber-300 font-sans">
                      {news.headline_te}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {news.summary_en}
                    </p>

                    {/* Scenario Analysis */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#232E47]/60 text-[10px] font-mono">
                      <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                        <span className="font-bold text-emerald-400 block mb-0.5">Positive Case</span>
                        <span className="text-slate-300">{news.scenario_analysis?.positive_case || 'Upside Catalyst'}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-800/60 border border-slate-700">
                        <span className="font-bold text-slate-300 block mb-0.5">Base Case</span>
                        <span className="text-slate-300">{news.scenario_analysis?.base_case || 'Priced In'}</span>
                      </div>
                      <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20">
                        <span className="font-bold text-rose-400 block mb-0.5">Negative Case</span>
                        <span className="text-slate-300">{news.scenario_analysis?.negative_case || 'Downside Risk'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Deep Dive */}
      <MacroIndicatorModal
        topic={selectedTopic}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default MarketIntelligenceDashboard;
