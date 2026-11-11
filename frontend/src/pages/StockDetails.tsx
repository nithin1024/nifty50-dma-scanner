import React from 'react';
import { LineChart, Search } from 'lucide-react';

export const StockDetails: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Stock DMA Deep Dive</h1>
          <p className="text-sm text-slate-400 mt-1">
            Individual stock 6-DMA breakdown, historical charts, distance metrics, and fresh crossover events.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Select constituent (e.g. TCS)..."
            className="pl-9 pr-4 py-2 bg-[#121824] border border-[#232E47] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-64"
          />
        </div>
      </div>

      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-8 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center mx-auto">
            <LineChart className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Stock Details &amp; Chart View</h3>
          <p className="text-sm text-slate-400">
            Full individual stock inspection with TradingView Lightweight Charts, six DMA overlay curves, and crossover event logs will activate alongside the DMA engine and database models in Level 6 &amp; 7.
          </p>
        </div>
      </div>
    </div>
  );
};
