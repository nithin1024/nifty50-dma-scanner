import React, { useState, useRef, useEffect } from 'react';
import type { NavTab } from '../types';
import { 
  LayoutDashboard, 
  BarChart3, 
  Activity, 
  Crown, 
  Layers, 
  ShieldCheck, 
  TrendingUp, 
  Download,
  Languages,
  Globe,
  ChevronDown,
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
  const [scannerDropdownOpen, setScannerDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setScannerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '1. Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'option-chain', label: '2. Live Option Chain', icon: <Layers className="w-4 h-4" /> },
    { id: 'trading-chart', label: '3. Professional Chart', icon: <Zap className="w-4 h-4" /> },
    { id: 'dma-scanner', label: '4. DMA Scanner', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'all-volume', label: '5. All 50 Volume', icon: <Activity className="w-4 h-4" /> },
    { id: 'heavyweights', label: '6. Top 7 Heavyweights', icon: <Crown className="w-4 h-4" /> },
    { id: 'volume-analytics', label: '7. Volume Analytics', icon: <Layers className="w-4 h-4" /> },
    { id: 'data-quality', label: '8. Data Quality', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'global-events', label: '9. Global Events 🌍', icon: <Globe className="w-4 h-4" /> },
  ];

  return (
    <nav className="bg-[#121824] border-b border-[#232E47] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand with DMA / EMA Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div 
              className={`flex items-center space-x-3 cursor-pointer p-1.5 -ml-1.5 rounded-lg transition-colors border ${
                activeTab === 'ema-scanner' 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                  : 'hover:bg-slate-800/50 border-transparent text-white'
              }`}
              onClick={() => setScannerDropdownOpen(!scannerDropdownOpen)}
              title="Click NIFTY 50 logo to toggle DMA Scanner or EMA Scanner"
            >
              <div className={`p-2 rounded-lg border ${
                activeTab === 'ema-scanner'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {activeTab === 'ema-scanner' ? <Zap className="w-6 h-6 text-amber-400" /> : <TrendingUp className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-lg tracking-tight flex items-center">
                    NIFTY 50 <ChevronDown className="w-4 h-4 ml-1 text-slate-400" />
                  </span>
                  <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border ${
                    activeTab === 'ema-scanner'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-mono'
                      : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                  }`}>
                    {activeTab === 'ema-scanner' ? '⚡ EMA + RSI' : t('Institutional')}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {activeTab === 'ema-scanner' ? 'EMA 9/21 + RSI 14 Scanner' : t('Institutional DMA + Live Volume Engine')}
                </div>
              </div>
            </div>

            {/* Dropdown Menu for DMA vs EMA Selection */}
            {scannerDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl bg-[#121824] border border-[#232E47] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-[#232E47]/70">
                  Select Technical Scanner
                </div>

                {/* Option 1: DMA Scanner */}
                <button
                  onClick={() => {
                    onTabChange('dma-scanner');
                    setScannerDropdownOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 text-left text-xs transition-colors ${
                    activeTab === 'dma-scanner' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white">1. DMA SCANNER</div>
                    <div className="text-[10px] text-slate-400">6-SMA (5, 10, 20, 50, 100, 200) Pure Engine</div>
                  </div>
                </button>

                {/* Option 2: EMA Scanner */}
                <button
                  onClick={() => {
                    onTabChange('ema-scanner');
                    setScannerDropdownOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 text-left text-xs transition-colors ${
                    activeTab === 'ema-scanner' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center space-x-1">
                      <span>2. EMA SCANNER</span>
                      <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono">NEW</span>
                    </div>
                    <div className="text-[10px] text-slate-400">EMA 9 / 21 &amp; Wilder RSI 14 (40-60 Corridor)</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Desktop Nav Items - Hidden in EMA Scanner Mode */}
          {activeTab === 'ema-scanner' ? (
            <div className="hidden lg:flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>EMA 9 / 21 &amp; RSI 14 DEDICATED SCANNER MODE</span>
              </div>
              <button
                onClick={() => onTabChange('overview')}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 transition-colors shadow-sm"
                title="Exit EMA Scanner and return to Institutional DMA Dashboard"
              >
                <span>&larr; {t('Back to DMA Platform')}</span>
              </button>
            </div>
          ) : (
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
            </div>
          )}

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
        {activeTab === 'ema-scanner' ? (
          <div className="lg:hidden flex items-center justify-between py-2 border-t border-[#232E47]/50">
            <span className="text-xs font-mono font-bold text-amber-300 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>EMA 9/21 Scanner</span>
            </span>
            <button
              onClick={() => onTabChange('overview')}
              className="px-2.5 py-1 rounded text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/40"
            >
              &larr; Back to DMA
            </button>
          </div>
        ) : (
          <div className="lg:hidden flex space-x-1 overflow-x-auto py-2 border-t border-[#232E47]/50 no-scrollbar">
            {navItems.map((item) => {
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
        )}
      </div>
    </nav>
  );
};
