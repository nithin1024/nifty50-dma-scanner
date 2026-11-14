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
  Download 
} from 'lucide-react';
import { getExcelDownloadUrl } from '../services/api';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  backendOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, backendOnline }) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '1. Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'dma-scanner', label: '2. DMA Scanner', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'all-volume', label: '3. All 50 Volume', icon: <Activity className="w-4 h-4" /> },
    { id: 'heavyweights', label: '4. Top 7 Heavyweights', icon: <Crown className="w-4 h-4" /> },
    { id: 'volume-analytics', label: '5. Volume Analytics', icon: <Layers className="w-4 h-4" /> },
    { id: 'historical', label: '6. Historical Charts', icon: <LineChart className="w-4 h-4" /> },
    { id: 'data-quality', label: '7. Data Quality', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <nav className="bg-[#121824] border-b border-[#232E47] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('overview')}>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">NIFTY 50 DMA</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Institutional
                </span>
              </div>
              <div className="text-xs text-slate-400">Institutional DMA + Live Volume Engine</div>
            </div>
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
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action & Indicators */}
          <div className="flex items-center space-x-3">
            <a
              href={getExcelDownloadUrl()}
              download
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
              title="Download 12-sheet official daily Excel workbook"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel (12-Sheet)</span>
            </a>

            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#1A2234] border border-[#232E47] text-xs">
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className={backendOnline ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                {backendOnline ? 'Live 50/50' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Navigation Scroll */}
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
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
