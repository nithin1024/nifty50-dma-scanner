import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  RefreshCw, 
  ChevronRight
} from 'lucide-react';
import { fetchSectorFundamentals } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const SectorFundamentalsDashboard: React.FC = () => {
  const { language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>('banking');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSectorFundamentals();
      setData(res);
      if (res.sectors && res.sectors.length > 0) {
        setSelectedSector(res.sectors[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load sector fundamentals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 bg-[#121824] rounded-xl border border-[#232E47] p-8">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
        <div className="text-slate-300 font-medium text-sm font-mono">
          {language === 'te' ? 'సెక్టార్ మరియు కంపెనీ ఫండమెంటల్స్‌ను లోడ్ చేస్తోంది...' : 'Loading Sector & Company Fundamentals Intelligence...'}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#121824] rounded-xl border border-rose-500/30 p-6 text-center space-y-3">
        <div className="text-rose-400 font-bold">Sector Data Unavailable</div>
        <div className="text-xs text-slate-400 font-mono">{error}</div>
        <button
          onClick={loadData}
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const sectors: any[] = data.sectors || [];
  const currentSector = sectors.find(s => s.id === selectedSector) || sectors[0];

  const filteredSectors = sectors.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nifty_index.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-black text-white tracking-tight">
              {language === 'te' ? 'సెక్టార్ మరియు కంపెనీ ఫండమెంటల్స్ ఇంటెలిజెన్స్' : 'Sector & Company Fundamentals Intelligence'}
            </h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MODULE 9
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {language === 'te' 
              ? '15 భారతీయ సెక్టార్లు • కంపెనీ-స్థాయి P/E, P/B, OPM, ROE, ROCE & స్థూల ఆర్థిక సున్నితత్వం.'
              : '15 Indian Key Sectors • Company-level Valuations, Financial Margins & Macro Transmission Matrices'}
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{language === 'te' ? 'రిఫ్రెష్ చేయండి' : 'Refresh Sectors'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: 15 Sector Selection Pills */}
        <div className="lg:col-span-1 space-y-3 bg-[#121824] border border-[#232E47] rounded-xl p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#232E47] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {filteredSectors.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedSector(sec.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-all ${
                  selectedSector === sec.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div>
                  <div className="font-semibold">{sec.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{sec.nifty_index}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400">{sec.weight_in_nifty50_pct}%</div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 inline-block" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Selected Sector Deep Dive */}
        <div className="lg:col-span-3 space-y-6">
          {currentSector && (
            <>
              {/* Sector Summary Telemetry */}
              <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47] gap-2">
                  <div>
                    <h2 className="text-base font-bold text-white">{currentSector.name}</h2>
                    <span className="text-xs text-slate-400 font-mono">Index: {currentSector.nifty_index}</span>
                  </div>
                  <span className="px-3 py-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono font-bold self-start sm:self-auto">
                    NIFTY 50 Weight: {currentSector.weight_in_nifty50_pct}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-[#0B0E14] p-3 rounded-lg border border-[#232E47]">
                    <div className="text-[10px] text-slate-400">Sector P/E</div>
                    <div className="text-base font-bold text-white mt-0.5">{currentSector.sector_pe}x</div>
                  </div>
                  <div className="bg-[#0B0E14] p-3 rounded-lg border border-[#232E47]">
                    <div className="text-[10px] text-slate-400">Sector P/B</div>
                    <div className="text-base font-bold text-white mt-0.5">{currentSector.sector_pb}x</div>
                  </div>
                  <div className="bg-[#0B0E14] p-3 rounded-lg border border-[#232E47]">
                    <div className="text-[10px] text-slate-400">Average ROE</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">{currentSector.roe_pct}%</div>
                  </div>
                  <div className="bg-[#0B0E14] p-3 rounded-lg border border-[#232E47]">
                    <div className="text-[10px] text-slate-400">Growth / Metric</div>
                    <div className="text-base font-bold text-amber-300 mt-0.5">
                      {currentSector.credit_growth_yoy_pct ? `${currentSector.credit_growth_yoy_pct}% Credit` : 
                       currentSector.revenue_growth_yoy_pct ? `${currentSector.revenue_growth_yoy_pct}% Rev` : 'Strong'}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
                  <span className="text-emerald-400 font-bold font-mono">Macroeconomic Transmission Sensitivity:</span>
                  <p className="text-slate-300 mt-1 leading-relaxed">{currentSector.macro_sensitivity}</p>
                </div>
              </div>

              {/* Leading Constituents Financial Table */}
              <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Leading Listed Constituents Fundamentals
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0B0E14] text-slate-400 uppercase text-[10px] border-b border-[#232E47]">
                      <tr>
                        <th className="py-2.5 px-3">Symbol</th>
                        <th className="py-2.5 px-3">Company</th>
                        <th className="py-2.5 px-3 text-right">M-Cap (₹ Cr)</th>
                        <th className="py-2.5 px-3 text-right">OPM %</th>
                        <th className="py-2.5 px-3 text-right">ROE %</th>
                        <th className="py-2.5 px-3 text-right">ROCE %</th>
                        <th className="py-2.5 px-3 text-right">P/E</th>
                        <th className="py-2.5 px-3 text-right">P/B</th>
                        <th className="py-2.5 px-3 text-right">D/E</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232E47]/50">
                      {currentSector.leading_constituents?.map((stock: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-sky-400">{stock.symbol}</td>
                          <td className="py-2.5 px-3 text-white">{stock.name}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">
                            ₹{stock.mcap_cr?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{stock.opm_pct}%</td>
                          <td className="py-2.5 px-3 text-right text-emerald-400">{stock.roe_pct}%</td>
                          <td className="py-2.5 px-3 text-right text-teal-300">{stock.roce_pct}%</td>
                          <td className="py-2.5 px-3 text-right text-slate-300">{stock.pe}x</td>
                          <td className="py-2.5 px-3 text-right text-slate-300">{stock.pb}x</td>
                          <td className="py-2.5 px-3 text-right text-slate-400">{stock.debt_to_equity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
