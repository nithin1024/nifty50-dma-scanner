import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';

export const DailyScanner: React.FC = () => {
  const [filterMode, setFilterMode] = useState<'all' | '6_6' | '5_6'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily DMA Scanner</h1>
          <p className="text-sm text-slate-400 mt-1">
            Official completed NSE trading session evaluation. Screen stocks strictly above 6/6 and exactly 5/6 DMAs.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbol (e.g. RELIANCE)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#121824] border border-[#232E47] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-56"
            />
          </div>

          <div className="flex items-center bg-[#121824] border border-[#232E47] rounded-lg p-1">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterMode === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Constituents
            </button>
            <button
              onClick={() => setFilterMode('6_6')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterMode === '6_6'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              6/6 Bullish
            </button>
            <button
              onClick={() => setFilterMode('5_6')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterMode === '5_6'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-sky-400'
              }`}
            >
              5/6 Bullish
            </button>
          </div>
        </div>
      </div>

      {/* State banner */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-8 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Daily Scanner Engine Standing By</h3>
          <p className="text-sm text-slate-400">
            Per strict project rules, no mock or dummy stocks are shown. The daily scanner will calculate and display genuine 6/6 and 5/6 classifications with exact DMA distances once Level 2 (Constituents) and Level 3 (Historical Data Ingestion) are completed.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1A2234] text-slate-300 border border-[#232E47]">
              <span>Scheduled for Level 5 Activation</span>
            </span>
          </div>
        </div>
      </div>

      {/* Target Table Skeleton preview */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#232E47] flex justify-between items-center">
          <h2 className="font-semibold text-white text-sm">Scanner Output Schema Preview</h2>
          <span className="text-xs text-slate-400">Columns configured for 6 DMAs + distances</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1A2234] text-slate-300 uppercase font-mono">
              <tr>
                <th className="py-3 px-4">Stock Symbol</th>
                <th className="py-3 px-4">Close Price (₹)</th>
                <th className="py-3 px-4">DMA Score</th>
                <th className="py-3 px-4">5 DMA</th>
                <th className="py-3 px-4">10 DMA</th>
                <th className="py-3 px-4">20 DMA</th>
                <th className="py-3 px-4">50 DMA</th>
                <th className="py-3 px-4">100 DMA</th>
                <th className="py-3 px-4">200 DMA</th>
                <th className="py-3 px-4">Fresh Crossover</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232E47] text-slate-400">
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-500 italic">
                  Awaiting Level 2 &amp; 3 data pipeline deployment — zero synthetic data policy enforced.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
