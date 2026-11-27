import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { NavTab, BackendHealth, DataStatusReport, DailyScanResponse, LiveScanResponse, HeavyweightsReport, MarketIntelligenceReport } from './types';
import { fetchHealth, fetchDataStatus, fetchDailyScan, fetchLiveScan, fetchTopHeavyweights, triggerLiveScanRefresh, fetchMarketIntelligence } from './services/api';
import { Navbar } from './components/Navbar';
import { MarketOverview } from './pages/MarketOverview';
import { DailyScanner } from './pages/DailyScanner';
import { AllVolumeDashboard } from './pages/AllVolumeDashboard';
import { Top7Heavyweights } from './pages/Top7Heavyweights';
import { VolumeAnalyticsPage } from './pages/VolumeAnalyticsPage';
import { StockDetails } from './pages/StockDetails';
import { EmaScanner } from './pages/EmaScanner';
import { NiftyLiveOptionChainDashboard } from './components/NiftyLiveOptionChainDashboard';
import { PremarketDashboard } from './components/PremarketDashboard';
import { MultiTimeframeMonitoringDashboard } from './components/MultiTimeframeMonitoringDashboard';
import { NiftyTradingIntelligenceDashboard } from './components/NiftyTradingIntelligenceDashboard';
import { PmiIntelligenceDashboard } from './components/PmiIntelligenceDashboard';
import { IipIntelligenceSection } from './components/IipIntelligenceSection';
import { GlobalMarketsAndCalendarPage } from './pages/GlobalMarketsAndCalendarPage';
import { IndianEconomyFundamentalsPage } from './pages/IndianEconomyFundamentalsPage';
import { MarketNewsPage } from './pages/MarketNewsPage';
import { SettingsAndDataSourcesPage } from './pages/SettingsAndDataSourcesPage';
import { FinancialDictionary } from './components/FinancialDictionary';
import { MarketToolsModal } from './components/MarketToolsModal';
import type { ToolType } from './components/MarketToolsModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [dataStatus, setDataStatus] = useState<DataStatusReport | null>(null);
  const [dailyScan, setDailyScan] = useState<DailyScanResponse | null>(null);
  const [liveScan, setLiveScan] = useState<LiveScanResponse | null>(null);
  const [heavyweights, setHeavyweights] = useState<HeavyweightsReport | null>(null);
  const [intelligence, setIntelligence] = useState<MarketIntelligenceReport | null>(null);
  const [selectedStock, setSelectedStock] = useState<string>('RELIANCE');
  const [loading, setLoading] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [h, ds, daily, live, hw, intel] = await Promise.all([
        fetchHealth(),
        fetchDataStatus(),
        fetchDailyScan(),
        fetchLiveScan(),
        fetchTopHeavyweights(),
        fetchMarketIntelligence()
      ]);
      setHealth(h);
      setDataStatus(ds);
      setDailyScan(daily);
      setLiveScan(live);
      setHeavyweights(hw);
      setIntelligence(intel);
      setBackendOnline(true);
    } catch (err) {
      console.error('Failed to connect to backend service:', err);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefreshLive = useCallback(async () => {
    try {
      const refreshed = await triggerLiveScanRefresh();
      setLiveScan(refreshed);
    } catch (err) {
      console.error('Error refreshing live scan:', err);
    }
  }, []);

  // Initial load & automatic 1-minute periodic refresh for live volumes, scans, and heavyweights
  useEffect(() => {
    loadAllData();
    const intervalTimer = window.setInterval(() => {
      console.log('Automated 1-minute interval: Refreshing market data, volumes & heavyweights...');
      loadAllData();
    }, 60000); // 1 minute = 60,000 ms

    return () => window.clearInterval(intervalTimer);
  }, [loadAllData]);

  // Live WebSocket Connection for intraday streaming
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-scanner`;
    let stopped = false;
    let reconnectTimer: number | undefined;

    const connectWs = () => {
      if (stopped) return;
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('Connected to live DMA WebSocket feed.');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'LIVE_SCAN_SNAPSHOT') {
              setLiveScan(data);
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        ws.onclose = () => {
          if (!stopped) {
            console.log('Live WebSocket feed disconnected. Reconnecting in 5s...');
            reconnectTimer = window.setTimeout(connectWs, 5000);
          }
        };
      } catch (e) {
        console.error('WebSocket connection error:', e);
      }
    };

    connectWs();

    return () => {
      stopped = true;
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleSelectStock = (symbol: string) => {
    setSelectedStock(symbol);
    setActiveTab('historical');
  };

  const availableSymbols = dailyScan 
    ? dailyScan.all_results.map(s => s.symbol)
    : ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      <Navbar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        backendOnline={backendOnline} 
        onOpenTool={setActiveTool}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
        {/* 1. OVERVIEW & FII/DII SCANNER (UNIFIED) */}
        {(activeTab === 'overview' || activeTab === 'fii-dii') && (
          <MarketOverview 
            health={health}
            dataStatus={dataStatus}
            dailyScan={dailyScan}
            heavyweights={heavyweights}
            intelligence={intelligence}
            loading={loading}
            onRefresh={loadAllData}
            onNavigate={setActiveTab}
            onSelectStock={handleSelectStock}
          />
        )}

        {/* 2. DMA SCANNER */}
        {activeTab === 'dma-scanner' && (
          <DailyScanner 
            dailyScan={dailyScan}
            loading={loading}
            onSelectStock={handleSelectStock}
          />
        )}

        {/* 3. EMA SCANNER */}
        {activeTab === 'ema-scanner' && (
          <EmaScanner 
            onSelectStock={handleSelectStock}
          />
        )}

        {/* 5. OPTIONS & F&O INTELLIGENCE */}
        {(activeTab === 'options-intelligence' || activeTab === 'option-chain') && (
          <NiftyLiveOptionChainDashboard initialTab="CHAIN" />
        )}
        {activeTab === 'oi-pcr' && (
          <NiftyLiveOptionChainDashboard initialTab="OI_PCR" />
        )}
        {activeTab === 'max-pain' && (
          <NiftyLiveOptionChainDashboard initialTab="MAX_PAIN" />
        )}
        {activeTab === 'support-resistance' && (
          <NiftyLiveOptionChainDashboard initialTab="SUPPORT_RESISTANCE" />
        )}
        {activeTab === 'live-market' && (
          <NiftyTradingIntelligenceDashboard />
        )}

        {/* 6. INDIAN ECONOMY & FUNDAMENTALS (GDP, PMI, IIP, INFLATION, CAPEX, RBI) */}
        {(activeTab === 'economy-fundamentals' || activeTab === 'indian-economy' || activeTab === 'sector-fundamentals' || activeTab === 'sector-analysis' || activeTab === 'company-fundamentals') && (
          <IndianEconomyFundamentalsPage />
        )}
        {activeTab === 'pmi-intelligence' && (
          <PmiIntelligenceDashboard />
        )}
        {activeTab === 'iip-intelligence' && (
          <IipIntelligenceSection />
        )}

        {/* 7. ECONOMIC CALENDAR & GLOBAL MARKETS */}
        {(activeTab === 'economic-calendar' || activeTab === 'calendar' || activeTab === 'global-markets-calendar' || activeTab === 'global-markets' || activeTab === 'global-events') && (
          <GlobalMarketsAndCalendarPage />
        )}

        {/* 8. MARKET NEWS WIRE */}
        {(activeTab === 'market-news' || activeTab === 'news-intelligence') && (
          <MarketNewsPage />
        )}

        {/* 9. SETTINGS & DATA SOURCES (CENTRAL SCHEDULER + 15 STATUTORY AUTHORITIES) */}
        {(activeTab === 'settings-sources' || activeTab === 'data-quality') && (
          <SettingsAndDataSourcesPage dataStatus={dataStatus} />
        )}

        {/* 10. FINANCIAL DICTIONARY (ENGLISH - TELUGU) */}
        {activeTab === 'financial-dictionary' && (
          <FinancialDictionary onBackToOverview={() => setActiveTab('overview')} />
        )}

        {/* OTHER ANCILLARY MODULES & STOCK DETAIL */}
        {activeTab === 'premarket' && (
          <PremarketDashboard />
        )}

        {(activeTab === 'daily-report' || activeTab === 'weekly-report' || activeTab === 'monthly-report') && (
          <MultiTimeframeMonitoringDashboard />
        )}

        {(activeTab === 'historical' || activeTab === 'trading-chart') && (
          <StockDetails
            selectedSymbol={selectedStock}
            onSymbolChange={setSelectedStock}
            availableSymbols={availableSymbols}
          />
        )}

        {activeTab === 'all-volume' && (
          <AllVolumeDashboard 
            dailyScan={dailyScan}
            liveScan={liveScan}
            loading={loading}
            onSelectStock={handleSelectStock}
            onRefreshLive={handleRefreshLive}
          />
        )}

        {activeTab === 'heavyweights' && (
          <Top7Heavyweights 
            heavyweights={heavyweights}
            loading={loading}
            onSelectStock={handleSelectStock}
          />
        )}

        {activeTab === 'volume-analytics' && (
          <VolumeAnalyticsPage 
            dailyScan={dailyScan}
            liveScan={liveScan}
            loading={loading}
            onSelectStock={handleSelectStock}
          />
        )}
      </main>

      <footer className="bg-[#121824] border-t border-[#232E47] py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            NIFTY 50 | DMA &amp; EMA MARKET INTELLIGENCE &bull; Professional Market &amp; Fundamental Economy Platform
          </div>
          <div className="text-[11px] text-slate-400">
            FastAPI, PostgreSQL &bull; React (TypeScript) &bull; Traceable Official Releases (MoSPI, RBI, NSE, BSE, DPIIT)
          </div>
        </div>
      </footer>

      {/* Institutional Market Tools Modal */}
      {activeTool && (
        <MarketToolsModal
          tool={activeTool}
          onClose={() => setActiveTool(null)}
          onNavigateTab={(tab) => {
            setActiveTab(tab as NavTab);
            setActiveTool(null);
          }}
        />
      )}
    </div>
  );
};

export default App;
