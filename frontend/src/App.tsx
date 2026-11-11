import React, { useState, useEffect, useCallback } from 'react';
import type { NavTab, BackendHealth, DataStatusReport } from './types';
import { fetchHealth, fetchDataStatus } from './services/api';
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
  const [loading, setLoading] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [h, ds] = await Promise.all([
        fetchHealth(),
        fetchDataStatus()
      ]);
      setHealth(h);
      setDataStatus(ds);
      setBackendOnline(true);
    } catch (err) {
      console.error('Failed to connect to backend service:', err);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    // Poll health every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, [loadStatus]);

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
            loading={loading}
            onRefresh={loadStatus}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'daily-scanner' && <DailyScanner />}
        {activeTab === 'live-scanner' && <LiveScanner />}
        {activeTab === 'stock-details' && <StockDetails />}
        {activeTab === 'scan-history' && <ScanHistory />}
        {activeTab === 'data-status' && <DataStatus dataStatus={dataStatus} />}
      </main>

      <footer className="bg-[#121824] border-t border-[#232E47] py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            NIFTY 50 DMA Scanner &bull; Precision Simple Moving Average Screening Engine
          </div>
          <div className="text-[11px] text-slate-400">
            Level 1: Project Foundation &bull; Built with FastAPI &amp; React (TypeScript)
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
