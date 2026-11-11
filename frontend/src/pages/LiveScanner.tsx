import React from 'react';
import { Activity, Radio, AlertTriangle } from 'lucide-react';

export const LiveScanner: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white">Live Intraday DMA Scanner</h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Provisional Intraday Mode
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time Upstox V3 streaming prices compared against completed daily SMAs.
          </p>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#121824] border border-[#232E47] text-xs">
          <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-slate-300">Feed Connection:</span>
          <span className="text-amber-400 font-semibold">Scheduled for Level 8 &amp; 9</span>
        </div>
      </div>

      {/* Critical calculation distinction alert */}
      <div className="bg-[#121824] border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3 text-xs">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-amber-300">Important Calculation Rule for Intraday Mode</div>
          <div className="text-slate-300 leading-relaxed">
            Live prices are strictly compared against completed daily SMAs from the previous completed trading session. 
            Daily SMAs are never silently recalculated from incomplete intraday candles. All intraday signals are explicitly labeled as provisional until the official NSE daily closing price is confirmed.
          </div>
        </div>
      </div>

      {/* State banner */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-8 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Live Stream Engine Standing By</h3>
          <p className="text-sm text-slate-400">
            Real-time Upstox Market Data Feed V3 integration, WebSocket broadcasting, and live 6/6 and 5/6 classification switches will be implemented in Level 8 and Level 9.
          </p>
        </div>
      </div>
    </div>
  );
};
