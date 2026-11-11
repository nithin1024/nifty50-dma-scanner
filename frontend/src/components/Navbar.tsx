import React from 'react';
import type { NavTab } from '../types';
import { 
  LayoutDashboard, 
  BarChart3, 
  Activity, 
  LineChart, 
  History, 
  ShieldCheck, 
  TrendingUp 
} from 'lucide-react';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  backendOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, backendOnline }) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'daily-scanner', label: 'Daily Scanner', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'live-scanner', label: 'Live Scanner', icon: <Activity className="w-4 h-4" /> },
    { id: 'stock-details', label: 'Stock Details', icon: <LineChart className="w-4 h-4" /> },
    { id: 'scan-history', label: 'Scan History', icon: <History className="w-4 h-4" /> },
    { id: 'data-status', label: 'Data Status', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <nav className="bg-[#121824] border-b border-[#232E47] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('dashboard')}>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">NIFTY 50 DMA</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Scanner
                </span>
              </div>
              <div className="text-xs text-slate-400">NSE Daily & Intraday Technical Engine</div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Backend Connection Indicator */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#1A2234] border border-[#232E47] text-xs">
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className={backendOnline ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                {backendOnline ? 'API Connected' : 'API Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row (Horizontal Scrollable) */}
        <div className="md:hidden flex space-x-1 overflow-x-auto py-2 border-t border-[#232E47]/50 no-scrollbar">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
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
