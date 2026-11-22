import React from 'react';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';

export type ToolType = 
  | 'nse-links'
  | null;

interface MarketToolsModalProps {
  tool: ToolType;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NSE_OFFICIAL_LINKS = [
  { name: 'NSE Live Market Bhavcopy', url: 'https://www.nseindia.com/all-reports', desc: 'Official End-of-Day cash and derivatives Bhavcopy ZIPs' },
  { name: 'NSE FII / DII Trading Activity', url: 'https://www.nseindia.com/reports/fii-dii', desc: 'Daily post-market institutional turnover statistics' },
  { name: 'NSE Participant-Wise Open Interest', url: 'https://www.nseindia.com/reports/derivatives', desc: 'FII, DII, Pro, and Client open interest breakdown' },
  { name: 'NSE Live Option Chain', url: 'https://www.nseindia.com/option-chain', desc: 'Real-time strike-wise OI, Volume, IV and PCR' },
  { name: 'NSE Advances & Declines Dashboard', url: 'https://www.nseindia.com/market-data/live-market-indices', desc: 'Real-time breadth across NIFTY 50, NIFTY 500 & Sectors' },
  { name: 'NSE Trading Holiday Calendar 2026', url: 'https://www.nseindia.com/resources/exchange-communication-holidays', desc: 'Official exchange clearing and settlement holidays' },
  { name: 'NSE Corporate Announcements & Filings', url: 'https://www.nseindia.com/companies-listing/corporate-filings-announcements', desc: 'Quarterly financial results, board meetings, dividends' },
  { name: 'BSE Official Market Watch', url: 'https://www.bseindia.com/', desc: 'SENSEX real-time indices, circuit limits, and market capitalisation' },
];

export const MarketToolsModal: React.FC<MarketToolsModalProps> = ({ tool, onClose }) => {
  if (!tool) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#121824] border border-[#232E47] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232E47] bg-[#161F33]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                NSE &amp; BSE Official Regulatory Links
              </h2>
              <p className="text-xs text-slate-400">
                Verified direct links to statutory Bhavcopy, participant Open Interest, option chains, and corporate filings.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: NSE Official Links Grid */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {NSE_OFFICIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-[#161F33] border border-[#232E47] hover:border-emerald-500/50 hover:bg-[#1A253D] transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors">{link.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">{link.desc}</p>
                <div className="mt-2 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Official Exchange Verified Portal</span>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
