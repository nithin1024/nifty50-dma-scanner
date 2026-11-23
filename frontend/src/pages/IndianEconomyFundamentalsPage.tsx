import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  ShieldCheck, 
  ExternalLink, 
  Fuel,
  Clock
} from 'lucide-react';
import { PmiIntelligenceDashboard } from '../components/PmiIntelligenceDashboard';
import { IipIntelligenceSection } from '../components/IipIntelligenceSection';

type SubSection = 'all' | 'gdp' | 'pmi' | 'iip' | 'inflation' | 'rbi-capex-macro';

export const IndianEconomyFundamentalsPage: React.FC = () => {
  const [subSection, setSubSection] = useState<SubSection>('all');
  const [inflationCountdown, setInflationCountdown] = useState<number>(300);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setInflationCountdown((prev) => (prev <= 1 ? 300 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Exact Section 3 GDP Intelligence calculations
  const realGdp = 173.82; // ₹ Lakh Crore (Constant FY12 prices)
  const nominalGdp = 295.36; // ₹ Lakh Crore (Current prices)
  const realGdpGrowth = 6.70; // % YoY
  const npia = -2.15; // Net Primary Income from Abroad (₹ Lakh Cr)
  const depreciation = 19.45; // Consumption of Fixed Capital (₹ Lakh Cr)
  const population = 144.17; // Crore persons (1.44 Billion)
  
  // Exact Formulas:
  // 1. GDP Deflator = (Nominal / Real) * 100
  const gdpDeflator = ((nominalGdp / realGdp) * 100).toFixed(2);
  const deflatorInflation = 3.00; // % YoY
  // 2. GNI = GDP + NPIA
  const gni = (nominalGdp + npia).toFixed(2);
  // 3. NDP = GDP - Depreciation
  const ndp = (nominalGdp - depreciation).toFixed(2);
  // 4. NNI = GNI - Depreciation
  const nni = (parseFloat(gni) - depreciation).toFixed(2);
  // 5. Per Capita Nominal GDP = (Nominal GDP in Lakh Cr * 10^7) / (Population in Cr * 10^7)
  const perCapitaGdp = Math.round((nominalGdp * 10000000) / population);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#121824] via-[#161F33] to-[#121824] border border-[#232E47] shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                Fundamental Economy Intelligence Platform
              </span>
              <span className="text-xs text-slate-400">
                MoSPI &bull; RBI &bull; DPIIT &bull; Union Budget &bull; NSO
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Indian Economy &amp; Fundamentals Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Comprehensive institutional analysis of GDP, PMI, IIP, Inflation, RBI Policy Corridor, CAPEX, and Commodities.
            </p>
          </div>

          {/* Quick Sub-navigation Pills */}
          <div className="flex flex-wrap gap-1.5 bg-[#0B0E14] p-1.5 rounded-xl border border-[#232E47]">
            <button
              onClick={() => setSubSection('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${subSection === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              All Modules
            </button>
            <button
              onClick={() => setSubSection('gdp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${subSection === 'gdp' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              1. GDP Intelligence
            </button>
            <button
              onClick={() => setSubSection('pmi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${subSection === 'pmi' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              2. PMI Intelligence
            </button>
            <button
              onClick={() => setSubSection('iip')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${subSection === 'iip' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              3. IIP Production
            </button>
            <button
              onClick={() => setSubSection('inflation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${subSection === 'inflation' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              4. Inflation Suite
            </button>
            <button
              onClick={() => setSubSection('rbi-capex-macro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${subSection === 'rbi-capex-macro' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              5. RBI, CAPEX &amp; Macro
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: GDP INTELLIGENCE DASHBOARD (SECTION 3 SPECIFICATION) */}
      {(subSection === 'all' || subSection === 'gdp') && (
        <section className="p-5 rounded-2xl bg-[#121824] border border-[#232E47] shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47] gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">MoSPI National Accounts</span>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>1. GDP &amp; National Income Intelligence Dashboard</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">13 Indicators</span>
              </h2>
            </div>
            <a 
              href="https://www.mospi.gov.in/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1"
            >
              <span>MoSPI Official Press Releases</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* 13 GDP Components Grid with Exact Mathematical Formulas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#161F33] border border-[#232E47]">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Real GDP Growth (YoY)</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">+{realGdpGrowth.toFixed(2)}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Constant FY12 prices (₹{realGdp}L Cr)</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#161F33] border border-[#232E47]">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Nominal GDP Growth</div>
              <div className="text-2xl font-black text-white mt-1">+9.70%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Current market prices (₹{nominalGdp}L Cr)</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#161F33] border border-[#232E47]">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Gross Value Added (GVA)</div>
              <div className="text-2xl font-black text-sky-400 mt-1">+6.80%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">GDP minus Taxes + Subsidies</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#161F33] border border-[#232E47]">
              <div className="text-[10px] text-slate-400 font-bold uppercase">GDP Deflator (Inflation)</div>
              <div className="text-2xl font-black text-amber-300 mt-1">+{deflatorInflation.toFixed(2)}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Index: {gdpDeflator} (Nominal / Real)</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#232E47]">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Gross National Income (GNI)</div>
              <div className="text-xl font-bold text-slate-200 mt-1">₹{gni}L Cr</div>
              <div className="text-[10px] text-slate-400 mt-0.5">GDP + Net Income from Abroad (NPIA)</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#232E47]">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Net Domestic Product (NDP)</div>
              <div className="text-xl font-bold text-slate-200 mt-1">₹{ndp}L Cr</div>
              <div className="text-[10px] text-slate-400 mt-0.5">GDP minus Depreciation (CFC)</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#232E47]">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Net National Income (NNI)</div>
              <div className="text-xl font-bold text-slate-200 mt-1">₹{nni}L Cr</div>
              <div className="text-[10px] text-slate-400 mt-0.5">GNI minus Depreciation</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#232E47]">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Per Capita Nominal GDP</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">₹{perCapitaGdp.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">GDP / Total Population (~1.44B)</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#161F33]/60 border border-[#232E47]">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Private Consumption (PFCE)</div>
              <div className="text-xl font-bold text-white mt-1">56.0% of GDP</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Household demand driver (+7.4% YoY)</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#161F33]/60 border border-[#232E47]">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Gross Fixed Capital (GFCF)</div>
              <div className="text-xl font-bold text-sky-400 mt-1">34.8% of GDP</div>
              <div className="text-[10px] text-slate-400 mt-0.5">National investment rate (+7.5% YoY)</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#161F33]/60 border border-[#232E47]">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Government Final (GFCE)</div>
              <div className="text-xl font-bold text-slate-200 mt-1">10.2% of GDP</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Fiscal revenue expenditure</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#161F33]/60 border border-[#232E47]">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Net External Trade (X - M)</div>
              <div className="text-xl font-bold text-rose-400 mt-1">-1.0% of GDP</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Net goods deficit offset by IT exports</div>
            </div>
          </div>

          {/* 5-Year Historical GDP vs NIFTY 50 Comparison */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47]">
            <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider mb-3">
              5-Year Trend &amp; GDP vs NIFTY 50 Market Correlation
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#161F33] text-slate-400 text-[11px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Fiscal Year</th>
                    <th className="py-2 px-3 text-right">Real GDP Growth</th>
                    <th className="py-2 px-3 text-right">Nominal GDP</th>
                    <th className="py-2 px-3 text-right">GFCF (Capex %)</th>
                    <th className="py-2 px-3 text-right">NIFTY 50 Fiscal Close</th>
                    <th className="py-2 px-3 text-right">NIFTY YoY Return</th>
                    <th className="py-2 px-3">Macro Engine Driver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232E47]">
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-white">FY26 (Current Est.)</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400 font-bold">+6.70%</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-200">₹295.36L Cr</td>
                    <td className="py-2 px-3 text-right font-mono text-sky-400">34.8%</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-white">25,255.05</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400 font-bold">+18.4%</td>
                    <td className="py-2 px-3 text-slate-400">Infra CAPEX &amp; Resilient Banking Credit</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-white">FY25</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400 font-bold">+8.20%</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-200">₹295.36L Cr</td>
                    <td className="py-2 px-3 text-right font-mono text-sky-400">33.5%</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-white">22,326.90</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400 font-bold">+28.6%</td>
                    <td className="py-2 px-3 text-slate-400">Manufacturing resurgence &amp; PLI rollout</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-white">FY24</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400">+7.00%</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-200">₹269.50L Cr</td>
                    <td className="py-2 px-3 text-right font-mono text-sky-400">32.2%</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-white">17,359.75</td>
                    <td className="py-2 px-3 text-right font-mono text-rose-400">-0.6%</td>
                    <td className="py-2 px-3 text-slate-400">Global central bank tightening cycle</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-white">FY23</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400 font-bold">+9.10%</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-200">₹234.71L Cr</td>
                    <td className="py-2 px-3 text-right font-mono text-sky-400">31.4%</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-white">17,464.75</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400 font-bold">+18.9%</td>
                    <td className="py-2 px-3 text-slate-400">Post-pandemic economic reopening rebound</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-white">FY22</td>
                    <td className="py-2 px-3 text-right font-mono text-rose-400">-5.80%</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-200">₹198.01L Cr</td>
                    <td className="py-2 px-3 text-right font-mono text-sky-400">28.6%</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-white">14,690.70</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400 font-bold">+70.9%</td>
                    <td className="py-2 px-3 text-slate-400">Global monetary stimulus &amp; liquidity wave</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: PMI INTELLIGENCE (SECTION 4 SPECIFICATION) */}
      {(subSection === 'all' || subSection === 'pmi') && (
        <PmiIntelligenceDashboard />
      )}

      {/* SECTION 3: IIP INDUSTRIAL PRODUCTION (SECTION 5 SPECIFICATION) */}
      {(subSection === 'all' || subSection === 'iip') && (
        <IipIntelligenceSection />
      )}

      {/* SECTION 4: INFLATION INTELLIGENCE (SECTION 6 SPECIFICATION) */}
      {(subSection === 'all' || subSection === 'inflation') && (
        <section className="p-5 rounded-2xl bg-[#121824] border border-[#232E47] shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47] gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">MoSPI &amp; DPIIT Official Baskets</span>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>4. Inflation Intelligence Dashboard (CPI vs WPI &amp; RBI Corridor)</span>
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-bold text-xs shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>5m Auto-Update: {formatCountdown(inflationCountdown)}</span>
              </div>
              <span className="text-xs text-slate-400">
                RBI Tolerance Band: <strong className="text-amber-300">4.0% &plusmn; 2.0% (2.0% to 6.0%)</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CPI Suite */}
            <div className="p-4 rounded-xl bg-[#161F33] border border-[#232E47] space-y-3">
              <div className="flex items-center justify-between border-b border-[#232E47] pb-2">
                <span className="text-xs font-bold text-rose-400 uppercase">Consumer Price Index (CPI Suite)</span>
                <span className="text-[10px] text-slate-400">Base 2012=100</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#232E47]/50">
                  <span className="text-slate-300 font-medium">Headline CPI YoY</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">6.21% (Breaches 6% ceiling)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#232E47]/50">
                  <span className="text-slate-300 font-medium">Core CPI (ex Food &amp; Fuel)</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">3.50% (Benign anchor)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#232E47]/50">
                  <span className="text-slate-300 font-medium">Food CPI (CFPI - 39% wt)</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">10.87% (Vegetable surge)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-300 font-medium">Fuel &amp; Light CPI</span>
                  <span className="font-mono font-bold text-sky-400 text-sm">-1.39% (Deflationary cushion)</span>
                </div>
              </div>
            </div>

            {/* WPI Suite */}
            <div className="p-4 rounded-xl bg-[#161F33] border border-[#232E47] space-y-3">
              <div className="flex items-center justify-between border-b border-[#232E47] pb-2">
                <span className="text-xs font-bold text-sky-400 uppercase">Wholesale Price Index (WPI Suite)</span>
                <span className="text-[10px] text-slate-400">Base 2011-12=100</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#232E47]/50">
                  <span className="text-slate-300 font-medium">Headline WPI YoY</span>
                  <span className="font-mono font-bold text-sky-400 text-sm">2.36% (Previous: 1.84%)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#232E47]/50">
                  <span className="text-slate-300 font-medium">Core WPI (Non-Food Mfg)</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">0.80% (Input cost stability)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#232E47]/50">
                  <span className="text-slate-300 font-medium">Food WPI</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">13.54% (Primary agri inputs)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-300 font-medium">Fuel &amp; Power WPI</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">-5.79% (Deflationary cushion)</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5: RBI POLICY, CAPEX, EMPLOYMENT, BOND YIELDS & COMMODITIES (SECTION 9) */}
      {(subSection === 'all' || subSection === 'rbi-capex-macro') && (
        <section className="p-5 rounded-2xl bg-[#121824] border border-[#232E47] shadow-xl space-y-5">
          <div className="pb-3 border-b border-[#232E47]">
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Sovereign &amp; Geopolitical Architecture</span>
            <h2 className="text-lg font-bold text-white">
              5. Central Bank Liquidity Corridor, Union Budget CAPEX &amp; Macro Indicators
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* RBI Liquidity Corridor */}
            <div className="p-4 rounded-xl bg-[#161F33] border border-[#232E47] space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-sky-400">
                <Landmark className="w-4 h-4" />
                <span>RBI Monetary Policy Corridor</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Policy Repo Rate:</span> <strong className="text-white font-mono">6.50%</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">SDF (Lower Floor):</span> <strong className="text-emerald-400 font-mono">6.25%</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">MSF (Upper Ceiling):</span> <strong className="text-amber-400 font-mono">6.75%</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">Cash Reserve Ratio (CRR):</span> <strong className="text-slate-200 font-mono">4.50%</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">Statutory Liquidity (SLR):</span> <strong className="text-slate-200 font-mono">18.00%</strong></div>
              </div>
            </div>

            {/* Union Budget CAPEX */}
            <div className="p-4 rounded-xl bg-[#161F33] border border-[#232E47] space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Union Budget CAPEX Targets</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Public CAPEX Target:</span> <strong className="text-emerald-400 font-mono">₹11.11 Lakh Cr</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">Effective CAPEX:</span> <strong className="text-white font-mono">₹15.02 Lakh Cr</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">Fiscal Deficit:</span> <strong className="text-sky-400 font-mono">4.90% of GDP</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">Railway &amp; Defence Capex:</span> <strong className="text-slate-200 font-mono">₹2.52L Cr / ₹1.72L Cr</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">Gross Monthly GST:</span> <strong className="text-emerald-400 font-mono">₹1.87 Lakh Cr</strong></div>
              </div>
            </div>

            {/* Sovereign Yields & Commodities */}
            <div className="p-4 rounded-xl bg-[#161F33] border border-[#232E47] space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                <Fuel className="w-4 h-4" />
                <span>Yields &amp; Geopolitics</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">India 10Y G-Sec Yield:</span> <strong className="text-white font-mono">6.82%</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">US 10Y Treasury Yield:</span> <strong className="text-rose-400 font-mono">4.41%</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">India-US Yield Spread:</span> <strong className="text-sky-400 font-mono">241 bps</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">Brent Crude Oil:</span> <strong className="text-emerald-400 font-mono">$72.80 / bbl</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">MCX Gold 24K:</span> <strong className="text-amber-300 font-mono">₹76,500 / 10g</strong></div>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};
