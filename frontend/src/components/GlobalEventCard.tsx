import React, { useState } from 'react';
import type { GlobalEvent } from '../types';
import { 
  Clock, 
  ExternalLink, 
  Flame, 
  AlertCircle, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  ShieldCheck
} from 'lucide-react';

interface GlobalEventCardProps {
  event: GlobalEvent;
  languageMode: 'en' | 'te' | 'bilingual';
  className?: string;
}

export const GlobalEventCard: React.FC<GlobalEventCardProps> = ({
  event,
  languageMode,
  className = ''
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'EXPLANATION' | 'WHY_MATTERS' | 'INDIA_IMPACT' | 'TERMS'>('INDIA_IMPACT');

  const isHigh = event.importance === 'HIGH';
  const isMedium = event.importance === 'MEDIUM';

  const isReleased = event.actual_value && event.actual_value !== 'Not yet released';
  const isUpcoming = event.countdown?.status === 'UPCOMING';
  const isOngoing = event.countdown?.status === 'ONGOING';

  // Category Color Map
  const categoryStyles: Record<string, { bg: string; text: string; border: string }> = {
    ECONOMIC_DATA: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
    CENTRAL_BANK: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    GOVERNMENT_FISCAL: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    GEOPOLITICAL: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    COMMODITIES_ENERGY: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    FINANCIAL_MARKETS: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
    CORPORATE_TECH: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  };

  const catStyle = categoryStyles[event.category] || categoryStyles.ECONOMIC_DATA;

  return (
    <div className={`rounded-xl bg-[#121824] border border-[#232E47] hover:border-slate-600 transition-all shadow-md overflow-hidden ${className}`}>
      {/* Top Header Row */}
      <div className="p-4 sm:p-5 border-b border-[#232E47]/60">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          {/* Country & Category Badge */}
          <div className="flex items-center space-x-2">
            <span className="text-xl" title={event.country}>{event.country_flag}</span>
            <span className="text-xs font-semibold text-slate-300">{event.country}</span>
            <span className="text-slate-600">&bull;</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
              {event.category.replace('_', ' ')}
            </span>
          </div>

          {/* Importance & Countdown Badge */}
          <div className="flex items-center space-x-2">
            {/* Importance */}
            <span className={`flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold border ${
              isHigh 
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm' 
                : isMedium 
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                : 'bg-slate-700/40 text-slate-400 border-slate-600/40'
            }`}>
              {isHigh && <Flame className="w-3 h-3 text-rose-400 fill-rose-400 animate-pulse" />}
              <span>{event.importance} IMPACT</span>
            </span>

            {/* Countdown / Status */}
            <span className={`flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
              isOngoing 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : isUpcoming 
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {isUpcoming && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block mr-0.5" />}
              <span>
                {languageMode === 'te' 
                  ? (event.countdown?.countdown_label_te || event.countdown?.countdown_label_en)
                  : event.countdown?.countdown_label_en}
              </span>
            </span>
          </div>
        </div>

        {/* Event Title in Selected Language Mode */}
        <div className="mt-1">
          {languageMode === 'en' && (
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {event.event_name}
            </h3>
          )}

          {languageMode === 'te' && (
            <div>
              <h3 className="text-base sm:text-lg font-bold text-amber-300 tracking-tight leading-snug">
                {event.event_name_te}
              </h3>
              <span className="text-xs text-slate-400 font-normal block mt-0.5">
                {event.event_name}
              </span>
            </div>
          )}

          {languageMode === 'bilingual' && (
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {event.event_name}
              </h3>
              <div className="text-sm font-semibold text-amber-300 flex items-center space-x-1.5">
                <span className="text-[10px] uppercase px-1 rounded bg-amber-500/20 text-amber-300 font-mono">తెలుగు</span>
                <span>{event.event_name_te}</span>
              </div>
            </div>
          )}
        </div>

        {/* Timestamps: Indian Standard Time (IST) & Local Event Time */}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20">
            <Clock className="w-3.5 h-3.5" />
            <strong className="text-white">{event.start_time_ist_str}</strong>
          </div>
          <div className="text-slate-400 text-[11px]">
            Local: <span className="text-slate-300">{event.original_time_str}</span> ({event.original_timezone})
          </div>
        </div>
      </div>

      {/* Numerical Data Metrics Grid: Previous | Forecast | Actual | Surprise */}
      <div className="grid grid-cols-2 sm:grid-cols-4 bg-[#0B0E14] border-b border-[#232E47]/60 divide-x divide-y sm:divide-y-0 divide-[#232E47]/60 text-center py-2.5">
        <div className="p-2">
          <span className="text-[10px] text-slate-500 font-medium uppercase block">Previous</span>
          <span className="text-xs sm:text-sm font-mono font-bold text-slate-300 block mt-0.5">
            {event.previous_value || '-'}
          </span>
        </div>

        <div className="p-2">
          <span className="text-[10px] text-slate-500 font-medium uppercase block">Consensus Forecast</span>
          <span className="text-xs sm:text-sm font-mono font-bold text-sky-400 block mt-0.5">
            {event.forecast_value || '-'}
          </span>
        </div>

        <div className="p-2">
          <span className="text-[10px] text-slate-500 font-medium uppercase block">Actual Released</span>
          <span className={`text-xs sm:text-sm font-mono font-bold block mt-0.5 ${
            isReleased ? 'text-emerald-400' : 'text-slate-500 italic'
          }`}>
            {event.actual_value || 'Not yet released'}
          </span>
        </div>

        <div className="p-2">
          <span className="text-[10px] text-slate-500 font-medium uppercase block">Surprise Impact</span>
          <span className={`text-xs sm:text-sm font-mono font-bold block mt-0.5 ${
            event.surprise_direction === 'POSITIVE' ? 'text-emerald-400' :
            event.surprise_direction === 'NEGATIVE' ? 'text-rose-400' :
            event.surprise_direction === 'IN_LINE' ? 'text-sky-300' :
            'text-slate-600'
          }`}>
            {event.surprise_value !== null ? `${event.surprise_value > 0 ? '+' : ''}${event.surprise_value}` : 'Pending'}
          </span>
        </div>
      </div>

      {/* Accordion Trigger */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="px-4 py-2.5 bg-[#141B29] hover:bg-slate-800/60 cursor-pointer flex items-center justify-between text-xs font-semibold text-slate-300 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="text-sky-400 font-bold">
            🇮🇳 India Market Impact Analysis &amp; Economic Insight
          </span>
        </div>
        <div className="flex items-center space-x-1 text-slate-400 hover:text-white">
          <span className="text-[11px]">{expanded ? 'Hide Insights' : 'Show Full Insights'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Bilingual Insights Panel */}
      {expanded && (
        <div className="p-5 space-y-4 bg-[#0F1420] border-t border-[#232E47]/70">
          {/* Sub-Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-lg bg-[#0B0E14] border border-[#232E47] text-xs">
            <button
              onClick={() => setActiveTab('INDIA_IMPACT')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                activeTab === 'INDIA_IMPACT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🇮🇳 Indian Market Impact</span>
            </button>
            <button
              onClick={() => setActiveTab('EXPLANATION')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                activeTab === 'EXPLANATION' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Event Explanation</span>
            </button>
            <button
              onClick={() => setActiveTab('WHY_MATTERS')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                activeTab === 'WHY_MATTERS' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Why It Matters</span>
            </button>
            <button
              onClick={() => setActiveTab('TERMS')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                activeTab === 'TERMS' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Key Terms ({event.key_terms?.length || 0})</span>
            </button>
          </div>

          {/* TAB 1: INDIA MARKET IMPACT (India First Mandate) */}
          {activeTab === 'INDIA_IMPACT' && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#121E2E] to-[#0F1420] border border-emerald-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span>NIFTY 50, Bank Nifty, IT, FII &amp; Rupee Channel Implications</span>
              </div>

              {(languageMode === 'en' || languageMode === 'bilingual') && (
                <div className="text-xs text-slate-200 leading-relaxed">
                  <strong className="text-white block mb-1">Institutional Outlook (English):</strong>
                  {event.india_market_impact_en}
                </div>
              )}

              {(languageMode === 'te' || languageMode === 'bilingual') && (
                <div className="text-xs text-amber-200/95 leading-relaxed pt-2 border-t border-[#232E47]/60">
                  <strong className="text-amber-300 block mb-1">భారత మార్కెట్ విశ్లేషణ (తెలుగు వివరణ):</strong>
                  {event.india_market_impact_te}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EVENT EXPLANATION */}
          {activeTab === 'EXPLANATION' && (
            <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47] space-y-3">
              {(languageMode === 'en' || languageMode === 'bilingual') && (
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white block mb-1">What This Indicator Measures:</strong>
                  {event.description_en}
                </div>
              )}

              {(languageMode === 'te' || languageMode === 'bilingual') && (
                <div className="text-xs text-amber-200/90 leading-relaxed pt-2 border-t border-[#232E47]/60">
                  <strong className="text-amber-300 block mb-1">ఈ సూచిక ఏమి తెలియజేస్తుంది (తెలుగు):</strong>
                  {event.description_te}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WHY IT MATTERS */}
          {activeTab === 'WHY_MATTERS' && (
            <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47] space-y-3">
              {(languageMode === 'en' || languageMode === 'bilingual') && (
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white block mb-1">Global Economic Significance:</strong>
                  {event.why_it_matters_en}
                </div>
              )}

              {(languageMode === 'te' || languageMode === 'bilingual') && (
                <div className="text-xs text-amber-200/90 leading-relaxed pt-2 border-t border-[#232E47]/60">
                  <strong className="text-amber-300 block mb-1">ఆర్థిక ప్రాముఖ్యత (తెలుగు):</strong>
                  {event.why_it_matters_te}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: KEY TERMS GLOSSARY */}
          {activeTab === 'TERMS' && (
            <div className="space-y-2">
              {(event.key_terms || []).map((term, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#121824] border border-[#232E47] text-xs">
                  <div className="flex items-center space-x-2 font-bold text-white mb-1">
                    <span>{term.term}</span>
                    <span className="text-slate-500">&bull;</span>
                    <span className="text-amber-300">{term.term_te}</span>
                  </div>
                  <div className="text-slate-300 mb-1">{term.def_en}</div>
                  <div className="text-amber-200/80 text-[11px] border-t border-[#232E47]/50 pt-1">
                    {term.def_te}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Source Provenance Footer */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-[#232E47]/50 gap-2">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Source: <strong className="text-slate-300">{event.source_name}</strong></span>
            </div>
            <a
              href={event.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-sky-400 hover:text-sky-300 transition-colors font-semibold"
            >
              <span>Visit Official Reference</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
