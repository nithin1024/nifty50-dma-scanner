import React from 'react';
import { 
  X, 
  ExternalLink, 
  Calendar, 
  BookOpen, 
  ShieldCheck, 
  Layers,
  BarChart3
} from 'lucide-react';

interface FiveYearHistoryItem {
  period: string;
  actual: string;
  previous: string;
  change_pct: number;
}

interface CountryComparisonItem {
  country: string;
  value: string;
  status: string;
}

interface MacroTopicDetail {
  id: string;
  name: string;
  name_te: string;
  group: string;
  category: string;
  definition_en: string;
  definition_te: string;
  formula: string;
  why_it_matters: string;
  why_it_matters_te: string;
  latest_value: string;
  previous_value: string;
  forecast_value: string;
  yoy_pct: number;
  qoq_pct?: number;
  unit: string;
  frequency: string;
  next_release: string;
  source_name: string;
  source_url: string;
  five_year_history: FiveYearHistoryItem[];
  chart_series: { period: string; value: number }[];
  country_comparison: CountryComparisonItem[];
  market_impact: Record<string, string>;
  market_impact_te: { summary: string };
}

interface MacroIndicatorModalProps {
  topic: MacroTopicDetail | null;
  isOpen: boolean;
  onClose: () => void;
  languageMode?: 'en' | 'te' | 'bilingual';
}

export const MacroIndicatorModal: React.FC<MacroIndicatorModalProps> = ({
  topic,
  isOpen,
  onClose,
  languageMode = 'bilingual'
}) => {
  if (!isOpen || !topic) return null;

  const showEn = languageMode === 'en' || languageMode === 'bilingual';
  const showTe = languageMode === 'te' || languageMode === 'bilingual';

  const maxChartVal = Math.max(...(topic.chart_series?.map(s => s.value) || [10]));
  const minChartVal = Math.min(...(topic.chart_series?.map(s => s.value) || [0]));
  const range = maxChartVal - minChartVal || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121824] border border-[#232E47] rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#171F32] via-[#121824] to-[#1E192E] border-b border-[#232E47]/70">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
              {topic.group}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              {topic.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-400 border border-slate-700">
              {topic.frequency}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {topic.name}
          </h2>
          <div className="text-sm font-semibold text-amber-300 mt-0.5 flex items-center space-x-2">
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[10px] uppercase font-mono">తెలుగు</span>
            <span>{topic.name_te}</span>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#232E47]/70 font-mono">
            <div className="p-2.5 rounded-lg bg-[#0B0E14] border border-[#232E47]">
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Latest Actual</span>
              <span className="text-base font-black text-emerald-400">{topic.latest_value}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0B0E14] border border-[#232E47]">
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Previous Value</span>
              <span className="text-base font-bold text-slate-300">{topic.previous_value}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0B0E14] border border-[#232E47]">
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Consensus Forecast</span>
              <span className="text-base font-bold text-sky-400">{topic.forecast_value}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0B0E14] border border-[#232E47]">
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Next Scheduled Release</span>
              <span className="text-xs font-semibold text-amber-300 block truncate" title={topic.next_release}>
                {topic.next_release.split(',')[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs text-slate-300">
          {/* Definition & Formula */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47]">
              <div className="flex items-center space-x-2 text-sky-400 font-bold mb-1.5">
                <BookOpen className="w-4 h-4" />
                <span>Executive Definition &amp; Significance</span>
              </div>
              {showEn && <p className="text-slate-300 leading-relaxed">{topic.definition_en}</p>}
              {showTe && (
                <div className="mt-3 pt-3 border-t border-[#232E47]/60 text-amber-300/90 leading-relaxed font-sans">
                  <strong>తెలుగు వివరణ:</strong> {topic.definition_te}
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47]">
              <div className="flex items-center space-x-2 text-purple-400 font-bold mb-1.5">
                <Layers className="w-4 h-4" />
                <span>Mathematical Formulation &amp; Methodology</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#141B29] font-mono text-emerald-300 border border-emerald-500/20 text-xs">
                {topic.formula}
              </div>
              <div className="mt-3">
                <strong className="text-slate-400 block mb-1">Why It Matters to Investors:</strong>
                <p className="text-slate-300 leading-relaxed">{topic.why_it_matters}</p>
              </div>
            </div>
          </div>

          {/* Historical Trend Line Chart */}
          {topic.chart_series && topic.chart_series.length > 0 && (
            <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 text-white font-bold">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Historical Observation Trendline</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">Unit: {topic.unit}</span>
              </div>

              {/* Simple Responsive SVG Line Chart */}
              <div className="h-40 w-full flex items-end space-x-3 pt-6 pb-2 px-4 bg-[#121824] rounded-lg border border-[#232E47]/60">
                {topic.chart_series.map((point, idx) => {
                  const normalizedH = Math.max(10, Math.min(100, ((point.value - minChartVal) / range) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-bold">
                        {point.value}%
                      </div>
                      <div 
                        className="w-full max-w-[28px] bg-gradient-to-t from-sky-600 to-emerald-400 rounded-t transition-all group-hover:from-sky-500 group-hover:to-emerald-300"
                        style={{ height: `${normalizedH}%` }}
                      />
                      <span className="text-[10px] font-mono text-slate-400 mt-1.5">{point.period}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5-Year Historical Observation Table */}
          {topic.five_year_history && topic.five_year_history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>5-Year Historical Reporting Series (Verified Data)</span>
                </h3>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[#232E47]">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#1A2234] text-slate-400 text-[10px] uppercase font-sans">
                    <tr>
                      <th className="py-2.5 px-3">Reporting Period</th>
                      <th className="py-2.5 px-3 text-right">Actual Value</th>
                      <th className="py-2.5 px-3 text-right">Previous Value</th>
                      <th className="py-2.5 px-3 text-right">Change / Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232E47]/60 bg-[#0B0E14]">
                    {topic.five_year_history.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-white font-medium">{row.period}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400">{row.actual}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">{row.previous}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={row.change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {row.change_pct >= 0 ? '+' : ''}{row.change_pct.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Indian Stock Market Impact Grid */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-emerald-500/30">
            <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4" />
              <span>🇮🇳 Indian Stock Market &amp; Sector Sensitivity Matrix</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {topic.market_impact && Object.entries(topic.market_impact).map(([key, val]) => (
                <div key={key} className="p-2.5 rounded-lg bg-[#121824] border border-[#232E47]">
                  <span className="font-bold text-sky-400 uppercase tracking-wider text-[10px] block mb-0.5">
                    {key.replace('_', ' ')}
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{val}</p>
                </div>
              ))}
            </div>

            {topic.market_impact_te && (
              <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed font-sans">
                <strong>తెలుగు మార్కెట్ విశ్లేషణ:</strong> {topic.market_impact_te.summary}
              </div>
            )}
          </div>

          {/* Cross-Country Comparison & Official Source Provenance */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-[#141B29] border border-[#232E47] gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-semibold">Global Comparison:</span>
              {topic.country_comparison?.map((c, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                  {c.country}: <strong className="text-white">{c.value}</strong>
                </span>
              ))}
            </div>

            <a
              href={topic.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-600/20 text-sky-400 hover:bg-sky-600/30 border border-sky-500/30 text-xs font-bold transition-colors whitespace-nowrap"
            >
              <span>Verify Official Source: {topic.source_name}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacroIndicatorModal;
