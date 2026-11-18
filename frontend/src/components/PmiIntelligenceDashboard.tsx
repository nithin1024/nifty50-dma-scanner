import React, { useState, useEffect } from 'react';
import { fetchPmiDashboard } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Building2, 
  DollarSign, 
  Filter,
  BarChart3
} from 'lucide-react';

export const PmiIntelligenceDashboard: React.FC = () => {
  const { language } = useLanguage();
  const isTelugu = language === 'te';

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedCaseTab, setSelectedCaseTab] = useState<string>('CASE_2');
  const [companyCaseFilter, setCompanyCaseFilter] = useState<string>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'CASES' | 'COMPARISON_TABLE' | 'COMPANIES' | 'HISTORY'>('OVERVIEW');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchPmiDashboard();
      setDashboardData(data);
      if (data?.current_regime?.case_id) {
        setSelectedCaseTab(data.current_regime.case_id);
      }
    } catch (err) {
      console.error('Failed to load PMI dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-[#121824] border border-[#232E47] rounded-xl text-slate-400">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
        <span className="text-sm font-mono">Loading Institutional PMI Intelligence Suite...</span>
      </div>
    );
  }

  const indicators = dashboardData?.indicators || [];
  const fourCases = dashboardData?.four_case_scenarios || {};
  const comparisonTable = dashboardData?.comparison_table || [];
  const expectationAnalysis = dashboardData?.expectation_vs_actual?.analyses || [];
  const companies = dashboardData?.companies || [];
  const history = dashboardData?.historical_5year || {};
  const alerts = dashboardData?.alerts || [];
  const currentRegime = dashboardData?.current_regime;

  const filteredCompanies = companyCaseFilter === 'ALL' 
    ? companies 
    : companies.filter((c: any) => c.pmi_case === companyCaseFilter);

  return (
    <div className="space-y-6">
      {/* Top Banner: Header, Live Provenance & Active Regime */}
      <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#232E47]/70">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <BarChart3 className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {isTelugu ? 'కొనుగోలు నిర్వాహకుల సూచిక (PMI) ఇంటెలిజెన్స్' : 'Institutional PMI Intelligence & Scenario Engine'}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    FOUR CASE FRAMEWORK
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isTelugu 
                    ? 'కోర్సు నోట్స్ ఆధారంగా 4 కేసు దృశ్యాలు, 8 ప్రపంచ సూచికలు, అంచనా vs వాస్తవ విశ్లేషణ'
                    : 'Surveillance of 8 Global PMIs • 4 Cyclical Recovery/Contraction Scenarios • Sector Sensitivity & Equity Allocation'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1A2234] hover:bg-[#232E47] text-slate-300 hover:text-white border border-[#232E47] text-xs font-mono transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
              <span>{isTelugu ? 'రిఫ్రెష్' : 'Refresh'}</span>
            </button>
            <div className="text-right font-mono text-[11px] text-slate-400 hidden sm:block">
              <div>Source: <span className="text-slate-200">S&P Global / HSBC / ISM</span></div>
              <div className="text-[10px] text-emerald-400 font-semibold">VERIFIED OFFICIAL</div>
            </div>
          </div>
        </div>

        {/* Current Active Economic Regime Callout */}
        {currentRegime && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-sky-950/40 via-[#1A2234] to-[#121824] border border-sky-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">
                  {isTelugu ? 'ప్రస్తుత ఆర్థిక పరిస్థితి' : 'Current Active Macro Regime'}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  {currentRegime.case_title}
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                {currentRegime.interpretation}
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <div className="bg-[#121824] border border-[#232E47] px-3 py-2 rounded-lg text-center">
                <div className="text-[10px] text-slate-400 uppercase font-mono">{currentRegime.headline_indicator}</div>
                <div className="text-lg font-black font-mono text-emerald-400">{currentRegime.current_value}</div>
                <div className="text-[10px] font-mono text-emerald-300 font-bold">
                  {currentRegime.monthly_change >= 0 ? `+${currentRegime.monthly_change}` : currentRegime.monthly_change} pts MoM
                </div>
              </div>
              <div className="bg-[#121824] border border-[#232E47] px-3 py-2 rounded-lg text-center">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Consensus Surprise</div>
                <div className={`text-lg font-black font-mono ${currentRegime.surprise >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currentRegime.surprise >= 0 ? `+${currentRegime.surprise}` : currentRegime.surprise}
                </div>
                <div className="text-[10px] font-mono text-slate-400">vs Expectations</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Alerts Feed */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert: any) => (
            <div 
              key={alert.id}
              className={`p-3 rounded-xl border flex items-start space-x-3 ${
                alert.severity === 'CRITICAL'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : alert.severity === 'HIGH'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-sky-500/10 border-sky-500/30 text-sky-200'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                alert.severity === 'CRITICAL' ? 'text-rose-400' : alert.severity === 'HIGH' ? 'text-amber-400' : 'text-sky-400'
              }`} />
              <div className="flex-1 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold">{alert.title}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-white/10 uppercase">
                    {alert.badge}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mt-0.5">{alert.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#232E47] pb-2 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: isTelugu ? '1. 8 PMI సూచికలు & అంచనా' : '1. 8 PMI Indicators & Surprise' },
          { id: 'CASES', label: isTelugu ? '2. నాలుగు కేసు దృశ్యాలు (కోర్సు నోట్స్)' : '2. Four Case Scenarios Analysis' },
          { id: 'COMPARISON_TABLE', label: isTelugu ? '3. 11-కాలమ్ దృశ్య పోలిక పట్టిక' : '3. 11-Column Scenario Table' },
          { id: 'COMPANIES', label: isTelugu ? '4. కంపెనీ స్థాయి విశ్లేషణ' : '4. Company-Level Fundamentals' },
          { id: 'HISTORY', label: isTelugu ? '5. 5-సంవత్సరాల చరిత్ర' : '5. 5-Year Historical Trends' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: 8 PMI INDICATORS WITH SURPRISE & MONTHLY CHANGE */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {indicators.map((ind: any) => {
              const isExpanding = ind.actual >= 50.0;
              const isSurprisePositive = ind.surprise >= 0;
              const isMonthlyPositive = ind.monthly_change >= 0;

              return (
                <div 
                  key={ind.id}
                  className="bg-[#121824] border border-[#232E47] rounded-xl p-4 hover:border-sky-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[#232E47]/50">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-300">{ind.country}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {ind.category}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isExpanding 
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}>
                        {isExpanding ? 'EXPANSION (>50)' : 'CONTRACTION (<50)'}
                      </span>
                    </div>

                    <div className="mt-3">
                      <h3 className="font-bold text-white text-sm">
                        {isTelugu ? ind.telugu_name : ind.name}
                      </h3>
                      <div className="text-[10px] text-slate-400 font-mono">{ind.period} &bull; {ind.provider}</div>
                    </div>

                    <div className="mt-3 flex items-baseline justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Actual Released</div>
                        <div className={`text-2xl font-black font-mono ${isExpanding ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {ind.actual}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Forecast</div>
                        <div className="text-sm font-bold font-mono text-slate-200">
                          {ind.forecast}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Previous</div>
                        <div className="text-sm font-bold font-mono text-slate-300">
                          {ind.previous_month}
                        </div>
                      </div>
                    </div>

                    {/* Expectation vs Actual Delta Pill */}
                    <div className="mt-3 pt-2.5 border-t border-[#232E47]/50 grid grid-cols-2 gap-2 text-center font-mono">
                      <div className="bg-[#1A2234] p-1.5 rounded-lg border border-[#232E47]/50">
                        <div className="text-[9px] text-slate-400 uppercase">Surprise (Act - Fc)</div>
                        <div className={`text-xs font-bold ${isSurprisePositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isSurprisePositive ? `+${ind.surprise}` : ind.surprise}
                        </div>
                      </div>
                      <div className="bg-[#1A2234] p-1.5 rounded-lg border border-[#232E47]/50">
                        <div className="text-[9px] text-slate-400 uppercase">MoM Change</div>
                        <div className={`text-xs font-bold ${isMonthlyPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isMonthlyPositive ? `+${ind.monthly_change}` : ind.monthly_change}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#232E47]/40 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="text-sky-300 font-semibold">{ind.case_title.split(':')[0]}</span>
                    <span>{ind.release_date.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expectation vs Actual Narrative Panel */}
          <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isTelugu ? 'అంచనా vs వాస్తవ సమగ్ర విశ్లేషణ' : 'Expectation vs Actual Institutional Findings'}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expectationAnalysis.map((item: any) => (
                <div key={item.indicator_id} className="p-3.5 rounded-lg bg-[#1A2234] border border-[#232E47] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{item.name} ({item.country})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      item.beat_consensus ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {item.institutional_verdict}
                    </span>
                  </div>
                  <ul className="space-y-1 text-slate-300 text-xs">
                    {item.key_findings.map((f: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-sky-400 font-bold">&bull;</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: FOUR CASE SCENARIOS INTERACTIVE DRILLDOWN */}
      {activeSubTab === 'CASES' && (
        <div className="space-y-6">
          {/* Case Selection Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.keys(fourCases).map((cid) => {
              const c = fourCases[cid];
              const isSelected = selectedCaseTab === cid;
              return (
                <button
                  key={cid}
                  onClick={() => setSelectedCaseTab(cid)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-500/50 shadow-md'
                      : 'bg-[#121824] border-[#232E47] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-sky-400">CASE {c.case_number}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      cid === 'CASE_1' ? 'bg-emerald-400' : cid === 'CASE_2' ? 'bg-sky-400' : cid === 'CASE_3' ? 'bg-amber-400' : 'bg-rose-400'
                    }`} />
                  </div>
                  <div className="font-bold text-white text-xs mt-1">{c.pattern}</div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{c.title.split(':')[1] || c.title}</div>
                </button>
              );
            })}
          </div>

          {/* Active Case Detailed Institutional Framework */}
          {fourCases[selectedCaseTab] && (
            <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#232E47] gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      {fourCases[selectedCaseTab].case_id}
                    </span>
                    <h2 className="text-lg font-bold text-white">
                      {isTelugu ? fourCases[selectedCaseTab].telugu_title : fourCases[selectedCaseTab].title}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 max-w-4xl leading-relaxed">
                    {isTelugu ? fourCases[selectedCaseTab].telugu_interpretation : fourCases[selectedCaseTab].economic_interpretation}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Confidence Level</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">{fourCases[selectedCaseTab].confidence_level}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{fourCases[selectedCaseTab].potential_market_impact}</div>
                </div>
              </div>

              {/* Sectors to Research & What to Confirm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#1A2234] border border-[#232E47] space-y-3">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Sectors to Research</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {fourCases[selectedCaseTab].sectors_to_research.map((s: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#121824] text-slate-200 border border-[#232E47]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1A2234] border border-[#232E47] space-y-3">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>What to Confirm (Institutional Checklist)</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {fourCases[selectedCaseTab].what_to_confirm.map((chk: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-emerald-400 font-bold">&check;</span>
                        <span>{chk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Companies to Research in this Case */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span>Beneficiary NSE-Listed Companies & Rationale</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fourCases[selectedCaseTab].companies_to_research.map((comp: any) => (
                    <div key={comp.symbol} className="p-3.5 rounded-lg bg-[#1A2234] border border-[#232E47] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{comp.symbol}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{comp.sector}</span>
                      </div>
                      <div className="text-xs text-slate-200 font-medium">{comp.name}</div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{comp.why_benefit}</p>
                      <div className="pt-2 border-t border-[#232E47]/60 text-[10px] text-sky-300 font-mono">
                        Key Metric: {comp.metric_to_watch}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: 11-COLUMN SCENARIO COMPARISON TABLE */}
      {activeSubTab === 'COMPARISON_TABLE' && (
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47] gap-2">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {isTelugu ? 'PMI దృశ్య పోలిక పట్టిక (11 కాలమ్‌లు)' : 'PMI Scenario Comparison Table (11 Core Dimensions)'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Each historical month automatically classified into Case 1, 2, 3 or 4 based on actual released PMI trajectories.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0B0E14] text-slate-400 border-b border-[#232E47]">
                <tr>
                  <th className="py-2.5 px-3">1. Period</th>
                  <th className="py-2.5 px-3">2. Case</th>
                  <th className="py-2.5 px-3 text-right">3. Prev</th>
                  <th className="py-2.5 px-3 text-right">4. Curr</th>
                  <th className="py-2.5 px-3 text-right">5. Chg</th>
                  <th className="py-2.5 px-3">6. Status</th>
                  <th className="py-2.5 px-3">7. Interpretation</th>
                  <th className="py-2.5 px-3">8. Sectors</th>
                  <th className="py-2.5 px-3">9. Companies</th>
                  <th className="py-2.5 px-3">10. Market Impact</th>
                  <th className="py-2.5 px-3 text-center">11. Conf</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232E47]/50 text-slate-300">
                {comparisonTable.map((row: any, idx: number) => {
                  const isCase2 = row.pmi_case === 'CASE_2';
                  const isCase3 = row.pmi_case === 'CASE_3';
                  const isCase1 = row.pmi_case === 'CASE_1';
                  return (
                    <tr key={idx} className="hover:bg-[#1A2234] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">{row.period}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCase1 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          isCase2 ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                          isCase3 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          CASE {row.case_number}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">{row.previous_pmi}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">{row.current_pmi}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${row.pmi_change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {row.pmi_change >= 0 ? `+${row.pmi_change}` : row.pmi_change}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-emerald-400 font-semibold">{row.expansion_status}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-xs font-sans text-[11px] truncate" title={row.economic_interpretation}>
                        {row.economic_interpretation}
                      </td>
                      <td className="py-2.5 px-3 max-w-[140px] truncate" title={row.sectors_to_research?.join(', ')}>
                        {row.sectors_to_research?.slice(0, 2).join(', ')}...
                      </td>
                      <td className="py-2.5 px-3 text-sky-300 font-bold whitespace-nowrap">
                        {row.companies_to_research?.slice(0, 3).join(', ')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px] font-sans whitespace-nowrap">
                        {row.potential_market_impact}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-bold text-emerald-400">{row.confidence_level}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: COMPANY-LEVEL ANALYSIS WITH RIGOROUS METRICS */}
      {activeSubTab === 'COMPANIES' && (
        <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232E47] gap-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {isTelugu ? 'కంపెనీ స్థాయి ప్రాథమిక & PMI సున్నితత్వ విశ్లేషణ' : 'Company-Level Fundamentals & PMI Earnings Sensitivity'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Connects macro PMI shifts to concrete balance sheet metrics, operating cash flow, and order books.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={companyCaseFilter}
                onChange={(e) => setCompanyCaseFilter(e.target.value)}
                className="bg-[#1A2234] border border-[#232E47] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500 font-mono"
              >
                <option value="ALL">All Four Cases</option>
                <option value="CASE_1">Case 1: Early Recovery</option>
                <option value="CASE_2">Case 2: Broad Expansion</option>
                <option value="CASE_3">Case 3: Momentum Slowing</option>
                <option value="CASE_4">Case 4: Contraction Risk</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0B0E14] text-slate-400 border-b border-[#232E47]">
                <tr>
                  <th className="py-2.5 px-3">Ticker</th>
                  <th className="py-2.5 px-3">Company & Sector</th>
                  <th className="py-2.5 px-3">Case</th>
                  <th className="py-2.5 px-3 text-right">Rev YoY</th>
                  <th className="py-2.5 px-3 text-right">EBITDA YoY</th>
                  <th className="py-2.5 px-3 text-right">OPM</th>
                  <th className="py-2.5 px-3 text-right">Order Book (Cr)</th>
                  <th className="py-2.5 px-3 text-right">FCF (Cr)</th>
                  <th className="py-2.5 px-3 text-right">D/E</th>
                  <th className="py-2.5 px-3 text-right">ROE</th>
                  <th className="py-2.5 px-3 text-right">P/E</th>
                  <th className="py-2.5 px-3">PMI Sensitivity & Institutional Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232E47]/50 text-slate-300">
                {filteredCompanies.map((c: any) => (
                  <tr key={c.symbol} className="hover:bg-[#1A2234] transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">{c.symbol}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-sans font-medium text-slate-200">{c.name}</div>
                      <div className="text-[10px] text-slate-400">{c.sector}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-sky-300 border border-slate-700">
                        {c.pmi_case}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+{c.revenue_growth_yoy}%</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+{c.ebitda_growth_yoy}%</td>
                    <td className="py-2.5 px-3 text-right">{c.operating_profit_margin}%</td>
                    <td className="py-2.5 px-3 text-right text-sky-300">
                      {c.order_book_cr ? `₹${c.order_book_cr.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-300">
                      ₹{c.free_cash_flow_cr.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">{c.debt_to_equity}x</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">{c.roe}%</td>
                    <td className="py-2.5 px-3 text-right">{c.pe_ratio}</td>
                    <td className="py-2.5 px-3 max-w-sm text-[11px] font-sans text-slate-300">
                      {c.pmi_sensitivity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 5: 5-YEAR MONTHLY HISTORICAL TRENDS */}
      {activeSubTab === 'HISTORY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {Object.keys(history.scenario_distribution || {}).map((k) => {
              const d = history.scenario_distribution[k];
              const titleMap: any = {
                CASE_1: 'Case 1: Early Recovery',
                CASE_2: 'Case 2: Broad Expansion',
                CASE_3: 'Case 3: Momentum Slowing',
                CASE_4: 'Case 4: Contraction Risk'
              };
              return (
                <div key={k} className="p-4 rounded-xl bg-[#121824] border border-[#232E47] text-center">
                  <div className="text-xs font-mono text-slate-400">{titleMap[k] || k}</div>
                  <div className="text-2xl font-black font-mono text-white mt-1">{d.percentage}%</div>
                  <div className="text-[10px] text-slate-500 font-mono">{d.count} of {history.total_months} months</div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#121824] border border-[#232E47] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              5-Year Monthly Historical Table ({history.start_period} to {history.end_period})
            </h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 bg-[#0B0E14] text-slate-400 border-b border-[#232E47]">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">India Mfg</th>
                    <th className="py-2 px-3 text-right">India Services</th>
                    <th className="py-2 px-3 text-right">India Composite</th>
                    <th className="py-2 px-3 text-right">US Mfg</th>
                    <th className="py-2 px-3 text-right">China Mfg</th>
                    <th className="py-2 px-3 text-right">NIFTY 50 Close</th>
                    <th className="py-2 px-3 text-center">Classified Regime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232E47]/40 text-slate-300">
                  {(history.history || []).map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#1A2234] transition-colors">
                      <td className="py-2 px-3 font-bold text-white">{row.date}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-400">{row.india_mfg}</td>
                      <td className="py-2 px-3 text-right">{row.india_services}</td>
                      <td className="py-2 px-3 text-right text-sky-300">{row.india_composite}</td>
                      <td className="py-2 px-3 text-right text-slate-400">{row.us_mfg}</td>
                      <td className="py-2 px-3 text-right text-slate-400">{row.china_mfg}</td>
                      <td className="py-2 px-3 text-right font-bold text-white">₹{row.nifty_close.toLocaleString()}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-sky-300 border border-slate-700">
                          {row.case}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
