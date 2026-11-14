import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { NavTab, BackendHealth, DataStatusReport, DailyScanResponse, LiveScanResponse, HeavyweightsReport } from './types';
import { fetchHealth, fetchDataStatus, fetchDailyScan, fetchLiveScan, fetchTopHeavyweights, triggerLiveScanRefresh } from './services/api';
import { Navbar } from './components/Navbar';
import { MarketOverview } from './pages/MarketOverview';
import { DailyScanner } from './pages/DailyScanner';
import { AllVolumeDashboard } from './pages/AllVolumeDashboard';
import { Top7Heavyweights } from './pages/Top7Heavyweights';
import { VolumeAnalyticsPage } from './pages/VolumeAnalyticsPage';
import { StockDetails } from './pages/StockDetails';
import { DataStatus } from './pages/DataStatus';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [dataStatus, setDataStatus] = useState<DataStatusReport | null>(null);
  const [dailyScan, setDailyScan] = useState<DailyScanResponse | null>(null);
  const [liveScan, setLiveScan] = useState<LiveScanResponse | null>(null);
  const [heavyweights, setHeavyweights] = useState<HeavyweightsReport | null>(null);
  const [selectedStock, setSelectedStock] = useState<string>('RELIANCE');
  const [loading, setLoading] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [h, ds, daily, live, hw] = await Promise.all([
        fetchHealth(),
        fetchDataStatus(),
        fetchDailyScan(),
        fetchLiveScan(),
        fetchTopHeavyweights()
      ]);
      setHealth(h);
      setDataStatus(ds);
      setDailyScan(daily);
      setLiveScan(live);
      setHeavyweights(hw);
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

  // Periodic background live volume poll every 15s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const live = await fetchLiveScan();
        setLiveScan(live);
      } catch {
        // Silently ignore background polling errors
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Live WebSocket Connection for intraday streaming
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-scanner`;

    const connectWs = () => {
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
          console.log('Live WebSocket feed disconnected. Reconnecting in 5s...');
          setTimeout(connectWs, 5000);
        };
      } catch (e) {
        console.error('WebSocket connection error:', e);
      }
    };

    connectWs();

    return () => {
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
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col font-sans">
      <Navbar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        backendOnline={backendOnline} 
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <MarketOverview 
            health={health}
            dataStatus={dataStatus}
            dailyScan={dailyScan}
            heavyweights={heavyweights}
            loading={loading}
            onRefresh={loadAllData}
            onNavigate={setActiveTab}
            onSelectStock={handleSelectStock}
          />
        )}

        {activeTab === 'dma-scanner' && (
          <DailyScanner 
            dailyScan={dailyScan}
            loading={loading}
            onSelectStock={handleSelectStock}
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

        {activeTab === 'historical' && (
          <StockDetails 
            selectedSymbol={selectedStock}
            onSymbolChange={setSelectedStock}
            availableSymbols={availableSymbols}
          />
        )}

        {activeTab === 'data-quality' && (
          <DataStatus dataStatus={dataStatus} />
        )}
      </main>

      <footer className="bg-[#121824] border-t border-[#232E47] py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            NIFTY 50 Institutional DMA &amp; Live Volume Platform &bull; Pure SMA Engine &amp; RVOL Analytics
          </div>
          <div className="text-[11px] text-slate-400">
            Institutional Build &bull; FastAPI, PostgreSQL, SQLAlchemy &amp; React (TypeScript)
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
