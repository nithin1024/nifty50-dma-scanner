import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { NavTab, BackendHealth, DataStatusReport, DailyScanResponse, LiveScanResponse } from './types';
import { fetchHealth, fetchDataStatus, fetchDailyScan, fetchLiveScan } from './services/api';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { DailyScanner } from './pages/DailyScanner';
import { LiveScanner } from './pages/LiveScanner';
import { StockDetails } from './pages/StockDetails';
import { ScanHistory } from './pages/ScanHistory';
import { DataStatus } from './pages/DataStatus';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [dataStatus, setDataStatus] = useState<DataStatusReport | null>(null);
  const [dailyScan, setDailyScan] = useState<DailyScanResponse | null>(null);
  const [liveScan, setLiveScan] = useState<LiveScanResponse | null>(null);
  const [selectedStock, setSelectedStock] = useState<string>('RELIANCE');
  const [loading, setLoading] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [h, ds, daily, live] = await Promise.all([
        fetchHealth(),
        fetchDataStatus(),
        fetchDailyScan(),
        fetchLiveScan()
      ]);
      setHealth(h);
      setDataStatus(ds);
      setDailyScan(daily);
      setLiveScan(live);
      setBackendOnline(true);
    } catch (err) {
      console.error('Failed to connect to backend service:', err);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
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
    setActiveTab('stock-details');
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
        {activeTab === 'dashboard' && (
          <Dashboard 
            health={health}
            dataStatus={dataStatus}
            dailyScan={dailyScan}
            loading={loading}
            onRefresh={loadAllData}
            onNavigate={setActiveTab}
            onSelectStock={handleSelectStock}
          />
        )}

        {activeTab === 'daily-scanner' && (
          <DailyScanner 
            dailyScan={dailyScan}
            loading={loading}
            onSelectStock={handleSelectStock}
          />
        )}

        {activeTab === 'live-scanner' && (
          <LiveScanner 
            liveScan={liveScan}
            loading={loading}
            onRefresh={loadAllData}
            onSelectStock={handleSelectStock}
          />
        )}

        {activeTab === 'stock-details' && (
          <StockDetails 
            selectedSymbol={selectedStock}
            onSymbolChange={setSelectedStock}
            availableSymbols={availableSymbols}
          />
        )}

        {activeTab === 'scan-history' && <ScanHistory />}

        {activeTab === 'data-status' && <DataStatus dataStatus={dataStatus} />}
      </main>

      <footer className="bg-[#121824] border-t border-[#232E47] py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            NIFTY 50 DMA Scanner &bull; 6-DMA Simple Moving Average Screening Engine
          </div>
          <div className="text-[11px] text-slate-400">
            Levels 1–11 Production Build &bull; FastAPI, PostgreSQL &amp; React (TypeScript)
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
