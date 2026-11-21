import React, { useState } from 'react';
import { X, Search, ExternalLink, Calculator, Layers, PieChart, ShieldCheck, BookOpen, Sparkles } from 'lucide-react';

export type ToolType = 
  | 'lot-size'
  | 'nse-links'
  | 'sector-companies'
  | 'top-etfs'
  | 'market-cap'
  | 'swing-screener'
  | 'trading-journal'
  | null;

interface MarketToolsModalProps {
  tool: ToolType;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

const LOT_SIZES = [
  { symbol: 'NIFTY', name: 'NIFTY 50 Index', lot_size: 25, type: 'Index' },
  { symbol: 'BANKNIFTY', name: 'NIFTY Bank Index', lot_size: 15, type: 'Index' },
  { symbol: 'FINNIFTY', name: 'NIFTY Financial Services', lot_size: 25, type: 'Index' },
  { symbol: 'MIDCPNIFTY', name: 'NIFTY Midcap Select', lot_size: 50, type: 'Index' },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', lot_size: 250, type: 'Stock' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', lot_size: 550, type: 'Stock' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', lot_size: 700, type: 'Stock' },
  { symbol: 'INFY', name: 'Infosys Ltd', lot_size: 400, type: 'Stock' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', lot_size: 175, type: 'Stock' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', lot_size: 475, type: 'Stock' },
  { symbol: 'SBIN', name: 'State Bank of India', lot_size: 750, type: 'Stock' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', lot_size: 150, type: 'Stock' },
  { symbol: 'ITC', name: 'ITC Ltd', lot_size: 1600, type: 'Stock' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', lot_size: 400, type: 'Stock' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', lot_size: 625, type: 'Stock' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', lot_size: 350, type: 'Stock' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', lot_size: 550, type: 'Stock' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', lot_size: 50, type: 'Stock' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Ltd', lot_size: 350, type: 'Stock' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', lot_size: 5500, type: 'Stock' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', lot_size: 125, type: 'Stock' },
  { symbol: 'NTPC', name: 'NTPC Ltd', lot_size: 1500, type: 'Stock' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', lot_size: 1800, type: 'Stock' },
];

const NSE_OFFICIAL_LINKS = [
  { name: 'NSE Live Market Bhavcopy', url: 'https://www.nseindia.com/all-reports', desc: 'Official End-of-Day cash and derivatives Bhavcopy ZIPs' },
  { name: 'NSE FII / DII Trading Activity', url: 'https://www.nseindia.com/reports/fii-dii', desc: 'Daily post-market institutional turnover statistics' },
  { name: 'NSE Participant-Wise Open Interest', url: 'https://www.nseindia.com/reports/derivatives', desc: 'FII, DII, Pro, and Client open interest breakdown' },
  { name: 'NSE Live Option Chain', url: 'https://www.nseindia.com/option-chain', desc: 'Real-time strike-wise OI, Volume, IV and PCR' },
  { name: 'NSE Advances & Declines Dashboard', url: 'https://www.nseindia.com/market-data/live-market-indices', desc: 'Real-time breadth across NIFTY 50, NIFTY 500 & Sectors' },
  { name: 'NSE Trading Holiday Calendar 2026', url: 'https://www.nseindia.com/resources/exchange-communication-holidays', desc: 'Official exchange clearing and settlement holidays' },
  { name: 'NSE Corporate Announcements & Filings', url: 'https://www.nseindia.com/companies-listing/corporate-filings-announcements', desc: 'Quarterly financial results, board meetings, dividends' },
  { name: 'BSE Official Market Watch', url: 'https://www.bseindia.com/', desc: 'SENSEX real-time indices, circuit limits, and market capitalisation' },
];

const TOP_ETFS = [
  { symbol: 'NIFTYBEES', name: 'Nippon India Nifty 50 BeES ETF', category: 'Large Cap Index', aum: '₹35,400 Cr', exp_ratio: '0.04%' },
  { symbol: 'BANKBEES', name: 'Nippon India Nifty Bank BeES ETF', category: 'Banking Sector', aum: '₹14,200 Cr', exp_ratio: '0.18%' },
  { symbol: 'GOLDBEES', name: 'Nippon India ETF Gold BeES', category: 'Precious Metals', aum: '₹12,800 Cr', exp_ratio: '0.79%' },
  { symbol: 'SILVERBEES', name: 'Nippon India ETF Silver BeES', category: 'Precious Metals', aum: '₹5,100 Cr', exp_ratio: '0.52%' },
  { symbol: 'ITBEES', name: 'Nippon India ETF Nifty IT', category: 'Technology', aum: '₹3,900 Cr', exp_ratio: '0.22%' },
  { symbol: 'JUNIORBEES', name: 'Nippon India ETF Nifty Next 50', category: 'Mid-Large Cap', aum: '₹4,600 Cr', exp_ratio: '0.15%' },
  { symbol: 'LIQUIDBEES', name: 'Nippon India ETF Nifty 1D Rate', category: 'Cash & Overnight', aum: '₹18,500 Cr', exp_ratio: '0.69%' },
  { symbol: 'MON100', name: 'Motilal Oswal Nasdaq 100 ETF', category: 'US Tech Equities', aum: '₹7,200 Cr', exp_ratio: '0.58%' },
];

export const MarketToolsModal: React.FC<MarketToolsModalProps> = ({ tool, onClose, onNavigateTab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [journalNote, setJournalNote] = useState('');
  const [journalTrades, setJournalTrades] = useState<string[]>([
    '21 Nov 2026: NIFTY 50 Closed 25,255 (+0.84%). Heavyweight support by HDFCBANK & ICICIBANK. FII bought +₹2,410 Cr in cash, unwound -71.7% index short contracts.',
    '18 Nov 2026: IIP printed +4.80% beat vs +4.00% expected. Capital Goods leading industrial expansion. Setup 6/6 DMA Bullish on BEL and LT.'
  ]);

  if (!tool) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#121824] border border-[#232E47] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232E47] bg-[#161F33]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
              {tool === 'lot-size' && <Calculator className="w-5 h-5" />}
              {tool === 'nse-links' && <ExternalLink className="w-5 h-5" />}
              {tool === 'top-etfs' && <PieChart className="w-5 h-5" />}
              {tool === 'trading-journal' && <BookOpen className="w-5 h-5" />}
              {tool === 'swing-screener' && <Sparkles className="w-5 h-5" />}
              {tool === 'sector-companies' && <Layers className="w-5 h-5" />}
              {tool === 'market-cap' && <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white capitalize">
                {tool === 'lot-size' && 'NSE F&O Lot Size Finder (2026 Official)'}
                {tool === 'nse-links' && 'NSE & BSE Official Regulatory Links'}
                {tool === 'top-etfs' && 'Top Liquid Indian ETFs (NSE Quoted)'}
                {tool === 'trading-journal' && 'Institutional Trading Journal & Notes'}
                {tool === 'swing-screener' && 'Quantitative Swing Screener (6/6 DMA + RVOL)'}
                {tool === 'sector-companies' && 'Sector Wise Constituent Companies'}
                {tool === 'market-cap' && 'NSE Market Capitalisation Segments'}
              </h2>
              <p className="text-xs text-slate-400">
                {tool === 'lot-size' && 'Current contract lot sizes for index and stock derivatives on the National Stock Exchange.'}
                {tool === 'nse-links' && 'Verified direct links to statutory Bhavcopy, participant Open Interest, and filings.'}
                {tool === 'top-etfs' && 'Most active exchange traded funds covering Equities, Commodities, and Debt.'}
                {tool === 'trading-journal' && 'Maintain discipline with timestamped session observations and setup tracking.'}
                {tool === 'swing-screener' && 'Scan stocks trading above all 6 moving averages with institutional volume expansion.'}
                {tool === 'sector-companies' && 'Classification of 50 heavyweights across 22 primary economic sectors.'}
                {tool === 'market-cap' && 'Large Cap (Top 100), Mid Cap (101-250), Small Cap (251-500) distribution.'}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* 1. Lot Size Finder */}
          {tool === 'lot-size' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search symbol (e.g. NIFTY, RELIANCE, HDFCBANK)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0B0E14] border border-[#232E47] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="overflow-x-auto rounded-lg border border-[#232E47]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#161F33] text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Underlying Asset</th>
                      <th className="py-2.5 px-3">Segment</th>
                      <th className="py-2.5 px-3 text-right">Lot Size (Contracts)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232E47]">
                    {LOT_SIZES.filter(s => s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                      <tr key={item.symbol} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-white">{item.symbol}</td>
                        <td className="py-2.5 px-3 text-slate-400">{item.name}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${item.type === 'Index' ? 'bg-purple-500/20 text-purple-300' : 'bg-sky-500/20 text-sky-300'}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">{item.lot_size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. NSE Official Links */}
          {tool === 'nse-links' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {NSE_OFFICIAL_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-[#161F33] border border-[#232E47] hover:border-sky-500/50 hover:bg-[#1A253D] transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white group-hover:text-sky-300 transition-colors">{link.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">{link.desc}</p>
                </a>
              ))}
            </div>
          )}

          {/* 3. Top ETFs */}
          {tool === 'top-etfs' && (
            <div className="overflow-x-auto rounded-lg border border-[#232E47]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#161F33] text-slate-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Fund Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">AUM</th>
                    <th className="py-2.5 px-3 text-right">Expense Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232E47]">
                  {TOP_ETFS.map((etf) => (
                    <tr key={etf.symbol} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-white">{etf.symbol}</td>
                      <td className="py-2.5 px-3 text-slate-300">{etf.name}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                          {etf.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-200">{etf.aum}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-sky-400 font-bold">{etf.exp_ratio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Trading Journal */}
          {tool === 'trading-journal' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Add Session Note / Trade Observation:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={journalNote}
                    onChange={(e) => setJournalNote(e.target.value)}
                    placeholder="E.g., Bought INFY call at 1880, supported by Services PMI beat and IT sector rotation..."
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#232E47] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={() => {
                      if (journalNote.trim()) {
                        setJournalTrades([`${new Date().toLocaleDateString('en-GB')}: ${journalNote.trim()}`, ...journalTrades]);
                        setJournalNote('');
                      }
                    }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-colors"
                  >
                    Add Entry
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Recorded Session Notes</span>
                <div className="space-y-2">
                  {journalTrades.map((t, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#161F33] border border-[#232E47] text-xs text-slate-200">
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. Swing Screener */}
          {tool === 'swing-screener' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                <div className="font-bold">Quantitative Swing Setup Rules:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>Price &gt; 5, 10, 20, 50, 100, 200 DMA:</strong> Complete bull trend alignment (Category A: 6/6 Score).</li>
                  <li><strong>RVOL &ge; 1.50x:</strong> Institutional volume surge confirming breakout momentum.</li>
                  <li><strong>Price Change &gt; +0.75%:</strong> Strong demand candle without intraday wick rejection.</li>
                </ul>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    onClose();
                    if (onNavigateTab) onNavigateTab('dma-scanner');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  Go to DMA Scanner →
                </button>
              </div>
            </div>
          )}

          {/* 6. Sector Companies */}
          {tool === 'sector-companies' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">Major NIFTY 50 Heavyweights grouped across primary economic sectors:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#161F33] border border-[#232E47]">
                  <div className="font-bold text-sky-400 mb-1">Financial Services (35.2% wt)</div>
                  <div className="text-slate-300">HDFCBANK, ICICIBANK, SBIN, AXISBANK, KOTAKBANK, BAJFINANCE, BAJAJFINSV</div>
                </div>
                <div className="p-3 rounded-lg bg-[#161F33] border border-[#232E47]">
                  <div className="font-bold text-emerald-400 mb-1">Information Technology (13.8% wt)</div>
                  <div className="text-slate-300">TCS, INFY, HCLTECH, WIPRO, TECHM</div>
                </div>
                <div className="p-3 rounded-lg bg-[#161F33] border border-[#232E47]">
                  <div className="font-bold text-amber-400 mb-1">Oil, Gas &amp; Consumable Fuels (11.5% wt)</div>
                  <div className="text-slate-300">RELIANCE, ONGC, BPCL, COALINDIA</div>
                </div>
                <div className="p-3 rounded-lg bg-[#161F33] border border-[#232E47]">
                  <div className="font-bold text-purple-400 mb-1">Automobile &amp; Auto Components (7.9% wt)</div>
                  <div className="text-slate-300">M&amp;M, MARUTI, TATAMOTORS, BAJAJ-AUTO, EICHERMOT, HEROMOTOCO</div>
                </div>
              </div>
            </div>
          )}

          {/* 7. Market Cap */}
          {tool === 'market-cap' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#161F33] border border-[#232E47]">
                  <div className="font-bold text-emerald-400 text-sm">Large Cap</div>
                  <div className="text-slate-400 text-[11px] mt-1">Top 1 to 100 Companies</div>
                  <div className="text-slate-200 mt-2">Market cap &gt; ₹67,000 Cr. Represents over 70% of total Indian equity market capitalization.</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#161F33] border border-[#232E47]">
                  <div className="font-bold text-sky-400 text-sm">Mid Cap</div>
                  <div className="text-slate-400 text-[11px] mt-1">Rank 101 to 250 Companies</div>
                  <div className="text-slate-200 mt-2">Market cap ₹22,000 Cr to ₹67,000 Cr. High growth, industrial manufacturing and domestic consumption.</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#161F33] border border-[#232E47]">
                  <div className="font-bold text-purple-400 text-sm">Small Cap</div>
                  <div className="text-slate-400 text-[11px] mt-1">Rank 251 and below</div>
                  <div className="text-slate-200 mt-2">Market cap &lt; ₹22,000 Cr. Emerging businesses, high beta, aggressive capex expansion.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#232E47] bg-[#161F33] flex justify-between items-center text-xs text-slate-400">
          <span>Official NSE / BSE / SEBI Data Architecture</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
