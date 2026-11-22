import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Star, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft,
  X,
  Languages,
  TrendingUp
} from 'lucide-react';
import { 
  FINANCIAL_DICTIONARY, 
  DICTIONARY_CATEGORIES, 
  type DictionaryEntry 
} from '../data/financialDictionaryData';

interface FinancialDictionaryProps {
  onBackToOverview?: () => void;
  initialTermId?: string;
}

const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export const FinancialDictionary: React.FC<FinancialDictionaryProps> = ({
  onBackToOverview,
  initialTermId
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(() => {
    if (initialTermId) {
      return FINANCIAL_DICTIONARY.find(e => e.id === initialTermId || e.term.toLowerCase() === initialTermId.toLowerCase()) || null;
    }
    return null;
  });

  // LocalStorage state for Favourites
  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nifty50_dict_favs');
      return saved ? JSON.parse(saved) : ['pe-ratio', 'pcr', 'long-buildup', 'gdp', 'vwap'];
    } catch {
      return ['pe-ratio', 'pcr', 'long-buildup', 'gdp', 'vwap'];
    }
  });

  // LocalStorage state for Recently Viewed
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nifty50_dict_recent');
      return saved ? JSON.parse(saved) : ['pcr', 'pe-ratio', 'long-buildup'];
    } catch {
      return ['pcr', 'pe-ratio', 'long-buildup'];
    }
  });

  const [activeTab, setActiveTab] = useState<'ALL' | 'FAVOURITES' | 'RECENT'>('ALL');

  // Persist favourites
  const toggleFavourite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavourites(prev => {
      const updated = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      try {
        localStorage.setItem('nifty50_dict_favs', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save favourites', err);
      }
      return updated;
    });
  };

  // Track recently viewed
  const handleSelectEntry = (entry: DictionaryEntry) => {
    setSelectedEntry(entry);
    setRecentlyViewed(prev => {
      const updated = [entry.id, ...prev.filter(id => id !== entry.id)].slice(0, 15);
      try {
        localStorage.setItem('nifty50_dict_recent', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save recents', err);
      }
      return updated;
    });
  };

  // Filtered terms
  const filteredEntries = useMemo(() => {
    let list = FINANCIAL_DICTIONARY;

    if (activeTab === 'FAVOURITES') {
      list = list.filter(e => favourites.includes(e.id));
    } else if (activeTab === 'RECENT') {
      list = recentlyViewed
        .map(id => list.find(e => e.id === id))
        .filter((e): e is DictionaryEntry => Boolean(e));
    }

    if (selectedCategory !== 'ALL') {
      list = list.filter(e => e.category === selectedCategory);
    }

    if (selectedLetter !== 'ALL') {
      list = list.filter(e => e.term.toUpperCase().startsWith(selectedLetter));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(e => 
        e.term.toLowerCase().includes(q) ||
        e.term_te.toLowerCase().includes(q) ||
        e.meaning_te.toLowerCase().includes(q) ||
        e.explanation_en.toLowerCase().includes(q) ||
        e.explanation_te.toLowerCase().includes(q) ||
        (e.formula && e.formula.toLowerCase().includes(q))
      );
    }

    return list;
  }, [searchQuery, selectedCategory, selectedLetter, activeTab, favourites, recentlyViewed]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Banner with English & Telugu Badging */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#121824] via-[#161F33] to-[#121824] border border-[#232E47] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <BookOpen className="w-5 h-5" />
              </span>
              <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                A–Z Institutional Finance Dictionary
              </span>
              <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                <Languages className="w-3 h-3" />
                English &bull; తెలుగు నిఘంటువు
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2 flex items-center gap-2">
              <span>Financial &amp; Stock Market Dictionary</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-amber-400 font-sans font-semibold text-lg sm:text-xl">ఆర్థిక &amp; స్టాక్ మార్కెట్ నిఘంటువు</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Comprehensive reference guide covering Basic Finance, Options Trading, Option Chain Buildup, Technical Indicators, Macroeconomics, and Banking with authentic Telugu explanations and formulas.
            </p>
          </div>

          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#1A2234] hover:bg-slate-700/60 border border-[#232E47] text-slate-200 text-xs font-semibold self-start md:self-auto transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-sky-400" />
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>

        {/* 2. Search Bar: Dual-Language English & Telugu */}
        <div className="mt-5 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by English term, formula, or Telugu term (ఉదా: P/E Ratio, రెపో రేటు, కాల్ ఆప్షన్, లాంగ్ బిల్డప్)..."
            className="w-full pl-12 pr-10 py-3 rounded-xl bg-[#0B0E14] border border-[#232E47] focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm text-white placeholder-slate-500 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 3. Sub-Tabs: All Terms / Favourites / Recently Viewed */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-[#232E47]/60">
          <div className="flex items-center space-x-1 bg-[#0B0E14] p-1 rounded-xl border border-[#232E47]">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ALL' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Terms ({FINANCIAL_DICTIONARY.length})
            </button>
            <button
              onClick={() => setActiveTab('FAVOURITES')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'FAVOURITES' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Favourites ({favourites.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('RECENT')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'RECENT' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Recently Viewed ({recentlyViewed.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Showing <strong className="text-sky-400">{filteredEntries.length}</strong> verified entries
          </div>
        </div>
      </div>

      {/* 4. A–Z Alphabetical Navigation Bar */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none py-1">
        {ALPHABET.map((letter) => (
          <button
            key={letter}
            onClick={() => setSelectedLetter(letter)}
            className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold font-mono transition-all shrink-0 ${
              selectedLetter === letter 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'bg-[#121824] hover:bg-slate-800 text-slate-400 hover:text-white border border-[#232E47]'
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* 5. 15 Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-emerald-500 text-black font-bold shadow-sm'
              : 'bg-[#121824] text-slate-400 hover:text-white border border-[#232E47]'
          }`}
        >
          All 15 Categories
        </button>
        {DICTIONARY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
              selectedCategory === cat
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'bg-[#121824] text-slate-400 hover:text-white border border-[#232E47]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 6. Main Grid: Left List (Cards) & Right Details View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Term Cards (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[850px] overflow-y-auto pr-1">
          {filteredEntries.length === 0 ? (
            <div className="p-8 text-center bg-[#121824] border border-[#232E47] rounded-xl text-slate-400">
              <Search className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-50" />
              <div className="text-sm font-semibold text-slate-300">No matching dictionary terms found</div>
              <div className="text-xs text-slate-500 mt-1">Try a different search keyword or category filter.</div>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isSelected = selectedEntry?.id === entry.id;
              const isFav = favourites.includes(entry.id);

              return (
                <div
                  key={entry.id}
                  onClick={() => handleSelectEntry(entry)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#161F33] to-[#121824] border-sky-500/80 ring-1 ring-sky-500/50 shadow-lg'
                      : 'bg-[#121824] border-[#232E47] hover:border-slate-600 hover:bg-[#161F33]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-sky-300 transition-colors">
                          {entry.term}
                        </h3>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 truncate">
                          {entry.category}
                        </span>
                      </div>
                      
                      <div className="text-xs font-semibold text-amber-300 mt-0.5">
                        {entry.term_te}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {entry.meaning_te}
                      </p>
                    </div>

                    {/* Favourite Star Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavourite(entry.id, e)}
                      title={isFav ? 'Remove from Favourites' : 'Add to Favourites'}
                      className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                        isFav 
                          ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-[#232E47]/50">
                    <span className="font-mono text-[10px] text-slate-400">
                      {entry.formula ? '📐 Formula included' : '📚 Conceptual'}
                    </span>
                    <span className="text-sky-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      View Explanation <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Detailed Term Deep-Dive (7 cols on lg) */}
        <div className="lg:col-span-7 sticky top-20">
          {selectedEntry ? (
            <div className="p-6 rounded-2xl bg-[#121824] border border-[#232E47] shadow-xl space-y-5 animate-in fade-in duration-150">
              
              {/* Header Details */}
              <div className="flex items-start justify-between pb-4 border-b border-[#232E47] gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      {selectedEntry.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                      ID: {selectedEntry.id}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-white tracking-tight mt-1.5">
                    {selectedEntry.term}
                  </h2>
                  <div className="text-base font-bold text-amber-300 mt-0.5">
                    {selectedEntry.term_te}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleFavourite(selectedEntry.id)}
                    className={`p-2 rounded-xl border transition-all ${
                      favourites.includes(selectedEntry.id)
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-[#161F33] text-slate-400 hover:text-white border-[#232E47]'
                    }`}
                    title={favourites.includes(selectedEntry.id) ? 'Remove Favourite' : 'Add Favourite'}
                  >
                    <Star className={`w-4 h-4 ${favourites.includes(selectedEntry.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="p-2 rounded-xl bg-[#161F33] text-slate-400 hover:text-white border border-[#232E47] lg:hidden"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 1. Telugu Meaning & Explanation */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#161F33] to-[#121824] border border-[#232E47] space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>తెలుగు అర్థం &amp; సమగ్ర వివరణ (Telugu Meaning &amp; Explanation)</span>
                </div>
                <div className="text-sm font-semibold text-white leading-snug">
                  {selectedEntry.meaning_te}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans pt-1">
                  {selectedEntry.explanation_te}
                </p>
              </div>

              {/* 2. English Explanation */}
              <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232E47] space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>English Conceptual Definition</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {selectedEntry.explanation_en}
                </p>
              </div>

              {/* 3. Mathematical Formula (If applicable) */}
              {selectedEntry.formula && (
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <span>📐</span>
                    <span>Mathematical Formula / Calculation Logic</span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-purple-200 bg-[#0B0E14] p-3 rounded-lg border border-purple-500/20 overflow-x-auto">
                    {selectedEntry.formula}
                  </div>
                </div>
              )}

              {/* 4. Practical Real-World Example */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>ప్రయోగాత్మక ఉదాహరణ (Practical Indian Market Example)</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed font-sans">
                  {selectedEntry.example}
                </p>
              </div>

              {/* 5. Stock Market Application */}
              <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>స్టాక్ మార్కెట్ వినియోగం (Trading &amp; Investment Application)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {selectedEntry.market_application}
                </p>
              </div>

              {/* 6. Related Terms Navigation (Clickable) */}
              {selectedEntry.related_terms && selectedEntry.related_terms.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Related Concepts &bull; సంబంధిత పదాలు:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEntry.related_terms.map((rt) => {
                      const matched = FINANCIAL_DICTIONARY.find(
                        e => e.term.toLowerCase() === rt.toLowerCase() || e.id.toLowerCase() === rt.toLowerCase()
                      );

                      return (
                        <button
                          key={rt}
                          type="button"
                          onClick={() => {
                            if (matched) {
                              handleSelectEntry(matched);
                            } else {
                              setSearchQuery(rt);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#161F33] hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-[#232E47] hover:border-sky-500/40 transition-all flex items-center gap-1"
                        >
                          <span>{rt}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-[#121824] border border-[#232E47] text-center text-slate-400 space-y-3">
              <BookOpen className="w-12 h-12 mx-auto text-sky-400/50" />
              <h3 className="text-base font-bold text-white">Select a Financial Term</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click any term from the directory on the left or use the search bar above to view complete explanations, formulas, and practical stock market examples in English and Telugu.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
