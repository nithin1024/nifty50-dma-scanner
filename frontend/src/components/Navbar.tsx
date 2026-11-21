import React, { useState } from 'react';
import type { NavTab } from '../types';
import { 
  LayoutDashboard, 
  BarChart3, 
  Layers, 
  TrendingUp, 
  Download,
  Languages,
  ChevronDown,
  Globe,
  Zap,
  Newspaper,
  Calendar,
  Settings,
  Menu,
  X,
  Wrench
} from 'lucide-react';
import { getExcelDownloadUrl } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import type { ToolType } from './MarketToolsModal';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  backendOnline: boolean;
  onOpenTool?: (tool: ToolType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, backendOnline: _backendOnline, onOpenTool }) => {
  const { language, toggleLanguage } = useLanguage();
  const [logoDropdownOpen, setLogoDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Exact Canonical Navigation Tabs
  const mainNavItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '1. Overview', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'fii-dii', label: '2. FII/DII Scanner', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'dma-scanner', label: '3. DMA Scanner', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'ema-scanner', label: '4. EMA Scanner', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'options-intelligence', label: '5. Live Option Chain', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'economy-fundamentals', label: '6. Sector & Market Intelligence', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'economic-calendar', label: '7. Economic Calendar', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'market-news', label: '8. Market News', icon: <Newspaper className="w-3.5 h-3.5" /> },
    { id: 'settings-sources', label: '9. Settings', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      <nav className="bg-[#121824] border-b border-[#232E47] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* BRANDING: NIFTY 50 | DMA & EMA MARKET INTELLIGENCE with 2-Engine Selection */}
            <div className="relative">
              <div 
                className="flex items-center space-x-2.5 cursor-pointer py-1 group"
                onClick={() => setLogoDropdownOpen(!logoDropdownOpen)}
                title="Click to toggle between DMA Scanner and EMA Scanner"
              >
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                      NIFTY 50 <span className="text-slate-400 font-normal">|</span> DMA &amp; EMA
                    </span>
                    <span className="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      INTELLIGENCE
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${logoDropdownOpen ? 'rotate-180 text-sky-400' : ''}`} />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {activeTab === 'ema-scanner' ? '⚡ EMA Scanner (9/21 EMA + RSI)' : '📊 DMA Scanner (6-SMA Corridor)'}
                  </div>
                </div>
              </div>

              {/* Logo Options Dropdown (EXACTLY 2 OPTIONS: DMA Scanner & EMA Scanner – NO ALL STOCKS) */}
              {logoDropdownOpen && (
                <div 
                  className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-[#232E47] bg-[#121824] p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setLogoDropdownOpen(false)}
                >
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1.5 border-b border-[#232E47]/50 mb-1 flex items-center justify-between">
                    <span>Active Technical Engines</span>
                    <span className="text-[9px] text-emerald-400 font-mono">2 ENGINES</span>
                  </div>
                  <button
                    onClick={() => { onTabChange('dma-scanner'); setLogoDropdownOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left text-xs transition-all ${
                      activeTab === 'dma-scanner' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold">1. DMA Scanner</div>
                      <div className="text-[10px] text-slate-400 font-normal">Daily 6-SMA Corridor (5, 10, 20, 50, 100, 200 SMA)</div>
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
                      <div className="font-bold">2. EMA Scanner</div>
                      <div className="text-[10px] text-slate-400 font-normal">Daily 9 &amp; 21 EMA + Wilder's RSI 14 Momentum</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Desktop Nav Items (9 Canonical Tabs) */}
            <div className="hidden xl:flex items-center space-x-0.5">
              {mainNavItems.map((item) => {
                const active = activeTab === item.id || 
                  (item.id === 'fii-dii' && activeTab === 'all-volume') ||
                  (item.id === 'options-intelligence' && (activeTab === 'option-chain' || activeTab === 'oi-pcr' || activeTab === 'max-pain' || activeTab === 'live-market')) ||
                  (item.id === 'economy-fundamentals' && (activeTab === 'pmi-intelligence' || activeTab === 'iip-intelligence' || activeTab === 'sector-fundamentals' || activeTab === 'indian-economy')) ||
                  (item.id === 'economic-calendar' && (activeTab === 'global-markets-calendar' || activeTab === 'global-markets' || activeTab === 'calendar' || activeTab === 'global-events')) ||
                  (item.id === 'market-news' && activeTab === 'news-intelligence') ||
                  (item.id === 'settings-sources' && activeTab === 'data-quality');

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                      active
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* MARKET TOOLS DROPDOWN (8 Essential Institutional Tools) */}
              <div className="relative">
                <button
                  onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                  className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                    toolsDropdownOpen
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Market Tools & Financial Resources"
                >
                  <Wrench className="w-3.5 h-3.5 text-sky-400" />
                  <span>Market Tools</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${toolsDropdownOpen ? 'rotate-180 text-sky-400' : ''}`} />
                </button>

                {toolsDropdownOpen && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-[#232E47] bg-[#121824] p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setToolsDropdownOpen(false)}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1.5 border-b border-[#232E47]/50 mb-1 flex items-center justify-between">
                      <span>Market Tools</span>
                      <span className="text-[9px] text-sky-400 font-mono">8 TOOLS</span>
                    </div>

                    <button
                      onClick={() => { onTabChange('economic-calendar'); setToolsDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                    >
                      2026 Events Calendar
                    </button>
                    <button
                      onClick={() => { onOpenTool?.('lot-size'); setToolsDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                    >
                      Lot Size Finder
                    </button>
                    <button
                      onClick={() => { onTabChange('economy-fundamentals'); setToolsDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                    >
                      Sector – Companies
                    </button>
                    <button
                      onClick={() => { onOpenTool?.('market-cap'); setToolsDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                    >
                      Market Cap Stocks List
                    </button>
                    <button
                      onClick={() => { onOpenTool?.('top-etfs'); setToolsDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                    >
                      Top ETFs
                    </button>
                    <button
                      onClick={() => { onOpenTool?.('nse-links'); setToolsDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                    >
                      NSE Official Links
                    </button>
                    <button
                      onClick={() => { onOpenTool?.('swing-screener'); setToolsDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                    >
                      Swing Screener
                    </button>
                    <button
                      onClick={() => { onOpenTool?.('trading-journal'); setToolsDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                    >
                      Trading Journal
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Controls: Date Pill, Excel Export, Language Toggle & Mobile Hamburger */}
            <div className="flex items-center space-x-2">
              <span className="hidden md:inline-flex items-center px-2 py-1 rounded-lg bg-[#161F33] border border-[#232E47] text-[11px] font-mono text-sky-400 font-bold" title="Today's Active Date">
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>

              <a
                href={getExcelDownloadUrl()}
                download
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
                title="Download verified institutional Excel workbook (12 sheets)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </a>

              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#161F33] hover:bg-slate-700/60 border border-[#232E47] text-slate-200 text-xs font-semibold transition-colors"
                title="Switch Language (English / Telugu)"
              >
                <Languages className="w-3.5 h-3.5 text-sky-400" />
                <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 rounded-lg bg-[#161F33] border border-[#232E47] text-slate-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-[#121824] border-t border-[#232E47] px-4 py-3 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Main Navigation</div>
            {mainNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                  activeTab === item.id ? 'bg-sky-500/20 text-sky-400' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}

            <div className="text-[10px] uppercase font-bold text-sky-400 px-2 pt-3 pb-1 border-t border-[#232E47] mt-2">
              Market Tools
            </div>
            <button
              onClick={() => { onTabChange('economic-calendar'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              2026 Events Calendar
            </button>
            <button
              onClick={() => { onOpenTool?.('lot-size'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              Lot Size Finder
            </button>
            <button
              onClick={() => { onTabChange('economy-fundamentals'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              Sector – Companies
            </button>
            <button
              onClick={() => { onOpenTool?.('market-cap'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              Market Cap Stocks List
            </button>
            <button
              onClick={() => { onOpenTool?.('top-etfs'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              Top ETFs
            </button>
            <button
              onClick={() => { onOpenTool?.('nse-links'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              NSE Official Links
            </button>
            <button
              onClick={() => { onOpenTool?.('swing-screener'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              Swing Screener
            </button>
            <button
              onClick={() => { onOpenTool?.('trading-journal'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              Trading Journal
            </button>
          </div>
        )}
      </nav>
    </>
  );
};
