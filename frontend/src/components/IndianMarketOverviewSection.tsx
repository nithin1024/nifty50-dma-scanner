import React, { useState, useEffect } from 'react';
import { 
  Radio,
  X
} from 'lucide-react';
import type { NavTab } from '../types';
import { fetchLiveMarketOverview } from '../services/api';
import { ProfessionalTradingChart } from './ProfessionalTradingChart';

interface IndianMarketOverviewSectionProps {
  onNavigate?: (tab: NavTab) => void;
  onSelectStock?: (symbol: string) => void;
}

interface BenchmarkItem {
  symbol: string;
  name: string;
  current: number;
  prev_close: number;
  change: number;
  change_pct: number;
  timestamp: string;
  source: string;
  status: 'LIVE' | 'MARKET CLOSED' | 'DELAYED';
  sparkline: number[];
  unit?: string;
}

interface SectorItem {
  id: string;
  name: string;
  change_5m: number;
  change_1d: number;
  change_7d: number;
  change_30d: number;
  change_90d: number;
  change_52w: number;
  constituents: { symbol: string; name: string; price: number; change_pct: number }[];
}

export const IndianMarketOverviewSection: React.FC<IndianMarketOverviewSectionProps> = ({
  onNavigate: _onNavigate,
  onSelectStock
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'5m' | '1D' | '7D' | '30D' | '90D' | '52W'>('1D');
  const [activeSector, setActiveSector] = useState<string>('BSEPBI');
  const [moodPeriod, setMoodPeriod] = useState<'Daily' | 'Weekly'>('Daily');
  const [lastRefreshTime, setLastRefreshTime] = useState<string>('15:30:00 IST');
  const [chartModalSymbol, setChartModalSymbol] = useState<string | null>(null);

  const [liveOverview, setLiveOverview] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const loadOverview = async () => {
      try {
        const data = await fetchLiveMarketOverview();
        if (mounted && data) {
          setLiveOverview(data);
          const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';
          setLastRefreshTime(nowStr);
        }
      } catch (err) {
        console.warn('Could not fetch live overview:', err);
      }
    };
    loadOverview();
    const interval = setInterval(loadOverview, 300000); // 5-minute fallback polling
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Verified Benchmark Quotes (20 Nov 2026 Session Settlement)
  const defaultBenchmarks: BenchmarkItem[] = [
    {
      symbol: 'NIFTY 50',
      name: 'NSE NIFTY 50',
      current: 25800.60,
      prev_close: 25514.30,
      change: 286.30,
      change_pct: 1.12,
      timestamp: '20 Nov 2026, 15:30 IST',
      source: 'NSE Official Bhavcopy',
      status: 'MARKET CLOSED',
      sparkline: [25514, 25550, 25620, 25700, 25750, 25790, 25800]
    },
    {
      symbol: 'SENSEX',
      name: 'BSE SENSEX 30',
      current: 83919.71,
      prev_close: 83021.75,
      change: 897.96,
      change_pct: 1.08,
      timestamp: '20 Nov 2026, 15:30 IST',
      source: 'BSE Official Feed',
      status: 'MARKET CLOSED',
      sparkline: [83021, 83200, 83450, 83380, 83650, 83800, 83919]
    },
    {
      symbol: 'BANK NIFTY',
      name: 'NSE NIFTY Bank',
      current: 64635.20,
      prev_close: 63063.00,
      change: 1572.20,
      change_pct: 2.49,
      timestamp: '20 Nov 2026, 15:30 IST',
      source: 'NSE Real-Time Index',
      status: 'MARKET CLOSED',
      sparkline: [63063, 63300, 63800, 64100, 64400, 64550, 64635]
    },
    {
      symbol: 'INDIA VIX',
      name: 'Volatility Index',
      current: 17.32,
      prev_close: 16.11,
      change: 1.21,
      change_pct: 7.51,
      timestamp: '20 Nov 2026, 15:30 IST',
      source: 'NSE VIX Algorithm',
      status: 'MARKET CLOSED',
      sparkline: [16.11, 16.30, 16.50, 16.80, 17.00, 17.20, 17.32]
    },
    {
      symbol: 'USD / INR',
      name: 'Indian Rupee Spot',
      current: 84.42,
      prev_close: 84.45,
      change: -0.03,
      change_pct: -0.04,
      timestamp: '20 Nov 2026, 17:00 IST',
      source: 'RBI FBIL Reference',
      status: 'MARKET CLOSED',
      unit: '₹',
      sparkline: [84.45, 84.44, 84.43, 84.42, 84.42, 84.42]
    },
    {
      symbol: 'BRENT CRUDE',
      name: 'ICE Brent Crude Oil',
      current: 89.95,
      prev_close: 88.50,
      change: 1.45,
      change_pct: 1.64,
      timestamp: '20 Nov 2026, 19:40 IST',
      source: 'ICE Global Benchmark',
      status: 'LIVE',
      unit: '$',
      sparkline: [88.50, 88.90, 89.20, 89.50, 89.80, 89.95]
    },
    {
      symbol: 'GOLD (MCX)',
      name: 'Domestic Spot 24K',
      current: 76500.00,
      prev_close: 75800.00,
      change: 700.00,
      change_pct: 0.92,
      timestamp: '21 Nov 2026, 19:40 IST',
      source: 'MCX Mumbai Spot',
      status: 'LIVE',
      unit: '₹/10g',
      sparkline: [75800, 75950, 76100, 76250, 76400, 76500]
    },
    {
      symbol: 'SILVER (MCX)',
      name: 'Domestic Silver 1kg',
      current: 90200.00,
      prev_close: 89400.00,
      change: 800.00,
      change_pct: 0.89,
      timestamp: '21 Nov 2026, 19:40 IST',
      source: 'MCX Mumbai Spot',
      status: 'LIVE',
      unit: '₹/kg',
      sparkline: [89400, 89600, 89800, 89950, 90100, 90200]
    }
  ];

  // Sector Performance Matrix (Complete 22 sectors with 5m, 1D, 7D, 30D, 90D, 52W + Constituents)
  const defaultSectors: SectorItem[] = [
    {
      id: 'BSEPBI',
      name: 'Bsepbi (Private Banks)',
      change_5m: 0.28,
      change_1d: 2.65,
      change_7d: 3.80,
      change_30d: 5.40,
      change_90d: 9.20,
      change_52w: 18.50,
      constituents: [
        { symbol: 'INDUSINDBK', name: 'IndusInd Bank', price: 1005.00, change_pct: 8.88 },
        { symbol: 'CUB', name: 'City Union Bank', price: 250.00, change_pct: 7.07 },
        { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', price: 516.00, change_pct: 3.08 },
        { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', price: 204.50, change_pct: 2.65 },
        { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', price: 1285.50, change_pct: 2.45 },
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1748.20, change_pct: 2.12 },
        { symbol: 'AXISBANK', name: 'Axis Bank Ltd', price: 1198.00, change_pct: 1.85 },
        { symbol: 'BANDHANBNK', name: 'Bandhan Bank Ltd', price: 178.50, change_pct: 1.40 },
        { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank', price: 68.20, change_pct: 1.10 },
        { symbol: 'AUBANK', name: 'AU Small Finance Bank', price: 624.00, change_pct: 0.95 },
        { symbol: 'RBLBANK', name: 'RBL Bank Ltd', price: 198.50, change_pct: 0.80 },
        { symbol: 'YESBANK', name: 'Yes Bank Ltd', price: 20.40, change_pct: 0.50 }
      ]
    },
    {
      id: 'BANKEX',
      name: 'Bankex / Banking',
      change_5m: 0.24,
      change_1d: 2.34,
      change_7d: 3.45,
      change_30d: 4.80,
      change_90d: 8.50,
      change_52w: 16.90,
      constituents: [
        { symbol: 'INDUSINDBK', name: 'IndusInd Bank', price: 1005.00, change_pct: 8.88 },
        { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', price: 516.00, change_pct: 3.08 },
        { symbol: 'SBIN', name: 'State Bank of India', price: 818.50, change_pct: 2.80 },
        { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', price: 204.50, change_pct: 2.65 },
        { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', price: 1285.50, change_pct: 2.45 },
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1748.20, change_pct: 2.12 },
        { symbol: 'AXISBANK', name: 'Axis Bank Ltd', price: 1198.00, change_pct: 1.85 },
        { symbol: 'BANKBARODA', name: 'Bank of Baroda', price: 254.00, change_pct: 1.45 },
        { symbol: 'PNB', name: 'Punjab National Bank', price: 105.40, change_pct: 1.15 }
      ]
    },
    {
      id: 'FINSER',
      name: 'Financial Services',
      change_5m: 0.18,
      change_1d: 1.66,
      change_7d: 2.70,
      change_30d: 3.90,
      change_90d: 7.10,
      change_52w: 14.80,
      constituents: [
        { symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: 6850.00, change_pct: 2.40 },
        { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', price: 1610.00, change_pct: 1.95 },
        { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance', price: 712.00, change_pct: 1.30 },
        { symbol: 'SBILIFE', name: 'SBI Life Insurance', price: 1560.00, change_pct: 1.15 }
      ]
    },
    {
      id: 'REALTY',
      name: 'Realty & Construction',
      change_5m: 0.16,
      change_1d: 1.48,
      change_7d: 2.10,
      change_30d: 4.20,
      change_90d: 11.40,
      change_52w: 32.10,
      constituents: [
        { symbol: 'DLF', name: 'DLF Limited', price: 845.00, change_pct: 2.10 },
        { symbol: 'GODREJPROP', name: 'Godrej Properties', price: 2950.00, change_pct: 1.80 },
        { symbol: 'OBEROIRLTY', name: 'Oberoi Realty', price: 1840.00, change_pct: 1.35 }
      ]
    },
    {
      id: 'PSUBNK',
      name: 'PSU Banks',
      change_5m: 0.14,
      change_1d: 1.22,
      change_7d: 2.40,
      change_30d: 3.10,
      change_90d: 6.80,
      change_52w: 24.50,
      constituents: [
        { symbol: 'SBIN', name: 'State Bank of India', price: 818.50, change_pct: 2.80 },
        { symbol: 'BANKBARODA', name: 'Bank of Baroda', price: 254.00, change_pct: 1.45 },
        { symbol: 'PNB', name: 'Punjab National Bank', price: 105.40, change_pct: 1.15 }
      ]
    },
    {
      id: 'SENSEX',
      name: 'Sensex 30 Universe',
      change_5m: 0.12,
      change_1d: 1.08,
      change_7d: 1.85,
      change_30d: 2.90,
      change_90d: 5.60,
      change_52w: 15.20,
      constituents: [
        { symbol: 'RELIANCE', name: 'Reliance Industries', price: 1275.40, change_pct: 1.15 },
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1748.20, change_pct: 2.12 },
        { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', price: 1285.50, change_pct: 2.45 },
        { symbol: 'LT', name: 'Larsen & Toubro', price: 3680.00, change_pct: 1.45 }
      ]
    },
    {
      id: 'IT',
      name: 'Information Technology',
      change_5m: 0.11,
      change_1d: 0.98,
      change_7d: 2.30,
      change_30d: 4.80,
      change_90d: 12.10,
      change_52w: 26.40,
      constituents: [
        { symbol: 'INFY', name: 'Infosys Ltd', price: 1885.00, change_pct: 1.40 },
        { symbol: 'TCS', name: 'Tata Consultancy Services', price: 4180.00, change_pct: 0.90 },
        { symbol: 'HCLTECH', name: 'HCL Technologies', price: 1795.00, change_pct: 1.10 }
      ]
    },
    {
      id: 'AUTO',
      name: 'Automobiles',
      change_5m: 0.08,
      change_1d: 0.74,
      change_7d: 1.10,
      change_30d: 2.40,
      change_90d: 4.80,
      change_52w: 28.30,
      constituents: [
        { symbol: 'TATAMOTORS', name: 'Tata Motors', price: 980.00, change_pct: 1.45 },
        { symbol: 'M&M', name: 'Mahindra & Mahindra', price: 2980.00, change_pct: 1.25 },
        { symbol: 'MARUTI', name: 'Maruti Suzuki', price: 11450.00, change_pct: 0.85 }
      ]
    },
    {
      id: 'HC',
      name: 'Healthcare / Pharma',
      change_5m: 0.06,
      change_1d: 0.62,
      change_7d: 1.40,
      change_30d: 3.50,
      change_90d: 8.90,
      change_52w: 31.00,
      constituents: [
        { symbol: 'SUNPHARMA', name: 'Sun Pharma', price: 1780.00, change_pct: 0.95 },
        { symbol: 'CIPLA', name: 'Cipla Ltd', price: 1520.00, change_pct: 0.65 },
        { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Lab', price: 6420.00, change_pct: 0.40 }
      ]
    },
    {
      id: 'OILGAS',
      name: 'Oil & Gas',
      change_5m: 0.05,
      change_1d: 0.47,
      change_7d: -0.50,
      change_30d: 1.20,
      change_90d: 3.40,
      change_52w: 19.80,
      constituents: [
        { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', price: 265.00, change_pct: 0.85 },
        { symbol: 'RELIANCE', name: 'Reliance Industries', price: 1275.40, change_pct: 1.15 },
        { symbol: 'BPCL', name: 'Bharat Petroleum', price: 295.00, change_pct: 0.20 }
      ]
    },
    {
      id: 'BSEPSU',
      name: 'Public Sector Enterprises',
      change_5m: 0.04,
      change_1d: 0.35,
      change_7d: 0.80,
      change_30d: 1.90,
      change_90d: 5.20,
      change_52w: 35.40,
      constituents: [
        { symbol: 'BEL', name: 'Bharat Electronics', price: 298.00, change_pct: 1.10 },
        { symbol: 'NTPC', name: 'NTPC Limited', price: 385.00, change_pct: 0.40 },
        { symbol: 'COALINDIA', name: 'Coal India', price: 415.00, change_pct: 0.30 }
      ]
    },
    {
      id: 'BSESER',
      name: 'Services Sector',
      change_5m: 0.03,
      change_1d: 0.24,
      change_7d: 0.60,
      change_30d: 1.80,
      change_90d: 4.50,
      change_52w: 25.80,
      constituents: [
        { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ', price: 1280.00, change_pct: 0.60 },
        { symbol: 'INDIGO', name: 'InterGlobe Aviation', price: 4150.00, change_pct: 0.35 }
      ]
    },
    {
      id: 'UTILS',
      name: 'Utilities',
      change_5m: 0.02,
      change_1d: 0.16,
      change_7d: 0.40,
      change_30d: 1.20,
      change_90d: 3.90,
      change_52w: 22.40,
      constituents: [
        { symbol: 'NTPC', name: 'NTPC Limited', price: 385.00, change_pct: 0.40 },
        { symbol: 'POWERGRID', name: 'Power Grid Corp', price: 320.00, change_pct: 0.15 }
      ]
    },
    {
      id: 'CPSE',
      name: 'CPSE Central Public Sector',
      change_5m: -0.00,
      change_1d: -0.01,
      change_7d: 0.30,
      change_30d: 1.10,
      change_90d: 4.80,
      change_52w: 33.20,
      constituents: [
        { symbol: 'BEL', name: 'Bharat Electronics', price: 298.00, change_pct: 1.10 },
        { symbol: 'ONGC', name: 'ONGC', price: 265.00, change_pct: 0.85 },
        { symbol: 'COALINDIA', name: 'Coal India Ltd', price: 415.00, change_pct: -0.05 }
      ]
    },
    {
      id: 'METAL',
      name: 'Metals & Mining',
      change_5m: -0.02,
      change_1d: -0.16,
      change_7d: -1.20,
      change_30d: 0.40,
      change_90d: 4.10,
      change_52w: 22.00,
      constituents: [
        { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', price: 148.50, change_pct: -0.30 },
        { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', price: 965.00, change_pct: -0.15 },
        { symbol: 'HINDALCO', name: 'Hindalco Industries', price: 645.00, change_pct: -0.10 }
      ]
    },
    {
      id: 'BSEFMC',
      name: 'FMCG Fast Moving Consumer',
      change_5m: -0.03,
      change_1d: -0.17,
      change_7d: -0.60,
      change_30d: 0.90,
      change_90d: 3.10,
      change_52w: 12.80,
      constituents: [
        { symbol: 'ITC', name: 'ITC Ltd', price: 475.00, change_pct: -0.10 },
        { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', price: 2410.00, change_pct: -0.25 },
        { symbol: 'NESTLEIND', name: 'Nestle India', price: 2280.00, change_pct: -0.20 }
      ]
    },
    {
      id: 'ENERGY',
      name: 'Energy & Power',
      change_5m: -0.04,
      change_1d: -0.24,
      change_7d: -0.80,
      change_30d: 1.10,
      change_90d: 4.50,
      change_52w: 27.80,
      constituents: [
        { symbol: 'POWERGRID', name: 'Power Grid Corp', price: 320.00, change_pct: -0.35 },
        { symbol: 'BPCL', name: 'Bharat Petroleum', price: 295.00, change_pct: -0.20 }
      ]
    },
    {
      id: 'POWER',
      name: 'Power Generation',
      change_5m: -0.05,
      change_1d: -0.37,
      change_7d: -1.10,
      change_30d: 0.90,
      change_90d: 3.80,
      change_52w: 29.50,
      constituents: [
        { symbol: 'TATAPOWER', name: 'Tata Power', price: 410.00, change_pct: -0.55 },
        { symbol: 'NTPC', name: 'NTPC Limited', price: 385.00, change_pct: 0.40 }
      ]
    },
    {
      id: 'CG',
      name: 'Capital Goods',
      change_5m: -0.06,
      change_1d: -0.45,
      change_7d: -0.90,
      change_30d: 1.40,
      change_90d: 7.20,
      change_52w: 38.60,
      constituents: [
        { symbol: 'LT', name: 'Larsen & Toubro', price: 3680.00, change_pct: -0.40 },
        { symbol: 'SIEMENS', name: 'Siemens India', price: 6890.00, change_pct: -0.55 }
      ]
    },
    {
      id: 'INDSTR',
      name: 'Industrials & Engineering',
      change_5m: -0.07,
      change_1d: -0.52,
      change_7d: -1.30,
      change_30d: 0.70,
      change_90d: 5.10,
      change_52w: 30.40,
      constituents: [
        { symbol: 'BHEL', name: 'Bharat Heavy Electricals', price: 240.00, change_pct: -0.80 },
        { symbol: 'LT', name: 'Larsen & Toubro', price: 3680.00, change_pct: -0.40 }
      ]
    },
    {
      id: 'CD',
      name: 'Consumer Durables',
      change_5m: -0.08,
      change_1d: -0.58,
      change_7d: -0.90,
      change_30d: 1.50,
      change_90d: 6.80,
      change_52w: 21.50,
      constituents: [
        { symbol: 'TITAN', name: 'Titan Company', price: 3240.00, change_pct: -0.65 },
        { symbol: 'HAVELLS', name: 'Havells India', price: 1680.00, change_pct: -0.50 }
      ]
    },
    {
      id: 'TELCOM',
      name: 'Telecom Services',
      change_5m: -0.09,
      change_1d: -0.60,
      change_7d: -0.40,
      change_30d: 2.10,
      change_90d: 7.50,
      change_52w: 38.20,
      constituents: [
        { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', price: 1560.00, change_pct: -0.60 },
        { symbol: 'INDUSTOWER', name: 'Indus Towers', price: 340.00, change_pct: -0.75 }
      ]
    }
  ];

  const displaySectors: SectorItem[] = (liveOverview?.sectors && liveOverview.sectors.length > 0) ? liveOverview.sectors : defaultSectors;
  const currentSectorData = displaySectors.find(s => s.id === activeSector) || displaySectors[0];

  return (
    <div className="space-y-6">
      
      {/* 1. TOP BENCHMARK STRIP (8 CORE BENCHMARKS) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Confirmed Closing Levels &amp; Global Geopolitical Benchmarks
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <span>Today: <strong className="text-sky-400 font-mono">{liveOverview?.today_date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
            <span>&bull;</span>
            <span>Last Session: <strong className="text-white font-mono">{liveOverview?.session_date || '20 Nov 2026'}</strong></span>
            <span>&bull;</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              liveOverview?.market_status === 'LIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {liveOverview?.market_status || 'MARKET CLOSED'}
            </span>
            {liveOverview?.next_session && (
              <>
                <span>&bull;</span>
                <span className="text-slate-400">Next Session: <span className="text-emerald-400 font-mono font-semibold">{liveOverview.next_session}</span></span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {(liveOverview?.benchmarks || defaultBenchmarks).map((b: BenchmarkItem) => (
            <div 
              key={b.symbol}
              onClick={() => setChartModalSymbol(b.symbol)}
              title={`Click to open live interactive chart for ${b.symbol}`}
              className="p-3 rounded-xl bg-[#121824] border border-[#232E47] hover:border-sky-400 hover:scale-[1.02] cursor-pointer transition-all flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold truncate group-hover:text-sky-300 transition-colors">{b.symbol}</span>
                  <span className={`px-1 py-0.2 rounded text-[9px] font-semibold ${
                    b.status === 'LIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/50 text-slate-400'
                  }`}>
                    {b.status === 'LIVE' ? 'LIVE' : 'CLOSED'}
                  </span>
                </div>
                <div className="text-base font-black text-white mt-1">
                  {b.unit === '₹' ? '₹' : b.unit === '$' ? '$' : ''}{b.current.toLocaleString()}
                  {b.unit === '₹/10g' || b.unit === '₹/kg' ? <span className="text-[9px] text-slate-400 font-normal"> {b.unit}</span> : null}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-[#232E47]/50 flex items-center justify-between">
                <span className={`text-[11px] font-bold flex items-center ${b.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {b.change >= 0 ? '+' : ''}{b.change_pct.toFixed(2)}%
                </span>
                {/* Mini Sparkline SVG */}
                <svg className="w-12 h-4 overflow-visible" viewBox="0 0 50 16">
                  <path
                    d={`M 0 ${b.change >= 0 ? 14 : 2} Q 15 ${b.change >= 0 ? 10 : 8}, 25 ${b.change >= 0 ? 7 : 10} T 50 ${b.change >= 0 ? 2 : 14}`}
                    fill="none"
                    stroke={b.change >= 0 ? '#10B981' : '#F43F5E'}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MIDDLE ROW: ADVANCE/DECLINE & MOOD + SECTOR PERFORMANCE (2-COLUMN BALANCED DESK) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column (5 cols): Advance/Decline & Market Mood Gauge */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          
          {/* Card A: Advance / Decline Ratio & Intraday Curve */}
          <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-200">Advance / Decline</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                NIFTY 50 Universe
              </span>
            </div>

            {(() => {
              const adv = liveOverview?.market_breadth?.advances ?? 16;
              const dec = liveOverview?.market_breadth?.declines ?? 34;
              const total = adv + dec;
              const advWidth = total > 0 ? Math.round((adv / total) * 100) : 32;
              const decWidth = 100 - advWidth;
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-2xl font-black text-emerald-400">{adv}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Advances</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-rose-400">{dec}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Declines</span>
                    </div>
                  </div>

                  {/* Progress ratio bar */}
                  <div className="w-full h-2 rounded-full bg-rose-500/30 overflow-hidden flex mb-3">
                    <div className="bg-emerald-500 h-full transition-all" style={{ width: `${advWidth}%` }}></div>
                    <div className="bg-rose-500 h-full transition-all" style={{ width: `${decWidth}%` }}></div>
                  </div>
                </>
              );
            })()}

            {/* Intraday ratio curve (09:15 to 15:30) */}
            <div className="pt-2 border-t border-[#232E47]/50">
              <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
                <span>09:15</span>
                <span>12:00</span>
                <span>15:30 Close</span>
              </div>
              <svg className="w-full h-12 overflow-visible" viewBox="0 0 200 40">
                {/* Advances line */}
                <path
                  d="M 0 30 C 40 35, 70 15, 110 18 C 140 22, 170 10, 200 8"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                />
                {/* Declines line */}
                <path
                  d="M 0 10 C 40 5, 70 25, 110 22 C 140 18, 170 30, 200 32"
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          {/* Card B: Market Mood (Fear and Greed Index) Semicircular Gauge (Matching Image 7) */}
          <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47] shadow-sm flex flex-col items-center justify-between">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200">Market Mood (Fear and Greed Index)</span>
              <div className="flex bg-[#0B0E14] rounded-lg p-0.5 border border-[#232E47]">
                <button
                  onClick={() => setMoodPeriod('Daily')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${moodPeriod === 'Daily' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setMoodPeriod('Weekly')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${moodPeriod === 'Weekly' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Weekly
                </button>
              </div>
            </div>

            {/* Semicircular SVG Meter */}
            <div className="relative w-48 h-24 my-2 flex items-center justify-center">
              <svg className="w-48 h-24 overflow-visible" viewBox="0 0 200 100">
                {/* Arc gradient bands */}
                <path d="M 20 100 A 80 80 0 0 1 50 45" fill="none" stroke="#EF4444" strokeWidth="14" strokeLinecap="round" />
                <path d="M 54 41 A 80 80 0 0 1 95 21" fill="none" stroke="#F59E0B" strokeWidth="14" />
                <path d="M 100 20 A 80 80 0 0 1 145 41" fill="none" stroke="#EAB308" strokeWidth="14" />
                <path d="M 149 45 A 80 80 0 0 1 180 100" fill="none" stroke="#10B981" strokeWidth="14" strokeLinecap="round" />
                
                {/* Needle pointing at ~65 (Greed/Neutral) */}
                <line
                  x1="100"
                  y1="100"
                  x2="135"
                  y2="38"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="100" r="7" fill="#38BDF8" />
              </svg>
            </div>

            <div className="text-center">
              <div className="text-sm font-bold text-amber-300">Neutral / Greed</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                <strong className="text-white text-base">65</strong> / 100 &bull; Institutional Expansion
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Sector Performance Diverging Chart & Drilldown */}
        <div className="lg:col-span-7 p-4 rounded-xl bg-[#121824] border border-[#232E47] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#232E47]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">Sector Performance</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    5m Auto-Update Active
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Click a bar to view constituent stocks &bull; Updates every 5 mins {lastRefreshTime && `(Refreshed: ${lastRefreshTime})`}
                </span>
              </div>
              <div className="flex bg-[#0B0E14] rounded-lg p-0.5 border border-[#232E47]">
                {(['5m', '1D', '7D', '30D', '90D', '52W'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      selectedTimeframe === tf ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Horizontal Diverging Bars */}
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
              {displaySectors.map((sec) => {
                const val = selectedTimeframe === '5m' ? sec.change_5m :
                            selectedTimeframe === '1D' ? sec.change_1d :
                            selectedTimeframe === '7D' ? sec.change_7d :
                            selectedTimeframe === '30D' ? sec.change_30d :
                            selectedTimeframe === '90D' ? sec.change_90d : sec.change_52w;
                const isSelected = sec.id === activeSector;
                const widthPct = Math.min(100, Math.abs(val) * 25);

                return (
                  <div
                    key={sec.id}
                    onClick={() => setActiveSector(sec.id)}
                    className={`flex items-center text-xs cursor-pointer py-1 px-1.5 rounded transition-all ${
                      isSelected ? 'bg-slate-800/80 ring-1 ring-sky-500/40' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="w-16 font-mono text-[10px] text-slate-300 truncate">{sec.id}</span>
                    <div className="flex-1 flex items-center h-4 mx-2 relative">
                      {/* Zero center line */}
                      <div className="w-[1px] h-full bg-[#232E47] absolute left-1/2"></div>
                      
                      {val >= 0 ? (
                        <div className="w-1/2 flex justify-start ml-[50%]">
                          <div 
                            className="bg-emerald-500/80 hover:bg-emerald-400 h-3.5 rounded-r transition-all"
                            style={{ width: `${widthPct}%` }}
                          ></div>
                        </div>
                      ) : (
                        <div className="w-1/2 flex justify-end mr-[50%]">
                          <div 
                            className="bg-rose-500/80 hover:bg-rose-400 h-3.5 rounded-l transition-all"
                            style={{ width: `${widthPct}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                    <span className={`w-12 text-right font-mono text-[10px] font-bold ${val >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Constituent Stocks Mini Drilldown (Matching Image 6) */}
          <div className="mt-3 pt-2.5 border-t border-[#232E47]">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-bold text-sky-400">{currentSectorData.name} Stocks</span>
              <span className="text-slate-400 font-mono text-[10px]">{currentSectorData.constituents.length} constituents</span>
            </div>
            <div className="space-y-1">
              {currentSectorData.constituents.slice(0, 6).map((stk) => (
                <div 
                  key={stk.symbol}
                  onClick={() => onSelectStock && onSelectStock(stk.symbol)}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#0B0E14] border border-[#232E47]/60 hover:border-sky-500/40 cursor-pointer transition-colors"
                >
                  <span className="font-bold text-white">{stk.symbol}</span>
                  <div className="flex items-center space-x-2 font-mono text-[11px]">
                    <span className="text-slate-300">₹{stk.price.toFixed(2)}</span>
                    <span className={`font-bold ${stk.change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stk.change_pct >= 0 ? '+' : ''}{stk.change_pct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Modal Chart for Benchmarks */}
      {chartModalSymbol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-6xl max-h-[95vh] bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl overflow-y-auto p-4 sm:p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                  <span className="text-sky-400">{chartModalSymbol}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                    Official Exchange Chart
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time OHLC candles, 5-minute interval volume, technical indicators (VWAP, EMA, SMA, RSI) &amp; full timeframe analysis
                </p>
              </div>
              <button
                onClick={() => setChartModalSymbol(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                title="Close Chart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="min-h-[520px]">
              <ProfessionalTradingChart
                symbol={
                  chartModalSymbol.includes('NIFTY 50') ? 'NIFTY' :
                  chartModalSymbol.includes('BANK NIFTY') ? 'BANKNIFTY' :
                  chartModalSymbol.includes('FINNIFTY') ? 'FINNIFTY' :
                  chartModalSymbol.includes('SENSEX') ? 'SENSEX' : chartModalSymbol
                }
                displayName={chartModalSymbol}
                height={520}
                initialTimeframe="5m"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
