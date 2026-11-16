import React from 'react';
import type { NavTab } from '../types';
import { 
  LayoutDashboard, 
  BarChart3, 
  Activity, 
  Crown, 
  Layers, 
  LineChart,
  ShieldCheck, 
  TrendingUp, 
  Download,
  Languages,
  ChevronDown,
  Globe,
  Zap
} from 'lucide-react';
import { getExcelDownloadUrl } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  backendOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, backendOnline }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const [logoDropdownOpen, setLogoDropdownOpen] = React.useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '1. Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'dma-scanner', label: '2. DMA Scanner', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'all-volume', label: '3. All 50 Volume', icon: <Activity className="w-4 h-4" /> },
    { id: 'heavyweights', label: '4. Top 7 Heavyweights', icon: <Crown className="w-4 h-4" /> },
    { id: 'volume-analytics', label: '5. Volume Analytics', icon: <Layers className="w-4 h-4" /> },
    { id: 'historical', label: '6. Historical Charts', icon: <LineChart className="w-4 h-4" /> },
    { id: 'global-events', label: '7. Global Events', icon: <Globe className="w-4 h-4" /> },
    { id: 'data-quality', label: '8. Data Quality', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  const newToolItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'option-chain', label: 'Live Option Chain', icon: <Layers className="w-4 h-4" /> },
    { id: 'ema-scanner', label: 'EMA Scanner', icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <nav className="bg-[#121824] border-b border-[#232E47] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand with 2-Engine Selection Dropdown */}
          <div className="relative">
            <div 
              className="flex items-center space-x-2.5 cursor-pointer py-1 group"
              onClick={() => setLogoDropdownOpen(!logoDropdownOpen)}
              title="Click to switch between DMA Scanner and EMA Scanner"
            >
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-base sm:text-lg tracking-tight text-white">NIFTY 50</span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {t('Institutional')}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${logoDropdownOpen ? 'rotate-180 text-sky-400' : ''}`} />
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-mono">
                  {activeTab === 'ema-scanner' ? '⚡ 9/21 EMA + RSI 14' : '📊 6-SMA DMA Corridor'}
                </div>
              </div>
            </div>

            {/* Logo Options Dropdown (2 options: DMA Scanner / EMA Scanner) */}
            {logoDropdownOpen && (
              <div 
                className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-[#232E47] bg-[#121824] p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onMouseLeave={() => setLogoDropdownOpen(false)}
              >
                <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1.5 border-b border-[#232E47]/50 mb-1 flex items-center justify-between">
                  <span>Technical Engines</span>
                  <span className="text-[9px] text-emerald-400 font-mono">2 OPTIONS</span>
                </div>
                <button
                  onClick={() => { onTabChange('dma-scanner'); setLogoDropdownOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left text-xs transition-all ${
                    activeTab === 'dma-scanner' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold">1. 50 DMA Scanner</div>
                    <div className="text-[10px] text-slate-400 font-normal">Pure 6-SMA Corridor (5, 10, 20, 50, 100, 200 SMA)</div>
                  </div>
                </button>
                <button
                  onClick={() => { onTabChange('ema-scanner'); setLogoDropdownOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left text-xs transition-all mt-1 ${
                    activeTab === 'ema-scanner' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold">2. EMA &amp; RSI Scanner</div>
                    <div className="text-[10px] text-slate-400 font-normal">Upstox Chart Style 9/21 EMA + Wilder's RSI 14</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{t(item.label)}</span>
                </button>
              );
            })}
            <details className="relative">
              <summary
                className={`flex cursor-pointer list-none items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  newToolItems.some((item) => item.id === activeTab)
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{t('Market Tools')}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </summary>
              <div className="absolute right-0 top-full mt-2 min-w-52 rounded-lg border border-[#232E47] bg-[#121824] p-1.5 shadow-xl">
                {newToolItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={(event) => {
                      onTabChange(item.id);
                      const menu = event.currentTarget.closest('details');
                      if (menu) menu.open = false;
                    }}
                    className={`flex w-full items-center space-x-2 rounded-md px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      activeTab === item.id
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span>{t(item.label)}</span>
                  </button>
                ))}
              </div>
            </details>
          </div>

          {/* Action & Indicators */}
          <div className="flex items-center space-x-2.5">
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border ${
                language === 'te'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title={language === 'te' ? 'Switch to English' : 'తెలుగు వెర్షన్‌కి మారండి'}
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span className={language === 'te' ? 'text-amber-300 font-bold' : 'text-slate-400'}>తెలుగు</span>
              <span className="text-slate-500">/</span>
              <span className={language === 'en' ? 'text-sky-300 font-bold' : 'text-slate-400'}>EN</span>
            </button>

            <a
              href={getExcelDownloadUrl()}
              download
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
              title="Download 12-sheet official daily Excel workbook"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('Excel (12-Sheet)')}</span>
            </a>

            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#1A2234] border border-[#232E47] text-xs">
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className={backendOnline ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                {backendOnline ? t('Live 50/50') : t('Offline')}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Navigation Scroll */}
        <div className="lg:hidden flex space-x-1 overflow-x-auto py-2 border-t border-[#232E47]/50 no-scrollbar">
          {[...navItems, ...newToolItems].map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                <span>{t(item.label)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
