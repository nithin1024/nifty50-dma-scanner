import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Clock, RefreshCw } from 'lucide-react';
import { fetchGlobalNews } from '../services/api';

export const MarketNewsPage: React.FC = () => {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadNews = async () => {
    setLoading(true);
    try {
      const data = await fetchGlobalNews();
      setNewsList(data || []);
    } catch (e) {
      console.error('Failed to load news:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const categories = ['ALL', 'MACRO', 'EARNINGS', 'GEOPOLITICS', 'CENTRAL_BANK', 'F&O'];

  const filteredNews = newsList.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary_en?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#121824] via-[#161F33] to-[#121824] border border-[#232E47] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
              Verified Institutional Press Wire
            </span>
            <span className="text-xs text-slate-400">
              LiveMint &bull; CNBC-TV18 &bull; Economic Times &bull; PIB India
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            Indian Market News &amp; 3-Way Scenario Wire
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time economic developments with quantitative upside catalyst, base case, and downside risk models.
          </p>
        </div>

        <button
          onClick={loadNews}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Wire</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#121824] border border-[#232E47] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat ? 'bg-sky-600 text-white' : 'bg-[#161F33] text-slate-400 hover:text-white border border-[#232E47]'
              }`}
            >
              {cat === 'ALL' ? 'All Headlines' : cat}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search news &amp; stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0B0E14] border border-[#232E47] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* News Feed List */}
      <div className="space-y-4">
        {filteredNews.map((news) => (
          <div 
            key={news.id} 
            className="p-5 rounded-2xl bg-[#121824] border border-[#232E47] hover:border-sky-500/40 transition-all space-y-4 shadow-sm"
          >
            {/* Meta tags */}
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-[#232E47]/60 pb-3">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  {news.category}
                </span>
                <span className="text-slate-400 font-semibold">{news.source || 'Verified Official Feed'}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>{news.publication_time}</span>
              </div>
            </div>

            {/* Headline */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white hover:text-sky-300 transition-colors">
                {news.headline}
              </h3>
              {news.headline_te && (
                <div className="text-xs text-slate-400 mt-1 font-serif">
                  {news.headline_te}
                </div>
              )}
            </div>

            {/* Summary */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {news.summary_en}
            </p>

            {/* 3-Way Quantitative Scenario Analysis */}
            {news.scenario_analysis && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="font-bold text-emerald-400 flex items-center space-x-1.5 mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Positive Scenario (Catalyst)</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {news.scenario_analysis.positive_case}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                  <div className="font-bold text-sky-400 flex items-center space-x-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Base Case (Priced In)</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {news.scenario_analysis.base_case}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="font-bold text-rose-400 flex items-center space-x-1.5 mb-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Downside Risk (Worst Case)</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {news.scenario_analysis.negative_case}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
