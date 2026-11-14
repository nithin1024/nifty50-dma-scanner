import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { GlobalEvent, GlobalEventsSummary } from '../types';
import { 
  fetchGlobalEvents, 
  fetchGlobalEventsSummary, 
  fetchSubCalendar, 
  triggerGlobalEventsRefresh, 
  fetchUserPreferences, 
  saveUserPreferences 
} from '../services/api';
import { GlobalEventCard } from '../components/GlobalEventCard';
import { useLanguage } from '../context/LanguageContext';
import { 
  Globe, 
  Clock, 
  Flame, 
  Search, 
  RefreshCw, 
  Bell, 
  LayoutGrid, 
  ListFilter, 
  Building2, 
  TrendingUp, 
  Landmark, 
  CalendarDays, 
  SlidersHorizontal,
  ExternalLink,
  CheckCircle2,
  X
} from 'lucide-react';

type SubCalendarKey = 
  | 'all' 
  | 'india'
  | 'today' 
  | '7days' 
  | '30days' 
  | '90days' 
  | 'central-banks' 
  | 'inflation' 
  | 'gdp-pmi' 
  | 'geopolitical' 
  | 'commodities' 
  | 'holidays';

export const GlobalEventsPage: React.FC = () => {
  const { language: globalLanguage } = useLanguage();

  // Language Mode: 'en' | 'te' | 'bilingual'
  const [languageMode, setLanguageMode] = useState<'en' | 'te' | 'bilingual'>(
    globalLanguage === 'te' ? 'te' : 'bilingual'
  );

  // Sync with global language toggle
  useEffect(() => {
    if (globalLanguage === 'te' && languageMode === 'en') {
      setLanguageMode('te');
    }
  }, [globalLanguage]);

  // View Mode
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Sub-calendar tab
  const [activeSubTab, setActiveSubTab] = useState<SubCalendarKey>('all');

  // Data states
  const [events, setEvents] = useState<GlobalEvent[]>([]);
  const [summary, setSummary] = useState<GlobalEventsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedImportance, setSelectedImportance] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Alert preferences modal
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [preferences, setPreferences] = useState({
    alert_24h: true,
    alert_1h: true,
    alert_15m: true,
    alert_results: true,
    alert_postponed: false,
    preferred_countries: '',
    preferred_categories: ''
  });
  const [prefSaveSuccess, setPrefSaveSuccess] = useState<boolean>(false);

  // Digital IST Clock
  const [istTime, setIstTime] = useState<string>('');
  const [istDate, setIstDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const dateStr = now.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      setIstTime(timeStr);
      setIstDate(dateStr);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data based on sub-calendar tab
  const loadCalendarData = useCallback(async (tab: SubCalendarKey = activeSubTab) => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, prefData] = await Promise.all([
        fetchGlobalEventsSummary().catch(() => null),
        fetchUserPreferences().catch(() => ({
          alert_24h: true, alert_1h: true, alert_15m: true,
          alert_results: true, alert_postponed: false,
          preferred_countries: '', preferred_categories: ''
        }))
      ]);
      setSummary(sumData);
      setPreferences(prefData);

      let eventsData: GlobalEvent[] = [];
      if (tab === 'all') {
        eventsData = await fetchGlobalEvents();
      } else if (tab === 'india') {
        eventsData = await fetchSubCalendar('india');
      } else if (tab === 'today') {
        eventsData = await fetchSubCalendar('today');
      } else if (tab === '7days') {
        eventsData = await fetchGlobalEvents({ timeframe: '7d' });
      } else if (tab === '30days') {
        eventsData = await fetchGlobalEvents({ timeframe: '30d' });
      } else if (tab === '90days') {
        eventsData = await fetchGlobalEvents({ timeframe: '90d' });
      } else if (tab === 'central-banks') {
        eventsData = await fetchSubCalendar('central-banks');
      } else if (tab === 'inflation') {
        eventsData = await fetchSubCalendar('inflation');
      } else if (tab === 'gdp-pmi') {
        eventsData = await fetchSubCalendar('gdp-pmi');
      } else if (tab === 'geopolitical') {
        eventsData = await fetchSubCalendar('geopolitical');
      } else if (tab === 'commodities') {
        eventsData = await fetchSubCalendar('commodities');
      } else if (tab === 'holidays') {
        eventsData = await fetchSubCalendar('holidays');
      }
      setEvents(eventsData);
    } catch (err: any) {
      console.error('Failed to load global events calendar:', err);
      setError('Failed to fetch global events. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }, [activeSubTab]);

  useEffect(() => {
    loadCalendarData(activeSubTab);
  }, [activeSubTab]);

  // Handle Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await triggerGlobalEventsRefresh();
      await loadCalendarData(activeSubTab);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle Save Preferences
  const handleSavePreferences = async () => {
    try {
      await saveUserPreferences(preferences);
      setPrefSaveSuccess(true);
      setTimeout(() => {
        setPrefSaveSuccess(false);
        setIsAlertModalOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to save alert preferences:', err);
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((e: GlobalEvent) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = e.event_name.toLowerCase().includes(q);
        const matchTelugu = e.event_name_te?.includes(q);
        const matchDesc = e.description_en?.toLowerCase().includes(q) || e.description_te?.includes(q);
        const matchCountry = e.country?.toLowerCase().includes(q);
        const matchCategory = e.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchTelugu && !matchDesc && !matchCountry && !matchCategory) {
          return false;
        }
      }
      if (selectedCountry !== 'ALL' && e.country?.toUpperCase() !== selectedCountry.toUpperCase()) {
        return false;
      }
      if (selectedImportance !== 'ALL' && e.importance?.toUpperCase() !== selectedImportance.toUpperCase()) {
        return false;
      }
      if (selectedCategory !== 'ALL' && e.category?.toUpperCase() !== selectedCategory.toUpperCase()) {
        return false;
      }
      return true;
    });
  }, [events, searchQuery, selectedCountry, selectedImportance, selectedCategory]);

  // Sub Calendar Nav Tabs
  const subCalendarTabs: { id: SubCalendarKey; labelEn: string; labelTe: string; count?: number; icon: React.ReactNode }[] = [
    { id: 'all', labelEn: 'All Events', labelTe: 'మొత్తం ఈవెంట్లు', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'india', labelEn: 'India Focus 🇮🇳', labelTe: 'భారతదేశం 🇮🇳', icon: <Landmark className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'today', labelEn: "Today's Events", labelTe: 'నేటి ఈవెంట్లు', count: summary?.events_today_count, icon: <Clock className="w-3.5 h-3.5" /> },
    { id: '7days', labelEn: 'Next 7 Days', labelTe: 'రాబోయే 7 రోజులు', icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: '30days', labelEn: 'Next 30 Days', labelTe: 'రాబోయే 30 రోజులు', icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: '90days', labelEn: 'Next 90 Days', labelTe: 'రాబోయే 90 రోజులు', icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: 'central-banks', labelEn: 'Central Banks', labelTe: 'సెంట్రల్ బ్యాంకులు', icon: <Landmark className="w-3.5 h-3.5" /> },
    { id: 'inflation', labelEn: 'Inflation', labelTe: 'ద్రవ్యోల్బణం', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'gdp-pmi', labelEn: 'GDP & PMI', labelTe: 'GDP & PMI', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'geopolitical', labelEn: 'Geopolitical', labelTe: 'భౌగోళిక రాజకీయాలు', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'commodities', labelEn: 'Commodities', labelTe: 'కమోడిటీస్', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
    { id: 'holidays', labelEn: 'Holidays', labelTe: 'మార్కెట్ సెలవులు', icon: <CalendarDays className="w-3.5 h-3.5" /> },
  ];

  // Helper to get display name for event (Telugu or English)
  const getEventTitle = (e: GlobalEvent): string => {
    if (languageMode === 'te') return e.event_name_te || e.event_name;
    return e.event_name;
  };

  return (
    <div className="space-y-6">
      {/* ── 1. TOP HEADER & TELEMETRY BANNER ── */}
      <div className="bg-[#121824] rounded-xl border border-[#232E47] p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                <Globe className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {languageMode === 'te' 
                      ? 'గ్లోబల్ ఎకనామిక్ & వరల్డ్‌వైడ్ ఈవెంట్స్ క్యాలెండర్' 
                      : 'GLOBAL ECONOMIC & WORLDWIDE EVENTS CALENDAR'}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    BILINGUAL (EN/TE)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  {languageMode === 'te'
                    ? 'భారతదేశం, అమెరికా, యూరోజోన్, చైనా, జపాన్ మొదలైన దేశాల ఆర్ధిక విధానాలు, సెంట్రల్ బ్యాంక్ నిర్ణయాలు, ద్రవ్యోల్బణ గణాంకాలు మరియు భారత స్టాక్ మార్కెట్ ప్రభావ విశ్లేషణ.'
                    : 'Institutional macroeconomic intelligence covering India, US, Eurozone, China, Japan, UK & global economies with automatic DST conversion, live countdowns, and India market impact synthesis.'}
                </p>
              </div>
            </div>
          </div>

          {/* Clock & Action Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live IST Clock */}
            <div className="bg-[#0B0E14] border border-[#232E47] px-3.5 py-2 rounded-lg flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {languageMode === 'te' ? 'భారత కాలమానం (IST)' : 'INDIAN STANDARD TIME (IST)'}
                </div>
                <div className="text-sm font-mono font-bold text-white tracking-wide">
                  {istTime || '--:--:--'} <span className="text-xs text-slate-400 font-normal ml-1">({istDate})</span>
                </div>
              </div>
            </div>

            {/* Notification Preferences Trigger */}
            <button
              onClick={() => setIsAlertModalOpen(true)}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-lg border border-slate-700/60 transition-colors"
              title={languageMode === 'te' ? 'నోటిఫికేషన్ ప్రాధాన్యతలు' : 'Notification Preferences'}
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Refresh Feed Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/40 text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? (languageMode === 'te' ? 'రిఫ్రెష్ అవుతోంది...' : 'Refreshing...') : (languageMode === 'te' ? 'రిఫ్రెష్ ఫీడ్' : 'Refresh Feed')}</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#232E47]/70">
          <div className="bg-[#0B0E14]/70 p-3 rounded-lg border border-[#232E47]">
            <div className="text-[11px] text-slate-400">
              {languageMode === 'te' ? 'ట్రాక్ చేయబడుతున్న ఈవెంట్లు' : 'Total Tracked Events'}
            </div>
            <div className="text-xl font-bold text-white mt-0.5">
              {summary?.total_events_tracked ?? events.length}
            </div>
          </div>

          <div className="bg-[#0B0E14]/70 p-3 rounded-lg border border-[#232E47]">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>{languageMode === 'te' ? 'హై-ఇంపాక్ట్ ఈవెంట్లు' : 'High Impact Events'}</span>
            </div>
            <div className="text-xl font-bold text-rose-400 mt-0.5">
              {summary?.high_impact_total ?? events.filter(e => e.importance === 'HIGH').length}
            </div>
          </div>

          <div className="bg-[#0B0E14]/70 p-3 rounded-lg border border-[#232E47]">
            <div className="text-[11px] text-slate-400">
              {languageMode === 'te' ? 'నేటి ఈవెంట్లు' : "Today's Events"}
            </div>
            <div className="text-xl font-bold text-amber-300 mt-0.5">
              {summary?.events_today_count ?? 0}
            </div>
          </div>

          <div className="bg-[#0B0E14]/70 p-3 rounded-lg border border-[#232E47]">
            <div className="text-[11px] text-slate-400">
              {languageMode === 'te' ? 'తదుపరి ప్రధాన ఈవెంట్' : 'Next Critical Event'}
            </div>
            <div className="text-xs font-bold text-sky-400 mt-1 truncate" title={summary?.next_event?.event_name || ''}>
              {summary?.next_event 
                ? (languageMode === 'te' ? summary.next_event.event_name_te : summary.next_event.event_name)
                : (languageMode === 'te' ? 'లోడ్ అవుతోంది...' : 'Loading...')}
            </div>
            <div className="text-[10px] text-slate-400">
              {summary?.next_event?.countdown?.countdown_label_en || ''}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. SUB-CALENDARS NAVIGATION STRIP ── */}
      <div className="bg-[#121824] rounded-xl border border-[#232E47] p-2 overflow-x-auto scrollbar-thin">
        <div className="flex items-center space-x-1 min-w-max">
          {subCalendarTabs.map(tab => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{languageMode === 'te' ? tab.labelTe : tab.labelEn}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. TOOLBAR: SEARCH, FILTERS, LANGUAGE & VIEW TOGGLE ── */}
      <div className="bg-[#121824] rounded-xl border border-[#232E47] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={languageMode === 'te' ? 'ఈవెంట్, దేశం లేదా కీవర్డ్‌తో శోధించండి...' : 'Search by event title, country, or keyword...'}
            className="w-full bg-[#0B0E14] border border-[#232E47] rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Country Selector */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-[#0B0E14] border border-[#232E47] rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500/60"
          >
            <option value="ALL">{languageMode === 'te' ? 'అన్ని దేశాలు' : 'All Countries'}</option>
            <option value="INDIA">🇮🇳 India</option>
            <option value="UNITED STATES">🇺🇸 United States</option>
            <option value="EUROZONE">🇪🇺 Eurozone</option>
            <option value="UNITED KINGDOM">🇬🇧 United Kingdom</option>
            <option value="CHINA">🇨🇳 China</option>
            <option value="JAPAN">🇯🇵 Japan</option>
            <option value="GLOBAL">🌐 Global</option>
          </select>

          {/* Importance Selector */}
          <select
            value={selectedImportance}
            onChange={(e) => setSelectedImportance(e.target.value)}
            className="bg-[#0B0E14] border border-[#232E47] rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500/60"
          >
            <option value="ALL">{languageMode === 'te' ? 'అన్ని ప్రాధాన్యతలు' : 'All Importance'}</option>
            <option value="HIGH">🔥 High Impact</option>
            <option value="MEDIUM">⚡ Medium Impact</option>
            <option value="LOW">⚪ Low Impact</option>
          </select>

          {/* Category Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#0B0E14] border border-[#232E47] rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500/60"
          >
            <option value="ALL">{languageMode === 'te' ? 'అన్ని వర్గాలు' : 'All Categories'}</option>
            <option value="ECONOMIC_DATA">{languageMode === 'te' ? '📊 ఆర్ధిక డేటా' : '📊 Economic Data'}</option>
            <option value="CENTRAL_BANK">{languageMode === 'te' ? '🏛️ సెంట్రల్ బ్యాంక్' : '🏛️ Central Bank'}</option>
            <option value="GOVERNMENT_FISCAL">{languageMode === 'te' ? '📜 ప్రభుత్వ ఆర్ధిక' : '📜 Government & Fiscal'}</option>
            <option value="GEOPOLITICAL">{languageMode === 'te' ? '🌍 భౌగోళిక' : '🌍 Geopolitical'}</option>
            <option value="COMMODITIES_ENERGY">{languageMode === 'te' ? '⛽ కమోడిటీస్' : '⛽ Commodities & Energy'}</option>
            <option value="FINANCIAL_MARKETS">{languageMode === 'te' ? '📈 ఫైనాన్షియల్ మార్కెట్స్' : '📈 Financial Markets'}</option>
            <option value="CORPORATE_TECH">{languageMode === 'te' ? '💻 కార్పొరేట్ & టెక్' : '💻 Corporate & Tech'}</option>
          </select>

          {/* Language Mode Toggle */}
          <div className="flex items-center bg-[#0B0E14] border border-[#232E47] rounded-lg p-0.5">
            <button
              onClick={() => setLanguageMode('en')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                languageMode === 'en' ? 'bg-sky-500/20 text-sky-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguageMode('te')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                languageMode === 'te' ? 'bg-amber-500/20 text-amber-300 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              తెలుగు
            </button>
            <button
              onClick={() => setLanguageMode('bilingual')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                languageMode === 'bilingual' ? 'bg-emerald-500/20 text-emerald-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {languageMode === 'te' ? 'ద్విభాష' : 'Bilingual'}
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0B0E14] border border-[#232E47] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-700/60 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-slate-700/60 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Chronological Table View"
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. CONTENT AREA ── */}
      {loading ? (
        <div className="bg-[#121824] rounded-xl border border-[#232E47] p-12 text-center">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <div className="text-sm font-semibold text-white">
            {languageMode === 'te' ? 'గ్లోబల్ ఈవెంట్స్ డేటాను లోడ్ చేస్తోంది...' : 'Loading Global Macroeconomic Events...'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {languageMode === 'te' ? 'అధికారిక డేటా సోర్స్‌లు మరియు కాలానుగుణ DST ని ధృవీకరిస్తోంది.' : 'Synchronizing DST timezones, market consensus forecasts, and institutional signals.'}
          </div>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-6 text-center">
          <div className="text-rose-400 font-bold text-sm mb-1">{error}</div>
          <button
            onClick={() => loadCalendarData()}
            className="mt-3 px-4 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-semibold"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-[#121824] rounded-xl border border-[#232E47] p-12 text-center">
          <Globe className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-300">
            {languageMode === 'te' ? 'ఈ ప్రమాణాలకు సరిపోయే ఈవెంట్‌లు ఏవీ కనుగొనబడలేదు.' : 'No events found matching your search or filter criteria.'}
          </div>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCountry('ALL'); setSelectedImportance('ALL'); setSelectedCategory('ALL'); }}
            className="mt-4 px-3.5 py-1.5 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30 text-xs font-semibold hover:bg-sky-600/30"
          >
            {languageMode === 'te' ? 'అన్ని ఫిల్టర్‌లను రీసెట్ చేయండి' : 'Reset All Filters'}
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredEvents.map((event) => (
            <GlobalEventCard key={event.id} event={event} languageMode={languageMode} />
          ))}
        </div>
      ) : (
        /* CHRONOLOGICAL TABLE VIEW */
        <div className="bg-[#121824] rounded-xl border border-[#232E47] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0B0E14] border-b border-[#232E47] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">{languageMode === 'te' ? 'తేదీ & IST' : 'Date & IST'}</th>
                  <th className="py-3 px-3">{languageMode === 'te' ? 'దేశం' : 'Country'}</th>
                  <th className="py-3 px-4">{languageMode === 'te' ? 'ఈవెంట్ పేరు' : 'Event Name'}</th>
                  <th className="py-3 px-3">{languageMode === 'te' ? 'ప్రాముఖ్యత' : 'Impact'}</th>
                  <th className="py-3 px-3 text-right">{languageMode === 'te' ? 'గత విలువ' : 'Previous'}</th>
                  <th className="py-3 px-3 text-right">{languageMode === 'te' ? 'అంచనా' : 'Forecast'}</th>
                  <th className="py-3 px-3 text-right">{languageMode === 'te' ? 'వాస్తవం' : 'Actual'}</th>
                  <th className="py-3 px-3 text-right">{languageMode === 'te' ? 'సర్ప్రైజ్' : 'Surprise'}</th>
                  <th className="py-3 px-4">{languageMode === 'te' ? 'కౌంట్‌డౌన్' : 'Countdown'}</th>
                  <th className="py-3 px-3 text-center">{languageMode === 'te' ? 'సోర్స్' : 'Source'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232E47]/60">
                {filteredEvents.map((event) => {
                  const isHigh = event.importance === 'HIGH';
                  const isReleased = event.actual_value && event.actual_value !== 'Not yet released';
                  return (
                    <tr key={event.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">{event.start_time_ist?.split(' ')[0] || event.start_time_ist_str}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {event.start_time_ist?.split(' ').slice(1).join(' ') || ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-base">{event.country_flag}</span>
                          <span className="font-medium text-slate-200">{event.country_code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-white truncate" title={event.event_name}>
                          {getEventTitle(event)}
                        </div>
                        {languageMode === 'bilingual' && (
                          <div className="text-[11px] text-amber-300 truncate mt-0.5">{event.event_name_te}</div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">{event.category.replace(/_/g, ' ')}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isHigh ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : event.importance === 'MEDIUM' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {isHigh && <Flame className="w-3 h-3 text-rose-400" />}
                          <span>{event.importance}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">{event.previous_value || '—'}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">{event.forecast_value || '—'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                        {isReleased ? (
                          <span className="text-white bg-slate-800 px-1.5 py-0.5 rounded">{event.actual_value}</span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                        {event.surprise_value !== null && event.surprise_value !== undefined ? (
                          <span className={`font-semibold ${event.surprise_direction === 'POSITIVE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {event.surprise_value > 0 ? '+' : ''}{event.surprise_value.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[11px] font-mono font-semibold ${
                          event.countdown?.status === 'UPCOMING' ? 'text-sky-300'
                          : event.countdown?.status === 'ONGOING' ? 'text-emerald-400 animate-pulse'
                          : 'text-slate-400'
                        }`}>
                          {languageMode === 'te' ? event.countdown?.countdown_label_te : event.countdown?.countdown_label_en}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {event.source_url ? (
                          <a href={event.source_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center text-slate-400 hover:text-sky-400 transition-colors p-1"
                            title={`Official Source: ${event.source_name}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. ALERT NOTIFICATION PREFERENCES MODAL ── */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121824] border border-[#232E47] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsAlertModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-4">
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {languageMode === 'te' ? 'ఈవెంట్ అలర్ట్ ప్రాధాన్యతలు' : 'Global Event Alert Preferences'}
                </h3>
                <p className="text-xs text-slate-400">
                  {languageMode === 'te' ? 'ముఖ్యమైన ఆర్థిక ఈవెంట్ల అలర్ట్‌లను కాన్ఫిగర్ చేయండి' : 'Configure notifications for market-moving macroeconomic releases'}
                </p>
              </div>
            </div>

            <div className="space-y-4 py-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-white">{languageMode === 'te' ? 'ఈవెంట్‌కు 24 గంటల ముందు' : '24 Hours Before Event'}</div>
                  <div className="text-[11px] text-slate-400">{languageMode === 'te' ? 'ముందస్తు హెచ్చరిక' : 'Receive advance calendar heads-up'}</div>
                </div>
                <input type="checkbox" checked={preferences.alert_24h}
                  onChange={(e) => setPreferences({ ...preferences, alert_24h: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700" />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-white">{languageMode === 'te' ? 'ఈవెంట్‌కు 1 గంట ముందు' : '1 Hour Before Event'}</div>
                  <div className="text-[11px] text-slate-400">{languageMode === 'te' ? 'అస్థిరత హెచ్చరిక' : 'Volatility warning for active positions'}</div>
                </div>
                <input type="checkbox" checked={preferences.alert_1h}
                  onChange={(e) => setPreferences({ ...preferences, alert_1h: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700" />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-white">{languageMode === 'te' ? 'ఈవెంట్‌కు 15 నిమిషాల ముందు' : '15 Minutes Before Event'}</div>
                  <div className="text-[11px] text-slate-400">{languageMode === 'te' ? 'తుది కౌంట్‌డౌన్' : 'Final countdown before official release'}</div>
                </div>
                <input type="checkbox" checked={preferences.alert_15m}
                  onChange={(e) => setPreferences({ ...preferences, alert_15m: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700" />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-white">{languageMode === 'te' ? 'ఫలితం విడుదలైనప్పుడు' : 'On Result Release'}</div>
                  <div className="text-[11px] text-slate-400">{languageMode === 'te' ? 'సర్ప్రైజ్ లెక్కింపుతో' : 'Surprise calculation with actual vs forecast'}</div>
                </div>
                <input type="checkbox" checked={preferences.alert_results}
                  onChange={(e) => setPreferences({ ...preferences, alert_results: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700" />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-[#232E47] pt-3">
                <div>
                  <div className="text-xs font-semibold text-amber-400">{languageMode === 'te' ? 'వాయిదా / రద్దు హెచ్చరిక' : 'Postponed / Cancelled Alert'}</div>
                  <div className="text-[11px] text-slate-400">{languageMode === 'te' ? 'షెడ్యూల్ మారినప్పుడు' : 'When event schedule changes'}</div>
                </div>
                <input type="checkbox" checked={preferences.alert_postponed}
                  onChange={(e) => setPreferences({ ...preferences, alert_postponed: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700" />
              </label>
            </div>

            {prefSaveSuccess && (
              <div className="flex items-center space-x-2 text-emerald-400 text-xs mt-3 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                <span>{languageMode === 'te' ? 'విజయవంతంగా భద్రపరచబడింది!' : 'Preferences saved successfully!'}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2.5 mt-5 pt-3 border-t border-[#232E47]">
              <button onClick={() => setIsAlertModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white">
                {languageMode === 'te' ? 'రద్దు' : 'Cancel'}
              </button>
              <button onClick={handleSavePreferences}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors">
                {languageMode === 'te' ? 'భద్రపరచండి' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalEventsPage;
