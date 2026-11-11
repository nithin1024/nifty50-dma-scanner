import type { 
  BackendHealth, 
  DataStatusReport, 
  DailyScanResponse, 
  LiveScanResponse, 
  StockDetailsResponse, 
  ScanHistoryRecord 
} from '../types';

const API_BASE = '/api/v1';

export async function fetchHealth(): Promise<BackendHealth> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDataStatus(): Promise<DataStatusReport> {
  const response = await fetch(`${API_BASE}/data-status`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDailyScan(): Promise<DailyScanResponse> {
  const response = await fetch(`${API_BASE}/scanner/daily`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function triggerDailyScanRun(): Promise<DailyScanResponse> {
  const response = await fetch(`${API_BASE}/scanner/daily/run`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchLiveScan(): Promise<LiveScanResponse> {
  const response = await fetch(`${API_BASE}/scanner/live`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchStockDetails(symbol: string): Promise<StockDetailsResponse> {
  const response = await fetch(`${API_BASE}/stock-details/${encodeURIComponent(symbol)}`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchScanHistory(): Promise<ScanHistoryRecord[]> {
  const response = await fetch(`${API_BASE}/history/scans`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}
